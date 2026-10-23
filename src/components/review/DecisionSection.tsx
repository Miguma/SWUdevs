import React, { useState } from "react";
import { Trash2, Check, X, Link2, Edit2 } from "@/components/icons";
import { Evidence, MeetingDecision, ReviewStatus } from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";

export interface DecisionSectionProps {
  decisions: MeetingDecision[];
  onAddDecision: (decision: MeetingDecision) => void;
  onEditDecision?: (id: string, newText: string) => void;
  onDeleteDecision: (id: string) => void;
  onSetStatus: (id: string, status: ReviewStatus) => void;
  onInspectEvidence: (evidence: Evidence) => void;
}

export function DecisionSection({
  decisions,
  onAddDecision,
  onEditDecision,
  onDeleteDecision,
  onSetStatus,
  onInspectEvidence,
}: DecisionSectionProps) {
  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
    <section className="space-y-3 border-t border-border pt-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-foreground">Decisions</h3>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {decisions.length}
        </span>
      </div>

      {decisions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No decisions recorded.</p>
      ) : (
        <ul className="divide-y divide-border/70">
          {decisions.map((dec) => {
            const primaryEv = dec.evidence?.[0];
            const isEditing = editingId === dec.id;
            const isApproved = dec.reviewStatus === "approved";
            const isRejected = dec.reviewStatus === "rejected";

            return (
              <li key={dec.id} className="py-2.5">
                {isEditing ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editText.trim() && onEditDecision) {
                            onEditDecision(dec.id, editText.trim());
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
                          if (editText.trim() && onEditDecision) {
                            onEditDecision(dec.id, editText.trim());
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 space-y-1">
                      <p
                        className={`text-[13px] leading-snug ${
                          isRejected
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {dec.decision}
                      </p>
                      {primaryEv && (
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
                      )}
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-0.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(dec.id);
                          setEditText(dec.decision);
                        }}
                        className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                        title="Edit decision"
                        aria-label={`Edit decision: ${dec.decision}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(dec.id, isApproved ? "pending" : "approved")
                        }
                        aria-pressed={isApproved}
                        className={`tap-icon rounded p-1 transition-colors hover:bg-muted cursor-pointer ${
                          isApproved
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={isApproved ? "Move back to pending" : "Approve decision"}
                        aria-label={
                          isApproved
                            ? `Approved: ${dec.decision}`
                            : `Approve decision: ${dec.decision}`
                        }
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onSetStatus(dec.id, isRejected ? "pending" : "rejected")
                        }
                        aria-pressed={isRejected}
                        className={`tap-icon rounded p-1 transition-colors cursor-pointer ${
                          isRejected
                            ? "text-muted-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={isRejected ? "Move back to pending" : "Dismiss decision"}
                        aria-label={
                          isRejected
                            ? `Dismissed: ${dec.decision}`
                            : `Dismiss decision: ${dec.decision}`
                        }
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteDecision(dec.id)}
                        className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger cursor-pointer"
                        title="Delete decision"
                        aria-label={`Delete decision: ${dec.decision}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <input
          type="text"
          placeholder="Add a decision"
          aria-label="New decision"
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
