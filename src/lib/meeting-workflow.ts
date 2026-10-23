import type {
  ActionItem,
  Evidence,
  MeetingExtraction,
  MeetingDecision,
  OpenQuestion,
} from "@/types/meeting";
import { verifyEvidenceQuote } from "@/server/services/evidence-verifier";
import { hasTaskOwner, syncMeetingOwnerInformation } from "./owner-state";
import { traceOwnerState } from "./owner-diagnostics";

const normalize = (text: string) =>
  text
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
type ReviewItem = ActionItem | MeetingDecision | OpenQuestion;
const titleOf = (item: ReviewItem) =>
  "title" in item
    ? item.sourceTitle || item.title
    : "decision" in item
      ? item.decision
      : item.question;
const contentOf = (item: ReviewItem) =>
  JSON.stringify({
    ...item,
    id: undefined,
    reviewStatus: undefined,
    status: undefined,
    answer: undefined,
    needsReview: undefined,
    isUserEdited: undefined,
    isManual: undefined,
    retainedFromReview: undefined,
  });

function sameItem(a: ReviewItem, b: ReviewItem): boolean {
  if (normalize(titleOf(a)) === normalize(titleOf(b))) return true;
  const sameQuote = a.evidence.some(
    (x) =>
      x.quote &&
      b.evidence.some((y) => normalize(x.quote) === normalize(y.quote)),
  );
  if (!sameQuote) return false;
  const words = (s: string) =>
    new Set(
      normalize(s)
        .split(" ")
        .filter((w) => w.length > 2),
    );
  const aw = words(titleOf(a)),
    bw = words(titleOf(b));
  const common = Array.from(aw).filter((w) => bw.has(w)).length;
  return common >= 2 && (2 * common) / (aw.size + bw.size) >= 0.5;
}

function reanchor(evidence: Evidence[], transcript: string): Evidence[] {
  return evidence.flatMap((ev) =>
    ev.provenance === "manual"
      ? [ev]
      : verifyEvidenceQuote(transcript, ev.quote).verifiedEvidence,
  );
}

// Replace the previous AI pass; preserve human work and consume each match once.
// Changed source requires a new human review, even when a quotation still matches.
export function reconcileMeeting(
  previous: MeetingExtraction,
  fresh: MeetingExtraction,
): MeetingExtraction {
  const sourceChanged =
    previous.rawTranscript !== fresh.rawTranscript ||
    previous.meetingDate !== fresh.meetingDate ||
    previous.timezone !== fresh.timezone;
  const merge = <T extends ReviewItem>(oldItems: T[], newItems: T[]): T[] => {
    const consumed = new Set<string>();
    const result = newItems.map((item) => {
      const old = oldItems.find(
        (candidate) => !consumed.has(candidate.id) && sameItem(candidate, item),
      );
      if (!old) return item;
      consumed.add(old.id);
      const oldStatus = "status" in old ? old.status : undefined;
      const oldAnswer = "answer" in old ? old.answer : undefined;
      const kept = old.isUserEdited || old.isManual ? old : item;
      const evidence = reanchor(kept.evidence, fresh.rawTranscript);
      const needsNewReview =
        !old.isManual &&
        (sourceChanged ||
          (!old.isUserEdited && contentOf(old) !== contentOf(item)));
      return {
        ...kept,
        id: old.id,
        evidence,
        reviewStatus: needsNewReview ? ("pending" as const) : old.reviewStatus,
        needsReview: needsNewReview || kept.needsReview,
        retainedFromReview: sourceChanged ? true : kept.retainedFromReview,
        ...(oldStatus !== undefined ? { status: oldStatus } : {}),
        ...(oldAnswer !== undefined ? { answer: oldAnswer } : {}),
      };
    });
    for (const old of oldItems) {
      if (consumed.has(old.id)) continue;
      if (
        old.isManual ||
        old.isUserEdited ||
        old.retainedFromReview ||
        old.reviewStatus !== "pending"
      ) {
        result.push({
          ...old,
          retainedFromReview: true,
          evidence: reanchor(old.evidence, fresh.rawTranscript),
          reviewStatus: old.isManual ? old.reviewStatus : "pending",
          needsReview: !old.isManual,
        });
      }
    }
    return result;
  };
  const reconciled = syncMeetingOwnerInformation({
    ...fresh,
    id: previous.id,
    createdAt: previous.createdAt,
    actionItems: merge(previous.actionItems, fresh.actionItems),
    decisions: merge(previous.decisions, fresh.decisions),
    openQuestions: merge(previous.openQuestions, fresh.openQuestions),
    warnings: [
      ...fresh.warnings,
      "Re-analysis replaced the previous AI pass. Human edits and reviewed items were retained; changed or unmatched source items need review.",
    ],
  });
  traceOwnerState("reconciled", reconciled.actionItems);
  return reconciled;
}

