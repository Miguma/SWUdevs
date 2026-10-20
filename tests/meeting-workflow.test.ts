import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { assembleMeetingExtraction } from "../src/server/services/extraction-core";
import { RawExtractionResponseSchema } from "../src/types/meeting";
import {
  createSerialMeetingSaver,
  getReviewProgress,
  reconcileMeeting,
} from "../src/lib/meeting-workflow";
import {
  saveGuestMeeting,
  getAllGuestMeetings,
  getGuestMeetingById,
  deleteGuestMeeting,
  saveDraftNotes,
  getDraftNotes,
} from "../src/lib/storage/indexeddb";

function meeting() {
  return assembleMeetingExtraction(
    {
      title: "Committee",
      rawText: "Maria will draft the poster tomorrow.",
      meetingDate: "2026-10-23",
    },
    RawExtractionResponseSchema.parse({
      summary: "Planning",
      actionItems: [
        {
          title: "Draft the poster",
          assignees: ["Maria"],
          originalDeadlineText: "tomorrow",
          evidenceQuote: "Maria will draft the poster tomorrow.",
        },
      ],
      decisions: [],
      openQuestions: [],
    }),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe("Re-analysis and review integrity", () => {
  it("keeps the meeting identity, human edits and manual entries without appending another AI pass", () => {
    const old = meeting();
    old.actionItems[0] = {
      ...old.actionItems[0],
      title: "Draft an accessible poster",
      isUserEdited: true,
      reviewStatus: "approved",
    };
    old.actionItems.push({
      ...old.actionItems[0],
      id: "manual",
      title: "Call adviser",
      isManual: true,
      evidence: [],
    });
    const merged = reconcileMeeting(old, meeting());
    expect(merged.id).toBe(old.id);
    expect(merged.createdAt).toBe(old.createdAt);
    expect(merged.actionItems).toHaveLength(2);
    expect(merged.actionItems[0].title).toBe("Draft an accessible poster");
    expect(merged.actionItems[0].reviewStatus).toBe("approved");
    expect(reconcileMeeting(merged, meeting()).actionItems).toHaveLength(2);
  });
  it("replaces pending items and resets reviewed citations when source changes", () => {
    const old = meeting();
    old.actionItems[0].reviewStatus = "approved";
    const fresh = meeting();
    fresh.rawTranscript = "The poster has been cancelled.";
    fresh.actionItems = [];
    const merged = reconcileMeeting(old, fresh);
    expect(merged.actionItems).toHaveLength(1);
    expect(merged.actionItems[0].reviewStatus).toBe("pending");
    expect(merged.actionItems[0].evidence[0]).toMatchObject({
      isVerified: false,
      startOffset: null,
      provenance: "unverified",
    });
    expect(reconcileMeeting(merged, fresh).actionItems).toHaveLength(1);
    old.actionItems[0].reviewStatus = "pending";
    expect(reconcileMeeting(old, fresh).actionItems).toHaveLength(0);
  });
  it("includes decisions and questions in progress and distinguishes an empty extraction", () => {
    const m = meeting();
    m.actionItems[0].reviewStatus = "approved";
    m.decisions = [
      {
        id: "d",
        decision: "Use gym",
        evidence: [],
        needsReview: false,
        reviewStatus: "pending",
      },
    ];
    m.openQuestions = [
      {
        id: "q",
        question: "Budget?",
        evidence: [],
        needsReview: false,
        reviewStatus: "rejected",
      },
    ];
    expect(getReviewProgress(m)).toEqual({
      total: 3,
      reviewed: 2,
      percent: 67,
    });
    expect(
      getReviewProgress({
        ...m,
        actionItems: [],
        decisions: [],
        openQuestions: [],
      }),
    ).toEqual({ total: 0, reviewed: 0, percent: 0 });
  });
  it("requires renewed approval if the model changes an owner on the same source", () => {
    const old = meeting();
    old.actionItems[0].reviewStatus = "approved";
    const fresh = meeting();
    fresh.actionItems[0].assignees = [];
    expect(reconcileMeeting(old, fresh).actionItems[0].reviewStatus).toBe(
      "pending",
    );
  });
});

describe("Single-owner persistence", () => {
  it("serializes writes, snapshots values, and recovers after a storage failure", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const titles: string[] = [];
    const write = vi.fn(async (m) => {
      titles.push(m.title);
      if (titles.length === 1) {
        await gate;
        throw new Error("Quota");
      }
    });
    const save = createSerialMeetingSaver(write);
    const m = meeting();
    const first = save(m).catch(() => undefined);
    m.title = "Revision two";
    const second = save(m);
    m.title = "Unsaved mutation";
    await vi.waitFor(() => expect(write).toHaveBeenCalledTimes(1));
    release();
    await first;
    await second;
    expect(titles).toEqual(["Committee", "Revision two"]);
  });
  it("upserts one IndexedDB record through repeated analysis and keeps other meetings", async () => {
    vi.stubGlobal("window", globalThis);
    const first = meeting(),
      other = meeting();
    await saveGuestMeeting(first);
    await saveGuestMeeting(other);
    const fresh = reconcileMeeting(first, meeting());
    await saveGuestMeeting(fresh);
    await saveGuestMeeting(fresh);
    expect((await getAllGuestMeetings()).map((m) => m.id).sort()).toEqual(
      [first.id, other.id].sort(),
    );
    expect((await getGuestMeetingById(first.id))?.updatedAt).toBe(
      fresh.updatedAt,
    );
    await deleteGuestMeeting(first.id);
    await deleteGuestMeeting(other.id);
  });
  it("keeps edited-meeting drafts separate from the new-meeting draft", async () => {
    vi.stubGlobal("window", globalThis);
    const draft = {
      title: "New meeting",
      organization: "",
      meetingDate: "2026-10-23",
      dateUnknown: false,
      timezone: "Asia/Manila",
      participants: "Maria",
      rawText: "Unsaved new notes",
    };
    await saveDraftNotes(draft);
    await saveDraftNotes(
      { ...draft, rawText: "Revised existing notes" },
      "existing",
    );
    expect((await getDraftNotes())?.rawText).toBe("Unsaved new notes");
    expect((await getDraftNotes("existing"))?.rawText).toBe(
      "Revised existing notes",
    );
  });
  it("starts a separate new-meeting draft without replacing the legacy draft", async () => {
    vi.stubGlobal("window", globalThis);
    const draft = {
      title: "First notes",
      organization: "",
      meetingDate: "",
      dateUnknown: true,
      timezone: "Asia/Manila",
      participants: "",
      rawText: "Keep this first draft intact.",
    };
    await saveDraftNotes(draft);
    await saveDraftNotes({ ...draft, title: "Second notes" }, undefined, "draft:second");
    expect((await getDraftNotes())?.title).toBe("First notes");
    expect((await getDraftNotes(undefined, "draft:second"))?.title).toBe("Second notes");
    const { getAllNewMeetingDrafts } = await import("../src/lib/storage/indexeddb");
    expect((await getAllNewMeetingDrafts()).map((item) => item.id)).toEqual(
      expect.arrayContaining(["current_draft", "draft:second"]),
    );
  });
});
