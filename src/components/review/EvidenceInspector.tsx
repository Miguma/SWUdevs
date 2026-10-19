import React, { useEffect, useRef } from "react";
import { Quote, X, CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";
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
    // Focus close button on mount
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

  // Calculate highlighted transcript view
  let beforeText = rawTranscript;
  let highlightedText = "";
  let afterText = "";

  if (evidence.startOffset !== null && evidence.endOffset !== null) {
    beforeText = rawTranscript.slice(0, evidence.startOffset);
    highlightedText = rawTranscript.slice(evidence.startOffset, evidence.endOffset);
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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-accent-teal" />
            <h3 id="evidence-inspector-title" className="font-bold text-foreground">
              Source Evidence & Provenance Inspector
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provenance Status Banner */}
        <div className="flex-shrink-0">
          {provenance === "exact_match" ? (
            <div className="p-3 rounded-xl bg-accent-light/50 border border-accent-teal/30 text-xs text-foreground flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-accent-teal">Exact Verbatim Source Match</p>
                <p className="text-muted-foreground mt-0.5">
                  An exact character match was located in the source transcript. Note: Citing a matching passage indicates textual basis, not factual endorsement.
                </p>
              </div>
            </div>
          ) : provenance === "normalized_match" ? (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-foreground flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-700">Normalized Source Match</p>
                <p className="text-muted-foreground mt-0.5">
                  The cited passage was matched after resolving case differences or irregular linebreaks/whitespace in the transcript.
                </p>
              </div>
            </div>
          ) : provenance === "manual" ? (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-foreground flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-700">User-Created Content</p>
                <p className="text-muted-foreground mt-0.5">
                  This item was created manually during review and does not originate from AI transcript extraction.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-foreground flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-700">Unverified Citation</p>
                <p className="text-muted-foreground mt-0.5">
                  The cited quote could not be located in the source transcript. Please verify this item carefully before approving.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quoted text snippet */}
        <div className="space-y-1.5 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Extracted Quotation:
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-border text-sm font-medium text-foreground">
            &ldquo;{quote}&rdquo;
          </div>
        </div>

        {/* Highlighted in Context */}
        <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            In Raw Transcript Context:
          </p>
          <div className="flex-1 p-4 rounded-xl bg-slate-50 border border-border text-xs font-mono overflow-y-auto leading-relaxed whitespace-pre-wrap">
            {highlightedText ? (
              <>
                <span>{beforeText}</span>
                <mark className="bg-amber-200 text-foreground font-semibold px-1 rounded">
                  {highlightedText}
                </mark>
                <span>{afterText}</span>
              </>
            ) : (
              <span className="text-muted-foreground italic">
                {rawTranscript}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-border flex-shrink-0">
          <span className="text-[11px] text-muted-foreground">
            Offsets: {evidence.startOffset !== null ? `${evidence.startOffset}–${evidence.endOffset}` : "Unanchored"}
          </span>
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-foreground transition-colors cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
