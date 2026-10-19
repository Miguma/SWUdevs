import React, { useState } from "react";
import { Trash2, Check, X, Link2 } from "lucide-react";
import { Evidence, MeetingDecision, ReviewStatus } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

export interface DecisionSectionProps {
  decisions: MeetingDecision[];
  onAddDecision: (decision: MeetingDecision) => void;
  onDeleteDecision: (id: string) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onInspectEvidence: (evidence: Evidence) => void;
}

export function DecisionSection({
  decisions,
  onAddDecision,
  onDeleteDecision,
  onSetStatus,
  onInspectEvidence,
}: DecisionSectionProps) {
  const [newText, setNewText] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const newDecision: MeetingDecision = {
      id: `manual-dec-${crypto.randomUUID().slice(0, 8)}`,
      decision: newText.trim(),
      evidence: [
        createManualEvidence("Manually added decision during review"),
      ],
      needsReview: false,
      reviewStatus: "approved",
      isUserEdited: false,
      isManual: true,
    };

    onAddDecision(newDecision);
    setNewText("");
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Decisions ({decisions.length})
        </h3>
      </div>

      {decisions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No decisions recorded.</p>
      ) : (
        <div className="space-y-2">
          {decisions.map((dec) => {
            const primaryEv = dec.evidence?.[0];
            return (
              <div
                key={dec.id}
                className={`p-2.5 rounded-lg border text-xs flex items-start justify-between gap-2 transition-colors ${
                  dec.reviewStatus === "rejected"
                    ? "bg-slate-50/50 border-border/60 opacity-55 line-through"
                    : dec.reviewStatus === "approved"
                    ? "bg-primary-light/20 border-primary/30"
                    : "bg-background border-border/80"
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-medium text-foreground leading-snug">
                    {dec.decision}
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
                        dec.id,
                        dec.reviewStatus === "approved" ? "pending" : "approved"
                      )
                    }
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      dec.reviewStatus === "approved"
                        ? "bg-primary text-white border-primary"
                        : "bg-card text-muted-foreground border-border hover:text-primary"
                    }`}
                    title="Approve decision"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSetStatus(
                        dec.id,
                        dec.reviewStatus === "rejected" ? "pending" : "rejected"
                      )
                    }
                    className={`p-1 rounded border transition-colors cursor-pointer ${
                      dec.reviewStatus === "rejected"
                        ? "bg-danger text-white border-danger"
                        : "bg-card text-muted-foreground border-border hover:text-danger"
                    }`}
                    title="Dismiss decision"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDecision(dec.id)}
                    className="text-muted-foreground hover:text-danger p-1 rounded hover:bg-danger-light/60 transition-colors cursor-pointer"
                    title="Delete decision"
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
          placeholder="Add decision..."
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
