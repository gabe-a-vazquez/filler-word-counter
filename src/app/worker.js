import { pipeline, env } from "@huggingface/transformers";

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
  // Add other filler words as needed
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

let accumulatedResults = {};

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  try {
    const { text } = event.data;

    let extractor = await PipelineSingleton.getInstance((x) => {
      self.postMessage({ status: "progress", data: x });
    });

    const textEmbedding = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });

    const newResults = {};

    for (const [word, patterns] of Object.entries(USAGE_PATTERNS)) {
      // Only analyze if the new text contains the word
      if (text.toLowerCase().includes(word)) {
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

    // Only send if we have new results
    if (Object.keys(newResults).length) {
      self.postMessage({
        status: "complete",
        results: newResults,
        analyzedText: text,
      });
    }
  } catch (error) {
    console.error("Error in worker:", error);
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
