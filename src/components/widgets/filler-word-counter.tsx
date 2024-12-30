"use client";

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

import { useState, useEffect, useRef } from "react";
import { Button } from "@filler-word-counter/components/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/shadcn/card";
import { Progress } from "@filler-word-counter/components/shadcn/progress";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: (event: any) => void;
}

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "actually",
  "basically",
  "literally",
];

export default function FillerWordCounter() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [fillerCount, setFillerCount] = useState<Record<string, number>>({});
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
        setTranscript(currentTranscript);
        countFillerWords(currentTranscript);
      };
    }
  }, []);

  const countFillerWords = (text: string) => {
    const counts: Record<string, number> = {};
    const words = text.toLowerCase().split(" ");

    FILLER_WORDS.forEach((fillerWord) => {
      counts[fillerWord] = words.filter((word) => word === fillerWord).length;
    });

    setFillerCount(counts);
  };

  const toggleListening = () => {
    if (!isListening) {
      recognitionRef.current?.start();
    } else {
      recognitionRef.current?.stop();
    }
    setIsListening(!isListening);
  };

  const totalFillerWords = Object.values(fillerCount).reduce(
    (a, b) => a + b,
    0
  );
  const words = transcript.split(" ").length;
  const fillerPercentage = words > 0 ? (totalFillerWords / words) * 100 : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Speech Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={toggleListening}
            variant={isListening ? "destructive" : "default"}
          >
            {isListening ? "Stop Listening" : "Start Listening"}
          </Button>

          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Filler Words: {totalFillerWords} / {words} words (
              {fillerPercentage.toFixed(1)}%)
            </p>
            <Progress value={fillerPercentage} className="w-full" />
          </div>

          <div className="mt-4 space-y-2">
            {FILLER_WORDS.map((word) => (
              <div key={word} className="flex justify-between items-center">
                <span className="capitalize">{word}</span>
                <span className="text-muted-foreground">
                  {fillerCount[word] || 0}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
