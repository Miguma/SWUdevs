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
  Loader2,
  FileUp,
} from "lucide-react";
import { MeetingExtraction, ActionItem } from "@/types/meeting";
import { SAMPLE_CEBUANO_ENGLISH_MEETING } from "./SampleMeetingData";
import { parseUploadedFileContent } from "@/server/services/transcript-preprocessor";
import { saveDraftNotes, getDraftNotes } from "@/lib/storage/indexeddb";

interface MeetingIntakeProps {
  onExtractionComplete: (extraction: MeetingExtraction) => void;
  initialMeeting?: MeetingExtraction | null;
}

export function MeetingIntake({
  onExtractionComplete,
  initialMeeting,
}: MeetingIntakeProps) {
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
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from initialMeeting (when coming from "Edit Notes") OR from saved draft
  useEffect(() => {
    if (initialMeeting) {
      setTitle(initialMeeting.title || "");
      setOrganization(initialMeeting.organization || "");
      setMeetingDate(initialMeeting.meetingDate || new Date().toISOString().slice(0, 10));
      setDateUnknown(!initialMeeting.meetingDate);
      setTimezone(initialMeeting.timezone || "Asia/Manila");
      setRawText(initialMeeting.rawTranscript || "");
      setAutosaveStatus(`Loaded original notes from "${initialMeeting.title}"`);
      setTimeout(() => setAutosaveStatus(null), 3000);
      return;
    }

    // Otherwise, load general draft
    getDraftNotes().then((draft) => {
      if (draft && draft.rawText) {
        setTitle(draft.title || "");
        setOrganization(draft.organization || "");
        setMeetingDate(draft.meetingDate || new Date().toISOString().slice(0, 10));
        setDateUnknown(draft.dateUnknown || false);
        setTimezone(draft.timezone || "Asia/Manila");
        setParticipants(draft.participants || "");
        setRawText(draft.rawText || "");
        setAutosaveStatus("Restored unsaved draft from local storage");
        setTimeout(() => setAutosaveStatus(null), 3000);
      }
    });
  }, [initialMeeting]);

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
    }, 1200);
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
    if (rawText && !window.confirm("Clear all meeting notes and form fields?")) {
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

  const processFile = (file: File) => {
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
        setErrorBanner(parsed.error || "Failed to parse file content.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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

      // Preserve previously approved edits if re-analyzing an existing meeting
      if (initialMeeting && initialMeeting.actionItems.length > 0) {
        const approvedPrevious = initialMeeting.actionItems.filter(
          (t) => t.reviewStatus === "approved"
        );
        if (approvedPrevious.length > 0) {
          // Merge: keep previously approved user tasks prioritized
          const freshExtracted = data.actionItems.filter(
            (fresh: ActionItem) =>
              !approvedPrevious.some(
                (prev) => prev.title.toLowerCase() === fresh.title.toLowerCase()
              )
          );
          data.actionItems = [...approvedPrevious, ...freshExtracted];
        }
      }

      onExtractionComplete(data);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorBanner(err.message || "Failed to process meeting notes.");
      if (err.message?.includes("Ollama") || err.message?.includes("unreachable")) {
        setErrorDetails(
          "Ensure Ollama is running locally (`ollama serve`) and the configured model is installed (`ollama pull qwen3:4b-instruct`)."
        );
      }
    } finally {
      setLoading(false);
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
            Paste raw notes or drag-and-drop a transcript file. AI extracts action items with source evidence.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-light text-primary hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Meeting</span>
          </button>
          <button
            type="button"
            onClick={clearForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 border border-border transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorBanner && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-danger-light border border-danger/30 text-danger flex items-start gap-3 text-sm animate-in fade-in"
        >
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
            <label
              htmlFor="meeting-title"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Meeting Title <span className="text-danger">*</span>
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Committee Sync & Hackathon Roles"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="meeting-org"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Organization / Team Name
            </label>
            <input
              id="meeting-org"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="e.g. SWUdevs, Student Council, Barangay Youth"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all"
            />
          </div>
        </div>

        {/* Row 2: Date, Timezone, and Participants */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="meeting-date"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
              >
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
                <span>Date Unknown</span>
              </label>
            </div>
            <input
              id="meeting-date"
              type="date"
              disabled={dateUnknown}
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm disabled:opacity-50 disabled:bg-slate-100 transition-all"
            />
          </div>

          <div>
            <label
              htmlFor="meeting-timezone"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              Timezone
            </label>
            <select
              id="meeting-timezone"
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
            <label
              htmlFor="meeting-participants"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" />
              Attendees (Optional)
            </label>
            <input
              id="meeting-participants"
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
            <label
              htmlFor="meeting-notes"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
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
              <span className="text-xs text-muted-foreground font-mono">
                {charCount.toLocaleString()} chars · {wordCount.toLocaleString()} words
              </span>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl border transition-all ${
              isDragging
                ? "border-primary ring-2 ring-primary/20 bg-primary-light/20"
                : "border-border bg-background"
            }`}
          >
            <textarea
              id="meeting-notes"
              rows={12}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw notes, chat transcripts (Discord / Slack / Teams), or bullet points here...
Drag & drop .txt, .md, or .csv transcript files directly into this box.

Example:
- Si Ana sa poster. Ay wait, si Mark na lang diay tiwas sa poster ugma sa hapon.
- Dili na ta mag-order ug physical hoodies kay kulang ang budget.
- Wala pa tay assigned sa food sponsors outreach..."
              className="w-full p-4 rounded-xl border-none bg-transparent focus:outline-none text-sm leading-relaxed font-mono resize-y"
            />

            {/* Quick upload button & drag overlay */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card/90 border border-border text-foreground hover:bg-slate-100 shadow-sm transition-colors cursor-pointer"
                title="Upload .txt, .md, or .csv transcript file"
              >
                <Upload className="w-3.5 h-3.5 text-accent-teal" />
                <span>Upload File</span>
              </button>
            </div>

            {isDragging && (
              <div className="absolute inset-0 bg-primary-light/80 backdrop-blur-xs rounded-xl flex items-center justify-center border-2 border-dashed border-primary">
                <div className="text-center space-y-1 text-primary">
                  <FileUp className="w-8 h-8 mx-auto" />
                  <p className="font-semibold text-sm">Drop transcript file here (.txt, .md, .csv)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit & Processing UI */}
        <div className="pt-2">
          {loading ? (
            <div className="p-4 rounded-xl bg-accent-light/60 border border-accent-teal/30 space-y-1.5">
              <div className="flex items-center gap-3 text-accent-teal font-semibold text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Extracting Action Items with Local AI...</span>
              </div>
              <p className="text-xs text-slate-600 pl-8">
                Inference running via Ollama (`qwen3:4b-instruct`). Source evidence quotes are being verified against raw notes.
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
