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
  fillerCount: Record<string, number>
) => {
  // Sum up all filler word counts
  const totalFillerWords = Object.values(fillerCount).reduce(
    (sum, count) => sum + count,
    0
  );

  // Count total words in transcript
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
  fillerCount: Record<string, number>,
  transformerResults: Record<string, any>
): Record<string, number> => {
  Object.entries(transformerResults).forEach(([word, result]) => {
    if (!fillerCount[word]) fillerCount[word] = 0;
    if (result.isFillerWord) fillerCount[word]++;
  });

  return fillerCount;
};
