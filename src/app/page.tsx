"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, FileText, ListChecks, ShieldCheck, Sun, UserRoundX, Users } from "lucide-react";
import { Header } from "@/components/Header";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
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
    <div className="workspace-app min-h-screen bg-background text-foreground lg:flex">
      <WorkspaceSidebar
        onOpenHistory={() => setHistoryOpen(true)}
        onResetHome={startNewMeeting}
        savedMeetingsCount={savedCount}
      />
      <div className="min-w-0 flex-1">
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        savedMeetingsCount={savedCount}
        onResetHome={startNewMeeting}
        canExport={Boolean(currentMeeting)}
      />

      <main id="main-content" className="workspace-main w-full px-4 pb-16 pt-7 sm:px-7 xl:px-8">
        <div id="overview" className="workspace-hero mb-6 flex scroll-mt-28 items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">AI · Meeting-to-action tracker</p>
            <h1 className="text-[2.25rem] font-semibold leading-[1.06] tracking-[-0.052em] sm:text-[2.65rem] xl:text-[2.9rem]">
              From conversations to <span className="text-primary">community progress.</span>
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Turn meeting notes into clear action items, decisions, and next steps — with open-weight cloud AI and your review.
            </p>
          </div>
          <div className="workspace-hero-note hidden shrink-0 items-center gap-4 2xl:flex" aria-hidden="true">
            <span>Mas klaro.<br />Mas buhat.</span><Sun className="h-8 w-8 text-[#eabf55]" strokeWidth={1.2} />
          </div>
        </div>

        {saveError && (
          <div role="alert" className="mb-5 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-light p-3 text-sm text-warning">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{saveError}
          </div>
        )}

        {currentMeeting?.id === INITIAL_SAMPLE_EXTRACTION.id && (
          <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-light/60 p-4 text-sm text-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span><strong>Illustrative review preview.</strong> These example items were written by hand to show the workspace. Run “Analyze with Cloud AI” to replace them with actual model output.</span>
          </div>
        )}

        <div id="meeting-workspace" className="workspace-columns grid scroll-mt-24 items-start gap-4">
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
              <div className="workspace-panel flex min-h-[580px] flex-col rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="workspace-step flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-primary">2</span>
                    <div>
                      <h2 className="text-lg font-bold">Action items</h2>
                      <p className="text-xs text-muted-foreground">Review, edit, and confirm the extracted items.</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">0 of 0 reviewed</span>
                </div>
                <div className="review-stats mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-5" aria-label="Action item summary">
                  {[
                    { label: "Action items", icon: ListChecks, tone: "blue" },
                    { label: "Reviewed", icon: CheckCircle2, tone: "green" },
                    { label: "With assignees", icon: Users, tone: "teal" },
                    { label: "Need dates", icon: CalendarDays, tone: "amber" },
                    { label: "Need owner", icon: UserRoundX, tone: "red" },
                  ].map(({ label, icon: Icon, tone }) => (
                    <div key={label} className="review-stat"><span className={`review-stat-icon tone-${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><span><strong>0</strong><small>{label}</small></span></div>
                  ))}
                </div>
                <div className="m-auto max-w-sm py-12 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary-light/60 text-primary">
                    <ShieldCheck className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">Your action plan starts here</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Add your notes or load the sample meeting. Suggested actions and source evidence will appear here for your review.
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
      </div>

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
