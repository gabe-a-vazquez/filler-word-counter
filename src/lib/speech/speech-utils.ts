export const FILLER_WORDS = [
  "uh",
  "um",
  "like",
  "basically",
  "literally",
  "actually",
  "so",
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
  existingCounts: Record<string, number>,
  transformerResults: Record<string, any>
): Record<string, number> => {
  // Create a new object to avoid mutating the existing counts
  const newCounts = { ...existingCounts };

  // Process new results and add to counts
  Object.entries(transformerResults).forEach(([word, result]) => {
    if (result.isFillerWord) {
      if (!newCounts[word]) newCounts[word] = 1;
      else newCounts[word]++;
    }
  });

  return newCounts;
};
