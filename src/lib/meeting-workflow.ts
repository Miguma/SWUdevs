import type {
  ActionItem,
  Evidence,
  MeetingExtraction,
  MeetingDecision,
  OpenQuestion,
} from "@/types/meeting";
import { verifyEvidenceQuote } from "@/server/services/evidence-verifier";

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
  return {
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
  };
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
