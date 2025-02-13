import { env } from "@huggingface/transformers";

// Skip local model check
env.allowLocalModels = false;

type PatternType = {
  filler_patterns: string[];
  meaningful_patterns: string[];
};

type UsagePatternsType = {
  [key in "like" | "basically" | "literally" | "actually" | "so"]: PatternType;
};

const USAGE_PATTERNS: UsagePatternsType = {
  like: {
    filler_patterns: [
      "I was, like, really",
      "She's like totally",
      "It's like whatever",
      "They were like going",
    ],
    meaningful_patterns: [
      "I like pizza",
      "She looks like",
      "It feels like home",
      "They act like professionals",
    ],
  },
  basically: {
    filler_patterns: [
      "I basically just went there",
      "It's basically kind of like",
      "We basically did nothing",
      "She basically always does this",
    ],
    meaningful_patterns: [
      "The problem is basically solved",
      "This is basically algebra",
      "The concept is basically sound",
      "The foundation is basically complete",
    ],
  },
  literally: {
    filler_patterns: [
      "I literally can't even",
      "She literally always says that",
      "It's literally so annoying",
      "They literally just left",
    ],
    meaningful_patterns: [
      "The word literally means exactly",
      "Take this literally",
      "The instructions should be followed literally",
      "The translation is literally correct",
    ],
  },
  actually: {
    filler_patterns: [
      "I actually just thought",
      "It's actually kind of weird",
      "Actually, I don't know",
      "We actually were going to",
    ],
    meaningful_patterns: [
      "Is this actually true?",
      "The results were actually surprising",
      "This actually happened yesterday",
      "The experiment actually worked",
    ],
  },
  so: {
    filler_patterns: [
      "I'm so like whatever",
      "It's so totally awesome",
      "So, anyway, as I was saying",
      "So, yeah, that happened",
    ],
    meaningful_patterns: [
      "I am so happy",
      "The water is so cold",
      "She ran so fast",
      "They worked so hard",
    ],
  },
};

export function cosineSimilarity(embeddings1: number[], embeddings2: number[]) {
  const dotProduct = embeddings1.reduce(
    (sum, val, i) => sum + val * embeddings2[i],
    0
  );
  return dotProduct;
}

export function calculateAverageSimilarity(
  embedding: any,
  patternEmbeddings: any[]
) {
  const similarities = patternEmbeddings.map((pattern) =>
    cosineSimilarity(embedding.tolist()[0], pattern.tolist()[0])
  );
  return similarities.reduce((sum, val) => sum + val, 0) / similarities.length;
}

export class FillerWordDetector {
  private extractor: any;

  constructor(extractor: any) {
    this.extractor = extractor;
  }

  async detectFillerWords(text: string) {
    const results: any = {};
    const processingTimes = {
      simpleWordMatch: 0,
      embedding: 0,
      similarity: 0,
    };

    // Simple word matching
    const simpleMatchStart = Date.now();
    const words = text
      .toLowerCase()
      .replace(/[.,!?;:'"()\[\]{}]/g, "")
      .split(/\s+/);

    ["uh", "um"].forEach((word) => {
      if (words.includes(word)) {
        results[word] = {
          isFillerWord: true,
          fillerSimilarity: 1,
          meaningfulSimilarity: 0,
          confidence: 1,
          context: text,
        };
      }
    });
    processingTimes.simpleWordMatch = Date.now() - simpleMatchStart;

    // Complex word matching
    const remainingWords = Object.keys(USAGE_PATTERNS)
      .filter((word) => !["uh", "um"].includes(word))
      .filter((word) => {
        const wordRegex = new RegExp(`\\b${word}\\b`, "i");
        return wordRegex.test(text);
      });

    if (remainingWords.length > 0) {
      const textEmbedding = await this.extractor(text, {
        pooling: "mean",
        normalize: true,
      });

      for (const word of remainingWords) {
        const patterns = USAGE_PATTERNS[word as keyof UsagePatternsType];
        const fillerEmbeddings = await Promise.all(
          patterns.filler_patterns.map((p) =>
            this.extractor(p, { pooling: "mean", normalize: true })
          )
        );

        const meaningfulEmbeddings = await Promise.all(
          patterns.meaningful_patterns.map((p) =>
            this.extractor(p, { pooling: "mean", normalize: true })
          )
        );

        const fillerSimilarity = calculateAverageSimilarity(
          textEmbedding,
          fillerEmbeddings
        );

        const meaningfulSimilarity = calculateAverageSimilarity(
          textEmbedding,
          meaningfulEmbeddings
        );

        results[word] = {
          isFillerWord: fillerSimilarity > meaningfulSimilarity,
          fillerSimilarity,
          meaningfulSimilarity,
          confidence: Math.abs(fillerSimilarity - meaningfulSimilarity),
          context: text,
        };
      }
    }

    return { results, processingTimes };
  }
}
