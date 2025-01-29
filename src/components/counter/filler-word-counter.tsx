"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@filler-word-counter/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/ui/card";
import { auth, db } from "@filler-word-counter/lib/firebase/firebase-client";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Save, RotateCcw, Pause, Play, Mic } from "lucide-react";
import { useToast } from "@filler-word-counter/components/ui/use-toast";
import Link from "next/link";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  useDeepgram,
} from "@filler-word-counter/components/providers/deepgram-context-provider";
import { useMicrophone } from "@filler-word-counter/components/providers/microphone-context-provider";
import {
  calculateStats,
  countFillerWords,
} from "@filler-word-counter/lib/speech/speech-utils";
import { TranscriptCard } from "./transcript-card";
import { FillerWordStats } from "./filler-word-stats";
import { GuestNotice } from "./guest-notice";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Dynamically import the worker
const createWorker = () => {
  if (typeof window === "undefined") return null;
  return new Worker(new URL("../../app/worker.js", import.meta.url));
};

export default function FillerWordCounter() {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fillerCount, setFillerCount] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId] = useState<string>(new Date().getTime().toString());
  const [showGuestCard, setShowGuestCard] = useState(true);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isVipUser, setIsVipUser] = useState(false);
  const [isOverUsageLimit, setIsOverUsageLimit] = useState(false);
  const [transformerResults, setTransformerResults] = useState<
    Record<string, any>
  >({});
  const [lastProcessedIndex, setLastProcessedIndex] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pausedTranscriptRef = useRef("");
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } =
    useMicrophone();
  const workerRef = useRef<Worker | null>(null);

  const analyzeText = useCallback(
    debounce((text: string) => {
      if (workerRef.current && isVipUser) {
        // Get only the new text since last processing
        const newText = text.slice(lastProcessedIndex).trim();
        if (newText) {
          console.log("Sending new text to worker:", newText);
          workerRef.current.postMessage({ text: newText });
          setLastProcessedIndex(text.length);
        }
      }
    }, 1000),
    [isVipUser, lastProcessedIndex]
  );

  const handleTranscriptUpdate = useCallback(
    (newTranscript: string) => {
      setTranscript(newTranscript);
      analyzeText(newTranscript);
    },
    [analyzeText]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        const newTranscript = pausedTranscriptRef.current + currentTranscript;
        setTranscript(newTranscript);
        handleTranscriptUpdate(newTranscript);
      };
    }
  }, [handleTranscriptUpdate]);

  useEffect(() => {
    if (transcript || Object.keys(fillerCount).length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [transcript, fillerCount]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // @ts-ignore -- returnValue is deprecated but still widely supported
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const checkVipAccess = async () => {
      if (!user) {
        setIsVipUser(false);
        return;
      }

      try {
        const vipDoc = await getDoc(doc(db, "access", "vip"));
        if (vipDoc.exists()) {
          const vipUsers = vipDoc.data().users || [];
          setIsVipUser(vipUsers.includes(user.uid));
        } else {
          setIsVipUser(false);
        }
      } catch (error) {
        console.error("Error checking VIP access:", error);
        setIsVipUser(false);
      }
    };

    checkVipAccess();
  }, [user]);

  useEffect(() => {
    const checkUsage = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/deepgram/check-usage", {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        });
        const data = await response.json();

        if (data.isOverLimit) {
          setIsOverUsageLimit(true);
          toast({
            title: "Usage Limit Reached",
            description:
              "You've reached your usage limit. Please upgrade your plan to continue.",
            variant: "destructive",
            duration: Infinity,
          });
        }
      } catch (error) {
        console.error("Error checking usage:", error);
      }
    };

    checkUsage();
  }, [user, toast]);

  useEffect(() => {
    const worker = createWorker();
    if (worker) {
      worker.onmessage = (event) => {
        const { status, results, error } = event.data;

        switch (status) {
          case "complete":
            setTransformerResults(results);
            setFillerCount(countFillerWords(fillerCount, results));
            break;
          case "error":
            console.error("Transformer error:", error);
            toast({
              title: "Analysis Error",
              description:
                "Failed to analyze filler words. Using basic detection.",
              variant: "destructive",
            });
            break;
          case "progress":
            break;
        }
      };

      workerRef.current = worker;

      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    }
  }, []);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, user.uid, sessionId), {
        userId: user.uid,
        fillerCount,
        totalWords: stats.totalWords,
        totalFillerWords: stats.totalFillerWords,
        fillerPercentage: stats.fillerPercentage,
        timestamp: new Date().toISOString(),
      });

      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);

      toast({
        title: "Session Saved",
        description: (
          <div className="flex flex-col gap-2">
            <p>
              Successfully saved your speech analysis with {stats.totalWords}{" "}
              words and {stats.totalFillerWords} filler words.
            </p>
            <Link href="/dashboard" className="text-primary hover:underline">
              View your results in the dashboard →
            </Link>
          </div>
        ),
        variant: "success",
        duration: Infinity,
      });
    } catch (error) {
      console.error("Error saving transcript:", error);
      toast({
        title: "Save Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save transcript. Please try again.",
        variant: "destructive",
        duration: Infinity,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (user) {
      if (connection) {
        connection.close();
      }
    } else {
      recognitionRef.current?.stop();
    }
    setIsListening(false);
    setIsPaused(false);
    setTranscript("");
    setFillerCount({});
    setHasUnsavedChanges(false);
    setLastSaveTime(null);
    pausedTranscriptRef.current = "";
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "reset" });
    }
    setLastProcessedIndex(0);
  };

  const toggleListening = () => {
    if (isOverUsageLimit) {
      toast({
        title: "Usage Limit Reached",
        description:
          "You've reached your usage limit. Please upgrade your plan to continue.",
        variant: "destructive",
      });
      return;
    }

    if (isVipUser) {
      if (!isListening) {
        setupMicrophone().then(() => {
          connectToDeepgram({
            model: "nova-2",
            interim_results: true,
            smart_format: true,
            filler_words: true,
          });
          setIsListening(true);
          setIsPaused(false);
        });
      } else {
        if (isPaused) {
          setupMicrophone().then(() => {
            connectToDeepgram({
              model: "nova-2",
              interim_results: true,
              smart_format: true,
              filler_words: true,
            });
            setIsPaused(false);
          });
        } else {
          if (connection) {
            connection.close();
            if (microphone) {
              microphone.stop();
              microphone.stream.getTracks().forEach((track) => track.stop());
            }
          }
          setIsPaused(true);
        }
      }
    } else {
      if (!recognitionRef.current) return;
      if (!isListening) {
        recognitionRef.current.start();
        setIsListening(true);
        setIsPaused(false);
      } else {
        if (isPaused) {
          pausedTranscriptRef.current = transcript;
          recognitionRef.current.start();
          setIsPaused(false);
        } else {
          pausedTranscriptRef.current = transcript;
          recognitionRef.current.stop();
          setIsPaused(true);
        }
      }
    }
  };

  useEffect(() => {
    if (!isVipUser || !microphone || !connection) return;

    const onData = (e: BlobEvent) => {
      if (e.data.size > 0 && connection.readyState === WebSocket.OPEN) {
        connection.send(e.data);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.onmessage = (event) => {
        const data = JSON.parse(event.data) as LiveTranscriptionEvent;
        if (data.is_final) {
          const newTranscript = data.channel?.alternatives[0]?.transcript || "";
          if (newTranscript) {
            const updatedTranscript =
              transcript + (transcript ? " " : "") + newTranscript;
            handleTranscriptUpdate(updatedTranscript);
          }
        }
      };
      microphone.addEventListener("dataavailable", onData);
      startMicrophone();
    }

    return () => {
      if (connection) connection.onmessage = null;
      if (microphone) microphone.removeEventListener("dataavailable", onData);
    };
  }, [
    connectionState,
    connection,
    microphone,
    startMicrophone,
    user,
    isVipUser,
    transcript,
    handleTranscriptUpdate,
  ]);

  const stats = calculateStats(transcript, fillerCount);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speech Analyzer</CardTitle>
        </CardHeader>

        {!user && showGuestCard && (
          <GuestNotice onDismiss={() => setShowGuestCard(false)} />
        )}

        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={toggleListening}
              variant={isListening && !isPaused ? "destructive" : "default"}
              className="gap-2"
            >
              {!isListening ? (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Start</span>
                </>
              ) : isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>

            {(isListening || transcript) && (
              <Button onClick={handleReset} variant="outline" size="icon">
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}

            {user && transcript && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  variant="outline"
                  size="icon"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {hasUnsavedChanges
                    ? "Unsaved changes"
                    : lastSaveTime
                    ? `Saved ${lastSaveTime.toLocaleTimeString()}`
                    : null}
                </span>
              </div>
            )}
          </div>

          <FillerWordStats
            fillerCount={fillerCount}
            {...stats}
            isVipUser={isVipUser}
          />
        </CardContent>
      </Card>

      <TranscriptCard transcript={transcript} />
    </div>
  );
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
