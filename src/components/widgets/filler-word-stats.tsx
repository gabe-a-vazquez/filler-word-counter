import { Progress } from "@filler-word-counter/components/shadcn/progress";
import { FILLER_WORDS } from "@filler-word-counter/lib/speech-utils";

interface FillerWordStatsProps {
  fillerCount: Record<string, number>;
  totalWords: number;
  totalFillerWords: number;
  fillerPercentage: number;
}

export function FillerWordStats({
  fillerCount,
  totalWords,
  totalFillerWords,
  fillerPercentage,
}: FillerWordStatsProps) {
  return (
    <>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">
          Filler Words: {totalFillerWords} / {totalWords} words (
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
    </>
  );
}
