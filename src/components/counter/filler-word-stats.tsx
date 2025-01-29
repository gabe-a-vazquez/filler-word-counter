import { FILLER_WORDS } from "@filler-word-counter/lib/speech/speech-utils";
import { Progress } from "@filler-word-counter/components/ui/progress";

interface FillerWordStatsProps {
  fillerCount: Record<string, number>;
  totalWords: number;
  totalFillerWords: number;
  fillerPercentage: number;
  isVipUser: boolean;
}

export function FillerWordStats({
  fillerCount,
  totalWords,
  totalFillerWords,
  fillerPercentage,
  isVipUser,
}: FillerWordStatsProps) {
  // const fillerWords = isVipUser ? PREMIUM_FILLER_WORDS : BASIC_FILLER_WORDS;

  return (
    <div className="space-y-4 mt-4">
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">
          Filler Words: {totalFillerWords} / {totalWords} words (
          {fillerPercentage.toFixed(1)}%)
        </p>
        <Progress value={fillerPercentage} className="w-full" />
      </div>

      <div className="space-y-2">
        <div className="grid gap-1.5">
          {FILLER_WORDS.map((word) => {
            return (
              <div key={word} className="flex justify-between items-center">
                <span className="capitalize">{word}</span>
                <span className="text-muted-foreground">
                  {fillerCount[word] || 0}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