export function getReviewProgress(meeting: MeetingExtraction) {
  const items = [
    ...meeting.actionItems,
    ...meeting.decisions,
    ...meeting.openQuestions,
  ];
  const reviewed = items.filter(
    (item) =>
      item.reviewStatus === "approved" || item.reviewStatus === "rejected",
  ).length;
  return {
    total: items.length,
    reviewed,
    percent: items.length ? Math.round((100 * reviewed) / items.length) : 0,
  };
}

export function getExecutionProgress(meeting: MeetingExtraction) {
  const approvedTasks = meeting.actionItems.filter(
    (t) => t.reviewStatus === "approved",
  );
  const completed = approvedTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const inProgress = approvedTasks.filter(
    (t) => t.status === "in_progress",
  ).length;
  const blocked = approvedTasks.filter((t) => t.status === "blocked").length;
  const todo = approvedTasks.filter(
    (t) => !t.status || t.status === "todo",
  ).length;

  return {
    total: approvedTasks.length,
    totalApproved: approvedTasks.length,
    completed,
    inProgress,
    in_progress: inProgress,
    blocked,
    todo,
    percent: approvedTasks.length
      ? Math.round((100 * completed) / approvedTasks.length)
      : 0,
  };
}

export function getTodayInTimezone(
  timezone = "Asia/Manila",
  now: Date = new Date(),
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function isTaskOverdue(
  task: ActionItem,
  referenceDateOrTimezone?: string,
  now: Date = new Date(),
): boolean {
  if (task.status === "completed" || !task.deadline.date) return false;

  let referenceDate: string;
  if (
    referenceDateOrTimezone &&
    /^\d{4}-\d{2}-\d{2}$/.test(referenceDateOrTimezone)
  ) {
    referenceDate = referenceDateOrTimezone;
  } else {
    const tz = referenceDateOrTimezone || task.deadline.timezone || "Asia/Manila";
    referenceDate = getTodayInTimezone(tz, now);
  }

  return task.deadline.date < referenceDate;
}

export function getClarificationReasons(task: ActionItem): string[] {
  const reasons: string[] = [];
  if (!hasTaskOwner(task)) {
    reasons.push("Missing owner");
  }
  if (!task.deadline.date) {
    reasons.push("Missing deadline");
  } else if (task.deadline.isAmbiguous) {
    reasons.push("Ambiguous deadline");
  }
  if (task.commitmentStatus === "proposed") {
    reasons.push("Tentative proposal");
  } else if (task.commitmentStatus === "unclear") {
    reasons.push("Unclear commitment");
  }
  const hasVerifiedEvidence =
    task.evidence.length > 0 &&
    (task.evidence.some(
      (ev) => ev.isVerified && ev.provenance !== "unverified",
    ) ||
      task.evidence.some((ev) => ev.provenance === "manual"));
  if (!task.isManual && !hasVerifiedEvidence) {
    reasons.push("Unverified citation");
  } else if (
    task.evidence.some(
      (ev) =>
        ev.provenance !== "manual" &&
        (!ev.isVerified || ev.provenance === "unverified"),
    )
  ) {
    reasons.push("Unverified citation");
  }
  if (task.retainedFromReview && task.needsReview) {
    reasons.push("Source changed");
  }
  return reasons;
}

// A failed write must not poison later saves; writes start in invocation order.
export function createSerialMeetingSaver(
  write: (meeting: MeetingExtraction) => Promise<void>,
) {
  let tail: Promise<void> = Promise.resolve();
  return (meeting: MeetingExtraction) => {
    const snapshot = structuredClone(meeting);
    const next = tail.catch(() => undefined).then(() => write(snapshot));
    tail = next;
    return next;
  };
}
