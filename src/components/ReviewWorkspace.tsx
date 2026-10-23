"use client";

import React, { useState, useEffect } from "react";
import { Plus, ExternalLink } from "@/components/icons";
import {
  MeetingExtraction,
  ActionItem,
  MeetingDecision,
  OpenQuestion,
  ReviewStatus,
  TaskStatus,
  QuestionAnswerStatus,
  Evidence,
} from "@/types/meeting";
import { createManualEvidence } from "@/server/services/evidence-verifier";
import {
  getExecutionProgress,
  getClarificationReasons,
} from "@/lib/meeting-workflow";
import { formatDateDisplay } from "@/lib/utils";
import { DatePicker } from "@/components/DatePicker";

import { ActionItemCard } from "./review/ActionItemCard";
import { ActionItemEditor } from "./review/ActionItemEditor";
import { EvidenceInspector } from "./review/EvidenceInspector";
import { DecisionSection } from "./review/DecisionSection";
import { OpenQuestionsSection } from "./review/OpenQuestionsSection";

interface ReviewWorkspaceProps {
  meeting: MeetingExtraction;
  onUpdateMeeting: (updated: MeetingExtraction) => void;
  onEditNotes?: (meeting: MeetingExtraction) => void;
}

type ReviewFilter = "all" | "pending" | "approved" | "needs_info" | "dismissed";
type TrackingFilter = "all" | "todo" | "in_progress" | "blocked" | "completed";

