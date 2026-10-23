import React, { useEffect, useRef } from "react";
import {
  Quote,
  X,
  AlertTriangle,
  ShieldCheck,
  Info,
} from "@/components/icons";
import { Evidence } from "@/types/meeting";

interface EvidenceInspectorProps {
  evidence: Evidence | null;
  rawTranscript: string;
  onClose: () => void;
}

export function EvidenceInspector({
  evidence,
  rawTranscript,
  onClose,
}: EvidenceInspectorProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!evidence) return null;

  const quote = evidence.quote || "";
  const provenance = evidence.provenance || "unverified";

  let beforeText = rawTranscript;
  let highlightedText = "";
  let afterText = "";

  if (provenance !== "manual" && evidence.isVerified && evidence.startOffset !== null && evidence.endOffset !== null && rawTranscript.slice(evidence.startOffset, evidence.endOffset) === quote) {
    beforeText = rawTranscript.slice(0, evidence.startOffset);
    highlightedText = rawTranscript.slice(
      evidence.startOffset,
      evidence.endOffset
    );
    afterText = rawTranscript.slice(evidence.endOffset);
  } else if (provenance !== "manual" && evidence.isVerified && quote.trim() !== "") {
    const idx = rawTranscript.indexOf(quote);
    if (idx !== -1) {
      beforeText = rawTranscript.slice(0, idx);
      highlightedText = rawTranscript.slice(idx, idx + quote.length);
      afterText = rawTranscript.slice(idx + quote.length);
    }
  }

  const provenanceContent =
    provenance === "exact_match" ? (
      <>
        <div>
          <p className="text-xs font-medium text-foreground">
            Found word for word
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            This quote appears in your notes exactly as written. Seeing the
            words is a good sign, but only your review confirms the task, its
            owner, and the go-ahead.
          </p>
        </div>
      </>
    ) : provenance === "normalized_match" ? (
      <>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">
            Found with small cleanups
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            The same words, with spacing or capitalization tidied up in your
            notes.
          </p>
        </div>
      </>
    ) : provenance === "manual" ? (
      <>
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">Added by you</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            You created this item yourself while reviewing, so there is no quote
            to check.
          </p>
        </div>
      </>
    ) : (
      <>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div>
          <p className="text-xs font-medium text-warning">
            Not found in your notes
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            We could not find these words in your notes. Please double-check
            this item before approving it.
          </p>
        </div>
      </>
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-inspector-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-5 shadow-lg space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-primary" />
            <h3
              id="evidence-inspector-title"
              className="text-sm font-semibold text-foreground"
            >
              Source in your notes
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            type="button"
            className="rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            aria-label="Close inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-shrink-0 items-start gap-2.5">
          {provenanceContent}
        </div>

        <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">
              Your notes around the quote
            </span>
            <span className="tabular-nums">
              {evidence.startOffset !== null
                ? `Characters ${evidence.startOffset} to ${evidence.endOffset}`
                : "Not located"}
            </span>
          </div>
          <div className="flex-1 p-3.5 rounded-lg bg-background border border-border text-xs font-mono overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {highlightedText ? (
              <>
                <span>{beforeText}</span>
                <mark className="rounded-[2px] bg-muted px-0.5 font-medium text-foreground">
                  {highlightedText}
                </mark>
                <span>{afterText}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{rawTranscript}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
