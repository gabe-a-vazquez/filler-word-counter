import { pipeline, env } from "@huggingface/transformers";
import {
  createRun,
  updateRun,
  recordConfidence,
} from "../lib/langsmith/langsmith-utils";

// Skip local model check
env.allowLocalModels = false;

// Use Singleton pattern for the pipeline
class PipelineSingleton {
  static task = "feature-extraction";
  static model = "Supabase/gte-small";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

const USAGE_PATTERNS = {
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

function cosineSimilarity(embeddings1, embeddings2) {
  const dotProduct = embeddings1.reduce(
    (sum, val, i) => sum + val * embeddings2[i],
    0
  );
  return dotProduct;
}

function calculateAverageSimilarity(embedding, patternEmbeddings) {
  const similarities = patternEmbeddings.map((pattern) =>
    cosineSimilarity(embedding.tolist()[0], pattern.tolist()[0])
  );
  return similarities.reduce((sum, val) => sum + val, 0) / similarities.length;
}

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  let runId;
  const startTime = Date.now();

  try {
    const { text } = event.data;

    // Create a new run in LangSmith
    const run = await createRun(text, {
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });
    runId = run?.id || run;

    const newResults = {};
    const processingTimes = {
      simpleWordMatch: 0,
      embedding: 0,
      similarity: 0,
    };

    // Track simple word matching time
    const simpleMatchStart = Date.now();
    const words = text
      .toLowerCase()
      .replace(/[.,!?;:'"()\[\]{}]/g, "")
      .split(/\s+/);

    ["uh", "um"].forEach((word) => {
      if (words.includes(word)) {
        newResults[word] = {
          isFillerWord: true,
          fillerSimilarity: 1,
          meaningfulSimilarity: 0,
          confidence: 1,
          context: text,
        };
      }
    });

    processingTimes.simpleWordMatch = Date.now() - simpleMatchStart;

    // Only use transformer for other filler words
    const remainingWords = Object.keys(USAGE_PATTERNS)
      .filter((word) => !["uh", "um"].includes(word))
      .filter((word) => {
        // Create a regex that matches the word as a whole word
        const wordRegex = new RegExp(`\\b${word}\\b`, "i");
        return wordRegex.test(text);
      });

    if (remainingWords.length > 0) {
      let extractor = await PipelineSingleton.getInstance((x) => {
        self.postMessage({ status: "progress", data: x });
      });

      const textEmbedding = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });

      for (const word of remainingWords) {
        const patterns = USAGE_PATTERNS[word];
        const fillerEmbeddings = await Promise.all(
          patterns.filler_patterns.map((p) =>
            extractor(p, { pooling: "mean", normalize: true })
          )
        );

        const meaningfulEmbeddings = await Promise.all(
          patterns.meaningful_patterns.map((p) =>
            extractor(p, { pooling: "mean", normalize: true })
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

        newResults[word] = {
          isFillerWord: fillerSimilarity > meaningfulSimilarity,
          fillerSimilarity,
          meaningfulSimilarity,
          confidence: Math.abs(fillerSimilarity - meaningfulSimilarity),
          context: text,
        };
      }
    }

    // Update run with results and metrics
    if (runId) {
      await updateRun(runId, newResults);

      // Record confidence scores for each word
      const confidenceScores = Object.entries(newResults).forEach(
        ([word, result]) => {
          // word,
          recordConfidence(runId, result.confidence, word);
          // confidence: result.confidence,
          // fillerSimilarity: result.fillerSimilarity,
          // meaningfulSimilarity: result.meaningfulSimilarity,
          // isFillerWord: result.isFillerWord,
        }
      );

      await recordConfidence(runId, confidenceScores);
    }

    // Send results back to main thread
    if (Object.keys(newResults).length) {
      self.postMessage({
        status: "complete",
        results: newResults,
        analyzedText: text,
      });
    }
  } catch (error) {
    console.error("Error in worker:", error);

    // Log error to LangSmith if we have a runId
    if (runId) {
      await updateRun(runId, null, {
        error: error.message,
        processingTime: Date.now() - startTime,
      });
    }

    self.postMessage({
      status: "error",
      error: error.message,
    });
  }
});
// Add handler for reset
self.addEventListener("message", (event) => {
  if (event.data.type === "reset") {
    accumulatedResults = {};
  }
});
