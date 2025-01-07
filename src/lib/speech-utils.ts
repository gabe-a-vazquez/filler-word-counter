export const FILLER_WORDS = [
  "uh",
  "um",
  "like",
  "actually",
  "basically",
  "literally",
];

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
  const cleanText = text
    .toLowerCase()
    .replace(/[.,!?]/g, "") // Remove punctuation
    .trim();

  // Initialize counts
  FILLER_WORDS.forEach((word) => {
    counts[word] = 0;
  });

  // Count single-word fillers
  const words = cleanText.split(/\s+/).filter((word) => word.length > 0);
  const singleWordFillers = FILLER_WORDS.filter((w) => !w.includes(" "));
  words.forEach((word) => {
    singleWordFillers.forEach((filler) => {
      if (word === filler) counts[filler]++;
    });
  });

  // Count multi-word fillers
  const multiWordFillers = FILLER_WORDS.filter((w) => w.includes(" "));
  multiWordFillers.forEach((filler) => {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    const matches = cleanText.match(regex);
    if (matches) {
      counts[filler] = matches.length;
    }
  });

  // Remove fillers with zero count
  return Object.fromEntries(
    Object.entries(counts).filter(([_, count]) => count > 0)
  );
};
