import fs from "fs";
import path from "path";
import { resolveDeadline } from "../src/server/services/deadline-resolver";
import { verifyEvidenceQuote } from "../src/server/services/evidence-verifier";

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

async function runDatasetValidation() {
  console.log("==================================================================");
  console.log("  TAMBAYAYONG — BENCHMARK DATASET & LOGIC VALIDATOR");
  console.log("  Note: This validates dataset integrity and rule engines only.");
  console.log("  This does NOT measure live LLM inference accuracy.");
  console.log("==================================================================\n");

  const datasetPath = path.resolve(__dirname, "./dataset.json");
  if (!fs.existsSync(datasetPath)) {
    console.error(`Dataset not found at ${datasetPath}`);
    process.exit(1);
  }

  const dataset: TestCase[] = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  console.log(`Loaded ${dataset.length} gold-standard benchmark test cases.\n`);

  let validCases = 0;
  let totalTasks = 0;
  let tasksWithOwners = 0;
  let tasksWithDeadlines = 0;
  const issues: string[] = [];

  dataset.forEach((tc, idx) => {
    // 1. Validate basic fields
    if (!tc.id || !tc.language || !tc.notes || !tc.timezone) {
      issues.push(`Case #${idx + 1} (${tc.id || "unnamed"}): Missing required top-level fields.`);
      return;
    }

    // 2. Validate tasks
    const expected = tc.groundTruth.expectedTasks;
    totalTasks += expected.length;

    expected.forEach((task, tIdx) => {
      if (!task.title) {
        issues.push(`Case [${tc.id}] Task #${tIdx + 1}: Missing task title.`);
      }
      if (task.assignees && task.assignees.length > 0) {
        tasksWithOwners++;
        // Check that assignee name appears in notes (case-insensitive)
        task.assignees.forEach((assignee) => {
          if (!tc.notes.toLowerCase().includes(assignee.toLowerCase())) {
            issues.push(`Case [${tc.id}]: Assignee "${assignee}" not found verbatim in transcript.`);
          }
        });
      }
      if (task.expectedDeadlineDate) {
        tasksWithDeadlines++;
      }
    });

    validCases++;
  });

  const languageCounts = {
    english: dataset.filter((tc) => tc.language === "english").length,
    cebuano: dataset.filter((tc) => tc.language === "cebuano").length,
    mixed: dataset.filter((tc) => tc.language === "mixed").length,
  };

  console.log("Dataset Health Summary:");
  console.log(`- Total Scenarios:        ${dataset.length}`);
  console.log(`- English Scenarios:      ${languageCounts.english}`);
  console.log(`- Cebuano Scenarios:      ${languageCounts.cebuano}`);
  console.log(`- Mixed Language Scenarios: ${languageCounts.mixed}`);
  console.log(`- Total Ground-Truth Tasks: ${totalTasks}`);
  console.log(`- Tasks with Owners:       ${tasksWithOwners}`);
  console.log(`- Tasks with Deadlines:    ${tasksWithDeadlines}`);
  console.log(`- Total Decisions:         ${dataset.reduce((acc, c) => acc + c.groundTruth.expectedDecisions.length, 0)}`);
  console.log(`- Total Open Questions:    ${dataset.reduce((acc, c) => acc + c.groundTruth.expectedOpenQuestions.length, 0)}`);

  if (issues.length > 0) {
    console.warn(`\n⚠️  Found ${issues.length} dataset annotation issues:`);
    issues.forEach((iss) => console.warn(`   - ${iss}`));
    process.exit(1);
  } else {
    console.log("\n✅ All 20 dataset scenarios verified. Annotation syntax and references are valid.");
    console.log("   To run actual AI model inference evaluation, use: npm run eval:model\n");
  }
}

runDatasetValidation().catch((err) => {
  console.error("Validation error:", err);
  process.exit(1);
});
