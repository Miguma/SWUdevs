"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  X,
  FileText,
  Calendar,
  Trash2,
  Copy,
} from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import {
  getAllGuestMeetings,
  deleteGuestMeeting,
  duplicateGuestMeeting,
  getAllNewMeetingDrafts,
  type GuestDraft,
} from "@/lib/storage/indexeddb";
import { formatDateDisplay } from "@/lib/utils";

interface MeetingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeeting: (meeting: MeetingExtraction) => void;
  onSelectDraft: (draftId: string) => void;
  onMeetingsChange: () => void;
}

export function MeetingHistoryModal({
  isOpen,
  onClose,
  onSelectMeeting,
  onSelectDraft,
  onMeetingsChange,
}: MeetingHistoryModalProps) {
  const [meetings, setMeetings] = useState<MeetingExtraction[]>([]);
  const [drafts, setDrafts] = useState<GuestDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const [all, savedDrafts] = await Promise.all([
        getAllGuestMeetings(),
        getAllNewMeetingDrafts(),
      ]);
      setMeetings(all);
      setDrafts(savedDrafts);
      onMeetingsChange();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMeetings();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved meeting?")) return;
    await deleteGuestMeeting(id);
    await loadMeetings();
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateGuestMeeting(id);
    await loadMeetings();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-tight">
                Saved work
              </h3>
              <p className="text-xs text-muted-foreground">
                Stored locally in your browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close saved work"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-1 pr-1">
          {loading ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              Loading saved meetings...
            </div>
          ) : meetings.length === 0 && drafts.length === 0 ? (
            <div className="text-center py-10 space-y-1.5">
              <FileText className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-foreground">
                No saved work yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Draft notes and analyzed meetings appear here so you can return to them.
              </p>
            </div>
          ) : (
            <>
              {drafts.length > 0 && (
                <section aria-label="Meeting drafts" className="space-y-2 pb-3">
                  <h4 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Draft notes</h4>
                  {drafts.map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => { onSelectDraft(draft.id); onClose(); }}
                      className="flex w-full items-center gap-3 rounded-xl border border-border p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-light/30"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{draft.title || "Untitled draft"}</span>
                        <span className="block text-xs text-muted-foreground">{draft.rawText.length.toLocaleString()} characters · saved {new Date(draft.savedAt).toLocaleString()}</span>
                      </span>
                    </button>
                  ))}
                </section>
              )}
              {meetings.length > 0 && <h4 className="px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">Analyzed meetings</h4>}
              {meetings.map((m) => {
                const approvedCount = m.actionItems.filter(
                  (a) => a.reviewStatus === "approved"
                ).length;
                const totalCount = m.actionItems.length;

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 group"
                  >
                    <button
                      type="button"
                      onClick={() => { onSelectMeeting(m); onClose(); }}
                      className="min-w-0 flex-1 space-y-1 text-left"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {m.title}
                        </h4>
                        {m.organization && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-muted-foreground">
                            {m.organization}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateDisplay(m.meetingDate)}
                        </span>
                        <span>·</span>
                        <span>{approvedCount}/{totalCount} approved</span>
                        <span>·</span>
                        <span>{m.decisions.length} decisions</span>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDuplicate(m.id, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200/60 transition-colors cursor-pointer"
                        aria-label={`Duplicate ${m.title}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(m.id, e)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                        aria-label={`Delete ${m.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
