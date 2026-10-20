"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Calendar,
  Globe,
  Users,
  AlertCircle,
  Loader2,
  FileUp,
  Paperclip,
  ArrowRight,
  X,
  Plus,
  FileText,
  RefreshCw,
} from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import {
  SAMPLE_CEBUANO_ENGLISH_MEETING,
  INITIAL_SAMPLE_EXTRACTION,
} from "./SampleMeetingData";
import { parseUploadedFileContent } from "@/server/services/transcript-preprocessor";
import { reconcileMeeting } from "@/lib/meeting-workflow";
import { saveDraftNotes, getDraftNotes } from "@/lib/storage/indexeddb";
import type { GroqHealthStatus } from "@/server/services/groq-client";

interface MeetingIntakeProps {
  onExtractionComplete: (extraction: MeetingExtraction) => void;
  onLoadSampleMeeting?: (sampleExtraction: MeetingExtraction) => void;
  initialMeeting?: MeetingExtraction | null;
  newDraftId?: string;
}

export function MeetingIntake({
  onExtractionComplete,
  onLoadSampleMeeting,
  initialMeeting,
  newDraftId = "current_draft",
}: MeetingIntakeProps) {
  const [title, setTitle] = useState(initialMeeting?.title || "");
  const [organization, setOrganization] = useState(initialMeeting?.organization || "");
  const [meetingDate, setMeetingDate] = useState(initialMeeting?.meetingDate || "");
  const [dateUnknown, setDateUnknown] = useState(false);
  const [timezone, setTimezone] = useState(
    SAMPLE_CEBUANO_ENGLISH_MEETING.timezone
  );
  const [participants, setParticipants] = useState(initialMeeting?.participants || "");
  const [newParticipant, setNewParticipant] = useState("");
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [rawText, setRawText] = useState(initialMeeting?.rawTranscript || "");
  const [cloudConsent, setCloudConsent] = useState(false);
  const [aiStatus, setAiStatus] = useState<GroqHealthStatus | null>(null);
  const [checkingModels, setCheckingModels] = useState(true);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestDraft = useRef({
    title, organization, meetingDate, dateUnknown, timezone, participants, rawText,
    meetingId: initialMeeting?.id,
    newDraftId,
    hydrated: draftHydrated,
  });
  latestDraft.current = {
    title, organization, meetingDate, dateUnknown, timezone, participants, rawText,
    meetingId: initialMeeting?.id,
    newDraftId,
    hydrated: draftHydrated,
  };

  useEffect(() => () => {
    const draft = latestDraft.current;
    if (!draft.hydrated || draft.meetingId === INITIAL_SAMPLE_EXTRACTION.id || (!draft.title && !draft.rawText)) return;
    void saveDraftNotes({
      title: draft.title,
      organization: draft.organization,
      meetingDate: draft.meetingDate,
      dateUnknown: draft.dateUnknown,
      timezone: draft.timezone,
      participants: draft.participants,
      rawText: draft.rawText,
    }, draft.meetingId, draft.newDraftId).catch(() => undefined);
  }, []);

  const refreshModel = async () => {
    setCheckingModels(true);
    try {
      const response = await fetch("/api/ai/health", { cache: "no-store" });
      const status: GroqHealthStatus = await response.json();
      setAiStatus(status);
    } catch {
      setAiStatus(null);
    } finally {
      setCheckingModels(false);
    }
  };

  useEffect(() => {
    void refreshModel();
  }, []);

  useEffect(() => {
    const meetingId = initialMeeting?.id;
    if (meetingId === INITIAL_SAMPLE_EXTRACTION.id) {
      setDraftHydrated(true);
      return;
    }
    let active = true;
    getDraftNotes(meetingId, newDraftId)
      .then((draft) => {
        if (!active) return;
        if (draft && (draft.rawText || draft.title)) {
          setTitle(draft.title || "");
          setOrganization(draft.organization || "");
          setMeetingDate(
            draft.meetingDate || ""
          );
          setDateUnknown(draft.dateUnknown || false);
          setTimezone(draft.timezone || "Asia/Manila");
          setParticipants(draft.participants || "");
          setRawText(draft.rawText || "");
          return;
        }
        if (initialMeeting) {
          setTitle(initialMeeting.title || "");
          setOrganization(initialMeeting.organization || "");
          setMeetingDate(
            initialMeeting.meetingDate || ""
          );
          setDateUnknown(!initialMeeting.meetingDate);
          setTimezone(initialMeeting.timezone || "Asia/Manila");
          setParticipants(initialMeeting.participants || "");
          setRawText(initialMeeting.rawTranscript || "");
        }
      })
      .catch(() => undefined)
      .finally(() => { if (active) setDraftHydrated(true); });
    return () => { active = false; };
  }, [initialMeeting, newDraftId]);

  useEffect(() => {
    if (!draftHydrated || initialMeeting?.id === INITIAL_SAMPLE_EXTRACTION.id || (!rawText && !title)) return;
    const timer = setTimeout(() => {
      saveDraftNotes(
        {
          title,
          organization,
          meetingDate,
          dateUnknown,
          timezone,
          participants,
          rawText,
        },
        initialMeeting?.id,
        newDraftId
      ).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    title,
    organization,
    meetingDate,
    dateUnknown,
    timezone,
    participants,
    rawText,
    initialMeeting?.id,
    newDraftId,
    draftHydrated,
  ]);

  const participantList = participants
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const handleRemoveParticipant = (nameToRemove: string) => {
    const updated = participantList
      .filter((p) => p !== nameToRemove)
      .join(", ");
    setParticipants(updated);
  };

  const handleAddParticipantCommit = () => {
    const trimmed = newParticipant.trim();
    if (trimmed && !participantList.includes(trimmed)) {
      const updated = [...participantList, trimmed].join(", ");
      setParticipants(updated);
    }
    setNewParticipant("");
    setIsAddingParticipant(false);
  };

  const loadSample = () => {
    if (onLoadSampleMeeting) {
      onLoadSampleMeeting(INITIAL_SAMPLE_EXTRACTION);
      return;
    }
    setTitle(SAMPLE_CEBUANO_ENGLISH_MEETING.title);
    setOrganization(SAMPLE_CEBUANO_ENGLISH_MEETING.organization);
    setMeetingDate(SAMPLE_CEBUANO_ENGLISH_MEETING.meetingDate);
    setDateUnknown(false);
    setTimezone(SAMPLE_CEBUANO_ENGLISH_MEETING.timezone);
    setParticipants(SAMPLE_CEBUANO_ENGLISH_MEETING.participants);
    setRawText(SAMPLE_CEBUANO_ENGLISH_MEETING.rawText);
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
      setErrorBanner(
        "Please paste at least 10 characters of meeting notes or transcript."
      );
      return;
    }
    const selectedModel = aiStatus?.model;
    if (!aiStatus?.modelAvailable) {
      setErrorBanner(aiStatus?.error || "The open-weight cloud model is unavailable. Refresh its status.");
      return;
    }
    if (!cloudConsent) {
      setErrorBanner("Confirm that these notes may be sent to Groq for analysis.");
      return;
    }

    setLoading(true);
    setErrorBanner(null);

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
          model: selectedModel,
          provider: "groq",
          cloudConsent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Extraction failed.");
      }

      const finalExtraction =
        initialMeeting && initialMeeting.id !== INITIAL_SAMPLE_EXTRACTION.id
          ? reconcileMeeting(initialMeeting, data)
          : data;

      onExtractionComplete(finalExtraction);
    } catch (err: any) {
      console.error("Extraction error:", err);
      setErrorBanner(err.message || "Failed to process meeting notes.");
    } finally {
      setLoading(false);
    }
  };

  const charCount = rawText.length;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-xs p-5 sm:p-6 space-y-4">
      {/* Step 1 Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-tight">
              Meeting notes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Paste your notes, or explore the example.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSample}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-card hover:bg-slate-50 text-foreground border border-border transition-colors cursor-pointer shadow-2xs flex-shrink-0"
        >
          <FileText className="w-3.5 h-3.5 text-primary" />
          <span>Explore example</span>
        </button>
      </div>

      {/* Error alert banner */}
      {errorBanner && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-danger-light border border-danger/30 text-danger flex items-start gap-2.5 text-xs"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">{errorBanner}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Meeting Title */}
        <div>
          <label
            htmlFor="meeting-title"
            className="block text-xs font-semibold text-foreground mb-1"
          >
            Meeting title <span className="text-primary">*</span>
          </label>
          <input
            id="meeting-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Community Outreach Planning"
            required
            className="w-full px-3.5 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary text-xs sm:text-sm text-foreground transition-all"
          />
        </div>

        {/* Organization / Team */}
        <div>
          <label
            htmlFor="meeting-org"
            className="block text-xs font-semibold text-foreground mb-1"
          >
            Organization / Team
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-primary/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="meeting-org"
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Tambayayong"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary text-xs sm:text-sm text-foreground transition-all"
            />
          </div>
        </div>

        {/* Date & Timezone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="meeting-date"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-primary/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="meeting-date"
                type="date"
                disabled={dateUnknown}
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary text-xs sm:text-sm text-foreground disabled:opacity-50 disabled:bg-slate-50 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="meeting-timezone"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Timezone
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-primary/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="meeting-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary text-xs sm:text-sm text-foreground transition-all"
              >
                <option value="Asia/Manila">Philippines (GMT+8)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">New York (EST/EDT)</option>
                <option value="America/Los_Angeles">
                  Los Angeles (PST/PDT)
                </option>
                <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                <option value="Asia/Singapore">Singapore (GMT+8)</option>
              </select>
            </div>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={dateUnknown}
            onChange={(event) => setDateUnknown(event.target.checked)}
            className="h-3.5 w-3.5 accent-primary"
          />
          Meeting date unknown
        </label>

        {/* Participants Pill Input */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Participants{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <div className="min-h-[38px] px-2.5 py-1.5 rounded-xl border border-border bg-card flex flex-wrap items-center gap-1.5">
            {participantList.map((person) => (
              <span
                key={person}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-foreground border border-border/80"
              >
                <span>{person}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveParticipant(person)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={`Remove ${person}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {isAddingParticipant ? (
              <input
                type="text"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onBlur={handleAddParticipantCommit}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddParticipantCommit();
                  } else if (e.key === "Escape") {
                    setNewParticipant("");
                    setIsAddingParticipant(false);
                  }
                }}
                placeholder="Name..."
                autoFocus
                className="px-2 py-0.5 text-xs bg-transparent focus:outline-none w-20"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingParticipant(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-primary bg-primary-light/60 hover:bg-primary-light transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Meeting Notes / Transcript */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label
              htmlFor="meeting-notes"
              className="text-xs font-semibold text-foreground"
            >
              Meeting notes / transcript <span className="text-primary">*</span>
            </label>
            <span className="text-[11px] text-muted-foreground">
              {charCount.toLocaleString()} characters
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-xl border transition-all ${
              isDragging
                ? "border-primary ring-2 ring-primary/20 bg-primary-light/20"
                : "border-border bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
            }`}
          >
            <textarea
              id="meeting-notes"
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste your meeting notes or transcript here..."
              className="w-full p-3.5 rounded-xl border-none bg-transparent focus:outline-none text-xs sm:text-[13px] leading-relaxed text-foreground resize-y"
            />

            {isDragging && (
              <div className="absolute inset-0 bg-primary-light/90 backdrop-blur-xs rounded-xl flex items-center justify-center border-2 border-dashed border-primary">
                <div className="text-center space-y-1 text-primary">
                  <FileUp className="w-6 h-6 mx-auto" />
                  <p className="font-semibold text-xs">
                    Drop transcript file (.txt, .md, .csv)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-primary bg-primary-light/30 p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Open-weight cloud AI</p>
              <p className="text-xs text-muted-foreground">Qwen 3.8 27B via Groq's free tier.</p>
            </div>
            <button
              type="button"
              onClick={() => void refreshModel()}
              disabled={checkingModels}
              aria-busy={checkingModels}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary-light"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${checkingModels ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh status
            </button>
          </div>
          <p className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium">{aiStatus?.model || "qwen/qwen3.8-27b"} · Groq</p>
          <p className="text-xs leading-5 text-muted-foreground" role="status" aria-live="polite">
            {checkingModels
              ? "Checking the cloud model…"
              : aiStatus?.modelAvailable
                ? "The pinned model is available. Groq's free-tier limits apply when you analyze."
                : aiStatus?.error || "Cloud AI is unavailable. Refresh its status."}
          </p>
          <label className="flex items-start gap-2 text-xs leading-5 text-foreground">
            <input type="checkbox" checked={cloudConsent} onChange={(event) => setCloudConsent(event.target.checked)} className="mt-1 accent-primary" />
            <span>I understand these notes will be sent to Groq for analysis.</span>
          </label>
        </div>
        {/* Bottom Bar: Upload link + Analyze CTA */}
        <div className="pt-1 space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
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
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline cursor-pointer"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Upload .txt, .md, or .csv</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  (optional)
                </span>
              </button>
            </div>

            {loading ? (
              <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing with Cloud AI...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analyze with Cloud AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground sm:text-right">
            Cloud analysis sends these notes to Groq. Free-tier rate limits apply.
          </p>
        </div>
      </form>
    </div>
  );
}
