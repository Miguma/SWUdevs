import React, { useState } from "react";
import { HelpCircle, Trash2, PlusCircle } from "lucide-react";
import { OpenQuestion } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

interface OpenQuestionsSectionProps {
  questions: OpenQuestion[];
  onAddQuestion: (question: OpenQuestion) => void;
  onDeleteQuestion: (id: string) => void;
}

export function OpenQuestionsSection({
  questions,
  onAddQuestion,
  onDeleteQuestion,
}: OpenQuestionsSectionProps) {
  const [newText, setNewText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newQuestion: OpenQuestion = {
      id: `manual-q-${crypto.randomUUID().slice(0, 8)}`,
      question: newText.trim(),
      evidence: [createManualEvidence("Manually added open question during review")],
      needsReview: false,
      reviewStatus: "approved",
      isUserEdited: false,
      isManual: true,
    };

    onAddQuestion(newQuestion);
    setNewText("");
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">
          Unresolved Questions & Follow-ups ({questions.length})
        </h3>
      </div>

      {questions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No open questions detected.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className="p-3 rounded-xl bg-warning-light/40 border border-warning/20 text-xs flex items-start justify-between gap-2.5"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-medium text-foreground">❓ {q.question}</p>
                  {q.isManual && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Manual
                    </span>
                  )}
                </div>
                {q.evidence && q.evidence[0]?.quote && q.evidence[0].provenance !== "manual" && (
                  <p className="text-[10px] text-muted-foreground italic">
                    &ldquo;{q.evidence[0].quote}&rdquo;
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteQuestion(q.id)}
                className="text-slate-400 hover:text-danger p-1 rounded hover:bg-danger-light transition-colors cursor-pointer"
                title="Delete question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Question Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Add unresolved question..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-foreground transition-colors cursor-pointer"
        >
          Add
        </button>
      </form>
    </div>
  );
}
