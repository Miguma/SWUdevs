"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  FileText,
  Sparkles,
  Check,
  HelpCircle,
  X,
  ExternalLink,
  CalendarDays,
  CheckCircle2,
  ListChecks,
  UserRoundX,
  Users,
  Kanban,
  Clock,
  AlertTriangle,
} from "lucide-react";
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
  getReviewProgress,
  getExecutionProgress,
  getClarificationReasons,
  isTaskOverdue,
} from "@/lib/meeting-workflow";
import { formatDateDisplay } from "@/lib/utils";
import { hasTaskOwner } from "@/lib/owner-state";
import { traceOwnerState } from "@/lib/owner-diagnostics";

import { ActionItemCard } from "./review/ActionItemCard";
import { ActionItemEditor } from "./review/ActionItemEditor";
import { EvidenceInspector } from "./review/EvidenceInspector";
import { DecisionSection } from "./review/DecisionSection";
import { OpenQuestionsSection } from "./review/OpenQuestionsSection";
import { ExportPanel } from "./review/ExportPanel";

interface ReviewWorkspaceProps {
  meeting: MeetingExtraction;
  onUpdateMeeting: (updated: MeetingExtraction) => void;
  onEditNotes?: (meeting: MeetingExtraction) => void;
}

export function ReviewWorkspace({
  meeting,
  onUpdateMeeting,
}: ReviewWorkspaceProps) {
  useEffect(() => { traceOwnerState("rendered", meeting.actionItems); }, [meeting.actionItems]);
  const [viewMode, setViewMode] = useState<"review" | "board" | "clarifications">("review");
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "needs_info"
  >("all");
  const [boardFilter, setBoardFilter] = useState<
    "all" | "todo" | "in_progress" | "blocked" | "completed"
  >("all");
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

  // Metrics calculation
  const totalTasks = meeting.actionItems.length;
  const approvedTasks = meeting.actionItems.filter(
    (t) => t.reviewStatus === "approved"
  );
  const approvedCount = approvedTasks.length;
  const pendingCount = meeting.actionItems.filter(
    (t) => t.reviewStatus === "pending"
  ).length;
  const needDatesCount = meeting.actionItems.filter(
    (t) => !t.deadline.date || t.deadline.isAmbiguous
  ).length;
  const needOwnerCount = meeting.actionItems.filter(
    (t) => !hasTaskOwner(t)
  ).length;

  const isTaskNeedsInfo = (t: ActionItem) =>
    t.reviewStatus !== "rejected" && getClarificationReasons(t).length > 0;

  const needsInfoCount = meeting.actionItems.filter(isTaskNeedsInfo).length;
  const reviewProgress = getReviewProgress(meeting);

  // Phase 3: Execution progress metrics
  const execProgress = getExecutionProgress(meeting);
  const overdueApprovedCount = approvedTasks.filter((t) =>
    isTaskOverdue(t, meeting.timezone)
  ).length;

  // Phase 3: Clarification tasks
  const clarificationTasks = meeting.actionItems.filter(
    (t) => t.reviewStatus !== "rejected" && getClarificationReasons(t).length > 0
  );

  const filteredTasks = meeting.actionItems.filter((t) => {
    if (filter === "all") return true;
    if (filter === "pending") return t.reviewStatus === "pending";
    if (filter === "approved") return t.reviewStatus === "approved";
    if (filter === "needs_info") return isTaskNeedsInfo(t);
    return true;
  });

  const boardFilteredTasks = approvedTasks.filter((t) => {
    if (boardFilter === "all") return true;
    const taskStatus = t.status || "todo";
    return taskStatus === boardFilter;
  });

  const activeDisplayTasks =
    viewMode === "board"
      ? boardFilteredTasks
      : viewMode === "clarifications"
      ? clarificationTasks
      : filteredTasks;

  const selectedTask =
    meeting.actionItems.find((t) => t.id === selectedTaskId) ||
    activeDisplayTasks[0] ||
    null;

  const selectedEvidence = selectedTask?.evidence?.[0] || null;

  const getQuoteLineNumber = (ev: Evidence | null): number | null => {
    if (!ev || !meeting.rawTranscript) return null;
    if (ev.startOffset !== null && ev.startOffset >= 0) {
      return (
        meeting.rawTranscript.slice(0, ev.startOffset).split("\n").length
      );
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

  return (
    <div className="workspace-panel bg-card rounded-2xl border border-border p-5 sm:p-6 space-y-5">
      {/* Top Bar: Title + View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="workspace-step flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-lg font-bold text-primary">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {viewMode === "board"
                ? "Action tracker"
                : viewMode === "clarifications"
                ? "Clarification queue"
                : "Action items"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewMode === "board"
                ? "Track execution status of approved commitments."
                : viewMode === "clarifications"
                ? "Review and resolve tasks with missing or tentative information."
                : "Review, edit, and confirm extracted items."}
            </p>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-border/70 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("review")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "review"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Review List
          </button>
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "board"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Kanban className="w-3.5 h-3.5 text-primary" />
            <span>Action Board</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold">
              {execProgress.totalApproved}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("clarifications")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "clarifications"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Clarify</span>
            {clarificationTasks.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {clarificationTasks.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Stats based on View Mode */}
      {viewMode === "review" && (
        <>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Review Completion
            </span>
            <span className="text-xs font-bold text-foreground">
              {reviewProgress.reviewed} of {reviewProgress.total} reviewed ({reviewProgress.percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${reviewProgress.percent}%` }}
            />
          </div>

          <div className="review-stats grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-5" aria-label="Action item summary">
            {[
              { label: "Action items", value: totalTasks, icon: ListChecks, tone: "blue" },
              { label: "Reviewed", value: reviewProgress.reviewed, icon: CheckCircle2, tone: "green" },
              { label: "With assignees", value: totalTasks - needOwnerCount, icon: Users, tone: "teal" },
              { label: "Need dates", value: needDatesCount, icon: CalendarDays, tone: "amber" },
              { label: "Need owner", value: needOwnerCount, icon: UserRoundX, tone: "red" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="review-stat">
                <span className={`review-stat-icon tone-${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span><strong>{value}</strong><small>{label}</small></span>
              </div>
            ))}
          </div>

          {/* Filter Pills + Add Manual Task */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: `All (${totalTasks})` },
                  { id: "pending", label: `Pending review (${pendingCount})` },
                  { id: "approved", label: `Approved (${approvedCount})` },
                  { id: "needs_info", label: `Needs info (${needsInfoCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    filter === tab.id
                      ? "bg-primary-light/80 text-primary border-primary/30 font-semibold"
                      : "bg-slate-50 text-muted-foreground border-border/80 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isAddingTask && (
              <button
                onClick={() => setIsAddingTask(true)}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-slate-50 text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Add task</span>
              </button>
            )}
          </div>
        </>
      )}

      {viewMode === "board" && (
        <>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold text-muted-foreground">
              Execution Progress (Approved Tasks)
            </span>
            <span className="text-xs font-bold text-foreground">
              {execProgress.completed} of {execProgress.totalApproved} completed ({execProgress.percent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${execProgress.percent}%` }}
            />
          </div>

          <div className="review-stats grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-5" aria-label="Action board summary">
            {[
              { label: "Approved tasks", value: execProgress.totalApproved, icon: ListChecks, tone: "blue" },
              { label: "To do", value: execProgress.todo, icon: Clock, tone: "blue" },
              { label: "In progress", value: execProgress.in_progress, icon: CheckCircle2, tone: "teal" },
              { label: "Blocked", value: execProgress.blocked, icon: AlertTriangle, tone: "amber" },
              { label: "Overdue", value: overdueApprovedCount, icon: UserRoundX, tone: "red" },
            ].map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="review-stat">
                <span className={`review-stat-icon tone-${tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                <span><strong>{value}</strong><small>{label}</small></span>
              </div>
            ))}
          </div>

          {/* Action Board Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "all", label: `All (${execProgress.totalApproved})` },
                  { id: "todo", label: `To do (${execProgress.todo})` },
                  { id: "in_progress", label: `In progress (${execProgress.in_progress})` },
                  { id: "blocked", label: `Blocked (${execProgress.blocked})` },
                  { id: "completed", label: `Completed (${execProgress.completed})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBoardFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    boardFilter === tab.id
                      ? "bg-primary-light/80 text-primary border-primary/30 font-semibold"
                      : "bg-slate-50 text-muted-foreground border-border/80 hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {!isAddingTask && (
              <button
                onClick={() => setIsAddingTask(true)}
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card border border-border hover:bg-slate-50 text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Add task</span>
              </button>
            )}
          </div>
        </>
      )}

      {viewMode === "clarifications" && (
        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {clarificationTasks.length === 0
                ? "No tasks need clarification"
                : `${clarificationTasks.length} task${clarificationTasks.length === 1 ? "" : "s"} require attention`}
            </span>
            <span className="text-xs text-muted-foreground">
              Missing owners, ambiguous dates, or unverified quotes
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Resolve warnings directly using the edit and approval controls below. Tasks update automatically as details are clarified.
          </p>
        </div>
      )}

      {/* Add Manual Task Inline Form */}
      {isAddingTask && (
        <form
          onSubmit={handleAddNewTask}
          className="p-3.5 rounded-xl border border-primary/30 bg-background space-y-2.5"
        >
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Task title (e.g. Reserve barangay hall) *"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs sm:text-sm focus:outline-none focus:border-primary"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Assignee (e.g. John)"
                value={newTaskAssignee}
                onChange={(e) => setNewTaskAssignee(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:border-primary"
              />
              <input
                type="date"
                value={newTaskDeadline}
                onChange={(e) => setNewTaskDeadline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover cursor-pointer"
            >
              Save task
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-4 items-start">
        {/* Left: Action Items + Decisions + Open Questions */}
        <div className="2xl:col-span-7 space-y-3">
          {activeDisplayTasks.length === 0 ? (
            <div className="text-center py-8 bg-background/50 rounded-xl border border-border text-muted-foreground text-xs space-y-2">
              <p>
                {viewMode === "board"
                  ? approvedTasks.length === 0
                    ? "No approved tasks yet. Approve items in the Review List to track their execution here."
                    : `No tasks found matching "${boardFilter}" status.`
                  : viewMode === "clarifications"
                  ? "All action items are clear! No missing owners, dates, or unverified citations."
                  : "No action items under this filter."}
              </p>
              {viewMode === "board" && approvedTasks.length === 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode("review")}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Go to Review List
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
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
                    showExecutionControls={viewMode === "board"}
                    timezone={meeting.timezone}
                  />
                );
              })}
            </div>
          )}

          {/* Decisions & Open Questions */}
          <div className="grid grid-cols-1 gap-3 pt-2">
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

        {/* Right: Source Evidence Panel & Export Panel */}
        <div className="2xl:col-span-5 space-y-4">
          {/* Source Evidence Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    Source evidence
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    From your meeting notes
                  </p>
                </div>
              </div>

              {selectedEvidence && (
                <button
                  type="button"
                  onClick={() => setActiveEvidence(selectedEvidence)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  title="Open full transcript context inspector"
                >
                  <span>Full text</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {selectedTask && selectedEvidence ? (
              <>
                {/* Highlighted Quote Box */}
                <div className="p-3.5 rounded-xl bg-primary-light/50 border border-primary/15 space-y-2">
                  <p className="text-xs font-medium text-foreground leading-relaxed">
                    &ldquo;{selectedEvidence.quote}&rdquo;
                  </p>
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    {meeting.meetingDate && (
                      <div>— {formatDateDisplay(meeting.meetingDate)}</div>
                    )}
                    <div>
                      {quoteLineNumber
                        ? `Line ${quoteLineNumber} in your notes`
                        : "Unanchored excerpt"}{" "}
                      ·{" "}
                      <span className="font-medium">
                        {selectedEvidence.provenance === "exact_match"
                          ? "Exact textual match"
                          : selectedEvidence.provenance === "normalized_match"
                          ? "Normalized textual match"
                          : selectedEvidence.provenance === "manual"
                          ? "Manual entry"
                          : "Unverified citation"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Why this was extracted */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>What to verify</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The quote is a text match. Check whether it supports the action, owner,
                    commitment, and date before approving this item.
                  </p>
                </div>

                {/* Mark as... Controls */}
                <div className="space-y-1.5 pt-1 border-t border-border/70">
                  <span className="text-[11px] font-semibold text-primary block">
                    Mark as...
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleSetTaskStatus(selectedTask.id, "approved")
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        selectedTask.reviewStatus === "approved"
                          ? "bg-primary text-white border-primary"
                          : "bg-primary-light/60 text-primary border-primary/25 hover:bg-primary-light"
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingTaskId(selectedTask.id)}
                      className="py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-border bg-card hover:bg-slate-50 text-foreground flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      <span>Needs info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSetTaskStatus(selectedTask.id, "rejected")
                      }
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        selectedTask.reviewStatus === "rejected"
                          ? "bg-danger text-white border-danger"
                          : "bg-danger-light/60 text-danger border-danger/25 hover:bg-danger-light"
                      }`}
                    >
                      <X className="w-3 h-3" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Select an action item on the left to inspect its verbatim quote and provenance.
              </p>
            )}
          </div>

          {/* Export Results Card */}
          <ExportPanel meeting={meeting} />
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
