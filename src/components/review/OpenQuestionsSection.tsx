import React, { useState } from "react";
import {
  Trash2,
  Check,
  X,
  Link2,
  Edit2,
  CheckCircle2,
  MessageSquare,
} from "@/components/icons";
import {
  Evidence,
  OpenQuestion,
  QuestionAnswerStatus,
  ReviewStatus,
} from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

export interface OpenQuestionsSectionProps {
  questions: OpenQuestion[];
  onAddQuestion: (question: OpenQuestion) => void;
  onEditQuestion?: (id: string, newText: string) => void;
  onAnswerQuestion?: (
    id: string,
    status: QuestionAnswerStatus,
    answer?: string | null
  ) => void;
  onDeleteQuestion: (id: string) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onInspectEvidence: (evidence: Evidence) => void;
}

export function OpenQuestionsSection({
  questions,
  onAddQuestion,
  onEditQuestion,
  onAnswerQuestion,
  onDeleteQuestion,
  onSetStatus,
  onInspectEvidence,
}: OpenQuestionsSectionProps) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newQuestion: OpenQuestion = {
      id: `manual-q-${crypto.randomUUID().slice(0, 8)}`,
      question: newText.trim(),
      evidence: [
        createManualEvidence("Manually added open question during review"),
      ],
      status: "open",
      answer: null,
      needsReview: false,
      reviewStatus: "approved",
      isUserEdited: false,
      isManual: true,
    };

    onAddQuestion(newQuestion);
    setNewText("");
  };

  return (
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-foreground">
          Open questions
        </h3>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {questions.length}
        </span>
      </div>

      {questions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No open questions detected.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {questions.map((q) => {
            const primaryEv = q.evidence?.[0];
            const isEditing = editingId === q.id;
            const isAnswering = answeringId === q.id;
            const isAnswered = q.status === "answered";
            const isRejected = q.reviewStatus === "rejected";
            const isApproved = q.reviewStatus === "approved";

            return (
              <li key={q.id} className="py-2.5 text-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editText.trim() && onEditQuestion) {
                                onEditQuestion(q.id, editText.trim());
                              }
                              setEditingId(null);
                            } else if (e.key === "Escape") {
                              setEditingId(null);
                            }
                          }}
                          className="ui-input w-full sm:w-auto sm:flex-1"
                        />
                        <div className="flex items-center justify-between gap-2 sm:contents">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="tap-44-inline order-first text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer sm:order-none"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editText.trim() && onEditQuestion) {
                                onEditQuestion(q.id, editText.trim());
                              }
                              setEditingId(null);
                            }}
                            className="tap-44-inline ui-button-pill sm:order-none"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p
                          className={`text-[13px] leading-snug ${
                            isRejected
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {q.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onAnswerQuestion) {
                                onAnswerQuestion(
                                  q.id,
                                  isAnswered ? "open" : "answered",
                                  q.answer
                                );
                              }
                            }}
                            aria-pressed={isAnswered}
                            className={`tap-44-inline inline-flex items-center gap-1 py-0.5 text-[11px] transition-colors cursor-pointer ${
                              isAnswered
                                ? "text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="Toggle answered status"
                            aria-label={
                              isAnswered
                                ? `Mark as open: ${q.question}`
                                : `Mark as answered: ${q.question}`
                            }
                          >
                            {isAnswered && (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            <span>{isAnswered ? "Answered" : "Open"}</span>
                          </button>

                          {primaryEv && (
                            <>
                              <span
                                aria-hidden="true"
                                className="text-muted-foreground/50"
                              >
                                ·
                              </span>
                              <button
                                type="button"
                                onClick={() => onInspectEvidence(primaryEv)}
                                className="tap-44 inline-flex items-center gap-1 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                              >
                                <Link2 className="h-3 w-3" />
                                <span>
                                  {primaryEv.provenance === "manual"
                                    ? "Added by you"
                                    : "Source"}
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex shrink-0 flex-wrap items-center gap-0.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setAnsweringId(isAnswering ? null : q.id);
                          setAnswerText(q.answer || "");
                        }}
                        className={`tap-icon rounded p-1 transition-colors hover:bg-muted cursor-pointer ${
                          isAnswering
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={q.answer ? "Edit answer" : "Add answer"}
                        aria-label={
                          q.answer
                            ? `Edit answer for: ${q.question}`
                            : `Answer: ${q.question}`
                        }
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(q.id);
                          setEditText(q.question);
                        }}
                        className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        title="Edit question"
                        aria-label={`Edit question: ${q.question}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(q.id, isApproved ? "pending" : "approved")
                        }
                        aria-pressed={isApproved}
                        className={`tap-icon rounded p-1 transition-colors hover:bg-muted cursor-pointer ${
                          isApproved
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={isApproved ? "Move back to pending" : "Approve question"}
                        aria-label={
                          isApproved
                            ? `Approved: ${q.question}`
                            : `Approve question: ${q.question}`
                        }
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(q.id, isRejected ? "pending" : "rejected")
                        }
                        aria-pressed={isRejected}
                        className={`tap-icon rounded p-1 transition-colors cursor-pointer ${
                          isRejected
                            ? "text-muted-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={isRejected ? "Move back to pending" : "Dismiss question"}
                        aria-label={
                          isRejected
                            ? `Dismissed: ${q.question}`
                            : `Dismiss question: ${q.question}`
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(q.id)}
                        className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger cursor-pointer"
                        title="Delete question"
                        aria-label={`Delete question: ${q.question}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isAnswering ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <input
                      type="text"
                      placeholder="Record answer or resolution"
                      aria-label="Answer"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (onAnswerQuestion) {
                            onAnswerQuestion(
                              q.id,
                              answerText.trim() ? "answered" : "open",
                              answerText.trim() || null
                            );
                          }
                          setAnsweringId(null);
                        } else if (e.key === "Escape") {
                          setAnsweringId(null);
                        }
                      }}
                      className="ui-input w-full sm:w-auto sm:flex-1"
                    />
                    <div className="flex items-center justify-between gap-2 sm:contents">
                      <button
                        type="button"
                        onClick={() => setAnsweringId(null)}
                        className="tap-44-inline order-first text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer sm:order-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onAnswerQuestion) {
                            onAnswerQuestion(
                              q.id,
                              answerText.trim() ? "answered" : "open",
                              answerText.trim() || null
                            );
                          }
                          setAnsweringId(null);
                        }}
                        className="tap-44-inline ui-button-pill sm:order-none"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  q.answer && (
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">Answer:</span>{" "}
                      {q.answer}
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <input
          type="text"
          placeholder="Add an open question"
          aria-label="New open question"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="ui-input w-full sm:flex-1"
        />
        <button
          type="submit"
          className="tap-44 ui-button-pill w-full sm:w-auto sm:min-w-24"
        >
          Add
        </button>
      </form>
    </section>
  );
}
