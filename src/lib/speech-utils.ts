export const BASIC_FILLER_WORDS = [
  "like",
  // "you know",
  // "kind of",
  // "sort of",
  "basically",
  "literally",
  "actually",
  // "seriously",
  // "totally",
  // "whatever",
  // "anyway",
  // "well",
  // "so",
  // "right",
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

export const countFillerWords = (
  transcript: string,
  isPremium: boolean = false
): Record<string, number> => {
  const fillerWords = isPremium ? PREMIUM_FILLER_WORDS : BASIC_FILLER_WORDS;
  const words = transcript.toLowerCase();

  return fillerWords.reduce((acc, word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const count = (words.match(regex) || []).length;
    if (count > 0) {
      acc[word] = count;
    }
    return acc;
  }, {} as Record<string, number>);
};
