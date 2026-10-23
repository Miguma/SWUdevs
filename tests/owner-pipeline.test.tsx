import "fake-indexeddb/auto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assembleMeetingExtraction } from "../src/server/services/extraction-core";
import { executeGroqExtraction, GROQ_MODEL } from "../src/server/services/groq-client";
import { RawExtractionResponseSchema } from "../src/types/meeting";
import { createSerialMeetingSaver, getClarificationReasons, reconcileMeeting } from "../src/lib/meeting-workflow";
import { getGuestMeetingById, saveGuestMeeting, saveDraftNotes, getDraftNotes } from "../src/lib/storage/indexeddb";
import { ActionItemCard } from "../src/components/review/ActionItemCard";
import { ReviewWorkspace } from "../src/components/ReviewWorkspace";
import { parseUploadedPdfBuffer } from "../src/server/services/transcript-preprocessor";
import { jsPDF } from "jspdf";
import { syncOwnerInformation } from "../src/lib/owner-state";
import { traceOwnerAssembly, traceOwnerState } from "../src/lib/owner-diagnostics";
import { generateMeetingPdf } from "../src/lib/pdf-export";
import { generateCsvExport, generateMarkdownExport, generateMeetingMinutesExport } from "../src/server/services/export-service";
import { EvidenceInspector } from "../src/components/review/EvidenceInspector";

