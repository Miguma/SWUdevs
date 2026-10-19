import React, { useState } from "react";
import { Trash2, Check, X, Link2 } from "lucide-react";
import { Evidence, OpenQuestion, ReviewStatus } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

export interface OpenQuestionsSectionProps {
  questions: OpenQuestion[];
  onAddQuestion: (question: OpenQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onInspectEvidence: (evidence: Evidence) => void;
}

export function OpenQuestionsSection({
  questions,
  onAddQuestion,
  onDeleteQuestion,
  onSetStatus,
  onInspectEvidence,
}: OpenQuestionsSectionProps) {
  const [newText, setNewText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newQuestion: OpenQuestion = {
      id: `manual-q-${crypto.randomUUID().slice(0, 8)}`,
      question: newText.trim(),
      evidence: [
        createManualEvidence("Manually added open question during review"),
      ],
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
            return (
              <div
                key={q.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 transition-colors ${
                  q.reviewStatus === "rejected"
                    ? "bg-slate-50/50 border-border/60 opacity-55 line-through"
                    : q.reviewStatus === "approved"
                    ? "bg-primary-light/20 border-primary/30"
                    : "bg-warning-light/40 border-warning/20"
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground leading-snug">
                    {q.question}
                  </p>
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
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
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
