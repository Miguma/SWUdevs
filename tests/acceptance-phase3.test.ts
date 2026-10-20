import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  saveGuestMeeting,
  getGuestMeetingById,
  getAllGuestMeetings,
} from "../src/lib/storage/indexeddb";
import {
  getExecutionProgress,
  isTaskOverdue,
  getClarificationReasons,
  reconcileMeeting,
} from "../src/lib/meeting-workflow";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "../src/server/services/export-service";
import { INITIAL_SAMPLE_EXTRACTION } from "../src/components/SampleMeetingData";
import { MeetingExtraction, ActionItem, TaskStatus, ReviewStatus } from "../src/types/meeting";

describe("Phase 3: Formal Acceptance Test Suite", () => {
  let testMeeting: MeetingExtraction;

  beforeEach(() => {
    vi.stubGlobal("window", globalThis);
    testMeeting = JSON.parse(JSON.stringify(INITIAL_SAMPLE_EXTRACTION));
    testMeeting.openQuestions = [
      {
        id: "q-sample-1",
        question: "Who can take sponsor outreach?",
        evidence: [],
        needsReview: false,
        reviewStatus: "approved",
        status: "open",
        answer: null,
      },
    ];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Acceptance Test 1 & 2: Full browser lifecycle + Separation of Review and Execution status
  it("1 & 2. Manages execution status independently of review approval across IndexedDB save and reload", async () => {
    const meetingId = `accept-test-${Date.now()}`;
    testMeeting.id = meetingId;

    const task = testMeeting.actionItems[0];
    task.reviewStatus = "approved";

    // Set execution status to in_progress
    task.status = "in_progress";
    task.isUserEdited = true;

    // Save to IndexedDB
    await saveGuestMeeting(testMeeting);

    // Reload from IndexedDB
    const reloaded = await getGuestMeetingById(meetingId);
    expect(reloaded).toBeDefined();
    const reloadedTask = reloaded?.actionItems.find((t) => t.id === task.id);

    // Verify both statuses are accurately persisted
    expect(reloadedTask?.reviewStatus).toBe("approved");
    expect(reloadedTask?.status).toBe("in_progress");

    // Transition execution status without affecting reviewStatus
    const statusSequence: TaskStatus[] = ["blocked", "completed", "todo", "in_progress"];
    for (const s of statusSequence) {
      if (reloadedTask) {
        reloadedTask.status = s;
        // Review status MUST remain approved
        expect(reloadedTask.reviewStatus).toBe("approved");
      }
    }

    // Changing reviewStatus must not wipe out execution status
    if (reloadedTask) {
      reloadedTask.reviewStatus = "pending";
      expect(reloadedTask.status).toBe("in_progress");

      reloadedTask.reviewStatus = "rejected";
      expect(reloadedTask.status).toBe("in_progress");
    }
  });

  // Acceptance Test 3: Reanalysis preserves progress and identity
  it("3. Reanalysis preserves user changes, task execution status, and meeting ID", () => {
    const originalId = testMeeting.id;
    const taskToModify = testMeeting.actionItems[0];

    // User customized task title and set status to completed
    taskToModify.title = "User Customized Task Title";
    taskToModify.status = "completed";
    taskToModify.isUserEdited = true;

    // User answered an open question
    testMeeting.openQuestions[0].status = "answered";
    testMeeting.openQuestions[0].answer = "Confirmed by barangay captain.";
    testMeeting.openQuestions[0].isUserEdited = true;

    // Simulate fresh re-extraction from amended notes
    const freshReanalysis: MeetingExtraction = {
      ...testMeeting,
      id: "fresh-reanalysis-temp-id",
      actionItems: [
        {
          ...taskToModify,
          status: "todo", // fresh extraction defaults to todo
          reviewStatus: "pending",
        },
      ],
      openQuestions: [
        {
          ...testMeeting.openQuestions[0],
          status: "open",
          answer: null,
          reviewStatus: "pending",
        },
      ],
    };

    const reconciled = reconcileMeeting(testMeeting, freshReanalysis);

    // Preserves original meeting ID
    expect(reconciled.id).toBe(originalId);

    // Preserves user task edits and execution progress
    const recTask = reconciled.actionItems.find((t) => t.id === taskToModify.id);
    expect(recTask?.title).toBe("User Customized Task Title");
    expect(recTask?.status).toBe("completed");

    // Preserves question answer and status
    const recQuestion = reconciled.openQuestions.find((q) => q.id === testMeeting.openQuestions[0].id);
    expect(recQuestion?.status).toBe("answered");
    expect(recQuestion?.answer).toBe("Confirmed by barangay captain.");
  });

  // Acceptance Test 4: Clarification workflow
  it("4. Clarification queue detects and clears ambiguities dynamically", () => {
    // Construct task needing all clarification reasons
    const incompleteTask: ActionItem = {
      id: "unclear-task",
      title: "Organize medical mission",
      description: null,
      assignees: [], // Missing owner
      deadline: {
        originalText: "sunod bulan",
        date: null, // Missing deadline
        time: null,
        timezone: "Asia/Manila",
        relation: null,
        isAmbiguous: true,
      },
      commitmentStatus: "proposed", // Tentative proposal
      priority: null,
      status: "todo",
      evidence: [
        {
          quote: "unverified quote",
          startOffset: null,
          endOffset: null,
          isVerified: false,
          provenance: "unverified", // Unverified citation
        },
      ],
      missingInformation: ["assignee", "deadline"],
      needsReview: true,
      reviewStatus: "pending",
    };

    // All 4 warning reasons should be detected
    let reasons = getClarificationReasons(incompleteTask);
    expect(reasons).toContain("Missing owner");
    expect(reasons).toContain("Missing deadline");
    expect(reasons).toContain("Tentative proposal");
    expect(reasons).toContain("Unverified citation");

    // 1. Resolve owner
    incompleteTask.assignees = ["Dr. Ramos"];
    reasons = getClarificationReasons(incompleteTask);
    expect(reasons).not.toContain("Missing owner");

    // 2. Resolve deadline with concrete date
    incompleteTask.deadline.date = "2026-11-20";
    incompleteTask.deadline.isAmbiguous = false;
    reasons = getClarificationReasons(incompleteTask);
    expect(reasons).not.toContain("Missing deadline");

    // 3. Confirm commitment
    incompleteTask.commitmentStatus = "confirmed";
    reasons = getClarificationReasons(incompleteTask);
    expect(reasons).not.toContain("Tentative proposal");

    // 4. Validate citation (or manual note)
    incompleteTask.evidence[0].isVerified = true;
    incompleteTask.evidence[0].provenance = "exact_match";
    reasons = getClarificationReasons(incompleteTask);
    expect(reasons).not.toContain("Unverified citation");

    // Task is now fully clarified
    expect(reasons).toEqual([]);
  });

  // Acceptance Test 5: In-place editing of decisions and questions
  it("5. Persists decision modifications and question answer resolutions", async () => {
    const meetingId = `accept-dec-q-${Date.now()}`;
    testMeeting.id = meetingId;

    // Edit decision
    testMeeting.decisions[0].decision = "Agreed to use San Nicolas Barangay Hall instead";
    testMeeting.decisions[0].isUserEdited = true;

    // Answer open question
    testMeeting.openQuestions[0].status = "answered";
    testMeeting.openQuestions[0].answer = "Approved budget is PHP 50,000 from local fund.";
    testMeeting.openQuestions[0].isUserEdited = true;

    await saveGuestMeeting(testMeeting);

    const reloaded = await getGuestMeetingById(meetingId);
    expect(reloaded?.decisions[0].decision).toBe("Agreed to use San Nicolas Barangay Hall instead");
    expect(reloaded?.decisions[0].isUserEdited).toBe(true);

    expect(reloaded?.openQuestions[0].status).toBe("answered");
    expect(reloaded?.openQuestions[0].answer).toBe("Approved budget is PHP 50,000 from local fund.");
  });

  // Acceptance Test 6: Verify actual contents of exports
  it("6. Generates valid Markdown, CSV, and Meeting Minutes exports with execution status", () => {
    // Prepare meeting with diverse statuses
    testMeeting.actionItems[0].status = "in_progress";
    testMeeting.actionItems[0].reviewStatus = "approved";

    if (testMeeting.actionItems[1]) {
      testMeeting.actionItems[1].status = "completed";
      testMeeting.actionItems[1].reviewStatus = "approved";
    }

    testMeeting.openQuestions[0].status = "answered";
    testMeeting.openQuestions[0].answer = "Council endorsed the resolution.";

    // 1. Markdown Export Check
    const md = generateMarkdownExport(testMeeting);
    expect(md).toContain("# " + testMeeting.title);
    expect(md).toContain("[Status: In Progress]");
    expect(md).toContain("[Status: Completed]");
    expect(md).toContain("- [x]"); // Completed checkbox
    expect(md).toContain("- [ ]"); // In progress checkbox
    expect(md).toContain("Council endorsed the resolution.");

    // 2. CSV Export Check
    const csv = generateCsvExport(testMeeting);
    const rows = csv.split("\n");
    expect(rows[0]).toContain("Execution Status");
    expect(rows[0]).toContain("Clarification Warnings");
    expect(csv).toContain('"in_progress"');
    expect(csv).toContain('"completed"');

    // 3. Meeting Minutes Check
    const minutes = generateMeetingMinutesExport(testMeeting);
    expect(minutes).toContain("# Meeting Minutes: " + testMeeting.title);
    expect(minutes).toContain("## 1. Meeting Details");
    expect(minutes).toContain("## 2. Overview & Executive Summary");
    expect(minutes).toContain("## 3. Decisions Reached");
    expect(minutes).toContain("## 4. Action Items & Work Assignment");
    expect(minutes).toContain("| # | Task | Owner | Due Date | Status | Clarification |");
    expect(minutes).toContain("In Progress");
    expect(minutes).toContain("## 5. Open Inquiries & Follow-up Items");
    expect(minutes).toContain("Council endorsed the resolution.");
  });

  // Acceptance Test 7: Backward compatibility with legacy IndexedDB data
  it("7. Ensures older saved meetings missing execution fields load without data loss", async () => {
    const legacyId = `legacy-${Date.now()}`;
    const legacyMeeting = {
      ...testMeeting,
      id: legacyId,
      actionItems: testMeeting.actionItems.map((item) => {
        const { status, ...legacyItem } = item as any;
        return {
          ...legacyItem,
          reviewStatus: "approved" as ReviewStatus,
        };
      }),
      openQuestions: testMeeting.openQuestions.map((q) => {
        const { status, answer, ...legacyQ } = q as any;
        return legacyQ;
      }),
    } as MeetingExtraction;

    // Save legacy object directly
    await saveGuestMeeting(legacyMeeting);

    // Retrieve through public API
    const loaded = await getGuestMeetingById(legacyId);
    expect(loaded).toBeDefined();

    // Verify progress calculation defaults legacy records safely to 'todo'
    if (loaded) {
      const progress = getExecutionProgress(loaded);
      expect(progress.todo).toBe(loaded.actionItems.length);
      expect(progress.completed).toBe(0);
      expect(progress.percent).toBe(0);
    }
  });

  // Acceptance Test 8: Overdue calculation
  it("8. Overdue calculation accurately flags expired deadlines for incomplete tasks only", () => {
    const today = "2026-10-20";

    const pastIncompleteTask: ActionItem = {
      ...testMeeting.actionItems[0],
      deadline: { ...testMeeting.actionItems[0].deadline, date: "2026-10-15" },
      status: "in_progress",
    };
    expect(isTaskOverdue(pastIncompleteTask, today)).toBe(true);

    const pastCompletedTask: ActionItem = {
      ...testMeeting.actionItems[0],
      deadline: { ...testMeeting.actionItems[0].deadline, date: "2026-10-15" },
      status: "completed",
    };
    expect(isTaskOverdue(pastCompletedTask, today)).toBe(false);

    const futureTask: ActionItem = {
      ...testMeeting.actionItems[0],
      deadline: { ...testMeeting.actionItems[0].deadline, date: "2026-10-25" },
      status: "todo",
    };
    expect(isTaskOverdue(futureTask, today)).toBe(false);
  });
});
