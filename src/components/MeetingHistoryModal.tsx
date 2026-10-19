"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  X,
  FileText,
  Calendar,
  Trash2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Database,
} from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import {
  getAllGuestMeetings,
  deleteGuestMeeting,
  duplicateGuestMeeting,
  clearAllGuestData,
} from "@/lib/storage/indexeddb";
import { formatDateDisplay } from "@/lib/utils";

interface MeetingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeeting: (meeting: MeetingExtraction) => void;
  onMeetingsChange: () => void;
}

export function MeetingHistoryModal({
  isOpen,
  onClose,
  onSelectMeeting,
  onMeetingsChange,
}: MeetingHistoryModalProps) {
  const [meetings, setMeetings] = useState<MeetingExtraction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const all = await getAllGuestMeetings();
      setMeetings(all);
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

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all locally saved meetings and drafts? This cannot be undone."
      )
    ) {
      return;
    }
    await clearAllGuestData();
    await loadMeetings();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-light text-primary">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">
                Saved Meeting History
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3 text-accent-teal" />
                Stored in browser-local IndexedDB (Guest Mode)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Loading local meetings...
            </div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-foreground">
                No saved meetings yet.
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                When you analyze notes and approve actions, your meetings will appear here automatically for easy reopening.
              </p>
            </div>
          ) : (
            meetings.map((m) => {
              const approvedCount = m.actionItems.filter(
                (a) => a.reviewStatus === "approved"
              ).length;
              const totalCount = m.actionItems.length;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMeeting(m);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {m.title}
                      </h4>
                      {m.organization && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {m.organization}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateDisplay(m.meetingDate)}
                      </span>
                      <span>·</span>
                      <span>
                        {approvedCount} of {totalCount} approved
                      </span>
                      <span>·</span>
                      <span>{m.decisions.length} decisions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleDuplicate(m.id, e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-foreground hover:bg-slate-200/60 transition-colors"
                      title="Duplicate meeting"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(m.id, e)}
                      className="p-2 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-light transition-colors"
                      title="Delete meeting"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-teal" />
            <span>Zero server retention for guest data</span>
          </div>
          {meetings.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-danger hover:underline text-xs font-medium"
            >
              Clear All Saved Data
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