export function ReviewWorkspace({
  meeting,
  onUpdateMeeting,
}: ReviewWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"review" | "tracking">("review");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [boardFilter, setBoardFilter] = useState<TrackingFilter>("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    meeting.actionItems.find((t) => t.reviewStatus === "pending")?.id ||
      meeting.actionItems[0]?.id ||
      null
  );
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  useEffect(() => {
    if (
      !selectedTaskId ||
      !meeting.actionItems.some((t) => t.id === selectedTaskId)
    ) {
      setSelectedTaskId(meeting.actionItems[0]?.id || null);
    }
  }, [meeting.id, meeting.actionItems, selectedTaskId]);

  const commitMeetingUpdate = (updated: MeetingExtraction) => {
    onUpdateMeeting({
      ...updated,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSetTaskStatus = (taskId: string, status: ReviewStatus) => {
    const updatedTasks = meeting.actionItems.map((task) =>
      task.id === taskId ? { ...task, reviewStatus: status } : task
    );
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
  };

  const handleSetTaskExecutionStatus = (taskId: string, status: TaskStatus) => {
    const updatedTasks = meeting.actionItems.map((task) =>
      task.id === taskId ? { ...task, status, isUserEdited: true } : task
    );
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = meeting.actionItems.filter((t) => t.id !== taskId);
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
  };

  const handleSaveEditedTask = (updatedTask: ActionItem) => {
    const updatedTasks = meeting.actionItems.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
    setEditingTaskId(null);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ActionItem = {
      id: `manual-act-${crypto.randomUUID().slice(0, 8)}`,
      title: newTaskTitle.trim(),
      description: null,
      assignees: newTaskAssignee ? [newTaskAssignee.trim()] : [],
      deadline: {
        originalText: newTaskDeadline || null,
        date: newTaskDeadline || null,
        time: null,
        timezone: meeting.timezone,
        relation: "by",
        isAmbiguous: false,
      },
      commitmentStatus: "confirmed",
      priority: null,
      status: "todo",
      evidence: [
        createManualEvidence("Manually added action item during review"),
      ],
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved",
      isUserEdited: false,
      isManual: true,
    };

    commitMeetingUpdate({
      ...meeting,
      actionItems: [newTask, ...meeting.actionItems],
    });

    setSelectedTaskId(newTask.id);
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskDeadline("");
    setIsAddingTask(false);
    if (viewMode === "review") {
      setFilter("all");
    } else {
      setBoardFilter("all");
    }
  };

  const handleAddDecision = (newDecision: MeetingDecision) => {
    commitMeetingUpdate({
      ...meeting,
      decisions: [...meeting.decisions, newDecision],
    });
  };

  const handleEditDecision = (id: string, newText: string) => {
    const updated = meeting.decisions.map((d) =>
      d.id === id ? { ...d, decision: newText, isUserEdited: true } : d
    );
    commitMeetingUpdate({ ...meeting, decisions: updated });
  };

  const handleDeleteDecision = (id: string) => {
    commitMeetingUpdate({
      ...meeting,
      decisions: meeting.decisions.filter((d) => d.id !== id),
    });
  };

  const handleSetDecisionStatus = (id: string, status: ReviewStatus) => {
    const updated = meeting.decisions.map((d) =>
      d.id === id ? { ...d, reviewStatus: status } : d
    );
    commitMeetingUpdate({ ...meeting, decisions: updated });
  };

  const handleAddQuestion = (newQuestion: OpenQuestion) => {
    commitMeetingUpdate({
      ...meeting,
      openQuestions: [...meeting.openQuestions, newQuestion],
    });
  };

  const handleEditQuestion = (id: string, newText: string) => {
    const updated = meeting.openQuestions.map((q) =>
      q.id === id ? { ...q, question: newText, isUserEdited: true } : q
    );
    commitMeetingUpdate({ ...meeting, openQuestions: updated });
  };

  const handleAnswerQuestion = (
    id: string,
    status: QuestionAnswerStatus,
    answer?: string | null
  ) => {
    const updated = meeting.openQuestions.map((q) =>
      q.id === id
        ? { ...q, status, answer: answer ?? null, isUserEdited: true }
        : q
    );
    commitMeetingUpdate({ ...meeting, openQuestions: updated });
  };

  const handleDeleteQuestion = (id: string) => {
    commitMeetingUpdate({
      ...meeting,
      openQuestions: meeting.openQuestions.filter((q) => q.id !== id),
    });
  };

  const handleSetQuestionStatus = (id: string, status: ReviewStatus) => {
    const updated = meeting.openQuestions.map((q) =>
      q.id === id ? { ...q, reviewStatus: status } : q
    );
    commitMeetingUpdate({ ...meeting, openQuestions: updated });
  };

  const approvedTasks = meeting.actionItems.filter(
    (t) => t.reviewStatus === "approved"
  );
  const approvedCount = approvedTasks.length;
  const pendingCount = meeting.actionItems.filter(
    (t) => t.reviewStatus === "pending"
  ).length;
  const dismissedCount = meeting.actionItems.filter(
    (t) => t.reviewStatus === "rejected"
  ).length;
  const activeCount = meeting.actionItems.length - dismissedCount;

  const isTaskNeedsInfo = (t: ActionItem) =>
    t.reviewStatus !== "rejected" && getClarificationReasons(t).length > 0;
  const needsInfoCount = meeting.actionItems.filter(isTaskNeedsInfo).length;

  const execProgress = getExecutionProgress(meeting);

  const reviewFilters: { id: ReviewFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: activeCount },
    { id: "pending", label: "To review", count: pendingCount },
    { id: "approved", label: "Approved", count: approvedCount },
    { id: "needs_info", label: "Needs info", count: needsInfoCount },
  ];
  if (dismissedCount > 0) {
    reviewFilters.push({
      id: "dismissed",
      label: "Dismissed",
      count: dismissedCount,
    });
  }

  const trackingFilters: { id: TrackingFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: execProgress.totalApproved },
    { id: "todo", label: "To do", count: execProgress.todo },
    { id: "in_progress", label: "In progress", count: execProgress.inProgress },
    { id: "blocked", label: "Blocked", count: execProgress.blocked },
    { id: "completed", label: "Completed", count: execProgress.completed },
  ];

  const filteredTasks = meeting.actionItems.filter((t) => {
    if (filter === "all") return t.reviewStatus !== "rejected";
    if (filter === "pending") return t.reviewStatus === "pending";
    if (filter === "approved") return t.reviewStatus === "approved";
    if (filter === "needs_info") return isTaskNeedsInfo(t);
    return t.reviewStatus === "rejected";
  });

  const boardFilteredTasks = approvedTasks.filter((t) => {
    if (boardFilter === "all") return true;
    const taskStatus = t.status || "todo";
    return taskStatus === boardFilter;
  });

  const activeDisplayTasks =
    viewMode === "tracking" ? boardFilteredTasks : filteredTasks;

  const selectedTask =
    activeDisplayTasks.find((t) => t.id === selectedTaskId) ||
    activeDisplayTasks[0] ||
    null;

  const selectedEvidence = selectedTask?.evidence?.[0] || null;

  const getQuoteLineNumber = (ev: Evidence | null): number | null => {
    if (!ev || !meeting.rawTranscript) return null;
    if (ev.startOffset !== null && ev.startOffset >= 0) {
      return meeting.rawTranscript.slice(0, ev.startOffset).split("\n").length;
    }
    if (ev.quote) {
      const idx = meeting.rawTranscript.indexOf(ev.quote);
      if (idx !== -1) {
        return meeting.rawTranscript.slice(0, idx).split("\n").length;
      }
    }
    return null;
  };

  const quoteLineNumber = getQuoteLineNumber(selectedEvidence);

  const emptyMessage = (() => {
    if (viewMode === "tracking") {
      if (approvedTasks.length === 0) return "No approved tasks yet.";
      return "No tasks match this filter.";
    }
    if (filter === "needs_info") return "No missing details.";
    if (filter === "pending") return "Everything has been reviewed.";
    if (filter === "approved") return "No approved items yet.";
    if (filter === "dismissed") return "Nothing dismissed.";
    return dismissedCount > 0
      ? "No action items to review."
      : "No action items yet.";
  })();

  return (
    <div className="workspace-panel bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Action items</h2>
        {!isAddingTask && (
          <button
            type="button"
            onClick={() => setIsAddingTask(true)}
            className="tap-44-inline inline-flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add task</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-0 border-b border-border sm:gap-6">
          <button
            type="button"
            onClick={() => setViewMode("review")}
            aria-pressed={viewMode === "review"}
            className={`tap-44-inline flex-1 -mb-px border-b-2 pb-2.5 text-[13px] transition-colors cursor-pointer sm:flex-none ${
              viewMode === "review"
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Review
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
              {activeCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("tracking")}
            aria-pressed={viewMode === "tracking"}
            className={`tap-44-inline flex-1 -mb-px border-b-2 pb-2.5 text-[13px] transition-colors cursor-pointer sm:flex-none ${
              viewMode === "tracking"
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Tracking
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
              {approvedCount}
            </span>
          </button>
        </div>

        <div key={viewMode} className="panel-switch-in flex flex-wrap items-center gap-x-0 gap-y-2 sm:gap-x-5">
          {(viewMode === "review" ? reviewFilters : trackingFilters).map((tab) => {
            const isActive =
              viewMode === "review"
                ? filter === tab.id
                : boardFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (viewMode === "review") {
                    setFilter(tab.id as ReviewFilter);
                  } else {
                    setBoardFilter(tab.id as TrackingFilter);
                  }
                }}
                aria-pressed={isActive}
                className={`tap-44-inline flex-auto whitespace-nowrap py-1 text-xs transition-colors cursor-pointer sm:flex-none ${
                  isActive
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="ml-1 tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isAddingTask && (
        <form
          onSubmit={handleAddNewTask}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsAddingTask(false);
          }}
          className="space-y-3 border-b border-border pb-5"
        >
          <div>
            <label
              htmlFor="new-task-title"
              className="mb-1 block text-[11px] font-medium text-muted-foreground"
            >
              Task
            </label>
            <input
              id="new-task-title"
              type="text"
              placeholder="What needs doing?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              autoFocus
              className="ui-input"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-task-owner"
                className="mb-1 block text-[11px] font-medium text-muted-foreground"
              >
                Owner
              </label>
              <input
                id="new-task-owner"
                type="text"
                placeholder="Who is doing this?"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="ui-input"
              />
            </div>
            <div>
              <label
                htmlFor="new-task-due"
                className="mb-1 block text-[11px] font-medium text-muted-foreground"
              >
                Due date
              </label>
              <DatePicker
                id="new-task-due"
                value={newTaskDeadline}
                onChange={setNewTaskDeadline}
                ariaLabel="Choose due date"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="tap-44-inline text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tap-44-inline ui-button-pill"
            >
              Add task
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <div key={`${viewMode}-${filter}-${boardFilter}`} className="panel-switch-in">
            {activeDisplayTasks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {emptyMessage}
                </p>
                {viewMode === "tracking" && approvedTasks.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setViewMode("review")}
                    className="tap-44-inline mt-2 text-xs font-medium text-primary transition-colors hover:text-primary-hover cursor-pointer"
                  >
                    Review action items
                  </button>
                )}
              </div>
            ) : (
              <div>
                {activeDisplayTasks.map((task) => {
                  if (editingTaskId === task.id) {
                    return (
                      <ActionItemEditor
                        key={task.id}
                        task={task}
                        onSave={handleSaveEditedTask}
                        onCancel={() => setEditingTaskId(null)}
                      />
                    );
                  }

                  return (
                    <ActionItemCard
                      key={task.id}
                      task={task}
                      isSelected={selectedTask?.id === task.id}
                      onSelect={() => setSelectedTaskId(task.id)}
                      onSetStatus={handleSetTaskStatus}
                      onSetExecutionStatus={handleSetTaskExecutionStatus}
                      onEdit={() => setEditingTaskId(task.id)}
                      onDelete={handleDeleteTask}
                      onInspectEvidence={(ev) => setActiveEvidence(ev)}
                      showExecutionControls={viewMode === "tracking"}
                      showReviewControls={viewMode === "review"}
                      timezone={meeting.timezone}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-6">
            <DecisionSection
              decisions={meeting.decisions}
              onAddDecision={handleAddDecision}
              onEditDecision={handleEditDecision}
              onDeleteDecision={handleDeleteDecision}
              onSetStatus={handleSetDecisionStatus}
              onInspectEvidence={(ev) => setActiveEvidence(ev)}
            />

            <OpenQuestionsSection
              questions={meeting.openQuestions}
              onAddQuestion={handleAddQuestion}
              onEditQuestion={handleEditQuestion}
              onAnswerQuestion={handleAnswerQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onSetStatus={handleSetQuestionStatus}
              onInspectEvidence={(ev) => setActiveEvidence(ev)}
            />
          </div>
        </div>

        <div className="border-t border-border pt-5 lg:col-span-5 lg:border-t-0 lg:pt-0 lg:sticky lg:top-24">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[13px] font-semibold text-foreground">
                Source evidence
              </h3>
              {selectedEvidence && (
                <button
                  type="button"
                  onClick={() => setActiveEvidence(selectedEvidence)}
                  className="tap-44-inline inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-medium text-primary transition-colors hover:text-primary-hover cursor-pointer"
                  title="See the full context in your notes"
                >
                  <span>Full text</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>

            {selectedTask ? (
              selectedEvidence ? (
                <>
                  <blockquote className="border-l-2 border-border pl-3 text-[13px] leading-relaxed text-foreground">
                    &ldquo;{selectedEvidence.quote}&rdquo;
                  </blockquote>

                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {meeting.meetingDate && (
                      <>
                        {formatDateDisplay(meeting.meetingDate)}
                        <span aria-hidden="true"> · </span>
                      </>
                    )}
                    {quoteLineNumber
                      ? `Line ${quoteLineNumber} in your notes`
                      : "Not found in your notes"}
                    <span aria-hidden="true"> · </span>
                    <span
                      className={
                        selectedEvidence.provenance === "unverified"
                          ? "text-warning"
                          : undefined
                      }
                    >
                      {selectedEvidence.provenance === "exact_match"
                        ? "Exact match"
                        : selectedEvidence.provenance === "normalized_match"
                        ? "Matched with small cleanups"
                        : selectedEvidence.provenance === "manual"
                        ? "Added by you"
                        : "Not checked yet"}
                    </span>
                  </p>

                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      What to check
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Seeing these words proves where the item came from. It does
                      not prove the task, its owner, or the go-ahead, so check
                      those before approving.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This item has no source quote.
                </p>
              )
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Select an action item to see the words it came from.
              </p>
            )}
          </div>
        </div>
      </div>

      <EvidenceInspector
        evidence={activeEvidence}
        rawTranscript={meeting.rawTranscript}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
