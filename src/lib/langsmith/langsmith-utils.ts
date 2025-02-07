import { Client } from "langsmith";

// Initialize LangSmith client
export const langSmithClient = new Client({
  apiUrl: process.env.NEXT_PUBLIC_LANGSMITH_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_LANGSMITH_API_KEY,
});

// Helper to create a new run
export async function createRun(input: string, metadata = {}) {
  try {
    // Generate a unique run ID
    const runId = crypto.randomUUID();

    await langSmithClient.createRun({
      id: runId, // Specify the ID we want to use
      name: "filler-word-detection",
      inputs: { text: input },
      run_type: "tool",
      start_time: Date.now(),
      extra: {
        modelVersion: "gte-small",
        ...metadata,
      },
      project_name: process.env.LANGSMITH_PROJECT,
    });

    console.log("LangSmith run created with ID:", runId);
    return runId; // Return the ID we generated
  } catch (error) {
    console.error("Error creating LangSmith run:", error);
    throw error;
  }
}

// Helper to update run with results
export async function updateRun(runId: string, output: any, metrics = {}) {
  await langSmithClient.updateRun(runId, {
    outputs: output,
    end_time: Date.now(),
    extra: metrics,
  });
}

// Add new function to record confidence scores
export async function recordConfidence(
  runId: string,
  score: number,
  word: string
) {
  try {
    await langSmithClient.createFeedback(runId, "confidence_score", {
      score: score,
      value: word,
    });
  } catch (error) {
    console.error("Error recording confidence:", error);
    throw error;
  }
}
