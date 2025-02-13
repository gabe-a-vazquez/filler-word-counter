import { pipeline, env } from "@huggingface/transformers";
import {
  createRun,
  updateRun,
  recordConfidence,
} from "../lib/langsmith/langsmith-utils";
import { FillerWordDetector } from "../lib/services/filler-word-service";

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

// Listen for messages from the main thread
self.addEventListener("message", async (event) => {
  let runId;
  const startTime = Date.now();

  try {
    const { text } = event.data;
    const extractor = await PipelineSingleton.getInstance();
    const detector = new FillerWordDetector(extractor);

    // Create LangSmith run
    runId = await createRun(text, {
      textLength: text.length,
      timestamp: new Date().toISOString(),
    });

    // Detect filler words
    const { results: newResults, processingTimes } =
      await detector.detectFillerWords(text);

    // Update LangSmith run
    if (runId) {
      await updateRun(runId, newResults);

      // Record confidence scores for each word
      const confidenceScores = Object.entries(newResults).forEach(
        ([word, result]) => {
          recordConfidence(runId, result.confidence, word);
        }
      );

      await recordConfidence(runId, confidenceScores);
    }

    // Send results
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
