import React, { useState } from "react";
import { Trash2, Check, X, Link2, Edit2, CheckCircle2, MessageSquare } from "lucide-react";
import { Evidence, OpenQuestion, QuestionAnswerStatus, ReviewStatus } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

export interface OpenQuestionsSectionProps {
  questions: OpenQuestion[];
  onAddQuestion: (question: OpenQuestion) => void;
  onEditQuestion?: (id: string, newText: string) => void;
  onAnswerQuestion?: (id: string, status: QuestionAnswerStatus, answer?: string | null) => void;
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
    <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Open Questions ({questions.length})
        </h3>
      </div>

      {questions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No open questions detected.
        </p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const primaryEv = q.evidence?.[0];
            const isEditing = editingId === q.id;
            const isAnswering = answeringId === q.id;
            const isAnswered = q.status === "answered";

            return (
              <div
                key={q.id}
                className={`p-2.5 rounded-lg border text-xs flex flex-col gap-2 transition-colors ${
                  q.reviewStatus === "rejected"
                    ? "bg-slate-50/50 border-border/60 opacity-55 line-through"
                    : q.reviewStatus === "approved"
                    ? isAnswered
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-primary-light/20 border-primary/30"
                    : "bg-warning-light/40 border-warning/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
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
                          className="flex-1 px-2 py-1 text-xs rounded border border-border bg-card focus:outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editText.trim() && onEditQuestion) {
                              onEditQuestion(q.id, editText.trim());
                            }
                            setEditingId(null);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-hover cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[11px] text-muted-foreground hover:bg-slate-100 rounded cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground leading-snug">
                            {q.question}
                          </p>
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
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              isAnswered
                                ? "bg-emerald-100/80 text-emerald-800 border-emerald-300"
                                : "bg-amber-100/80 text-amber-800 border-amber-300"
                            }`}
                            title="Click to toggle answered status"
                          >
                            {isAnswered ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
                                <span>Answered</span>
                              </>
                            ) : (
                              <span>Open</span>
                            )}
                          </button>
                        </div>

                        {primaryEv && (
                          <button
                            type="button"
                            onClick={() => onInspectEvidence(primaryEv)}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>
                              {primaryEv.provenance === "manual"
                                ? "Manual entry"
                                : "Inspect source"}
                            </span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setAnsweringId(isAnswering ? null : q.id);
                          setAnswerText(q.answer || "");
                        }}
                        className={`p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary-light/40 transition-colors cursor-pointer ${
                          isAnswering ? "bg-primary-light text-primary" : ""
                        }`}
                        title={q.answer ? "Edit resolution / answer" : "Add answer"}
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(q.id);
                          setEditText(q.question);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit question text"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(
                            q.id,
                            q.reviewStatus === "approved" ? "pending" : "approved"
                          )
                        }
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          q.reviewStatus === "approved"
                            ? "bg-primary text-white border-primary"
                            : "bg-card text-muted-foreground border-border hover:text-primary"
                        }`}
                        title="Approve question"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(
                            q.id,
                            q.reviewStatus === "rejected" ? "pending" : "rejected"
                          )
                        }
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          q.reviewStatus === "rejected"
                            ? "bg-danger text-white border-danger"
                            : "bg-card text-muted-foreground border-border hover:text-danger"
                        }`}
                        title="Dismiss question"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(q.id)}
                        className="text-muted-foreground hover:text-danger p-1 rounded hover:bg-danger-light/60 transition-colors cursor-pointer flex-shrink-0"
                        title="Delete question"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Answer display or input */}
                {isAnswering ? (
                  <div className="pt-1.5 border-t border-border/60 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Record answer or resolution..."
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
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-border bg-card focus:outline-none focus:border-primary"
                    />
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
                      className="px-2 py-1 text-[11px] font-semibold bg-primary text-white rounded hover:bg-primary-hover cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnsweringId(null)}
                      className="px-2 py-1 text-[11px] text-muted-foreground hover:bg-slate-100 rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  q.answer && (
                    <div className="pt-1 border-t border-border/50 text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="font-semibold text-emerald-700">Resolution:</span>
                      <span className="text-foreground">{q.answer}</span>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-1.5 pt-0.5">
        <input
          type="text"
          placeholder="Add open question..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-foreground transition-colors cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
}
