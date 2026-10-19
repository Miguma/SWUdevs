"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { MeetingIntake } from "@/components/MeetingIntake";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { MeetingHistoryModal } from "@/components/MeetingHistoryModal";
import { MeetingExtraction } from "@/types/meeting";
import { getAllGuestMeetings, saveGuestMeeting } from "@/lib/storage/indexeddb";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  const [currentMeeting, setCurrentMeeting] = useState<MeetingExtraction | null>(null);
  const [meetingToEdit, setMeetingToEdit] = useState<MeetingExtraction | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const refreshSavedCount = async () => {
    try {
      const all = await getAllGuestMeetings();
      setSavedCount(all.length);
    } catch {
      // IndexedDB might not be available during SSR
    }
  };

  useEffect(() => {
    refreshSavedCount();
  }, []);

  const handleExtractionComplete = async (extraction: MeetingExtraction) => {
    setCurrentMeeting(extraction);
    setMeetingToEdit(null);
    await saveGuestMeeting(extraction);
    await refreshSavedCount();
  };

  const handleUpdateMeeting = async (updated: MeetingExtraction) => {
    setCurrentMeeting(updated);
    await saveGuestMeeting(updated);
    await refreshSavedCount();
  };

  const handleEditNotes = (meeting: MeetingExtraction) => {
    setMeetingToEdit(meeting);
    setCurrentMeeting(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* App Header */}
      <Header
        onOpenHistory={() => setHistoryOpen(true)}
        savedMeetingsCount={savedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero banner (shown when no active meeting is in review) */}
        {!currentMeeting && (
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-2 pb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light border border-primary/20 text-primary text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bilingual Meeting Intelligence · English & Cebuano</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              From conversation to action.{" "}
              <span className="text-primary block sm:inline">Walay mabilin!</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Transform unstructured multilingual meeting notes, chat logs, and transcripts into clear, accountable, human-verified action plans. Powered by local open-source AI.
            </p>

            {/* Feature pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>100% Private Local AI</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Runs self-hosted via Ollama (Qwen3). Notes never leave your machine.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <FileText className="w-4 h-4 text-accent-teal" />
                  <span>Verbatim Evidence</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Every task, decision, and question cites exact quotes. No invented owners.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Human In Control</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Review, correct, and approve to-dos before exporting to Markdown or CSV.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Workspace Container */}
        <div className="transition-all duration-300">
          {!currentMeeting ? (
            <MeetingIntake
              onExtractionComplete={handleExtractionComplete}
              initialMeeting={meetingToEdit}
            />
          ) : (
            <ReviewWorkspace
              meeting={currentMeeting}
              onUpdateMeeting={handleUpdateMeeting}
              onEditNotes={handleEditNotes}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/60 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong className="text-foreground">Tambayayong</strong> — An open-source project for student orgs, community groups, and hackathon teams.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              Qwen3-4B-Instruct (Apache 2.0)
            </span>
            <span>·</span>
            <span>Zero Proprietary APIs</span>
          </div>
        </div>
      </footer>

      {/* History modal */}
      <MeetingHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectMeeting={(m) => {
          setCurrentMeeting(m);
          setMeetingToEdit(null);
        }}
        onMeetingsChange={refreshSavedCount}
      />
    </div>
  );
}
