import { evaluate } from "langsmith/evaluation";
import type { EvaluationResult } from "langsmith/evaluation";
import type { Run, Example } from "langsmith/schemas";
import { FillerWordDetector } from "../services/filler-word-service.js";
import { pipeline } from "@huggingface/transformers";

// 1. Define a dataset
const datasetName = "speechai-qa-dataset";

async function evaluateText(text: string) {
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/bge-base-en-v1.5"
  );
  const detector = new FillerWordDetector(extractor);
  return detector.detectFillerWords(text);
}

// 2. Define an evaluator
function isCorrect(rootRun: Run, example?: Example): EvaluationResult {
  const isCorrect =
    Object.values(rootRun.outputs?.result.results as Record<string, any>)[0]
      .isFillerWord ===
    Object.values(example?.outputs as Record<string, any>)[0].isFillerWord;
  console.log("IS_CORRECT:", isCorrect);
  return { key: "is_correct", score: isCorrect ? 1 : 0 };
}

async function main() {
  // 3. Run an evaluation
  await evaluate(
    async (input: { text: string }) => {
      const result = await evaluateText(input.text);
      return {
        result,
      };
    },
    {
      data: datasetName,
      evaluators: [isCorrect],
      experimentPrefix: "Xenova/bge-base-en-v1.5",
    }
  );
}

// Run if called directly
if (import.meta.url === new URL(import.meta.url).href) {
  main().catch(console.error);
}
