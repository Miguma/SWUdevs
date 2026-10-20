"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, AlertCircle, FileText, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { MeetingIntake } from "@/components/MeetingIntake";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { MeetingHistoryModal } from "@/components/MeetingHistoryModal";
import { INITIAL_SAMPLE_EXTRACTION } from "@/components/SampleMeetingData";
import { MeetingExtraction } from "@/types/meeting";
import { getAllGuestMeetings, saveGuestMeeting } from "@/lib/storage/indexeddb";
import { createSerialMeetingSaver } from "@/lib/meeting-workflow";

const ACTIVE_DRAFT_KEY = "tambayayong_active_draft";

function getActiveDraftId() {
  if (typeof window === "undefined") return "current_draft";
  try {
    const saved = window.localStorage.getItem(ACTIVE_DRAFT_KEY);
    return saved?.startsWith("draft:") ? saved : "current_draft";
  } catch {
    return "current_draft";
  }
}

export default function HomePage() {
  const [currentMeeting, setCurrentMeeting] = useState<MeetingExtraction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newDraftId, setNewDraftId] = useState(getActiveDraftId);
  const serialSave = useMemo(() => createSerialMeetingSaver(saveGuestMeeting), []);

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

  const startNewMeeting = () => {
    const nextDraftId = `draft:${crypto.randomUUID()}`;
    try {
      window.localStorage.setItem(ACTIVE_DRAFT_KEY, nextDraftId);
    } catch {
      // An in-memory draft still works when browser storage is unavailable.
    }
    setNewDraftId(nextDraftId);
    setCurrentMeeting(null);
    setSaveError(null);
    document.getElementById("meeting-workspace")?.scrollIntoView({ behavior: "smooth" });
  };

  const openDraft = (draftId: string) => {
    try {
      window.localStorage.setItem(ACTIVE_DRAFT_KEY, draftId);
    } catch {
      // The selected draft remains available in this tab.
    }
    setNewDraftId(draftId);
    setCurrentMeeting(null);
    setSaveError(null);
    document.getElementById("meeting-workspace")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        savedMeetingsCount={savedCount}
        onResetHome={startNewMeeting}
      />

      <main id="main-content" className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
        <div className="mb-8 grid gap-5 border-b border-border pb-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Tambayayong / Meeting workspace</p>
            <h1 className="text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.055em] sm:text-5xl">
              A clearer way to <span className="text-primary">move together.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Bring English or Cebuano notes. Find the work, check the source, and decide what your team will do next.
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary lg:pb-1">
            Walay mabilin. <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
          </p>
        </div>

        {saveError && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-light p-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{saveError}
          </div>
        )}

        {currentMeeting?.id === INITIAL_SAMPLE_EXTRACTION.id && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-light/60 p-4 text-sm text-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span><strong>Illustrative review preview.</strong> These example items were written by hand to show the workspace. Run “Analyze with Local AI” to replace them with actual model output.</span>
          </div>
        )}

        <div id="meeting-workspace" className="grid scroll-mt-24 items-start gap-5 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.4fr)]">
          <MeetingIntake
            key={currentMeeting?.id ?? newDraftId}
            initialMeeting={currentMeeting}
            newDraftId={newDraftId}
            onLoadSampleMeeting={setCurrentMeeting}
            onExtractionComplete={async (extraction) => {
              setCurrentMeeting(extraction);
              await persistMeeting(extraction);
            }}
          />
          <section id="step-2-review" aria-label="Action review">
            {currentMeeting ? (
              <ReviewWorkspace
                meeting={currentMeeting}
                onUpdateMeeting={async (updated) => {
                  setCurrentMeeting(updated);
                  await persistMeeting(updated);
                }}
              />
            ) : (
              <div className="flex min-h-[480px] flex-col rounded-2xl border border-border bg-card p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">2</span>
                  <div>
                    <h2 className="text-lg font-semibold">Review the plan</h2>
                    <p className="text-xs text-muted-foreground">Your next step appears here.</p>
                  </div>
                </div>
                <div className="m-auto max-w-sm py-12 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary-light/60 text-primary">
                    <ShieldCheck className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Nothing to review yet</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Add your notes and choose a local model. You’ll review every suggested action before it becomes your team’s plan.
                  </p>
                  <div className="mt-7 flex items-center justify-center gap-3 text-xs font-medium text-primary">
                    <span>Notes</span><span aria-hidden="true">→</span><span>Source checked</span><span aria-hidden="true">→</span><span>Your call</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <MeetingHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectMeeting={setCurrentMeeting}
        onSelectDraft={openDraft}
        onMeetingsChange={refreshSavedCount}
      />
    </div>
  );
}
