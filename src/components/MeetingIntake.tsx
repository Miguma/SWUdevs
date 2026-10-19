"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Sparkles,
  RotateCcw,
  FileText,
  Calendar,
  Globe,
  Users,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import { SAMPLE_CEBUANO_ENGLISH_MEETING } from "./SampleMeetingData";
import { parseUploadedFileContent } from "@/server/services/transcript-preprocessor";
import { saveDraftNotes, getDraftNotes } from "@/lib/storage/indexeddb";

interface MeetingIntakeProps {
  onExtractionComplete: (extraction: MeetingExtraction) => void;
}

export function MeetingIntake({ onExtractionComplete }: MeetingIntakeProps) {
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dateUnknown, setDateUnknown] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Manila");
  const [participants, setParticipants] = useState("");
  const [rawText, setRawText] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft on mount
  useEffect(() => {
    getDraftNotes().then((draft) => {
      if (draft && draft.rawText) {
        setTitle(draft.title || "");
        setOrganization(draft.organization || "");
        setMeetingDate(draft.meetingDate || new Date().toISOString().slice(0, 10));
        setDateUnknown(draft.dateUnknown || false);
        setTimezone(draft.timezone || "Asia/Manila");
        setParticipants(draft.participants || "");
        setRawText(draft.rawText || "");
        setAutosaveStatus("Restored draft from local storage");
        setTimeout(() => setAutosaveStatus(null), 3000);
      }
    });
  }, []);

  // Autosave draft debounce
  useEffect(() => {
    if (!rawText && !title) return;
    const timer = setTimeout(() => {
      saveDraftNotes({
        title,
        organization,
        meetingDate,
        dateUnknown,
        timezone,
        participants,
        rawText,
      }).then(() => {
        setAutosaveStatus("Draft auto-saved");
        setTimeout(() => setAutosaveStatus(null), 2000);
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, organization, meetingDate, dateUnknown, timezone, participants, rawText]);

  const loadSample = () => {
    setTitle(SAMPLE_CEBUANO_ENGLISH_MEETING.title);
    setOrganization(SAMPLE_CEBUANO_ENGLISH_MEETING.organization);
    setMeetingDate(SAMPLE_CEBUANO_ENGLISH_MEETING.meetingDate);
    setDateUnknown(false);
    setTimezone(SAMPLE_CEBUANO_ENGLISH_MEETING.timezone);
    setParticipants(SAMPLE_CEBUANO_ENGLISH_MEETING.participants);
    setRawText(SAMPLE_CEBUANO_ENGLISH_MEETING.rawText);
    setErrorBanner(null);
  };

  const clearForm = () => {
    if (rawText && !window.confirm("Clear all meeting notes and fields?")) {
      return;
    }
    setTitle("");
    setOrganization("");
    setMeetingDate(new Date().toISOString().slice(0, 10));
    setDateUnknown(false);
    setParticipants("");
    setRawText("");
    setErrorBanner(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseUploadedFileContent(file.name, content);
      if (parsed.success && parsed.text) {
        setRawText(parsed.text);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
        setErrorBanner(null);
      } else {
        setErrorBanner(parsed.error || "Failed to read file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorBanner("Please provide a meeting title.");
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 10) {
      setErrorBanner("Please paste at least 10 characters of meeting notes or transcript.");
      return;
    }

    setLoading(true);
    setErrorBanner(null);
    setErrorDetails(null);

    // Staged processing pipeline simulation for real feedback
    setLoadingStage("Preparing notes and checking language tokens...");

    const stageTimer1 = setTimeout(() => {
      setLoadingStage("Extracting commitments, negations, and decisions with local AI...");
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setLoadingStage("Verifying verbatim source evidence and calculating offsets...");
    }, 2800);

    const stageTimer3 = setTimeout(() => {
      setLoadingStage("Resolving bilingual relative deadlines and organizing results...");
    }, 4200);

    try {
      const res = await fetch("/api/meetings/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          organization,
          meetingDate: dateUnknown ? undefined : meetingDate,
          dateUnknown,
          timezone,
          participants,
          rawText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Extraction failed.");
      }

      onExtractionComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorBanner(err.message || "Failed to process meeting notes.");
      if (err.message?.includes("Ollama") || err.message?.includes("unreachable")) {
        setErrorDetails(
          "Ollama must be running on your machine. Start it with `ollama serve` and pull the model with `ollama pull qwen3:4b-instruct` (or `ollama pull qwen2.5:3b`)."
        );
      }
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      setLoading(false);
      setLoadingStage("");
    }
  };

  const charCount = rawText.length;
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 space-y-6">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Meeting Intake & Transcript</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-light text-accent-teal border border-accent-teal/20">
              Bilingual (EN / Cebuano)
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Paste raw notes or upload a transcript. AI extracts actions with verbatim evidence.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-light text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Load Sample Meeting
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 border border-border transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-danger-light border border-danger/30 text-danger flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorBanner}</p>
            {errorDetails && <p className="text-xs text-danger/90">{errorDetails}</p>}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Title and Organization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Meeting Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Sprint & Hackathon Planning"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-medium transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Organization / Team
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g., SWUdevs, Student Council, Barangay Youth"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
            />
          </div>
        </div>

        {/* Row 2: Date, Timezone, and Participants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Meeting Date
              </label>
              <label className="text-[11px] text-muted-foreground flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dateUnknown}
                  onChange={(e) => setDateUnknown(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                />
                Date Unknown
              </label>
            </div>
            <input
              type="date"
              disabled={dateUnknown}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm disabled:opacity-50 disabled:bg-slate-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
            >
              <option value="Asia/Manila">Asia/Manila (PHT, UTC+8)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST, UTC+9)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Participants (Optional)
            </label>
            <input
              type="text"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="e.g. Maria, Mark, Carlo, Kath"
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
            />
          </div>
        </div>

        {/* Notes Textarea & Drag and Drop File Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Meeting Notes or Transcript <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-3">
              {autosaveStatus && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-primary" />
                  {autosaveStatus}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words
              </span>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw meeting notes, Discord/Slack discussions, or bullet points here...
Example:
- Si Ana sa poster. Ay wait, si Mark na lang diay tiwas sa poster ugma sa hapon.
- Dili na ta mag-order ug physical shirts kay kuwang ang budget.
- Wala pa tay assigned sa food sponsors outreach..."
              className="w-full p-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm leading-relaxed font-mono transition-all resize-y"
            />

            {/* Quick upload button inside corner */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card/90 border border-border text-foreground hover:bg-slate-100 shadow-sm transition-colors"
                title="Upload .txt, .md, or .csv transcript file"
              >
                <Upload className="w-3.5 h-3.5 text-accent-teal" />
                Upload File (.txt, .md, .csv)
              </button>
            </div>
          </div>
        </div>

        {/* Submit & Processing UI */}
        <div className="pt-2">
          {loading ? (
            <div className="p-4 rounded-xl bg-accent-light border border-accent-teal/30 space-y-2">
              <div className="flex items-center gap-3 text-accent-teal font-semibold text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing Meeting with Local AI...</span>
              </div>
              <p className="text-xs text-slate-700 pl-8">
                {loadingStage || "Analyzing transcript..."}
              </p>
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analyze with Local AI & Extract Actions</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
