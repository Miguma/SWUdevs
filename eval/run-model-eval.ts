import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  checkHuggingFaceHealth,
  executeHuggingFaceExtraction,
} from "../src/server/services/huggingface-client";
import { aggregateScores, scoreCase, type BenchmarkCase } from "./metrics";

async function runModelEvaluation() {
  // CLI tools use shell variables, not Next's .env.local loader.
  const provider = "huggingface";
  const datasetBytes = fs.readFileSync(
    path.resolve(__dirname, "dataset.json"),
    "utf8",
  );
  const dataset: BenchmarkCase[] = JSON.parse(datasetBytes);
  const inference = await checkHuggingFaceHealth().then((health) => ({
    model: health.model,
    available: health.configured && health.modelAvailable,
    unavailableReason: health.error || "Pinned cloud model unavailable",
  }));
  const model = inference.model;
  const reportPath = path.resolve(__dirname, "model-eval-report");
  const base = {
    benchmarkDate: new Date().toISOString(),
    mode: "LIVE_MODEL_INFERENCE",
    provider,
    model,
    datasetSha256: createHash("sha256").update(datasetBytes).digest("hex"),
    totalTestCases: dataset.length,
    matcher:
      "Maximum one-to-one lexical token Dice >= 0.6; multilingual paraphrases require human audit.",
  };
  function writeReport(report: object) {
    fs.writeFileSync(
      `${reportPath}.json`,
      JSON.stringify(report, null, 2) + "\n",
    );
    fs.writeFileSync(
      `${reportPath}.md`,
      `# Tambayayong live model evaluation\n\nGround truth is used only for scoring. Empty predictions remain empty; failed inference never becomes a prediction.\n\nMetrics cover successful inference only; inspect errors and coverage before quoting scores. Null means no denominator. Lexical matching is an approximation.\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`,
    );
  }
  if (!inference.available) {
    const reason = inference.unavailableReason;
    writeReport({
      ...base,
      status: "NOT_RUN",
      reason,
      evaluatedSampleCount: 0,
      metrics: null,
    });
    console.error(`${reason.replace(/[.!?]$/, "")}. No accuracy scores generated.`);
    process.exitCode = 1;
    return;
  }
  const rows: ReturnType<typeof scoreCase>[] = [];
  const predictions: { id: string; prediction: unknown }[] = [];
  const errors: { id: string; error: string }[] = [];
  for (const tc of dataset) {
    try {
      // Only source fields cross the inference boundary, never groundTruth.
      const input = {
        title: `Eval ${tc.id}`,
        meetingDate: tc.meetingDate || undefined,
        timezone: tc.timezone,
        rawText: tc.notes,
        model,
      };
      const prediction = await executeHuggingFaceExtraction(input);
      predictions.push({ id: tc.id, prediction });
      rows.push(scoreCase(prediction, tc));
      console.log(
        `${tc.id}: ${prediction.actionItems.length} actual predicted tasks`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown inference failure";
      errors.push({ id: tc.id, error: message });
      console.error(`${tc.id}: ${message}`);
    }
  }
  const report = {
    ...base,
    status: errors.length ? "INCOMPLETE" : "COMPLETE",
    evaluatedSampleCount: rows.length,
    failedSampleCount: errors.length,
    metrics: aggregateScores(rows),
    languageBreakdown: Object.fromEntries(
      ["english", "cebuano", "mixed"].map((language) => [
        language,
        {
          evaluatedSampleCount: rows.filter((row) => row.language === language)
            .length,
          metrics: aggregateScores(
            rows.filter((row) => row.language === language),
          ),
        },
      ]),
    ),
    details: rows,
    errors,
    predictions,
  };
  writeReport(report);
  console.log(JSON.stringify(report.metrics, null, 2));
  if (errors.length) process.exitCode = 1;
}
runModelEvaluation().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
