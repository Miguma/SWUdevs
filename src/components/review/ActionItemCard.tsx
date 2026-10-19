import React from "react";
import {
  Check,
  X,
  Edit2,
  Trash2,
  User,
  Clock,
  Quote,
  AlertTriangle,
  Sparkles,
  Pencil,
  PlusCircle,
} from "lucide-react";
import { ActionItem, ReviewStatus, Evidence } from "@/types/meeting";
import { formatDateDisplay } from "@/lib/utils";

interface ActionItemCardProps {
  task: ActionItem;
  onSetStatus: (taskId: string, status: ReviewStatus) => void;
  onEdit: (task: ActionItem) => void;
  onDelete: (taskId: string) => void;
  onInspectEvidence: (evidence: Evidence) => void;
}

export function ActionItemCard({
  task,
  onSetStatus,
  onEdit,
  onDelete,
  onInspectEvidence,
}: ActionItemCardProps) {
  const isUnassigned = task.assignees.length === 0;
  const isAmbiguousDate = task.deadline.isAmbiguous;
  const primaryEvidence = task.evidence && task.evidence[0];
  const hasUnverifiedEvidence =
    primaryEvidence && primaryEvidence.provenance === "unverified";

  return (
    <div
      className={`bg-card rounded-xl border transition-all p-4 space-y-3 ${
        task.reviewStatus === "approved"
          ? "border-primary/40 shadow-sm"
          : task.reviewStatus === "rejected"
          ? "border-slate-200 opacity-60 bg-slate-50/60"
          : "border-border shadow-sm hover:border-slate-300"
      }`}
    >
      {/* Top row: Title, status pills & quick actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-bold ${
                task.reviewStatus === "rejected"
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h4>

            {/* Origin Pill */}
            {task.isManual ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                <PlusCircle className="w-3 h-3" />
                Manual
              </span>
            ) : task.isUserEdited ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                User Edited
              </span>
            ) : (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                AI Extracted
              </span>
            )}

            {/* Proposed status */}
            {task.commitmentStatus === "proposed" && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Proposed
              </span>
            )}

            {/* Priority */}
            {task.priority && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  task.priority === "high"
                    ? "bg-danger-light text-danger border border-danger/30"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {task.priority.toUpperCase()}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() =>
              onSetStatus(
                task.id,
                task.reviewStatus === "approved" ? "pending" : "approved"
              )
            }
            type="button"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              task.reviewStatus === "approved"
                ? "bg-primary text-white border-primary"
                : "text-slate-400 hover:text-primary hover:bg-primary-light border-border"
            }`}
            title={task.reviewStatus === "approved" ? "Approved (click to toggle)" : "Approve task"}
          >
            <Check className="w-4 h-4" />
          </button>

          <button
            onClick={() =>
              onSetStatus(
                task.id,
                task.reviewStatus === "rejected" ? "pending" : "rejected"
              )
            }
            type="button"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              task.reviewStatus === "rejected"
                ? "bg-danger text-white border-danger"
                : "text-slate-400 hover:text-danger hover:bg-danger-light border-border"
            }`}
            title={task.reviewStatus === "rejected" ? "Rejected (click to toggle)" : "Reject task"}
          >
            <X className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(task)}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-foreground hover:bg-slate-100 border border-border transition-colors cursor-pointer"
            title="Edit task details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-light border border-border transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metadata Row: Assignees, Deadlines, Evidence */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Assignee Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isUnassigned
              ? "bg-warning-light text-warning border-warning/30 font-semibold"
              : "bg-slate-50 text-foreground border-border"
          }`}
        >
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{isUnassigned ? "Unassigned ⚠️" : task.assignees.join(", ")}</span>
        </div>

        {/* Deadline Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
            isAmbiguousDate
              ? "bg-warning-light text-warning border-warning/30 font-semibold"
              : "bg-slate-50 text-foreground border-border"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span>
            {task.deadline.date
              ? `${formatDateDisplay(task.deadline.date)}${
                  task.deadline.time ? ` (${task.deadline.time})` : ""
                }`
              : task.deadline.originalText || "No deadline"}
            {task.deadline.relation && ` (${task.deadline.relation})`}
            {isAmbiguousDate && " ⚠️"}
          </span>
        </div>

        {/* Evidence Provenance Badge */}
        {primaryEvidence && (
          <button
            type="button"
            onClick={() => onInspectEvidence(primaryEvidence)}
            className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
              primaryEvidence.provenance === "exact_match"
                ? "bg-accent-light/50 text-accent-teal border-accent-teal/30 hover:bg-accent-light"
                : primaryEvidence.provenance === "normalized_match"
                ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                : primaryEvidence.provenance === "manual"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
            }`}
            title="Click to view evidence citation in transcript"
          >
            <Quote className="w-3 h-3" />
            <span>
              {primaryEvidence.provenance === "exact_match" && "Exact Evidence"}
              {primaryEvidence.provenance === "normalized_match" && "Normalized Evidence"}
              {primaryEvidence.provenance === "manual" && "Manual Entry"}
              {primaryEvidence.provenance === "unverified" && "Unverified Citation ⚠️"}
            </span>
          </button>
        )}
      </div>

      {/* Warnings Row */}
      {(isUnassigned || isAmbiguousDate || hasUnverifiedEvidence) && (
        <div className="text-[11px] text-warning flex items-center gap-1.5 pt-0.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {isUnassigned && "Needs responsible person. "}
            {isAmbiguousDate && "Relative deadline requires date confirmation. "}
            {hasUnverifiedEvidence && "Source quote could not be verified in transcript."}
          </span>
        </div>
      )}
    </div>
  );
}
