// End-to-end integration and actual Groq inference verification
// using Orlando's synthetic Bisaya transcript: docs/verification/orlando-bisaya.txt
// Run: node --env-file=.env.local --import tsx scripts/verify-orlando-bisaya-live.ts

import "fake-indexeddb/auto";
globalThis.window = globalThis as any;
import { readFileSync, writeFileSync } from "node:fs";
import { executeGroqExtraction, GROQ_MODEL } from "../src/server/services/groq-client";
import { getClarificationReasons, createSerialMeetingSaver } from "../src/lib/meeting-workflow";
import { getGuestMeetingById, saveGuestMeeting } from "../src/lib/storage/indexeddb";
import { generateMeetingPdf } from "../src/lib/pdf-export";
import { generateCsvExport, generateMarkdownExport, generateMeetingMinutesExport } from "../src/server/services/export-service";

async function main() {
  const rawText = readFileSync("docs/verification/orlando-bisaya.txt", "utf-8");
  console.log("1. Starting live Groq inference on Orlando Bisaya transcript...");

  const meeting = await executeGroqExtraction({
    title: "Community Outreach Planning",
    rawText,
    model: GROQ_MODEL,
    timezone: "Asia/Manila",
    meetingDate: "2026-10-23",
  });

  console.log(`✓ Analysis completed using ${meeting.analysis?.model}`);
  console.log(`  Extracted ${meeting.actionItems.length} action items, ${meeting.decisions.length} decisions, ${meeting.openQuestions.length} open questions.`);

  // 1. Verify tasks are initially pending
  for (const item of meeting.actionItems) {
    if (item.reviewStatus !== "pending") {
      throw new Error(`Expected item "${item.title}" to be pending review, but got ${item.reviewStatus}`);
    }
  }
  console.log("✓ All extracted items initialized with reviewStatus = 'pending'");

  // 2. Verify speaker owners
  const lizaTask = meeting.actionItems.find(t => t.assignees.includes("Liza"));
  const junTask = meeting.actionItems.find(t => t.assignees.includes("Jun"));
  const markTask = meeting.actionItems.find(t => t.assignees.includes("Mark"));

  if (!lizaTask) throw new Error("Missing task assigned to Liza");
  if (!junTask) throw new Error("Missing task assigned to Jun");
  if (!markTask) throw new Error("Missing task assigned to Mark");

  console.log("✓ Task owners correctly identified:");
  console.log(`  - Liza: "${lizaTask.title}" (deadline: ${lizaTask.deadline.date ?? "none"})`);
  console.log(`  - Jun: "${junTask.title}" (deadline: ${junTask.deadline.date ?? "none"})`);
  console.log(`  - Mark: "${markTask.title}" (deadline: ${markTask.deadline.date ?? "none"})`);

  // 3. Human review simulation: Approve task & change progress status
  console.log("3. Simulating human review: approving Liza's task and setting status to 'in_progress'...");
  lizaTask.reviewStatus = "approved";
  lizaTask.status = "in_progress";
  lizaTask.isUserEdited = true;

  // 4. Persistence to guest IndexedDB
  console.log("4. Persisting reviewed meeting to guest IndexedDB...");
  const save = createSerialMeetingSaver(saveGuestMeeting);
  await save(meeting);

  // 5. Reload from IndexedDB
  console.log("5. Reloading meeting from IndexedDB...");
  const reloaded = await getGuestMeetingById(meeting.id);
  if (!reloaded) throw new Error("Failed to reload meeting from IndexedDB");

  const reloadedLizaTask = reloaded.actionItems.find(t => t.id === lizaTask.id);
  if (!reloadedLizaTask) throw new Error("Failed to find Liza's task in reloaded meeting");
  if (reloadedLizaTask.reviewStatus !== "approved") {
    throw new Error(`Expected reviewStatus 'approved' after reload, got '${reloadedLizaTask.reviewStatus}'`);
  }
  if (reloadedLizaTask.status !== "in_progress") {
    throw new Error(`Expected status 'in_progress' after reload, got '${reloadedLizaTask.status}'`);
  }
  console.log("✓ Meeting persisted and reloaded successfully with all edits preserved");

  // 6. PDF Export with reviewed data
  console.log("6. Generating branded PDF export...");
  const pdfDoc = generateMeetingPdf(reloaded);
  const pdfBytes = Buffer.from(pdfDoc.output("arraybuffer"));
  const pdfString = pdfBytes.toString("latin1");

  if (!pdfString.startsWith("%PDF-")) throw new Error("Invalid PDF output header");
  if (!pdfString.includes("Tambayayong")) throw new Error("PDF missing Tambayayong brand header");
  if (!pdfString.includes("Liza")) throw new Error("PDF missing Liza assignee");

  console.log(`✓ Branded PDF generated successfully (${pdfBytes.length} bytes, selectable text verified)`);

  // 7. Verify CSV, Markdown, Minutes exports
  console.log("7. Verifying CSV, Markdown, and Meeting Minutes exports...");
  const csv = generateCsvExport(reloaded);
  const md = generateMarkdownExport(reloaded);
  const minutes = generateMeetingMinutesExport(reloaded);

  if (!csv.includes("Liza")) throw new Error("CSV export missing Liza");
  if (!md.includes("Liza")) throw new Error("Markdown export missing Liza");
  if (!minutes.includes("Liza")) throw new Error("Minutes export missing Liza");

  console.log("✓ CSV, Markdown, and Meeting Minutes exports generated successfully");

  const report = {
    timestamp: new Date().toISOString(),
    model: meeting.analysis?.model,
    provider: meeting.analysis?.provider,
    totalActionItems: meeting.actionItems.length,
    totalDecisions: meeting.decisions.length,
    totalOpenQuestions: meeting.openQuestions.length,
    ownersFound: {
      Liza: lizaTask.title,
      Jun: junTask.title,
      Mark: markTask.title,
    },
    humanReviewCheck: {
      approvedTaskId: lizaTask.id,
      reloadedReviewStatus: reloadedLizaTask.reviewStatus,
      reloadedExecutionStatus: reloadedLizaTask.status,
    },
    pdfExportSize: pdfBytes.length,
    success: true,
  };

  writeFileSync("docs/verification/orlando-bisaya-live-result.json", JSON.stringify(report, null, 2) + "\n");
  console.log("✓ Live verification finished successfully and saved to docs/verification/orlando-bisaya-live-result.json");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exitCode = 1;
});
