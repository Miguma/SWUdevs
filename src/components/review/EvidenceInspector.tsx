import React, { useEffect, useRef } from "react";
import {
  Quote,
  X,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Info,
} from "lucide-react";
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

  if (evidence.startOffset !== null && evidence.endOffset !== null) {
    beforeText = rawTranscript.slice(0, evidence.startOffset);
    highlightedText = rawTranscript.slice(
      evidence.startOffset,
      evidence.endOffset
    );
    afterText = rawTranscript.slice(evidence.endOffset);
  } else if (quote.trim() !== "") {
    const idx = rawTranscript.indexOf(quote);
    if (idx !== -1) {
      beforeText = rawTranscript.slice(0, idx);
      highlightedText = rawTranscript.slice(idx, idx + quote.length);
      afterText = rawTranscript.slice(idx + quote.length);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-inspector-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-primary" />
            <h3
              id="evidence-inspector-title"
              className="font-bold text-sm text-foreground"
            >
              Source Evidence in Transcript
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provenance Status Banner */}
        <div className="flex-shrink-0">
          {provenance === "exact_match" ? (
            <div className="p-3 rounded-xl bg-primary-light/60 border border-primary/20 text-xs text-foreground flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-primary">
                  Exact Verbatim Match
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Located directly in the source transcript. Note: A located quotation proves textual provenance only, not task commitment or approval.
                </p>
              </div>
            </div>
          ) : provenance === "normalized_match" ? (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-foreground flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-700">
                  Normalized Match
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Matched after normalizing whitespace or casing in the transcript.
                </p>
              </div>
            </div>
          ) : provenance === "manual" ? (
            <div className="p-3 rounded-xl bg-slate-100 border border-border text-xs text-foreground flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Manual Entry</p>
                <p className="text-muted-foreground mt-0.5">
                  Created manually during human review.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-warning-light border border-warning/30 text-xs text-foreground flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-warning">
                  Unverified Citation
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Could not be located verbatim in the transcript. Verify carefully before approving.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Highlighted in Context */}
        <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              Transcript Context
            </span>
            <span>
              {evidence.startOffset !== null
                ? `Offsets ${evidence.startOffset}–${evidence.endOffset}`
                : "Unanchored"}
            </span>
          </div>
          <div className="flex-1 p-3.5 rounded-xl bg-background border border-border text-xs font-mono overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {highlightedText ? (
              <>
                <span>{beforeText}</span>
                <mark className="bg-primary-light text-primary font-semibold px-1 py-0.5 rounded border border-primary/30">
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
