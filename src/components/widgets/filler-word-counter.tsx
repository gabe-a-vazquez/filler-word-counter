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
import { Save, RotateCcw, Pause, Play, Mic } from "lucide-react";
import { useToast } from "@filler-word-counter/components/shadcn/use-toast";

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

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const pausedTranscriptRef = useRef("");
  const [user] = useAuthState(auth);
  const { toast } = useToast();

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

      toast({
        title: "Session Saved",
        description: `Successfully saved your speech analysis with ${stats.words} words and ${stats.totalFillerWords} filler words.`,
        duration: 3000,
        variant: "success",
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
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsPaused(false);
    setTranscript("");
    setFillerCount({});
    pausedTranscriptRef.current = "";
  };

  const toggleListening = () => {
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
  };

  const stats = calculateStats(transcript, fillerCount);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speech Analysis</CardTitle>
        </CardHeader>
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
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="outline"
                size="icon"
              >
                <Save className="h-4 w-4" />
              </Button>
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
