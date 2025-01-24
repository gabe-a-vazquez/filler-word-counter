export const BASIC_FILLER_WORDS = [
  "like",
  "basically",
  "literally",
  "actually",
  "so",
] as const;

export const PREMIUM_FILLER_WORDS = [
  "uh",
  "um",
  ...BASIC_FILLER_WORDS,
] as const;

export const calculateStats = (
  transcript: string,
  fillerCount: Record<string, number>,
  transformerResults?: Record<string, any>
) => {
  const totalFillerWords = Object.entries(fillerCount).reduce(
    (sum, [word, count]) => {
      // If we have transformer results for this word, only count instances marked as filler
      if (transformerResults?.[word]) {
        return transformerResults[word].isFillerWord ? sum + count : sum;
      }
      return sum + count;
    },
    0
  );

  const totalWords = transcript.trim()
    ? transcript
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    : 0;
  const fillerPercentage =
    totalWords > 0 ? (totalFillerWords / totalWords) * 100 : 0;

  return { totalFillerWords, totalWords, fillerPercentage };
};

export const countFillerWords = (
  transcript: string,
  isPremium: boolean = false,
  transformerResults?: Record<string, any>
): Record<string, number> => {
  const fillerWords = isPremium ? PREMIUM_FILLER_WORDS : BASIC_FILLER_WORDS;
  const words = transcript.toLowerCase();

  return fillerWords.reduce((acc, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = words.match(regex) || [];

    // Only count matches that are determined to be filler words by the transformer
    if (matches.length > 0) {
      if (transformerResults?.[word]) {
        acc[word] = transformerResults[word].isFillerWord ? matches.length : 0;
      } else {
        acc[word] = matches.length;
      }
    }
    return acc;
  }, {} as Record<string, number>);
};
