import fs from "fs";
import path from "path";
import { checkOllamaHealth, executeOllamaExtraction } from "../src/server/services/ollama-client";

interface TestCase {
  id: string;
  language: "english" | "cebuano" | "mixed";
  category: string;
  meetingDate: string | null;
  timezone: string;
  notes: string;
  groundTruth: {
    expectedTasks: Array<{
      title: string;
      assignees: string[];
      expectedDeadlineDate: string | null;
      status: "confirmed" | "proposed";
    }>;
    expectedDecisions: string[];
    expectedOpenQuestions: string[];
  };
}

interface CaseMetrics {
  id: string;
  language: string;
  category: string;
  status: "success" | "error";
  errorMessage?: string;
  extractedTaskCount: number;
  expectedTaskCount: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  ownerAccuracy: number;
  deadlineAccuracy: number;
  evidenceValidRate: number;
}

function calculateF1(p: number, r: number): number {
  if (p + r === 0) return 0;
  return (2 * p * r) / (p + r);
}

function isTaskMatch(extractedTitle: string, expectedTitle: string): boolean {
  const normExt = extractedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const normExp = expectedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "");

  if (normExt.includes(normExp) || normExp.includes(normExt)) return true;

  const extWords = new Set(normExt.split(/\s+/).filter((w) => w.length > 2));
  const expWords = new Set(normExp.split(/\s+/).filter((w) => w.length > 2));

  let common = 0;
  extWords.forEach((w) => {
    if (expWords.has(w)) common++;
  });

  const overlap = common / Math.max(1, Math.min(extWords.size, expWords.size));
  return overlap >= 0.4;
}

