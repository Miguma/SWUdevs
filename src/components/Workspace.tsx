"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  Edit2,
  History,
  Plus,
} from "@/components/icons";
import { InlineNotice } from "@/components/InlineNotice";
import { MeetingIntake } from "@/components/MeetingIntake";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { ExportPanel } from "@/components/review/ExportPanel";
import { MeetingHistoryModal } from "@/components/MeetingHistoryModal";
import { INITIAL_SAMPLE_EXTRACTION } from "@/components/SampleMeetingData";
import { MeetingExtraction } from "@/types/meeting";
import { getAllGuestMeetings, saveGuestMeeting } from "@/lib/storage/indexeddb";
import { createSerialMeetingSaver, getReviewProgress } from "@/lib/meeting-workflow";
import { formatDateDisplay } from "@/lib/utils";

const ACTIVE_DRAFT_KEY = "tambayayong_active_draft";

type WorkspaceStep = "notes" | "plan" | "share";

function getActiveDraftId() {
  if (typeof window === "undefined") return "current_draft";
  try {
    const saved = window.localStorage.getItem(ACTIVE_DRAFT_KEY);
    return saved?.startsWith("draft:") ? saved : "current_draft";
  } catch {
    return "current_draft";
  }
}

function scrollToWorkspace() {
  document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Workspace() {
  const [step, setStep] = useState<WorkspaceStep>("notes");
  const [currentMeeting, setCurrentMeeting] = useState<MeetingExtraction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [planUpdated, setPlanUpdated] = useState(false);
  const [intakeHasContent, setIntakeHasContent] = useState(false);
  const [newDraftId, setNewDraftId] = useState(getActiveDraftId);
  const serialSave = useMemo(() => createSerialMeetingSaver(saveGuestMeeting), []);

  const reviewProgress = useMemo(
    () => (currentMeeting ? getReviewProgress(currentMeeting) : null),
    [currentMeeting]
  );

  const refreshSavedCount = async () => {
    try {
      setSavedCount((await getAllGuestMeetings()).length);
    } catch {
      // The workspace still works if browser storage is unavailable.
    }
  };

  useEffect(() => {
    refreshSavedCount();
  }, []);

  const persistMeeting = async (meeting: MeetingExtraction) => {
    // The hand-authored example is a temporary preview, never a saved AI result.
    if (meeting.id === INITIAL_SAMPLE_EXTRACTION.id) return;
    try {
      setSaveError(null);
      await serialSave(meeting);
      await refreshSavedCount();
    } catch {
      setSaveError("Could not save to this browser. Export your plan to keep a copy.");
    }
  };

  // First analysis lands on the plan; re-analysis after editing notes
  // also lands there and marks the session bar so nothing changes silently.
  const handleExtractionComplete = async (extraction: MeetingExtraction) => {
    setPlanUpdated(currentMeeting !== null);
    setCurrentMeeting(extraction);
    setStep("plan");
    await persistMeeting(extraction);
    scrollToWorkspace();
  };

  const handleLoadSample = (sample: MeetingExtraction) => {
    setPlanUpdated(false);
    setCurrentMeeting(sample);
    setStep("plan");
    scrollToWorkspace();
  };

  const startNewMeeting = () => {
    const nextDraftId = `draft:${crypto.randomUUID()}`;
    try {
      window.localStorage.setItem(ACTIVE_DRAFT_KEY, nextDraftId);
    } catch {
      // An in-memory draft still works when browser storage is unavailable.
    }
    setNewDraftId(nextDraftId);
    setCurrentMeeting(null);
    setPlanUpdated(false);
    setIntakeHasContent(false);
    setSaveError(null);
    setStep("notes");
    scrollToWorkspace();
  };

  const openDraft = (draftId: string) => {
    try {
      window.localStorage.setItem(ACTIVE_DRAFT_KEY, draftId);
    } catch {
      // The selected draft remains available in this tab.
    }
    setNewDraftId(draftId);
    setCurrentMeeting(null);
    setPlanUpdated(false);
    setIntakeHasContent(false);
    setSaveError(null);
    setStep("notes");
    scrollToWorkspace();
  };

  const openSavedMeeting = (meeting: MeetingExtraction) => {
    setPlanUpdated(false);
    setCurrentMeeting(meeting);
    setStep("plan");
  };

  const sessionMeta = currentMeeting
    ? [
        currentMeeting.meetingDate ? formatDateDisplay(currentMeeting.meetingDate) : null,
        currentMeeting.organization || null,
        reviewProgress ? `${reviewProgress.reviewed} of ${reviewProgress.total} reviewed` : null,
      ].filter(Boolean)
    : [];

  return (
    <div className="workspace-app text-foreground">
      <div
        id="start"
        className={`mx-auto w-full ${step === "notes" ? "max-w-3xl" : "max-w-4xl"}`}
      >
        <div className="flex flex-wrap items-center justify-end gap-2 pb-3 sm:justify-end">
          <button type="button" onClick={() => setHistoryOpen(true)} className="workspace-top-action flex-1 font-brand sm:flex-none" aria-label={savedCount > 0 ? `History, ${savedCount} saved` : "History"}>
            <History className="h-4 w-4" aria-hidden="true" /><span>History</span>
            {savedCount > 0 && <span className="font-brand text-[10px] font-semibold tabular-nums text-primary">{savedCount}</span>}
          </button>
          <button type="button" disabled={!Boolean(currentMeeting)} onClick={() => { setStep("share"); scrollToWorkspace(); }} className="workspace-top-action flex-1 font-brand sm:flex-none" title={currentMeeting ? "Open the share options" : "Analyze a meeting first, then export"} aria-label="Export">
            <Download className="h-4 w-4" aria-hidden="true" /><span>Export</span>
          </button>
          <span className="mx-1 hidden h-7 w-px bg-border sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={startNewMeeting}
            disabled={!currentMeeting && !intakeHasContent}
            className="workspace-top-action flex-1 font-brand text-primary disabled:opacity-100 disabled:text-muted-foreground sm:flex-none sm:rounded-full sm:border sm:border-primary/40 sm:bg-primary-light/50 sm:px-4 sm:transition-colors sm:enabled:hover:bg-primary-light sm:disabled:border-border sm:disabled:bg-transparent"
            title={currentMeeting || intakeHasContent ? "New meeting" : "Nothing to clear yet"}
            aria-label="New meeting"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">New</span>
            <span className="hidden sm:inline">New meeting</span>
          </button>
        </div>

        <InlineNotice
          message={saveError}
          tone="warning"
          className="pb-4"
        />

        {step === "notes" && (
          <MeetingIntake
            key={currentMeeting?.id ?? newDraftId}
            initialMeeting={currentMeeting}
            newDraftId={newDraftId}
            onDraftStateChange={setIntakeHasContent}
            onLoadSampleMeeting={handleLoadSample}
            onExtractionComplete={handleExtractionComplete}
          />
        )}

        {step === "plan" && currentMeeting && (
          <>
            <div className="mb-4 rounded-2xl border border-border bg-card px-4 py-3.5 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {currentMeeting.title}
                    </p>
                    {planUpdated && (
                      <span className="font-brand inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Updated
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sessionMeta.join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-0 sm:gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStep("notes")}
                    className="workspace-top-action flex-1 sm:flex-none"
                    title="Back to your notes"
                  >
                    <Edit2 className="h-4 w-4" aria-hidden="true" /><span>Edit notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={startNewMeeting}
                    className="workspace-top-action flex-1 sm:flex-none"
                    title="Start a new meeting"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" /><span>New</span>
                  </button>
                </div>
              </div>
            </div>

            <ReviewWorkspace
              meeting={currentMeeting}
              onUpdateMeeting={async (updated) => {
                setCurrentMeeting(updated);
                await persistMeeting(updated);
              }}
            />
          </>
        )}

        {step === "share" && currentMeeting && (
          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Share your plan</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pick the format your team uses and download it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setStep("plan"); scrollToWorkspace(); }}
                className="workspace-top-action self-start"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" /><span>Back to plan</span>
              </button>
            </div>
            <ExportPanel meeting={currentMeeting} />
          </div>
        )}
      </div>

      <MeetingHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectMeeting={openSavedMeeting}
        onSelectDraft={openDraft}
        onMeetingsChange={refreshSavedCount}
      />
    </div>
  );
}
