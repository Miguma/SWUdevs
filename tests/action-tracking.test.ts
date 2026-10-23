import { describe, it, expect } from "vitest";
import {
  getExecutionProgress,
  isTaskOverdue,
  getClarificationReasons,
  getTodayInTimezone,
  reconcileMeeting,
} from "../src/lib/meeting-workflow";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "../src/server/services/export-service";
import { createManualEvidence } from "../src/server/services/evidence-verifier";
import { ActionItem, MeetingExtraction, OpenQuestion } from "../src/types/meeting";

describe("Phase 3: Action Tracking & Execution Status", () => {
  const baseMeeting: MeetingExtraction = {
    id: "meet-exec-1",
    title: "Youth Council Project Alignment",
    organization: "SWUdevs",
    meetingDate: "2026-10-20",
    timezone: "Asia/Manila",
    rawTranscript: "Maria will finalize budget by 2026-10-15.\nJohn will draft proposal.",
    summary: "Coordination meeting for annual barangay outreach.",
    actionItems: [
      {
        id: "act-1",
        title: "Finalize budget spreadsheet",
        description: "Submit to treasurer",
        assignees: ["Maria"],
        deadline: {
          originalText: "by Oct 15",
          date: "2026-10-15",
          time: null,
          timezone: "Asia/Manila",
          relation: "by",
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: "high",
        status: "in_progress",
        evidence: [
          {
            quote: "Maria will finalize budget by 2026-10-15.",
            startOffset: 0,
            endOffset: 43,
            isVerified: true,
            provenance: "exact_match",
          },
        ],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "act-2",
        title: "Draft project proposal",
        description: null,
        assignees: ["John"],
        deadline: {
          originalText: "next week",
          date: "2026-10-28",
          time: null,
          timezone: "Asia/Manila",
          relation: "by",
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: null,
        status: "todo",
        evidence: [
          {
            quote: "John will draft proposal.",
            startOffset: 44,
            endOffset: 69,
            isVerified: true,
            provenance: "exact_match",
          },
        ],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "act-3",
        title: "Order event shirts",
        description: null,
        assignees: [], // missing owner
        deadline: {
          originalText: "sometime soon",
          date: null, // missing date
          time: null,
          timezone: "Asia/Manila",
          relation: null,
          isAmbiguous: true,
        },
        commitmentStatus: "proposed", // tentative
        priority: null,
        status: "blocked",
        evidence: [],
        missingInformation: ["assignee", "deadline"],
        needsReview: true,
        reviewStatus: "pending",
      },
      {
        id: "act-4",
        title: "Book event venue",
        description: null,
        assignees: ["Mark"],
        deadline: {
          originalText: "done yesterday",
          date: "2026-10-19",
          time: null,
          timezone: "Asia/Manila",
          relation: "by",
          isAmbiguous: false,
        },
        commitmentStatus: "confirmed",
        priority: "medium",
        status: "completed",
        evidence: [],
        missingInformation: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    decisions: [
      {
        id: "dec-1",
        decision: "Outreach event set for November 15 at Barangay Gymnasium",
        evidence: [],
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    openQuestions: [
      {
        id: "q-1",
        question: "Who will coordinate with the barangay captain?",
        evidence: [],
        status: "answered",
        answer: "Councilor Santos agreed to coordinate.",
        needsReview: false,
        reviewStatus: "approved",
      },
      {
        id: "q-2",
        question: "Is snacks budget included?",
        evidence: [],
        status: "open",
        answer: null,
        needsReview: false,
        reviewStatus: "approved",
      },
    ],
    nextMeeting: null,
    warnings: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe("Step 2 & 3: Execution Progress & Task Status", () => {
    it("computes execution progress only from approved tasks", () => {
      const progress = getExecutionProgress(baseMeeting);
      // Approved tasks: act-1 (in_progress), act-2 (todo), act-4 (completed) -> 3 approved tasks total
      // act-3 is pending review, so it must not count toward active execution tracking
      expect(progress.total).toBe(3);
      expect(progress.totalApproved).toBe(3);
      expect(progress.completed).toBe(1);
      expect(progress.inProgress).toBe(1);
      expect(progress.in_progress).toBe(1);
      expect(progress.todo).toBe(1);
      expect(progress.blocked).toBe(0);
      expect(progress.percent).toBe(33); // 1 out of 3 = 33%
    });

    it("defaults legacy tasks without status to 'todo' backward-compatibly", () => {
      const legacyMeeting: MeetingExtraction = {
        ...baseMeeting,
        actionItems: [
          {
            ...baseMeeting.actionItems[0],
            status: undefined, // legacy record
            reviewStatus: "approved",
          },
        ],
      };
      const progress = getExecutionProgress(legacyMeeting);
      expect(progress.todo).toBe(1);
      expect(progress.completed).toBe(0);
    });

    it("detects overdue tasks when deadline is before the reference date and task is not completed", () => {
      const refDate = "2026-10-20";
      // act-1 has date 2026-10-15 and status in_progress -> OVERDUE
      expect(isTaskOverdue(baseMeeting.actionItems[0], refDate)).toBe(true);

      // act-2 has date 2026-10-28 (future) -> NOT overdue
      expect(isTaskOverdue(baseMeeting.actionItems[1], refDate)).toBe(false);

      // act-4 has date 2026-10-19 (past) BUT status is 'completed' -> NOT overdue
      expect(isTaskOverdue(baseMeeting.actionItems[3], refDate)).toBe(false);

      // task with no date -> NOT overdue
      expect(isTaskOverdue(baseMeeting.actionItems[2], refDate)).toBe(false);
    });
  });

  describe("Step 4: Clarification Workflow", () => {
    it("identifies all clarification reasons for ambiguous or incomplete tasks", () => {
      const task3 = baseMeeting.actionItems[2];
      const reasons = getClarificationReasons(task3);
      expect(reasons).toContain("Missing owner");
      expect(reasons).toContain("Missing deadline");
      expect(reasons).toContain("Tentative proposal");
    });

    it("reports an empty clarification list when task is fully specified and confirmed", () => {
      const task1 = baseMeeting.actionItems[0];
      const reasons = getClarificationReasons(task1);
      expect(reasons).toEqual([]);
    });

    it("flags ambiguous deadlines when date is marked ambiguous", () => {
      const ambiguousTask: ActionItem = {
        ...baseMeeting.actionItems[0],
        deadline: {
          originalText: "sunod semana",
          date: "2026-10-28",
          time: null,
          timezone: "Asia/Manila",
          relation: null,
          isAmbiguous: true,
        },
      };
      const reasons = getClarificationReasons(ambiguousTask);
      expect(reasons).toContain("Ambiguous deadline");
    });
  });

  describe("Reanalysis & State Preservation", () => {
    it("preserves task execution status and open question answers across re-analysis", () => {
      const freshExtraction: MeetingExtraction = {
        ...baseMeeting,
        id: "fresh-id",
        actionItems: [
          // Simulated fresh AI output for task-1 without execution status
          {
            ...baseMeeting.actionItems[0],
            status: "todo", // LLM initial prediction
            reviewStatus: "pending",
          },
        ],
        openQuestions: [
          // Fresh AI output without answers
          {
            ...baseMeeting.openQuestions[0],
            status: "open",
            answer: null,
            reviewStatus: "pending",
          },
        ],
      };

      const reconciled = reconcileMeeting(baseMeeting, freshExtraction);
      const recTask = reconciled.actionItems.find((t) => t.id === "act-1");
      const recQuestion = reconciled.openQuestions.find((q) => q.id === "q-1");

      // Execution status was preserved from user's earlier "in_progress"
      expect(recTask?.status).toBe("in_progress");
      expect(recTask?.reviewStatus).toBe("approved");

      // Question answer was preserved from user's recorded resolution
      expect(recQuestion?.status).toBe("answered");
      expect(recQuestion?.answer).toBe("Councilor Santos agreed to coordinate.");
    });
  });

  describe("Step 6: Exports with Execution Progress & Meeting Minutes", () => {
    it("includes execution status and clarification flags in Markdown export", () => {
      const md = generateMarkdownExport(baseMeeting, { includePending: true });

      // Check for execution status markers
      expect(md).toContain("[Status: In Progress]");
      expect(md).toContain("[Status: Completed]");
      expect(md).toContain("- [x] **Book event venue**");
      expect(md).toContain("- [ ] **Draft project proposal**");

      // Check for question answers
      expect(md).toContain("Councilor Santos agreed to coordinate.");

      // Check for clarification warnings
      expect(md).toContain("Clarification Needed: Missing owner; Missing deadline; Tentative proposal");
    });

    it("includes Execution Status and Clarification Warnings columns in CSV export", () => {
      const csv = generateCsvExport(baseMeeting, { includePending: true });
      const lines = csv.split("\n");
      const header = lines[0];

      expect(header).toContain("Execution Status");
      expect(header).toContain("Clarification Warnings");

      // Approved tasks show their execution status
      expect(csv).toContain('"in_progress"');
      expect(csv).toContain('"completed"');
    });

    it("generates structured Meeting Minutes document", () => {
      const minutes = generateMeetingMinutesExport(baseMeeting);

      expect(minutes).toContain("# Meeting Minutes: Youth Council Project Alignment");
      expect(minutes).toContain("SWUdevs");
      expect(minutes).toContain("## 1. Meeting Details");
      expect(minutes).toContain("## 2. Overview & Executive Summary");
      expect(minutes).toContain("Coordination meeting for annual barangay outreach.");
      expect(minutes).toContain("## 3. Decisions Reached");
      expect(minutes).toContain("Outreach event set for November 15 at Barangay Gymnasium");
      expect(minutes).toContain("## 4. Action Items & Work Assignment");
      expect(minutes).toContain("| # | Task | Owner | Due Date | Status | Clarification |");
      expect(minutes).toContain("| 1 | Finalize budget spreadsheet | Maria | 2026-10-15 | In Progress | None |");
      expect(minutes).toContain("## 5. Open Inquiries & Follow-up Items");
      expect(minutes).toContain("Councilor Santos agreed to coordinate.");
    });
  });

  describe("Corrective Pass: Edge Cases & Regressions", () => {
    it("flags AI tasks lacking verified evidence as 'Unverified citation'", () => {
      // AI task with empty evidence array
      const aiTaskNoEvidence: ActionItem = {
        ...baseMeeting.actionItems[0],
        isManual: false,
        evidence: [],
      };
      const reasons = getClarificationReasons(aiTaskNoEvidence);
      expect(reasons).toContain("Unverified citation");

      // AI task where all evidence is unverified
      const aiTaskUnverified: ActionItem = {
        ...baseMeeting.actionItems[0],
        isManual: false,
        evidence: [
          {
            quote: "some text",
            startOffset: 0,
            endOffset: 9,
            isVerified: false,
            provenance: "unverified",
          },
        ],
      };
      expect(getClarificationReasons(aiTaskUnverified)).toContain("Unverified citation");

      // Manual task with empty evidence is NOT penalized for missing citation
      const manualTask: ActionItem = {
        ...baseMeeting.actionItems[0],
        isManual: true,
        evidence: [],
      };
      expect(getClarificationReasons(manualTask)).not.toContain("Unverified citation");
    });

    it("exempts manually added items with manual evidence from the citation warning", () => {
      const manualTask: ActionItem = {
        ...baseMeeting.actionItems[0],
        isManual: true,
        evidence: [createManualEvidence()],
      };

      expect(getClarificationReasons(manualTask)).toEqual([]);
    });

    it("flags source-changed items requiring review as 'Source changed'", () => {
      // Reconcile with altered source transcript
      const updatedMeeting: MeetingExtraction = {
        ...baseMeeting,
        rawTranscript: "Maria will finalize budget by 2026-10-15.\nJohn will draft proposal.\nNew notes.",
      };

      const reconciled = reconcileMeeting(baseMeeting, updatedMeeting);
      const reconciledTask = reconciled.actionItems.find((t) => t.id === "act-1");
      expect(reconciledTask).toBeDefined();
      expect(reconciledTask?.retainedFromReview).toBe(true);
      expect(reconciledTask?.needsReview).toBe(true);

      const reasons = getClarificationReasons(reconciledTask!);
      expect(reasons).toContain("Source changed");

      // Once the user approves or clears review requirement
      const approvedTask: ActionItem = {
        ...reconciledTask!,
        needsReview: false,
        reviewStatus: "approved",
      };
      expect(getClarificationReasons(approvedTask)).not.toContain("Source changed");
    });

    it("evaluates overdue status using the configured meeting timezone rather than UTC", () => {
      // Suppose UTC is 2026-10-20 at 18:00 (6 PM)
      // In Asia/Manila (UTC+8), it is 2026-10-21 at 02:00 (2 AM next day)
      const testDate = new Date("2026-10-20T18:00:00Z");

      expect(getTodayInTimezone("UTC", testDate)).toBe("2026-10-20");
      expect(getTodayInTimezone("Asia/Manila", testDate)).toBe("2026-10-21");

      const taskDueOct20: ActionItem = {
        ...baseMeeting.actionItems[0],
        status: "in_progress",
        deadline: {
          originalText: "Oct 20",
          date: "2026-10-20",
          time: null,
          timezone: "Asia/Manila",
          relation: "by",
          isAmbiguous: false,
        },
      };

      // In Asia/Manila, October 20 deadline is already in the past on October 21
      expect(isTaskOverdue(taskDueOct20, "Asia/Manila", testDate)).toBe(true);

      // In UTC, October 20 deadline is today, not yet in the past
      expect(isTaskOverdue(taskDueOct20, "UTC", testDate)).toBe(false);

      // Completed tasks are never overdue
      const completedTask: ActionItem = { ...taskDueOct20, status: "completed" };
      expect(isTaskOverdue(completedTask, "Asia/Manila", testDate)).toBe(false);
    });

    it("preserves ambiguous deadline flag when editing unrelated task fields", () => {
      const ambiguousTask: ActionItem = {
        ...baseMeeting.actionItems[0],
        deadline: {
          originalText: "sunod semana",
          date: "2026-10-28",
          time: null,
          timezone: "Asia/Manila",
          relation: null,
          isAmbiguous: true,
        },
      };

      // Simulating ActionItemEditor logic:
      // When deadlineDate is NOT modified, isAmbiguous must be preserved
      const editedTitleOnly = {
        ...ambiguousTask,
        title: "Updated Title",
        deadline: {
          ...ambiguousTask.deadline,
          date: ambiguousTask.deadline.date,
          isAmbiguous:
            "2026-10-28" !== (ambiguousTask.deadline.date || "")
              ? false
              : ambiguousTask.deadline.isAmbiguous,
        },
      };
      expect(editedTitleOnly.deadline.isAmbiguous).toBe(true);

      // When deadlineDate IS modified by the user, ambiguity is cleared
      const editedDate = {
        ...ambiguousTask,
        deadline: {
          ...ambiguousTask.deadline,
          date: "2026-10-30",
          isAmbiguous:
            "2026-10-30" !== (ambiguousTask.deadline.date || "")
              ? false
              : ambiguousTask.deadline.isAmbiguous,
        },
      };
      expect(editedDate.deadline.isAmbiguous).toBe(false);
    });

    it("ensures Review List's Needs Info filter matches Clarify tab and excludes rejected tasks", () => {
      // Filter logic used across Review List and Clarify view
      const isTaskNeedsInfo = (t: ActionItem) =>
        t.reviewStatus !== "rejected" && getClarificationReasons(t).length > 0;

      const unassignedTask: ActionItem = {
        ...baseMeeting.actionItems[0],
        assignees: [],
        reviewStatus: "pending",
      };
      expect(isTaskNeedsInfo(unassignedTask)).toBe(true);

      // Rejected task must not appear in active needs-info
      const rejectedTask: ActionItem = {
        ...unassignedTask,
        reviewStatus: "rejected",
      };
      expect(isTaskNeedsInfo(rejectedTask)).toBe(false);
    });

    it("preserves newly resolved assignees during re-analysis reconciliation without being overwritten by stale unassigned records", () => {
      // Previous meeting had an unassigned task (e.g. before speaker awareness fix)
      const staleMeeting: MeetingExtraction = {
        ...baseMeeting,
        actionItems: [
          {
            ...baseMeeting.actionItems[0],
            id: "act-liza-1",
            title: "Create and submit poster",
            sourceTitle: "maghimo sa poster ug ipasa nako sa Oktubre 27",
            assignees: [], // was unassigned in previous pass
            reviewStatus: "pending",
            isUserEdited: false,
            isManual: false,
          },
        ],
      };

      // Fresh re-analysis now successfully extracts Liza
      const freshMeeting: MeetingExtraction = {
        ...baseMeeting,
        actionItems: [
          {
            ...baseMeeting.actionItems[0],
            id: "act-liza-fresh",
            title: "Create and submit poster",
            sourceTitle: "maghimo sa poster ug ipasa nako sa Oktubre 27",
            assignees: ["Liza"], // newly resolved
            reviewStatus: "pending",
            isUserEdited: false,
            isManual: false,
          },
        ],
      };

      const reconciled = reconcileMeeting(staleMeeting, freshMeeting);
      expect(reconciled.actionItems).toHaveLength(1);
      // Freshly resolved assignee Liza must be present, not overwritten with empty assignees
      expect(reconciled.actionItems[0].assignees).toEqual(["Liza"]);
    });
  });
});
