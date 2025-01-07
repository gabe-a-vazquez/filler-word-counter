"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@filler-word-counter/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/shadcn/card";
import { Progress } from "@filler-word-counter/components/shadcn/progress";
import { auth, db } from "@filler-word-counter/lib/firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Save, RotateCcw, Pause, Play, Mic, X } from "lucide-react";
import { useToast } from "@filler-word-counter/components/shadcn/use-toast";
import Link from "next/link";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  useDeepgram,
} from "@filler-word-counter/context/DeepgramContextProvider";
import { useMicrophone } from "@filler-word-counter/context/MicrophoneContextProvider";

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

const FILLER_WORDS = ["like", "actually", "basically", "literally"];

const calculateStats = (
  transcript: string,
  fillerCount: Record<string, number>
) => {
  const totalFillerWords = Object.values(fillerCount).reduce(
    (a, b) => a + b,
    0
  );
  const words = transcript.trim()
    ? transcript
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;
  const fillerPercentage = words > 0 ? (totalFillerWords / words) * 100 : 0;

  return { totalFillerWords, words, fillerPercentage };
};

const TranscriptCard = ({ transcript }: { transcript: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>Transcript</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        {transcript || "Start speaking to see your transcript..."}
      </p>
    </CardContent>
  </Card>
);

const FillerWordStats = ({
  fillerCount,
}: {
  fillerCount: Record<string, number>;
}) => (
  <div className="mt-4 space-y-2">
    {FILLER_WORDS.map((word) => (
      <div key={word} className="flex justify-between items-center">
        <span className="capitalize">{word}</span>
        <span className="text-muted-foreground">{fillerCount[word] || 0}</span>
      </div>
    ))}
  </div>
);

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pausedTranscriptRef = useRef("");
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } =
    useMicrophone();

  const countFillerWords = useCallback((text: string) => {
    const counts: Record<string, number> = {};
    const words = text
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    FILLER_WORDS.forEach((fillerWord) => {
      counts[fillerWord] = words.filter((word) => word === fillerWord).length;
    });

    setFillerCount(counts);
  }, []);

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
        countFillerWords(newTranscript);
      };
    }
  }, [countFillerWords]);

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

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const stats = calculateStats(transcript, fillerCount);
      await setDoc(doc(db, user.uid, sessionId), {
        userId: user.uid,
        fillerCount,
        totalWords: stats.words,
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
              Successfully saved your speech analysis with {stats.words} words
              and {stats.totalFillerWords} filler words.
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
  };

  const toggleListening = () => {
    if (user) {
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
          connectToDeepgram({
            model: "nova-2",
            interim_results: true,
            smart_format: true,
            filler_words: true,
          });
          setIsPaused(false);
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
    if (!user || !microphone || !connection) return;

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
            setTranscript((prev) => prev + " " + newTranscript);
            countFillerWords(newTranscript);
          }
        }
      };
      microphone.addEventListener("dataavailable", onData);
      startMicrophone();
    }

    return () => {
      if (connection) connection.onmessage = null;
      microphone.removeEventListener("dataavailable", onData);
    };
  }, [connectionState, connection, microphone, startMicrophone, user]);

  const stats = calculateStats(transcript, fillerCount);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speech Analysis</CardTitle>
        </CardHeader>
        {!user && showGuestCard && (
          <CardContent className="border mt-4 mb-10 ml-4 mr-4 p-4 rounded-lg bg-muted">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {/* <p className="text-sm font-medium">Guest Mode</p> */}
                <p className="text-sm text-muted-foreground">
                  You're currently using the app as a guest. Sign up for free to
                  save your results and track your progress over time.
                </p>
                <div className="pt-2">
                  <Link
                    href="/signup"
                    className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline"
                  >
                    Create an account →
                  </Link>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-8"
                onClick={() => setShowGuestCard(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
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

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Filler Words: {stats.totalFillerWords} / {stats.words} words (
              {stats.fillerPercentage.toFixed(1)}%)
            </p>
            <Progress value={stats.fillerPercentage} className="w-full" />
          </div>

          <FillerWordStats fillerCount={fillerCount} />
        </CardContent>
      </Card>

      <TranscriptCard transcript={transcript} />
    </div>
  );
}
