export const FILLER_WORDS = ["like", "actually", "basically", "literally"];

export const calculateStats = (
  transcript: string,
  fillerCount: Record<string, number>
) => {
  const totalFillerWords = Object.values(fillerCount).reduce(
    (a, b) => a + b,
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

export const countFillerWords = (text: string): Record<string, number> => {
  const counts: Record<string, number> = {};
  const words = text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  FILLER_WORDS.forEach((fillerWord) => {
    counts[fillerWord] = words.filter((word) => word === fillerWord).length;
  });

  return counts;
};
