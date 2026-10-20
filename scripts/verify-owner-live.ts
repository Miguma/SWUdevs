// Public synthetic smoke test. This is actual inference, separate from the
// deterministic regression fixtures and the full model evaluation benchmark.
// Run: node --env-file=.env.local --import tsx scripts/verify-owner-live.ts
import { writeFileSync } from "node:fs";
import { executeGroqExtraction, GROQ_MODEL } from "../src/server/services/groq-client";
import { getClarificationReasons } from "../src/lib/meeting-workflow";
import { RawExtractionResponseSchema } from "../src/types/meeting";

const rawText = [
  'Liza: "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27."',
  'Jun: "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet."',
  'Mark: "Sige, ako na ang moasikaso sa permiso."',
  'Ana: "Kinahanglan og volunteers sa registration, wala pay assigned."',
].join("\n");

async function main() {
  let rawModel: ReturnType<typeof RawExtractionResponseSchema.parse> | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const response = await originalFetch(...args);
    if (String(args[0]).endsWith("/chat/completions") && response.ok) {
      const body = await response.clone().json();
      rawModel = RawExtractionResponseSchema.parse(JSON.parse(body.choices[0].message.content));
    }
    return response;
  };
  try {
    const meeting = await executeGroqExtraction({
      title: "Public owner regression", rawText, model: GROQ_MODEL,
      timezone: "Asia/Manila", // Date deliberately unknown: no invented year.
    });
    const tasks = meeting.actionItems.map(task => ({
      title: task.title,
      rawModelAssignees: rawModel?.actionItems.find(raw => raw.title === task.title)?.assignees,
      assembledAssignees: task.assignees, reviewStatus: task.reviewStatus,
      deadline: task.deadline.date, missingInformation: task.missingInformation,
      clarificationReasons: getClarificationReasons(task),
      evidence: task.evidence.map(ev => ({
        start: ev.startOffset, end: ev.endOffset, verified: ev.isVerified,
        sourceMatches: rawText.slice(ev.startOffset ?? 0, ev.endOffset ?? 0) === ev.quote,
      })),
    }));
    const success = ["Liza", "Jun", "Mark"].every(name =>
      tasks.some(t => t.assembledAssignees.includes(name) &&
        !t.clarificationReasons.includes("Missing owner") && t.reviewStatus === "pending"));
    const report = {
      kind: "actual-inference-public-smoke", at: new Date().toISOString(),
      provider: "groq", model: meeting.analysis?.model, success, tasks,
      openQuestions: meeting.openQuestions.map(q => q.question),
      fullBenchmarkRun: false,
    };
    writeFileSync("docs/owner-live-verification.json", JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
    if (!success) process.exitCode = 1;
  } finally { globalThis.fetch = originalFetch; }
}
main().catch(() => {
  console.error("Live owner verification failed; no successful inference result claimed.");
  process.exitCode = 1;
});
