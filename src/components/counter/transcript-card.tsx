import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@filler-word-counter/components/ui/card";
import { useEffect, useState } from "react";

interface TranscriptCardProps {
  transcript: string;
}

export function TranscriptCard({ transcript }: TranscriptCardProps) {
  const [isOverLimit, setIsOverLimit] = useState(false);

  // Add this function to check usage before processing
  const checkUsage = async () => {
    try {
      const response = await fetch("/api/deepgram/check-usage");
      const data = await response.json();

      if (data.isOverLimit) {
        setIsOverLimit(true);
        // Show upgrade modal or message
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking usage:", error);
      return false;
    }
  };

  // Modify your existing handleFileUpload function
  const handleFileUpload = async (file: File) => {
    const canProcess = await checkUsage();
    if (!canProcess) {
      // Show error message or upgrade prompt
      return;
    }

    // ... rest of your existing upload logic
  };

  return (
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
}
