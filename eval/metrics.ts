import type { MeetingExtraction } from "../src/types/meeting";
import { verifyEvidenceQuote } from "../src/server/services/evidence-verifier";

export interface BenchmarkCase {
  id: string;
  language: "english" | "cebuano" | "tagalog" | "mixed" | "edge_cases";
  category: string;
  meetingDate: string | null;
  timezone: string;
  notes: string;
  groundTruth: {
    expectedTasks: {
      title: string;
      assignees: string[];
      expectedDeadlineDate: string | null;
      status: string;
      semanticMustInclude?: string[];
      semanticMustNotInclude?: string[];
    }[];
    expectedDecisions: string[];
    expectedOpenQuestions: string[];
  };
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
const stopWords = new Set([
  "the",
  "a",
  "an",
  "to",
  "and",
  "for",
  "of",
  "in",
  "on",
  "sa",
  "ang",
  "ug",
  "og",
  "mga",
  "para",
  "nga",
  "ni",
  "si",
  "ng",
  "nang",
  "kay",
  "na",
  "at",
  "ay",
]);
export function titleSimilarity(a: string, b: string): number {
  a = normalize(a);
  b = normalize(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const words = (s: string) =>
    new Set(s.split(" ").filter((w) => !stopWords.has(w)));
  const aw = words(a),
    bw = words(b);
  const common = Array.from(aw).filter((w) => bw.has(w)).length;
  return aw.size + bw.size ? (2 * common) / (aw.size + bw.size) : 0;
}

// Maximum one-to-one matching prevents one short title from claiming multiple labels.
// This lexical heuristic is reproducible, not a claim of semantic equivalence.
function matchTitles(predictions: string[], labels: string[]) {
  const edges = predictions.map((prediction) =>
    labels
      .map((label, index) => ({
        index,
        score: titleSimilarity(prediction, label),
      }))
      .filter((match) => match.score >= 0.6)
      .sort((a, b) => b.score - a.score),
  );
  const assigned = new Map<number, number>();
  function visit(prediction: number, seen: Set<number>): boolean {
    for (const { index } of edges[prediction]) {
      if (seen.has(index)) continue;
      seen.add(index);
      const current = assigned.get(index);
      if (current === undefined || visit(current, seen)) {
        assigned.set(index, prediction);
        return true;
      }
    }
    return false;
  }
  predictions.forEach((_, index) => visit(index, new Set()));
  return Array.from(assigned, ([label, prediction]) => ({ label, prediction }));
}

export function scoreCase(prediction: MeetingExtraction, tc: BenchmarkCase) {
  const expected = tc.groundTruth.expectedTasks;
  const matches = matchTitles(
    prediction.actionItems.map((task) => task.title),
    expected.map((task) => task.title),
  );
  const owners = (names: string[]) =>
    JSON.stringify(Array.from(new Set(names.map(normalize))).sort());
  let correctOwners = 0,
    correctDeadlines = 0,
    correctCommitments = 0,
    correctSemantics = 0,
    semanticViolations = 0;
  for (const match of matches) {
    const actual = prediction.actionItems[match.prediction],
      label = expected[match.label];
    if (owners(actual.assignees) === owners(label.assignees)) correctOwners++;
    if (actual.deadline.date === label.expectedDeadlineDate) correctDeadlines++;
    if (actual.commitmentStatus === label.status) correctCommitments++;

    // Semantic fidelity evaluation
    const actualText = `${actual.title} ${actual.description || ""}`.toLowerCase();
    const actualWords = new Set(normalize(actualText).split(" "));
    let hasSemanticViolation = false;

    // 1. Forbidden semantic substitutions (e.g. "shovel" when text means "silhig" / "broom")
    if (label.semanticMustNotInclude && label.semanticMustNotInclude.length > 0) {
      for (const forbidden of label.semanticMustNotInclude) {
        if (actualWords.has(normalize(forbidden))) {
          hasSemanticViolation = true;
          break;
        }
      }
    }

    // 2. Required semantic keywords (e.g. "broom", "sack")
    if (!hasSemanticViolation && label.semanticMustInclude && label.semanticMustInclude.length > 0) {
      for (const required of label.semanticMustInclude) {
        if (!actualWords.has(normalize(required))) {
          hasSemanticViolation = true;
          break;
        }
      }
    }

    if (hasSemanticViolation) {
      semanticViolations++;
    } else {
      correctSemantics++;
    }
  }
  const allItems = [
    ...prediction.actionItems,
    ...prediction.decisions,
    ...prediction.openQuestions,
  ];
  const verifiedItems = allItems.filter(
    (item) =>
      item.evidence.length > 0 &&
      item.evidence.every(
        (evidence) =>
          evidence.provenance !== "manual" &&
          verifyEvidenceQuote(tc.notes, evidence.quote).isVerified,
      ),
  ).length;
  const counts = (titles: string[], labels: string[]) => ({
    predicted: titles.length,
    expected: labels.length,
    matched: matchTitles(titles, labels).length,
  });
  return {
    id: tc.id,
    language: tc.language,
    status: "success" as const,
    tasks: {
      predicted: prediction.actionItems.length,
      expected: expected.length,
      matched: matches.length,
    },
    decisions: counts(
      prediction.decisions.map((d) => d.decision),
      tc.groundTruth.expectedDecisions,
    ),
    questions: counts(
      prediction.openQuestions.map((q) => q.question),
      tc.groundTruth.expectedOpenQuestions,
    ),
    correctOwners,
    correctDeadlines,
    correctCommitments,
    correctSemantics,
    semanticViolations,
    verifiedItems,
    totalItems: allItems.length,
    matches,
  };
}

export function aggregateScores(rows: ReturnType<typeof scoreCase>[]) {
  const sum = (
    key:
      | "correctOwners"
      | "correctDeadlines"
      | "correctCommitments"
      | "correctSemantics"
      | "semanticViolations"
      | "verifiedItems"
      | "totalItems",
  ) => rows.reduce((total, row) => total + row[key], 0);
  const category = (key: "tasks" | "decisions" | "questions") => {
    const count = rows.reduce(
      (total, row) => ({
        predicted: total.predicted + row[key].predicted,
        expected: total.expected + row[key].expected,
        matched: total.matched + row[key].matched,
      }),
      { predicted: 0, expected: 0, matched: 0 },
    );
    return {
      ...count,
      precision: count.predicted ? count.matched / count.predicted : null,
      recall: count.expected ? count.matched / count.expected : null,
      f1:
        count.predicted + count.expected
          ? (2 * count.matched) / (count.predicted + count.expected)
          : null,
    };
  };
  const tasks = category("tasks");
  return {
    tasks,
    decisions: category("decisions"),
    questions: category("questions"),
    ownerAccuracy: tasks.matched ? sum("correctOwners") / tasks.matched : null,
    deadlineAccuracy: tasks.matched
      ? sum("correctDeadlines") / tasks.matched
      : null,
    commitmentAccuracy: tasks.matched
      ? sum("correctCommitments") / tasks.matched
      : null,
    semanticAccuracy: tasks.matched
      ? sum("correctSemantics") / tasks.matched
      : null,
    semanticViolations: sum("semanticViolations"),
    evidenceValidity: sum("totalItems")
      ? sum("verifiedItems") / sum("totalItems")
      : null,
  };
}
