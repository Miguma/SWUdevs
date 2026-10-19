import React, { useState } from "react";
import { CheckSquare, Trash2, Plus, Sparkles, PlusCircle } from "lucide-react";
import { MeetingDecision, ReviewStatus } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

interface DecisionSectionProps {
  decisions: MeetingDecision[];
  onAddDecision: (decision: MeetingDecision) => void;
  onDeleteDecision: (id: string) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
}

export function DecisionSection({
  decisions,
  onAddDecision,
  onDeleteDecision,
  onSetStatus,
}: DecisionSectionProps) {
  const [newText, setNewText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newDecision: MeetingDecision = {
      id: `manual-dec-${crypto.randomUUID().slice(0, 8)}`,
      decision: newText.trim(),
      evidence: [createManualEvidence("Manually added decision during review")],
      needsReview: false,
      reviewStatus: "approved",
      isUserEdited: false,
      isManual: true,
    };

    onAddDecision(newDecision);
    setNewText("");
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">
            Confirmed Decisions ({decisions.length})
          </h3>
        </div>
      </div>

      {decisions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No decisions recorded.</p>
      ) : (
        <div className="space-y-2">
          {decisions.map((dec) => (
            <div
              key={dec.id}
              className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 transition-colors ${
                dec.reviewStatus === "rejected"
                  ? "bg-slate-50 border-slate-200 opacity-60 line-through"
                  : "bg-slate-50/70 border-border"
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-medium text-foreground">{dec.decision}</p>
                  {dec.isManual && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Manual
                    </span>
                  )}
                </div>
                {dec.evidence && dec.evidence[0]?.quote && dec.evidence[0].provenance !== "manual" && (
                  <p className="text-[10px] text-muted-foreground italic">
                    &ldquo;{dec.evidence[0].quote}&rdquo;
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onSetStatus(
                      dec.id,
                      dec.reviewStatus === "approved" ? "rejected" : "approved"
                    )
                  }
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    dec.reviewStatus === "approved"
                      ? "bg-primary-light text-primary border-primary/30 font-semibold"
                      : "bg-card text-muted-foreground border-border hover:bg-slate-100"
                  }`}
                  title="Toggle approved / rejected"
                >
                  {dec.reviewStatus === "approved" ? "Approved" : "Rejected"}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteDecision(dec.id)}
                  className="text-slate-400 hover:text-danger p-1 rounded hover:bg-danger-light transition-colors cursor-pointer"
                  title="Delete decision"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Decision Form */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Add confirmed decision..."
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
