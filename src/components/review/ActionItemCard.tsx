import React from "react";
import { Check, Edit2, Trash2, Link2, X } from "@/components/icons";
import { ActionItem, ReviewStatus, TaskStatus, Evidence } from "@/types/meeting";
import { formatDateDisplay } from "@/lib/utils";
import { isTaskOverdue } from "@/lib/meeting-workflow";
import { hasTaskOwner } from "@/lib/owner-state";

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
  showReviewControls?: boolean;
  timezone?: string;
}

type MetaItem = {
  key: string;
  label: string;
  tone?: "warning" | "danger";
};

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
  showReviewControls = true,
}: ActionItemCardProps) {
  const isUnassigned = !hasTaskOwner(task);
  const primaryEvidence = task.evidence && task.evidence[0];
  const isApproved = task.reviewStatus === "approved";
  const isRejected = task.reviewStatus === "rejected";
  const overdue = isTaskOverdue(task, timezone || task.deadline.timezone);
  const currentExecStatus = task.status || "todo";
  const hasVerifiedEvidence =
    task.evidence.some(
      (evidence) => evidence.isVerified && evidence.provenance !== "unverified"
    ) || task.evidence.some((evidence) => evidence.provenance === "manual");
  const unverifiedCitation =
    !task.isManual && !hasVerifiedEvidence
      ? true
      : task.evidence.some(
          (evidence) =>
            evidence.provenance !== "manual" &&
            (!evidence.isVerified || evidence.provenance === "unverified")
        );
  const hasAmbiguousDate = Boolean(task.deadline.date && task.deadline.isAmbiguous);
  const sourceChanged = Boolean(task.retainedFromReview && task.needsReview);
  const dateText = task.deadline.date
    ? formatDateDisplay(task.deadline.date)
    : "No date";

  const meta: MetaItem[] = [
    {
      key: "owner",
      label: isUnassigned ? "Unassigned" : task.assignees.join(", "),
      tone: isUnassigned ? "warning" : undefined,
    },
    {
      key: "date",
      label: overdue ? `Overdue · ${dateText}` : dateText,
      tone: !task.deadline.date ? "warning" : overdue ? "danger" : undefined,
    },
  ];

  if (hasAmbiguousDate) {
    meta.push({ key: "ambiguous", label: "Ambiguous", tone: "warning" });
  }
  if (task.commitmentStatus === "proposed") {
    meta.push({ key: "commitment", label: "Proposed", tone: "warning" });
  } else if (task.commitmentStatus === "unclear") {
    meta.push({ key: "commitment", label: "Unclear", tone: "warning" });
  }
  if (sourceChanged) {
    meta.push({ key: "source-changed", label: "Source changed", tone: "warning" });
  }
  if (unverifiedCitation) {
    meta.push({ key: "citation", label: "Source unverified", tone: "warning" });
  }

  const sourceLabel =
    primaryEvidence?.provenance === "manual"
      ? "Added by you"
      : unverifiedCitation
      ? "Open source"
      : `${task.evidence.length} ${
          task.evidence.length === 1 ? "source" : "sources"
        }`;

  return (
    <div
      onClick={onSelect}
      onKeyDown={(event) => {
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          onSelect?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Inspect ${task.title}`}
      className={`group relative -mx-3 cursor-pointer border-b border-b-border/70 border-l-2 px-3 py-3.5 transition-colors last:border-b-0 ${
        isSelected
          ? "border-l-primary bg-muted/50"
          : "border-l-transparent hover:bg-muted/30"
      } ${isRejected ? "opacity-55" : ""}`}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4
              className={`text-sm font-medium leading-snug ${
                isRejected
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }`}
            >
              {task.title}
            </h4>

            {task.sourceTitle &&
              task.sourceTitle.toLowerCase().trim() !==
                task.title.toLowerCase().trim() && (
                <p
                  className="mt-0.5 truncate text-[11px] italic leading-relaxed text-muted-foreground"
                  title={task.sourceTitle}
                >
                  {task.sourceTitle}
                </p>
              )}
          </div>

          <div
            className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              title="Edit task"
              aria-label={`Edit ${task.title}`}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task.id)}
              className="tap-icon rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger cursor-pointer"
              title="Delete task"
              aria-label={`Delete ${task.title}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {task.description && (
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground"
            title={task.description}
          >
            {task.description}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11.5px] text-muted-foreground">
            {meta.map((item, index) => (
              <React.Fragment key={item.key}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-muted-foreground/50">
                    ·
                  </span>
                )}
                <span
                  className={
                    item.tone === "danger"
                      ? "font-medium text-danger"
                      : item.tone === "warning"
                      ? "text-warning"
                      : undefined
                  }
                >
                  {item.label}
                </span>
              </React.Fragment>
            ))}

            {primaryEvidence && (
              <>
                {meta.length > 0 && (
                  <span aria-hidden="true" className="text-muted-foreground/50">
                    ·
                  </span>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (onSelect) onSelect();
                    onInspectEvidence(primaryEvidence);
                  }}
                  className="tap-44 inline-flex items-center gap-1 rounded py-0.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  title="See these words in your notes"
                >
                  <Link2 className="h-3 w-3" />
                  <span>{sourceLabel}</span>
                </button>
              </>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
            onClick={(event) => event.stopPropagation()}
          >
            {showReviewControls && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onSetStatus(task.id, isApproved ? "pending" : "approved")
                  }
                  aria-pressed={isApproved}
                  aria-label={
                    isApproved
                      ? `Approved: ${task.title}. Activate to move back to pending.`
                      : `Approve ${task.title}`
                  }
                  className={`tap-44 inline-flex items-center gap-1.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                    isApproved
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`grid h-3.5 w-3.5 place-items-center rounded-[3px] border ${
                      isApproved ? "border-primary" : "border-border"
                    }`}
                  >
                    {isApproved && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span>{isApproved ? "Approved" : "Approve"}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onSetStatus(task.id, isRejected ? "pending" : "rejected")
                  }
                  aria-pressed={isRejected}
                  aria-label={
                    isRejected
                      ? `Dismissed: ${task.title}. Activate to move back to pending.`
                      : `Dismiss ${task.title}`
                  }
                  className={`tap-44 inline-flex items-center gap-1.5 py-1 text-[11.5px] font-medium transition-colors cursor-pointer ${
                    isRejected
                      ? "text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <X className="h-3 w-3" />
                  <span>{isRejected ? "Dismissed" : "Dismiss"}</span>
                </button>
              </>
            )}

            {showExecutionControls && onSetExecutionStatus && (
              <select
                value={currentExecStatus}
                onChange={(event) =>
                  onSetExecutionStatus(
                    task.id,
                    event.target.value as TaskStatus
                  )
                }
                aria-label={`Execution status for ${task.title}`}
                className={`tap-44 cursor-pointer border-0 bg-transparent p-0 text-base font-medium transition-colors sm:text-[11.5px] ${
                  currentExecStatus === "completed"
                    ? "text-primary"
                    : currentExecStatus === "blocked"
                    ? "text-warning"
                    : "text-muted-foreground"
                }`}
              >
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