// Deterministic model fixture, never an inference accuracy result.
const statements = [
  "Ako ang maghimo sa poster ug ipasa nako sa Oktubre 27.",
  "Mangita ko og presyo sa gloves ug mga sako, pero wala pa ta kasabot sa pinal nga badyet.",
  "Sige, ako na ang moasikaso sa permiso.",
  "Kinahanglan og volunteers sa registration.",
];
const source = statements.map((s, i) => `${["Liza", "Jun", "Mark", "Ana"][i]}: "${s}"`).join("\r\n");
const titles = ["Create and submit poster", "Check prices of gloves and sacks", "Arrange permission", "Find registration volunteers"];
const raw = RawExtractionResponseSchema.parse({
  summary: "Public owner regression fixture",
  actionItems: statements.map((evidenceQuote, i) => ({
    title: titles[i], assignees: [], evidenceQuote, missingInformation: ["assignee"],
    originalDeadlineText: i === 0 ? "Oktubre 27" : null,
  })),
  decisions: [],
  openQuestions: [{ question: "What is the final budget?", evidenceQuote: statements[1] }],
});
const input = { title: "Owner regression", rawText: source, model: GROQ_MODEL };
function taskFor(rawText: string, quote: string, assignees: string[] = []) {
  return assembleMeetingExtraction({ ...input, rawText }, {
    ...raw, actionItems: [{ ...raw.actionItems[0], evidenceQuote: quote, assignees, originalDeadlineText: null }],
  }).actionItems[0];
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Owner pipeline", () => {
  it("recovers explicit speakers when the model omits owners, without a guessed year", () => {
    const meeting = assembleMeetingExtraction(input, raw);
    expect(meeting.actionItems.map(t => t.assignees)).toEqual([["Liza"], ["Jun"], ["Mark"], []]);
    expect(meeting.actionItems[0].deadline.date).toBeNull();
    expect(meeting.actionItems[1].deadline.date).toBeNull();
    expect(meeting.openQuestions).toHaveLength(1);
    for (const t of meeting.actionItems.slice(0, 3)) {
      expect(t.reviewStatus).toBe("pending");
      expect(t.missingInformation).not.toContain("assignee");
      expect(getClarificationReasons(t)).not.toContain("Missing owner");
      const ev = t.evidence[0];
      expect(source.slice(ev.startOffset!, ev.endOffset!)).toBe(ev.quote);
    }
    expect(getClarificationReasons(meeting.actionItems[3])).toContain("Missing owner");
  });

  it.each(["Liza:", "[Liza]", "(Liza)", "Liza -", "**Liza**:", "- Liza:", "1. Liza:"])(
    "handles a PDF-like multiline turn with %s", label => {
      const text = `${label}\r\nAko ang maghimo sa poster\r\nug ipasa nako sa Oktubre 27.`;
      expect(taskFor(text, statements[0]).assignees).toEqual(["Liza"]);
    },
  );
  it.each([
    ["Ana", "Ako ang gagawa ng poster."],
    ["Ana", "I will create the poster."],
    ["Ana", "I'll create the poster."],
    ["Ana", "Ako na ang mag-create sa poster."],
  ])("supports a singular commitment by %s: %s", (name, speech) => {
    expect(taskFor(`${name}: ${speech}`, speech).assignees).toEqual([name]);
  });
  it.each([
    ["Liza: I will not create the poster.", "I will not create the poster.", ["Liza"]],
    ["Liza: Jun will create the poster.", "Jun will create the poster.", ["Liza"]],
    ["Liza: Dili ako ang maghimo sa poster.", "Dili ako ang maghimo sa poster.", ["Liza"]],
    ["Liza: I spoke to Jun yesterday.", "I spoke to Jun yesterday.", ["Liza"]],
    ["Liza: Jun said, 'I will create the poster.'", "Jun said, 'I will create the poster.'", ["Liza"]],
    ["Liza: Maghimo ta og poster.", "Maghimo ta og poster.", []],
    ["Speaker 1: I will create the poster.", "I will create the poster.", ["Speaker 1"]],
    ["Liza: I will create the poster.\nJun: I will create the poster.", "I will create the poster.", ["Liza"]],
    ["Liza: We need supplies.\n[Jun]\nI will check prices.", "I will check prices.", ["Liza"]],
  ])("does not invent or accept an unsupported owner: %s", (text, quote, owners) => {
    expect(taskFor(text, quote, owners).assignees).toEqual([]);
  });
  it("does not borrow first-person speech from another turn in a crossing quote", () => {
    const text = 'Liza: We need supplies. Jun: I will check prices.';
    expect(taskFor(text, text, ["Liza"]).assignees).toEqual([]);
  });
  it("requires a narrower citation when two speakers commit to different actions", () => {
    const text = "Liza: I will create the poster. Jun: I will check prices.";
    expect(taskFor(text, text, ["Liza"]).assignees).toEqual([]);
    expect(taskFor(text, "I will check prices.", ["Jun"]).assignees).toEqual(["Jun"]);
  });
  it("clears stale missing-owner metadata for a supported model owner", () => {
    expect(taskFor(source, statements[0], ["Liza"]).missingInformation).not.toContain("assignee");
  });
  it("resolves an anonymous label only when an explicit identity mapping exists", () => {
    const text = "Speaker 1 = Liza\nSpeaker 1: I will create the poster.";
    expect(taskFor(text, "I will create the poster.").assignees).toEqual(["Liza"]);
    expect(taskFor(text, "I will create the poster.", ["Liza"]).assignees).toEqual(["Liza"]);
    expect(taskFor(text, "I will create the poster.", ["Speaker 1"]).assignees).toEqual(["Liza"]);
  });
  it("handles a citation starting at zero without shifting offsets", () => {
    const text = "Liza: Ako ang maghimo sa poster.";
    const task = taskFor(text, text, ["Liza"]);
    expect(task.assignees).toEqual(["Liza"]);
    expect(task.evidence[0].startOffset).toBe(0);
    expect(task.evidence[0].quote).toBe(text);
  });
  it("carries selectable PDF text through attribution using exact extracted source offsets", async () => {
    const doc = new jsPDF();
    doc.text(["[Liza]", "Ako ang maghimo sa poster", "ug ipasa nako sa Oktubre 27."], 10, 20);
    const parsed = await parseUploadedPdfBuffer(Buffer.from(doc.output("arraybuffer")));
    expect(parsed.success).toBe(true);
    const task = taskFor(parsed.text!, statements[0]);
    expect(task.assignees).toEqual(["Liza"]);
    const ev = task.evidence[0];
    expect(parsed.text!.slice(ev.startOffset!, ev.endOffset!)).toBe(ev.quote);
  });
  it("derives owner warnings from current owners while preserving other missing information and approval", () => {
    const task = taskFor(source, statements[0], ["Liza"]);
    task.missingInformation = ["Missing owner", "Needs responsible person", "budget", "deadline"];
    task.reviewStatus = "approved";
    const synced = syncOwnerInformation(task);
    expect(synced.missingInformation).toEqual(["budget", "deadline"]);
    expect(synced.reviewStatus).toBe("approved");
    expect(syncOwnerInformation({ ...synced, assignees: [" "] }).missingInformation).toContain("assignee");
    expect(getClarificationReasons({ ...synced, assignees: [" "] })).toContain("Missing owner");
  });
  it("keeps diagnostics opt-in and redacts names and source content", () => {
    vi.stubEnv("NODE_ENV", "development");
    const log = vi.spyOn(console, "debug").mockImplementation(() => {});
    const task = taskFor(source, statements[0], ["Liza"]);
    traceOwnerState("persisted", [task]);
    expect(log).not.toHaveBeenCalled();
    vi.stubEnv("OWNER_DIAGNOSTICS", "1");
    traceOwnerAssembly(task.id, ["Liza"], task.evidence, {
      accepted: ["Liza"], rejected: [], detectedSpeakers: ["Liza"],
    });
    traceOwnerState("persisted", [task]);
    expect(log).toHaveBeenCalledTimes(2);
    const output = JSON.stringify(log.mock.calls);
    expect(output).not.toContain("Liza");
    expect(output).not.toContain(statements[0]);
    expect(output).toContain("person-");
    log.mockRestore();
  });

  it("runs mocked Groq → evidence → assembly → IndexedDB reload → actual review components", async () => {
    vi.stubGlobal("window", globalThis);
    vi.stubEnv("GROQ_API_KEY", "fixture-key");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: GROQ_MODEL, active: true }] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        model: GROQ_MODEL, choices: [{ finish_reason: "stop", message: { content: JSON.stringify(raw) } }],
      }))));
    const meeting = await executeGroqExtraction(input);
    const save = createSerialMeetingSaver(saveGuestMeeting);
    const unrelated = { ...structuredClone(meeting), id: crypto.randomUUID(), title: "Unrelated saved meeting" };
    await save(unrelated);
    const draft = { title: "Unrelated draft", organization: "", meetingDate: "", dateUnknown: true, timezone: "Asia/Manila", participants: "", rawText: "Keep these notes." };
    await saveDraftNotes(draft, undefined, "draft:owner-regression-unrelated");
    await save(meeting);
    const reloaded = (await getGuestMeetingById(meeting.id))!;
    expect(reloaded.actionItems.map(t => t.assignees)).toEqual([["Liza"], ["Jun"], ["Mark"], []]);
    const markup = renderToStaticMarkup(<ReviewWorkspace meeting={reloaded} onUpdateMeeting={() => {}} />);
    expect(markup).toContain("Needs info");
    expect(markup.match(/>Unassigned</g)).toHaveLength(1);
    for (const name of ["Liza", "Jun", "Mark"]) expect(markup).toContain(name);
    expect(reloaded.actionItems.filter(t => getClarificationReasons(t).includes("Missing owner"))).toHaveLength(1);
    for (const [i, t] of reloaded.actionItems.entries()) {
      const html = renderToStaticMarkup(<ActionItemCard task={t} onSetStatus={() => {}} onEdit={() => {}} onDelete={() => {}} onInspectEvidence={() => {}} />);
      if (i < 3) {
        expect(html).toContain(["Liza", "Jun", "Mark"][i]);
        expect(html).not.toContain("Needs owner");
        expect(html).not.toContain("Missing owner");
        expect(html).toContain(`aria-label="Approve ${t.title}"`);
        expect(html).not.toContain('aria-pressed="true"');
      } else expect(html).toContain("Unassigned");
    }
    const previous = structuredClone(reloaded);
    previous.actionItems[0].reviewStatus = "approved";
    previous.actionItems[1].isUserEdited = true;
    previous.actionItems[1].assignees = ["Human chosen owner"];
    const merged = reconcileMeeting(previous, { ...assembleMeetingExtraction(input, raw), analysis: meeting.analysis });
    await save(merged);
    const final = (await getGuestMeetingById(previous.id))!;
    expect(final.actionItems[0].reviewStatus).toBe("approved");
    expect(final.actionItems[1].assignees).toEqual(["Human chosen owner"]);
    expect(final.id).toBe(previous.id);
    expect(final.analysis?.model).toBe(GROQ_MODEL);
    const pdf = Buffer.from(generateMeetingPdf(final).output("arraybuffer")).toString("latin1");
    expect(pdf).toContain("%PDF-");
    expect(pdf).toContain("Liza");
    for (const output of [generateCsvExport(final), generateMarkdownExport(final), generateMeetingMinutesExport(final)]) {
      expect(output).toContain("Liza");
      expect(output).not.toContain("Human chosen owner"); // Pending work is excluded by default.
    }
    expect(await getGuestMeetingById(unrelated.id)).toEqual(unrelated);
    expect(await getDraftNotes(undefined, "draft:owner-regression-unrelated")).toMatchObject(draft);
  });

  it("never presents manual or unverified text as a located source quotation", () => {
    for (const provenance of ["manual", "unverified"] as const) {
      const html = renderToStaticMarkup(<EvidenceInspector
        evidence={{quote: "Liza", startOffset: 0, endOffset: 4, isVerified: false, provenance}}
        rawTranscript="Liza: Ako ang maghimo sa poster."
        onClose={() => {}}
      />);
      expect(html).not.toContain("<mark");
    }
  });
});
