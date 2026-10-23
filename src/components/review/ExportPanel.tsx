import React, { useState } from "react";
import {
  FileDown,
  FileText,
  Table,
  Check,
  Copy,
  ScrollText,
  Loader2,
} from "@/components/icons";
import { noticeShellClass, useNoticePresence } from "@/components/InlineNotice";
import { MeetingExtraction } from "@/types/meeting";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "@/server/services/export-service";

interface ExportPanelProps {
  meeting: MeetingExtraction;
}

let pdfExportPromise: Promise<typeof import("@/lib/pdf-export")> | null = null;
function loadPdfExport() {
  if (!pdfExportPromise) {
    pdfExportPromise = import("@/lib/pdf-export").catch((err) => {
      // Reset so subsequent clicks can retry loading the chunk
      pdfExportPromise = null;
      throw err;
    });
  }
  return pdfExportPromise;
}

export function ExportPanel({ meeting }: ExportPanelProps) {
  const [includePending, setIncludePending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { rendered: pdfErrorNotice, visible: pdfErrorVisible } =
    useNoticePresence(pdfError);

  React.useEffect(() => {
    // Idle-preload PDF chunk once the review panel mounts
    const timer = setTimeout(() => {
      loadPdfExport().catch(() => {
        // Silently ignore background preload failures
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfError(null);
      // Lazy-load PDF generator code only when clicked to keep initial bundle light
      const { exportMeetingToPdf } = await loadPdfExport();
      await exportMeetingToPdf(meeting, { includePending });
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      const msg = err?.message || "";
      if (msg.includes("Loading chunk") || err?.name === "ChunkLoadError") {
        setPdfError("Application was updated. Please refresh the page (Ctrl + F5) to load the latest PDF bundle.");
      } else {
        setPdfError(msg || "Failed to generate PDF");
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExport(meeting, { includePending });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-actions.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownExport(meeting, { includePending });
    navigator.clipboard.writeText(md);
    setCopied("md");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadMinutes = () => {
    const minutes = generateMeetingMinutesExport(meeting, { includePending });
    const blob = new Blob([minutes], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}-minutes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const csv = generateCsvExport(meeting, { includePending });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="export-results"
      className="bg-card rounded-xl border border-border p-4 space-y-3 scroll-mt-28"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground leading-tight">
          Export results
        </h3>

        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="tap-44-inline inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Copy Action Plan Markdown to clipboard"
        >
          {copied === "md" ? (
            <>
              <Check className="w-3 h-3 text-primary" />
              <span className="text-primary">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Export options: PDF, Markdown Actions, Minutes, CSV */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          type="button"
          className="tap-44 py-2 px-2.5 rounded-full border border-primary/40 bg-primary-light/50 hover:bg-primary-light text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          title="Download branded official PDF report"
        >
          {isGeneratingPdf ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : (
            <FileDown className="w-3.5 h-3.5 text-primary" />
          )}
          <span>PDF Report</span>
        </button>

        <button
          onClick={handleDownloadMarkdown}
          type="button"
          className="tap-44 py-2 px-2.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Download Action Plan as Markdown"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Actions</span>
        </button>

        <button
          onClick={handleDownloadMinutes}
          type="button"
          className="tap-44 py-2 px-2.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Download formatted Meeting Minutes (.md)"
        >
          <ScrollText className="w-3.5 h-3.5 text-primary" />
          <span>Minutes</span>
        </button>

        <button
          onClick={handleDownloadCsv}
          type="button"
          className="tap-44 py-2 px-2.5 rounded-full border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          title="Download Action Items spreadsheet (.csv)"
        >
          <Table className="w-3.5 h-3.5 text-primary" />
          <span>CSV</span>
        </button>
      </div>

      {pdfErrorNotice && (
        <div
          className={noticeShellClass(pdfErrorVisible)}
          aria-hidden={pdfErrorVisible ? undefined : true}
        >
          <div className="notice-clip">
            <div
              className="flex items-center justify-between gap-2 text-[11px] text-danger"
              role={pdfErrorVisible ? "alert" : undefined}
            >
              <span>{pdfErrorNotice}</span>
              {pdfErrorVisible && pdfErrorNotice.includes("refresh") && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="tap-44-inline underline font-semibold hover:text-danger/80 cursor-pointer flex-shrink-0"
                >
                  Refresh now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <label className="tap-44 text-[11px] text-muted-foreground flex items-center gap-2 cursor-pointer pt-0.5">
        <input
          type="checkbox"
          checked={includePending}
          onChange={(e) => setIncludePending(e.target.checked)}
          className="h-4 w-4 rounded text-primary focus:ring-primary"
        />
        <span>Include pending review items</span>
      </label>
    </div>
  );
}