async function runModelEvaluation() {
  console.log("==================================================================");
  console.log("  TAMBAYAYONG — LIVE OLLAMA MODEL EVALUATION BENCHMARK");
  console.log("==================================================================\n");

  const datasetPath = path.resolve(__dirname, "./dataset.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const dataset: TestCase[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

  // Check Ollama health
  const health = await checkOllamaHealth();
  if (!health.ollamaConnected) {
    console.error("❌ Ollama server is unreachable at " + health.inferenceHost);
    console.error("   Error: " + (health.error || "Connection failed"));
    console.error("\n[EVALUATION ABORTED]");
    console.error("Per strict SDD rules: Ground truth will NOT be substituted for missing model output.");
    console.error("To run live model evaluation:");
    console.error("  1. Start Ollama: ollama serve");
    console.error("  2. Pull model:   ollama pull " + health.configuredModel);
    console.error("  3. Run:          npm run eval:model\n");

    const unrunReport = {
      benchmarkDate: new Date().toISOString(),
      liveInferenceAttempted: true,
      status: "NOT_RUN",
      reason: "Ollama server unreachable at " + health.inferenceHost,
      configuredModel: health.configuredModel,
      totalTestCases: dataset.length,
      evaluatedSampleCount: 0,
    };

    fs.writeFileSync(
      path.resolve(__dirname, "./model-eval-report.json"),
      JSON.stringify(unrunReport, null, 2)
    );

    const mdNotice = `# Tambayayong Live Model Evaluation Report
- **Date:** ${new Date().toLocaleString()}
- **Status:** **NOT RUN (OLLAMA UNREACHABLE)**
- **Configured Model:** \`${health.configuredModel}\`
- **Host:** \`${health.inferenceHost}\`

> [!WARNING]
> Ollama daemon was not running when \`npm run eval:model\` was executed.
> In accordance with strict Spec-Driven Development rules, ground truth answers are **never** substituted for live predictions.
> Start Ollama with \`ollama serve\` and re-run this command.
`;
    fs.writeFileSync(path.resolve(__dirname, "./model-eval-report.md"), mdNotice);
    process.exit(1);
  }

  if (!health.modelAvailable) {
    console.error(`❌ Configured model '${health.configuredModel}' is not pulled in Ollama.`);
    console.error(`   Available models in Ollama: ${health.availableModels.join(", ") || "none"}`);
    console.error(`\nPlease run: ollama pull ${health.configuredModel}\n`);
    process.exit(1);
  }

  console.log(`✓ Ollama connected at ${health.inferenceHost}`);
  console.log(`✓ Active model: ${health.configuredModel}`);
  console.log(`Evaluating ${dataset.length} test cases...\n`);

  const results: CaseMetrics[] = [];
  let successfulRuns = 0;
  let failedRuns = 0;

  for (let i = 0; i < dataset.length; i++) {
    const tc = dataset[i];
    process.stdout.write(`[${i + 1}/${dataset.length}] Evaluating ${tc.id} (${tc.language})... `);

    try {
      const extraction = await executeOllamaExtraction({
        title: `Eval ${tc.id}`,
        meetingDate: tc.meetingDate || undefined,
        timezone: tc.timezone,
        rawText: tc.notes,
      });

      const extractedTasks = extraction.actionItems.map((item) => ({
        title: item.title,
        assignees: item.assignees,
        deadlineDate: item.deadline.date,
        status: item.commitmentStatus,
        evidenceQuote: item.evidence[0]?.quote || "",
        isEvidenceVerified: item.evidence[0]?.provenance !== "unverified" && Boolean(item.evidence[0]?.isVerified),
      }));

      const expected = tc.groundTruth.expectedTasks;
      let tp = 0;
      let correctOwners = 0;
      let correctDeadlines = 0;
      let verifiedEvidenceCount = 0;
      const matchedExpectedIndices = new Set<number>();

      for (const ext of extractedTasks) {
        if (ext.isEvidenceVerified) verifiedEvidenceCount++;

        for (let j = 0; j < expected.length; j++) {
          if (!matchedExpectedIndices.has(j) && isTaskMatch(ext.title, expected[j].title)) {
            matchedExpectedIndices.add(j);
            tp++;

            const expAssignees = expected[j].assignees.map((a) => a.toLowerCase().trim());
            const extAssignees = ext.assignees.map((a) => a.toLowerCase().trim());
            const ownerMatch =
              (expAssignees.length === 0 && extAssignees.length === 0) ||
              expAssignees.some((a) => extAssignees.includes(a));
            if (ownerMatch) correctOwners++;

            if (ext.deadlineDate === expected[j].expectedDeadlineDate) {
              correctDeadlines++;
            }
            break;
          }
        }
      }

      const fp = Math.max(0, extractedTasks.length - tp);
      const fn = Math.max(0, expected.length - tp);

      // Honest zero-handling: If both expected and extracted are 0 -> perfect precision & recall
      const precision = extractedTasks.length > 0 ? tp / extractedTasks.length : expected.length === 0 ? 1.0 : 0.0;
      const recall = expected.length > 0 ? tp / expected.length : extractedTasks.length === 0 ? 1.0 : 0.0;
      const f1 = calculateF1(precision, recall);

      const ownerAcc = tp > 0 ? correctOwners / tp : expected.length === 0 ? 1.0 : 0.0;
      const deadlineAcc = tp > 0 ? correctDeadlines / tp : expected.length === 0 ? 1.0 : 0.0;
      const evRate = extractedTasks.length > 0 ? verifiedEvidenceCount / extractedTasks.length : 1.0;

      results.push({
        id: tc.id,
        language: tc.language,
        category: tc.category,
        status: "success",
        extractedTaskCount: extractedTasks.length,
        expectedTaskCount: expected.length,
        truePositives: tp,
        falsePositives: fp,
        falseNegatives: fn,
        precision,
        recall,
        f1,
        ownerAccuracy: ownerAcc,
        deadlineAccuracy: deadlineAcc,
        evidenceValidRate: evRate,
      });

      successfulRuns++;
      console.log(`✓ (F1: ${(f1 * 100).toFixed(0)}%)`);
    } catch (err: any) {
      failedRuns++;
      console.log(`❌ ERROR: ${err.message}`);

      results.push({
        id: tc.id,
        language: tc.language,
        category: tc.category,
        status: "error",
        errorMessage: err.message,
        extractedTaskCount: 0,
        expectedTaskCount: tc.groundTruth.expectedTasks.length,
        truePositives: 0,
        falsePositives: 0,
        falseNegatives: tc.groundTruth.expectedTasks.length,
        precision: 0,
        recall: 0,
        f1: 0,
        ownerAccuracy: 0,
        deadlineAccuracy: 0,
        evidenceValidRate: 0,
      });
    }
  }

  // Summary aggregation
  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const overallPrecision = avg(results.map((r) => r.precision));
  const overallRecall = avg(results.map((r) => r.recall));
  const overallF1 = avg(results.map((r) => r.f1));
  const overallOwnerAcc = avg(results.map((r) => r.ownerAccuracy));
  const overallDeadlineAcc = avg(results.map((r) => r.deadlineAccuracy));
  const overallEvidenceRate = avg(results.map((r) => r.evidenceValidRate));

  const languages = ["english", "cebuano", "mixed"] as const;
  const breakdown: Record<string, any> = {};

  for (const lang of languages) {
    const langRows = results.filter((r) => r.language === lang);
    breakdown[lang] = {
      testCaseCount: langRows.length,
      precision: Number(avg(langRows.map((r) => r.precision)).toFixed(3)),
      recall: Number(avg(langRows.map((r) => r.recall)).toFixed(3)),
      f1: Number(avg(langRows.map((r) => r.f1)).toFixed(3)),
      ownerAccuracy: Number(avg(langRows.map((r) => r.ownerAccuracy)).toFixed(3)),
      deadlineAccuracy: Number(avg(langRows.map((r) => r.deadlineAccuracy)).toFixed(3)),
    };
  }

  const finalReport = {
    benchmarkDate: new Date().toISOString(),
    evaluationMode: "LIVE_MODEL_INFERENCE",
    model: health.configuredModel,
    inferenceHost: health.inferenceHost,
    totalTestCases: dataset.length,
    successfulRuns,
    failedRuns,
    overallMetrics: {
      taskPrecision: Number(overallPrecision.toFixed(3)),
      taskRecall: Number(overallRecall.toFixed(3)),
      taskF1: Number(overallF1.toFixed(3)),
      ownerAccuracy: Number(overallOwnerAcc.toFixed(3)),
      deadlineAccuracy: Number(overallDeadlineAcc.toFixed(3)),
      evidenceValidityRate: Number(overallEvidenceRate.toFixed(3)),
    },
    languageBreakdown: breakdown,
    details: results,
  };

  fs.writeFileSync(
    path.resolve(__dirname, "./model-eval-report.json"),
    JSON.stringify(finalReport, null, 2)
  );

  const mdReport = `# Tambayayong Live Model Evaluation Report
- **Evaluated At:** ${new Date().toLocaleString()}
- **Evaluation Mode:** Live Model Inference (Strict - Zero Synthetic Substitutions)
- **Model Identifier:** \`${health.configuredModel}\`
- **Inference Host:** \`${health.inferenceHost}\`
- **Total Test Cases:** ${dataset.length} (${successfulRuns} succeeded, ${failedRuns} failed)

## Aggregate Performance Metrics
| Metric | Score |
|---|---|
| **Task Precision** | ${(overallPrecision * 100).toFixed(1)}% |
| **Task Recall** | ${(overallRecall * 100).toFixed(1)}% |
| **Task F1 Score** | ${(overallF1 * 100).toFixed(1)}% |
| **Owner Assignment Accuracy** | ${(overallOwnerAcc * 100).toFixed(1)}% |
| **Deadline Extraction Accuracy** | ${(overallDeadlineAcc * 100).toFixed(1)}% |
| **Evidence Grounding Rate** | ${(overallEvidenceRate * 100).toFixed(1)}% |

## Language Performance Breakdown
| Language | Samples | Precision | Recall | F1 Score | Owner Acc | Deadline Acc |
|---|---|---|---|---|---|---|
| **English** | ${breakdown.english.testCaseCount} | ${(breakdown.english.precision * 100).toFixed(1)}% | ${(breakdown.english.recall * 100).toFixed(1)}% | ${(breakdown.english.f1 * 100).toFixed(1)}% | ${(breakdown.english.ownerAccuracy * 100).toFixed(1)}% | ${(breakdown.english.deadlineAccuracy * 100).toFixed(1)}% |
| **Cebuano (Bisaya)** | ${breakdown.cebuano.testCaseCount} | ${(breakdown.cebuano.precision * 100).toFixed(1)}% | ${(breakdown.cebuano.recall * 100).toFixed(1)}% | ${(breakdown.cebuano.f1 * 100).toFixed(1)}% | ${(breakdown.cebuano.ownerAccuracy * 100).toFixed(1)}% | ${(breakdown.cebuano.deadlineAccuracy * 100).toFixed(1)}% |
| **Mixed Code-Switching** | ${breakdown.mixed.testCaseCount} | ${(breakdown.mixed.precision * 100).toFixed(1)}% | ${(breakdown.mixed.recall * 100).toFixed(1)}% | ${(breakdown.mixed.f1 * 100).toFixed(1)}% | ${(breakdown.mixed.ownerAccuracy * 100).toFixed(1)}% | ${(breakdown.mixed.deadlineAccuracy * 100).toFixed(1)}% |
`;

  fs.writeFileSync(path.resolve(__dirname, "./model-eval-report.md"), mdReport);

  console.log("\n=================== LIVE MODEL RESULTS ===================");
  console.log(`Task Precision:        ${(overallPrecision * 100).toFixed(1)}%`);
  console.log(`Task Recall:           ${(overallRecall * 100).toFixed(1)}%`);
  console.log(`Task F1 Score:         ${(overallF1 * 100).toFixed(1)}%`);
  console.log(`Owner Accuracy:        ${(overallOwnerAcc * 100).toFixed(1)}%`);
  console.log(`Deadline Accuracy:     ${(overallDeadlineAcc * 100).toFixed(1)}%`);
  console.log(`Evidence Validity:     ${(overallEvidenceRate * 100).toFixed(1)}%`);
  console.log("==========================================================");
  console.log("Saved report to eval/model-eval-report.json & eval/model-eval-report.md\n");
}

runModelEvaluation().catch((err) => {
  console.error("Evaluation runner encountered fatal error:", err);
  process.exit(1);
});
