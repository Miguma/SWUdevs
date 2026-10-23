"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Loader2,
  FileUp,
  X,
  Plus,
  FileText,
} from "@/components/icons";
import { InlineNotice } from "@/components/InlineNotice";
import { DatePicker } from "@/components/DatePicker";
import { MeetingExtraction } from "@/types/meeting";
import {
  SAMPLE_CEBUANO_ENGLISH_MEETING,
  INITIAL_SAMPLE_EXTRACTION,
} from "./SampleMeetingData";
import { parseUploadedFileContent } from "@/server/services/transcript-preprocessor";
import { reconcileMeeting } from "@/lib/meeting-workflow";
import { saveDraftNotes, getDraftNotes } from "@/lib/storage/indexeddb";
import type { GroqHealthStatus } from "@/server/services/groq-client";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Manila", label: "Philippines (GMT+8)" },
  { value: "UTC", label: "UTC (GMT+0)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
  { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
] as const;

interface MeetingIntakeProps {
  onExtractionComplete: (extraction: MeetingExtraction) => void;
  onLoadSampleMeeting?: (sampleExtraction: MeetingExtraction) => void;
  onDraftStateChange?: (hasContent: boolean) => void;
  initialMeeting?: MeetingExtraction | null;
  newDraftId?: string;
}

export function MeetingIntake({
  onExtractionComplete,
  onLoadSampleMeeting,
  onDraftStateChange,
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

  const [draftHydrated, setDraftHydrated] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [timezoneOpen, setTimezoneOpen] = useState(false);
  const [timezoneVisible, setTimezoneVisible] = useState(false);
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);
  const [tabContentHeight, setTabContentHeight] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsContentRef = useRef<HTMLDivElement>(null);
  const timezoneWrapperRef = useRef<HTMLDivElement>(null);
  const timezoneTriggerRef = useRef<HTMLButtonElement>(null);
  const timezoneMenuRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const modeTransitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    try {
      const response = await fetch("/api/ai/health", { cache: "no-store" });
      if (!response.ok) {
        setAiStatus(null);
        return;
      }
      const status: GroqHealthStatus = await response.json();
      setAiStatus(status);
    } catch {
      setAiStatus(null);
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

  useEffect(() => {
    const node = detailsContentRef.current;
    if (node) node.inert = !detailsOpen;
  }, [detailsOpen]);

  useEffect(() => {
    if (!detailsOpen) setTimezoneOpen(false);
  }, [detailsOpen]);

  useEffect(() => {
    if (timezoneOpen) {
      setTimezoneVisible(true);
      return;
    }
    if (!timezoneVisible) return;
    const timer = setTimeout(() => setTimezoneVisible(false), 220);
    return () => clearTimeout(timer);
  }, [timezoneOpen, timezoneVisible]);

  useEffect(() => {
    if (!timezoneOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!timezoneWrapperRef.current?.contains(event.target as Node)) {
        setTimezoneOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTimezoneOpen(false);
        timezoneTriggerRef.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [timezoneOpen]);

  useEffect(() => {
    if (!timezoneOpen) return;
    const menu = timezoneMenuRef.current;
    if (!menu) return;
    const target =
      menu.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]') ??
      menu.querySelector<HTMLButtonElement>('[role="option"]');
    target?.focus({ preventScroll: true });
  }, [timezoneOpen]);

  useEffect(() => {
    const element = tabContentRef.current;
    if (!element) return;

    const updateHeight = () => {
      setTabContentHeight(element.getBoundingClientRect().height);
    };

    updateHeight();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (modeTransitionTimer.current) {
      clearTimeout(modeTransitionTimer.current);
    }
  }, []);

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

  const processFile = async (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext === "pdf") {
      setIsParsingFile(true);
      setErrorBanner(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/transcript/parse", {
          method: "POST",
          body: formData,
        });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // In case of HTML error page from server or proxy
        }
        if (!res.ok || !data?.success) {
          setErrorBanner(data?.error || "We couldn't read that PDF. Please try again.");
          return;
        }
        setRawText(data.text);
        if (!title) {
          setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
        }
        setErrorBanner(null);
      } catch (err: any) {
        setErrorBanner(err?.message || "We couldn't read that file. Please try again.");
      } finally {
        setIsParsingFile(false);
      }
      return;
    }

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
        setErrorBanner(parsed.error || "We couldn't read that file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
      e.target.value = "";
    }
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
      setErrorBanner("Give your meeting a name to continue.");
      return;
    }
    if (!rawText.trim() || rawText.trim().length < 10) {
      setErrorBanner(
        "Add a bit more of your notes (at least 10 characters) and try again."
      );
      return;
    }
    if (!cloudConsent) {
      setErrorBanner(
        "Tick the box to confirm these notes can be sent to Groq for analysis."
      );
      return;
    }
    const selectedModel = aiStatus?.model;
    if (!aiStatus?.modelAvailable) {
      setErrorBanner(aiStatus?.error || "The AI helper is not available right now. Please try again soon.");
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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Dev server or reverse proxy returned non-JSON (e.g. HTML 500 error page)
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
          data?.error ||
          `Something went wrong while drafting your plan. Please try again.`
        );
      }

      if (!data) {
        throw new Error("Received an invalid response from the server. Please try again.");
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
  const selectedTimezoneLabel =
    TIMEZONE_OPTIONS.find((option) => option.value === timezone)?.label ?? timezone;

  const handleTimezoneSelect = (value: string) => {
    setTimezone(value);
    setTimezoneOpen(false);
    timezoneTriggerRef.current?.focus({ preventScroll: true });
  };

  const handleTimezoneMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    const menu = timezoneMenuRef.current;
    if (!menu) return;
    const options = Array.from(
      menu.querySelectorAll<HTMLButtonElement>('[role="option"]')
    );
    if (options.length === 0) return;

    event.preventDefault();
    const currentIndex = options.indexOf(
      document.activeElement as HTMLButtonElement
    );
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex < 0
          ? options.length - 1
          : (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else {
      nextIndex = options.length - 1;
    }
    options[nextIndex]?.focus({ preventScroll: true });
  };

  const [inputMode, setInputMode] = useState<"text" | "file" | "sample">("text");

  const handleInputModeChange = (mode: typeof inputMode) => {
    if (mode === inputMode) return;

    setInputMode(mode);
    setIsModeTransitioning(true);

    if (modeTransitionTimer.current) {
      clearTimeout(modeTransitionTimer.current);
    }
    modeTransitionTimer.current = setTimeout(() => {
      setIsModeTransitioning(false);
      modeTransitionTimer.current = null;
    }, 320);
  };

  const hasDraftContent =
    title.trim().length > 0 ||
    organization.trim().length > 0 ||
    meetingDate.trim().length > 0 ||
    dateUnknown ||
    participants.trim().length > 0 ||
    rawText.trim().length > 0 ||
    newParticipant.trim().length > 0 ||
    isAddingParticipant ||
    inputMode !== "text" ||
    timezone !== SAMPLE_CEBUANO_ENGLISH_MEETING.timezone;

  useEffect(() => {
    onDraftStateChange?.(hasDraftContent);
  }, [hasDraftContent, onDraftStateChange]);

  return (
    <div className="workspace-panel overflow-hidden rounded-2xl border border-border bg-card">
      <div className="px-4 pt-5 sm:px-6 sm:pt-6">
        <h2 className="font-brand text-base font-semibold leading-tight tracking-[-0.01em] text-foreground">
          Meeting notes
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Give the meeting a name, drop in your notes, and we&apos;ll draft a plan.
        </p>
      </div>

      <InlineNotice
        message={errorBanner}
        className="px-4 pt-4 sm:px-6"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 px-4 py-5 sm:px-6">
          <div>
            <label
              htmlFor="meeting-title"
              className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
            >
              Meeting title
            </label>
            <input
              id="meeting-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Community Outreach Planning"
              required
              className="ui-input"
            />
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                const next = !detailsOpen;
                setDetailsOpen(next);
                if (!next) {
                  setTimezoneOpen(false);
                  setTimezoneVisible(false);
                }
              }}
              aria-expanded={detailsOpen}
              aria-controls="meeting-details-content"
              className="tap-44 flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm text-left text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <span>
                Meeting details{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </span>
              <span
                aria-hidden="true"
                className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center text-muted-foreground"
              >
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 motion-reduce:transition-none ${
                    detailsOpen ? "opacity-0" : "opacity-100"
                  }`}
                >
                  +
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 motion-reduce:transition-none ${
                    detailsOpen ? "opacity-100" : "opacity-0"
                  }`}
                >
                  −
                </span>
              </span>
            </button>
            <div
              id="meeting-details-content"
              ref={detailsContentRef}
              aria-hidden={detailsOpen ? undefined : true}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                detailsOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className={`min-h-0 space-y-3 pt-4 ${timezoneVisible ? "overflow-visible" : "overflow-hidden"}`}>
                <div>
                  <label
                    htmlFor="meeting-org"
                    className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
                  >
                    Organization / Team
                  </label>
                  <input
                    id="meeting-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="Tambayayong"
                    className="ui-input"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <label
                        htmlFor="meeting-date"
                        className="text-[11px] font-medium text-muted-foreground"
                      >
                        Date
                      </label>
                      <label className="tap-44 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={dateUnknown}
                          onChange={(event) => setDateUnknown(event.target.checked)}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        Date unknown
                      </label>
                    </div>
                    <DatePicker
                      id="meeting-date"
                      value={meetingDate}
                      onChange={setMeetingDate}
                      disabled={dateUnknown}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="meeting-timezone"
                      className="mb-1.5 block text-[11px] font-medium text-muted-foreground"
                    >
                      Timezone
                    </label>
                    <div
                      ref={timezoneWrapperRef}
                      className="relative"
                      onBlur={(event) => {
                        if (
                          timezoneOpen &&
                          !event.currentTarget.contains(
                            event.relatedTarget as Node
                          )
                        ) {
                          setTimezoneOpen(false);
                        }
                      }}
                    >
                      <button
                        ref={timezoneTriggerRef}
                        type="button"
                        id="meeting-timezone"
                        aria-haspopup="listbox"
                        aria-expanded={timezoneOpen}
                        aria-controls="meeting-timezone-menu"
                        onClick={() => {
                          setTimezoneVisible(true);
                          setTimezoneOpen((open) => !open);
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "ArrowDown" ||
                            event.key === "ArrowUp"
                          ) {
                            event.preventDefault();
                            setTimezoneVisible(true);
                            setTimezoneOpen(true);
                          }
                        }}
                        className="ui-input flex cursor-pointer items-center justify-between gap-2 text-left"
                      >
                        <span className="min-w-0 truncate">
                          {selectedTimezoneLabel}
                        </span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                            timezoneOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <div
                        ref={timezoneMenuRef}
                        id="meeting-timezone-menu"
                        role="listbox"
                        aria-label="Timezone"
                        aria-hidden={timezoneOpen ? undefined : true}
                        onKeyDown={handleTimezoneMenuKeyDown}
                        className={`absolute inset-x-0 top-full z-30 mt-1.5 origin-top overflow-hidden rounded-lg border bg-card transition-[max-height,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                          timezoneOpen
                            ? "max-h-72 translate-y-0 border-border opacity-100"
                            : "pointer-events-none max-h-0 -translate-y-1 border-transparent opacity-0"
                        }`}
                      >
                        <div className="p-1">
                          {TIMEZONE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              role="option"
                              aria-selected={timezone === option.value}
                              tabIndex={timezoneOpen ? 0 : -1}
                              onClick={() => handleTimezoneSelect(option.value)}
                              className={`tap-44 flex w-full items-center rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none ${
                                timezone === option.value
                                  ? "font-medium text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">
                    Participants{" "}
                    <span className="font-normal">(optional)</span>
                  </label>
                  <div className="flex min-h-9 flex-wrap items-center gap-x-1.5 gap-y-1 rounded-lg border border-border bg-card px-2.5 py-1.5">
                    {participantList.map((person, index) => (
                      <React.Fragment key={person}>
                        {index > 0 && (
                          <span
                            aria-hidden="true"
                            className="text-muted-foreground/40"
                          >
                            ·
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5 text-xs text-foreground">
                          <span>{person}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(person)}
                            className="tap-icon cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`Remove ${person}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      </React.Fragment>
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
                        className="min-h-11 w-24 bg-transparent px-1 py-0.5 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none sm:min-h-0 sm:text-xs"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingParticipant(true)}
                        className="tap-44-inline inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border px-5 py-5 sm:px-6">
          <div
            className="flex items-end gap-0 border-b border-border sm:gap-6"
            role="group"
            aria-label="Choose input"
          >
            {([
              { id: "text", label: "Text" },
              { id: "file", label: "File" },
              { id: "sample", label: "Sample" },
            ] as const).map(({ id, label }) => {
              const active = inputMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleInputModeChange(id)}
                  aria-pressed={active}
                  className={`tap-44-inline flex-1 -mb-px cursor-pointer border-b-2 pb-2 text-[13px] transition-colors sm:flex-none ${
                    active
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div
            className={`overflow-hidden motion-reduce:transition-none ${
              isModeTransitioning
                ? "transition-[height] duration-300 ease-out"
                : ""
            }`}
            style={{ height: tabContentHeight ?? undefined }}
          >
            <div ref={tabContentRef} className="flow-root pb-1 pt-4">
              {inputMode === "text" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="meeting-notes"
                      className="text-[11px] font-medium text-muted-foreground"
                    >
                      Meeting notes / transcript
                    </label>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {charCount.toLocaleString()} characters
                    </span>
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative"
                  >
                    <textarea
                      id="meeting-notes"
                      rows={8}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste your meeting notes or transcript here..."
                      className="ui-input min-h-[180px] resize-y text-[13px] leading-relaxed"
                    />
                    {isDragging && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-card">
                        <div className="space-y-1 text-center text-primary">
                          <FileUp className="mx-auto h-5 w-5" />
                          <p className="text-xs font-medium">
                            Drop your file here (PDF, TXT, MD, CSV)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inputMode === "file" && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                    isDragging
                      ? "border-primary bg-card"
                      : "border-border bg-card"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <FileUp
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-foreground">
                    {isDragging
                      ? "Drop your file"
                      : "Drag & drop or select a file"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    PDF, TXT, MD, or CSV
                  </p>
                  <button
                    type="button"
                    disabled={isParsingFile}
                    onClick={() => fileInputRef.current?.click()}
                    className="tap-44 mt-1 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    {isParsingFile && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    <span>
                      {isParsingFile ? "Reading your file..." : "Choose file"}
                    </span>
                  </button>
                </div>
              )}

              {inputMode === "sample" && (
                <div className="py-8 text-center">
                  <p className="mx-auto max-w-md text-xs leading-relaxed text-muted-foreground">
                    Not sure where to start? Load a short sample meeting and see
                    how it becomes a reviewed plan.
                  </p>
                  <button
                    type="button"
                    onClick={loadSample}
                    className="tap-44 mt-3 inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-primary/40 bg-primary-light/50 px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-light"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Load sample meeting</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-start gap-2 text-xs leading-5 text-foreground">
              <input
                type="checkbox"
                checked={cloudConsent}
                onChange={(event) => setCloudConsent(event.target.checked)}
                className="mt-1 accent-primary"
              />
              <span>
                It&apos;s okay to send my notes to Groq to draft my plan.
              </span>
            </label>
            {loading ? (
              <div className="inline-flex min-h-11 w-full cursor-default items-center justify-center gap-2 rounded-lg bg-muted px-5 py-2.5 text-xs font-semibold text-muted-foreground sm:w-auto">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Drafting your plan...</span>
              </div>
            ) : (
              <button
                type="submit"
                className="ui-button-primary w-full sm:w-auto"
              >
                <span>Draft my action plan</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
