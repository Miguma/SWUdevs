import React from "react";
import { ArrowLeft, Save, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { MeetingExtraction } from "@/types/meeting";
import { formatDateDisplay } from "@/lib/utils";

interface ReviewHeaderProps {
  meeting: MeetingExtraction;
  onEditNotes: () => void;
  onSaveMeeting: () => void;
  saveSuccess: boolean;
}

export function ReviewHeader({
  meeting,
  onEditNotes,
  onSaveMeeting,
  saveSuccess,
}: ReviewHeaderProps) {
  // Accurate review calculation: considers all action items
  const totalTasks = meeting.actionItems.length;
  const approvedTasks = meeting.actionItems.filter((t) => t.reviewStatus === "approved").length;
  const rejectedTasks = meeting.actionItems.filter((t) => t.reviewStatus === "rejected").length;
  const reviewedTasks = approvedTasks + rejectedTasks;
  const percentReviewed = totalTasks > 0 ? Math.round((reviewedTasks / totalTasks) * 100) : 100;

  let reviewLabel = "Awaiting Review";
  let reviewColor = "bg-amber-100 text-amber-800 border-amber-300";
  if (reviewedTasks === totalTasks && totalTasks > 0) {
    reviewLabel = "Fully Reviewed";
    reviewColor = "bg-primary-light text-primary border-primary/30";
  } else if (reviewedTasks > 0) {
    reviewLabel = "Partially Reviewed";
    reviewColor = "bg-blue-100 text-blue-800 border-blue-300";
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onEditNotes}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-lg hover:bg-slate-100 border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Edit original notes for this meeting"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Edit Meeting Notes</span>
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs font-semibold text-primary">Human-in-the-Loop Review</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {meeting.title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {meeting.organization && `${meeting.organization} · `}
          {formatDateDisplay(meeting.meetingDate)} ({meeting.timezone})
        </p>
      </div>

      {/* Progress & Save */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${reviewColor}`}>
              {reviewLabel}
            </span>
            <span className="text-xs font-bold text-foreground">
              {reviewedTasks} / {totalTasks} reviewed ({percentReviewed}%)
            </span>
          </div>
          <div className="w-48 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-border">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${percentReviewed}%` }}
            />
          </div>
        </div>

        <button
          onClick={onSaveMeeting}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-light text-primary hover:bg-primary/20 border border-primary/20 transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saveSuccess ? "Saved Locally!" : "Save Meeting"}</span>
        </button>
      </div>
    </div>
  );
}
