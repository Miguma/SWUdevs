import React from "react";
import {
  Check,
  Edit2,
  Trash2,
  User,
  Calendar,
  Clock,
  Flag,
  Link2,
  AlertTriangle,
} from "lucide-react";
import { ActionItem, ReviewStatus, TaskStatus, Evidence } from "@/types/meeting";
import { formatDateDisplay } from "@/lib/utils";
import { isTaskOverdue, getClarificationReasons } from "@/lib/meeting-workflow";

interface ActionItemCardProps {
  task: ActionItem;
  isSelected?: boolean;
  onSelect?: () => void;
  onSetStatus: (taskId: string, status: ReviewStatus) => void;
  onSetExecutionStatus?: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: ActionItem) => void;
  onDelete: (taskId: string) => void;
  onInspectEvidence: (evidence: Evidence) => void;
  showExecutionControls?: boolean;
  timezone?: string;
}

export function ActionItemCard({
  task,
  isSelected = false,
  timezone,
  onSelect,
  onSetStatus,
  onSetExecutionStatus,
  onEdit,
  onDelete,
  onInspectEvidence,
  showExecutionControls = false,
}: ActionItemCardProps) {
  const isUnassigned = task.assignees.length === 0;
  const hasMissingOrAmbiguousDate =
    !task.deadline.date || task.deadline.isAmbiguous;
  const primaryEvidence = task.evidence && task.evidence[0];
  const isApproved = task.reviewStatus === "approved";
  const isRejected = task.reviewStatus === "rejected";
  const overdue = isTaskOverdue(task, timezone || task.deadline.timezone);
  const clarificationReasons = getClarificationReasons(task);
  const currentExecStatus = task.status || "todo";

  // Status badge logic matching reference design
  let statusBadge = {
    label: "Pending review",
    className: "bg-warning-light text-warning border-warning/20",
  };
  if (isApproved) {
    statusBadge = {
      label: "Approved",
      className: "bg-primary-light text-primary border-primary/20",
    };
  } else if (isRejected) {
    statusBadge = {
      label: "Dismissed",
      className: "bg-slate-100 text-muted-foreground border-border",
    };
  } else if (isUnassigned) {
    statusBadge = {
      label: "Needs owner",
      className: "bg-danger-light text-danger border-danger/20",
    };
  }

  return (
    <div
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onSelect?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Inspect ${task.title}`}
      className={`rounded-xl border transition-all p-3.5 cursor-pointer ${
        isSelected
          ? "border-primary bg-primary-light/15 ring-1 ring-primary/25 shadow-2xs"
          : isRejected
          ? "border-border/60 opacity-55 bg-slate-50/40"
          : "bg-card border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Left Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetStatus(task.id, isApproved ? "pending" : "approved");
          }}
          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
            isApproved
              ? "bg-primary border-primary text-white"
              : "border-slate-300 bg-card hover:border-primary"
          }`}
          aria-label={isApproved ? "Mark as pending" : "Approve task"}
        >
          {isApproved && <Check className="w-3 h-3 stroke-[2.5]" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Top Row: Title + Badge + Quick Edit/Delete */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-bold leading-snug ${
                  isRejected
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </h4>

              {task.sourceTitle &&
                task.sourceTitle.toLowerCase().trim() !==
                  task.title.toLowerCase().trim() && (
                  <span
                    className="text-[11px] text-muted-foreground font-normal italic"
                    title="Original wording from notes"
                  >
                    ({task.sourceTitle})
                  </span>
                )}

              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>

              {overdue && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md border bg-danger-light text-danger border-danger/30 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Overdue</span>
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-0.5 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors cursor-pointer"
                title="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="p-1 rounded-md text-muted-foreground hover:text-danger hover:bg-danger-light/60 transition-colors cursor-pointer"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Clarification Reasons (if any) */}
          {clarificationReasons.length > 0 && !isRejected && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {clarificationReasons.map((reason) => (
                <span
                  key={reason}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md border bg-amber-50 text-amber-800 border-amber-200 inline-flex items-center gap-1"
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  <span>{reason}</span>
                </span>
              ))}
            </div>
          )}

          {/* Bottom Metadata Pills + Source Link */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Execution Status Selector for Approved/Tracker items */}
              {(isApproved || showExecutionControls) && onSetExecutionStatus && (
                <div
                  className="inline-flex items-center gap-1 mr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={currentExecStatus}
                    onChange={(e) =>
                      onSetExecutionStatus(task.id, e.target.value as TaskStatus)
                    }
                    aria-label={`Execution status for ${task.title}`}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors cursor-pointer focus:outline-none ${
                      currentExecStatus === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : currentExecStatus === "in_progress"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : currentExecStatus === "blocked"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}

              {/* Assignee */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                  isUnassigned
                    ? "bg-slate-50 text-muted-foreground border-border"
                    : "bg-slate-50 text-foreground border-border/80 font-medium"
                }`}
              >
                <User className="w-3 h-3 text-muted-foreground" />
                <span>
                  {isUnassigned ? "Unassigned" : task.assignees.join(", ")}
                </span>
              </span>

              {/* Date */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                  hasMissingOrAmbiguousDate
                    ? "bg-danger-light/70 text-danger border-danger/20 font-medium"
                    : "bg-primary-light/60 text-foreground border-primary/20 font-medium"
                }`}
              >
                {hasMissingOrAmbiguousDate ? (
                  <Clock className="w-3 h-3 text-danger" />
                ) : (
                  <Calendar className="w-3 h-3 text-primary" />
                )}
                <span>
                  {task.deadline.date
                    ? formatDateDisplay(task.deadline.date)
                    : task.deadline.originalText || "No date"}
                </span>
              </span>

              {/* Commitment Status */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                  task.commitmentStatus === "confirmed"
                    ? "bg-primary-light/60 text-primary border-primary/20"
                    : "bg-warning-light text-warning border-warning/20"
                }`}
              >
                <Flag className="w-3 h-3" />
                <span>
                  {task.commitmentStatus === "proposed"
                    ? "Proposed"
                    : task.commitmentStatus === "unclear"
                    ? "Unclear"
                    : "Confirmed"}
                </span>
              </span>
            </div>

            {/* Source Link */}
            {primaryEvidence && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect();
                  onInspectEvidence(primaryEvidence);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                title="View verbatim source in transcript"
              >
                <Link2 className="w-3 h-3" />
                <span>
                  {task.evidence.length}{" "}
                  {task.evidence.length === 1 ? "source" : "sources"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
