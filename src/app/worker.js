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

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  try {
    const { text } = event.data;

    // Get the feature extraction pipeline
    let extractor = await PipelineSingleton.getInstance((x) => {
      self.postMessage({ status: "progress", data: x });
    });

    // Get embeddings for input text
    const textEmbedding = await extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    console.log("textEmbedding", textEmbedding);

    const results = {};

    for (const [word, patterns] of Object.entries(USAGE_PATTERNS)) {
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

        results[word] = {
          isFillerWord: fillerSimilarity > meaningfulSimilarity,
          fillerSimilarity,
          meaningfulSimilarity,
          confidence: Math.abs(fillerSimilarity - meaningfulSimilarity),
          context: text,
        };

        console.log("results", results);
      }
    }

    self.postMessage({
      status: "complete",
      results,
    });
  } catch (error) {
    console.error("Error in worker:", error);
    self.postMessage({
      status: "error",
      error: error.message,
    });
  }
});
