import React, { useState } from "react";
import { FileDown, Copy, Check, ShieldCheck } from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import {
  generateMarkdownExport,
  generateCsvExport,
} from "@/server/services/export-service";

interface ExportPanelProps {
  meeting: MeetingExtraction;
}

export function ExportPanel({ meeting }: ExportPanelProps) {
  const [includePending, setIncludePending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExport(meeting, { includePending });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownExport(meeting, { includePending });
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCsv = () => {
    const csv = generateCsvExport(meeting, { includePending });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <FileDown className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Export Action Plan
        </h3>
      </div>

      <div className="space-y-3">
        <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includePending}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
          />
          <span>Include pending items (labeled `[PENDING REVIEW]`)</span>
        </label>

        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-teal flex-shrink-0" />
          <span>Rejected tasks are never exported as commitments.</span>
        </p>

        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            onClick={handleDownloadMarkdown}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Markdown (.md)</span>
          </button>

          <button
            onClick={handleCopyMarkdown}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl border border-border hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-accent-teal" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadCsv}
            type="button"
            className="w-full py-2.5 px-3 rounded-xl border border-border hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            title="RFC 4180 CSV with formula injection defense"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV (Formula Safe)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
