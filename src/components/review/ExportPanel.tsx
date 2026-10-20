import React, { useState } from "react";
import { FileDown, FileText, Table, Check, Copy, ScrollText } from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import {
  generateMarkdownExport,
  generateCsvExport,
  generateMeetingMinutesExport,
} from "@/server/services/export-service";

interface ExportPanelProps {
  meeting: MeetingExtraction;
}

export function ExportPanel({ meeting }: ExportPanelProps) {
  const [includePending, setIncludePending] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

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
    <div id="export-results" className="bg-card rounded-xl border border-border p-4 space-y-3 scroll-mt-28">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
            <FileDown className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">
              Export results
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Download your action plan or official minutes.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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

      {/* 3 Export options: Markdown, Minutes, CSV */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleDownloadMarkdown}
          type="button"
          className="py-2 px-2.5 rounded-xl border border-border bg-card hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          title="Download Action Plan as Markdown"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Actions</span>
        </button>

        <button
          onClick={handleDownloadMinutes}
          type="button"
          className="py-2 px-2.5 rounded-xl border border-border bg-card hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          title="Download formatted Meeting Minutes (.md)"
        >
          <ScrollText className="w-3.5 h-3.5 text-primary" />
          <span>Minutes</span>
        </button>

        <button
          onClick={handleDownloadCsv}
          type="button"
          className="py-2 px-2.5 rounded-xl border border-border bg-card hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          title="Download Action Items spreadsheet (.csv)"
        >
          <Table className="w-3.5 h-3.5 text-primary" />
          <span>CSV</span>
        </button>
      </div>

      <label className="text-[11px] text-muted-foreground flex items-center gap-2 cursor-pointer pt-0.5">
        <input
          type="checkbox"
          checked={includePending}
          onChange={(e) => setIncludePending(e.target.checked)}
          className="rounded text-primary focus:ring-primary h-3 w-3"
        />
        <span>Include pending review items</span>
      </label>
    </div>
  );
}
