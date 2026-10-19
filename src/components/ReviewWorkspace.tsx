"use client";

import React, { useState } from "react";
import {
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  FileDown,
  Copy,
  AlertTriangle,
  Quote,
  Clock,
  User,
  HelpCircle,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Save,
  CheckSquare,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  MeetingExtraction,
  ActionItem,
  MeetingDecision,
  OpenQuestion,
  ReviewStatus,
} from "@/types/meeting";
import { formatDateDisplay } from "@/lib/utils";
import {
  generateMarkdownExport,
  generateCsvExport,
} from "@/server/services/export-service";
import { saveGuestMeeting } from "@/lib/storage/indexeddb";

interface ReviewWorkspaceProps {
  meeting: MeetingExtraction;
  onUpdateMeeting: (updated: MeetingExtraction) => void;
  onReset: () => void;
}

export function ReviewWorkspace({
  meeting,
  onUpdateMeeting,
  onReset,
}: ReviewWorkspaceProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [activeEvidenceQuote, setActiveEvidenceQuote] = useState<string | null>(null);
  const [includePendingExport, setIncludePendingExport] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Editing state for tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [editTaskAssignees, setEditTaskAssignees] = useState("");
  const [editTaskDeadline, setEditTaskDeadline] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<"low" | "medium" | "high" | null>(null);

  // New task modal/drawer state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");

  // New decision state
  const [newDecisionText, setNewDecisionText] = useState("");
  // New open question state
  const [newQuestionText, setNewQuestionText] = useState("");

  // Calculate review progress
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

  // Update task status
  const handleSetTaskStatus = (taskId: string, status: ReviewStatus) => {
    const updatedTasks = meeting.actionItems.map((task) => {
      if (task.id === taskId) {
        return { ...task, reviewStatus: status };
      }
      return task;
    });
    const updated = { ...meeting, actionItems: updatedTasks };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = meeting.actionItems.filter((t) => t.id !== taskId);
    const updated = { ...meeting, actionItems: updatedTasks };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const startEditTask = (task: ActionItem) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description || "");
    setEditTaskAssignees(task.assignees.join(", "));
    setEditTaskDeadline(task.deadline.date || "");
    setEditTaskPriority(task.priority);
  };

  const saveEditTask = () => {
    if (!editingTaskId) return;
    const assigneesList = editTaskAssignees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const updatedTasks = meeting.actionItems.map((task) => {
      if (task.id === editingTaskId) {
        return {
          ...task,
          title: editTaskTitle,
          description: editTaskDesc || null,
          assignees: assigneesList,
          priority: editTaskPriority,
          deadline: {
            ...task.deadline,
            date: editTaskDeadline || null,
            isAmbiguous: false,
          },
          needsReview: false,
        };
      }
      return task;
    });

    const updated = { ...meeting, actionItems: updatedTasks };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
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
      evidence: [{ quote: "Manually added during review", startOffset: null, endOffset: null, isVerified: true }],
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved",
    };

    const updated = {
      ...meeting,
      actionItems: [newTask, ...meeting.actionItems],
    };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskDeadline("");
    setIsAddingTask(false);
  };

  // Decisions operations
  const handleSetDecisionStatus = (decId: string, status: ReviewStatus) => {
    const updatedDecisions = meeting.decisions.map((d) =>
      d.id === decId ? { ...d, reviewStatus: status } : d
    );
    const updated = { ...meeting, decisions: updatedDecisions };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const handleDeleteDecision = (decId: string) => {
    const updated = {
      ...meeting,
      decisions: meeting.decisions.filter((d) => d.id !== decId),
    };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const handleAddDecision = () => {
    if (!newDecisionText.trim()) return;
    const newDec: MeetingDecision = {
      id: `manual-dec-${crypto.randomUUID().slice(0, 8)}`,
      decision: newDecisionText.trim(),
      evidence: [{ quote: "Manually added", startOffset: null, endOffset: null, isVerified: true }],
      needsReview: false,
      reviewStatus: "approved",
    };
    const updated = { ...meeting, decisions: [...meeting.decisions, newDec] };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
    setNewDecisionText("");
  };

  // Open questions operations
  const handleSetQuestionStatus = (qId: string, status: ReviewStatus) => {
    const updatedQuestions = meeting.openQuestions.map((q) =>
      q.id === qId ? { ...q, reviewStatus: status } : q
    );
    const updated = { ...meeting, openQuestions: updatedQuestions };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const handleDeleteQuestion = (qId: string) => {
    const updated = {
      ...meeting,
      openQuestions: meeting.openQuestions.filter((q) => q.id !== qId),
    };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQ: OpenQuestion = {
      id: `manual-q-${crypto.randomUUID().slice(0, 8)}`,
      question: newQuestionText.trim(),
      evidence: [{ quote: "Manually added", startOffset: null, endOffset: null, isVerified: true }],
      needsReview: false,
      reviewStatus: "approved",
    };
    const updated = { ...meeting, openQuestions: [...meeting.openQuestions, newQ] };
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
    setNewQuestionText("");
  };

  // Export triggers
  const handleDownloadMarkdown = () => {
    const md = generateMarkdownExport(meeting, {
      includePending: includePendingExport,
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    const md = generateMarkdownExport(meeting, {
      includePending: includePendingExport,
    });
    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleDownloadCsv = () => {
    const csv = generateCsvExport(meeting, {
      includePending: includePendingExport,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tambayayong-${meeting.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExplicitSave = async () => {
    await saveGuestMeeting(meeting);
    setSaveSuccessNotification(true);
    setTimeout(() => setSaveSuccessNotification(false), 2500);
  };

  const filteredTasks = meeting.actionItems.filter((t) => {
    if (filter === "all") return true;
    return t.reviewStatus === filter;
  });

  return (
    <div className="space-y-6">
      {/* Back button and title strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit Notes
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-xs font-semibold text-primary">Review & Verification</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {meeting.title}
          </h2>
          <p className="text-xs text-muted-foreground">
            {meeting.organization && `${meeting.organization} · `}
            {formatDateDisplay(meeting.meetingDate)} ({meeting.timezone})
          </p>
        </div>

        {/* Review progress bar & Save button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${reviewColor}`}>
                {reviewLabel}
              </span>
              <span className="text-xs font-bold text-foreground">
                {reviewedTasks} / {totalTasks} reviewed ({percentReviewed}%)
              </span>
            </div>
            <div className="w-44 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden border border-border">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${percentReviewed}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleExplicitSave}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-light text-primary hover:bg-primary/20 border border-primary/20 transition-colors shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saveSuccessNotification ? "Saved!" : "Save Meeting"}
          </button>
        </div>
      </div>

      {/* Summary Box */}
      {meeting.summary && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>AI Meeting Summary</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {meeting.summary}
          </p>
        </div>
      )}

      {/* Main Review Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Items Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Action Items ({totalTasks})
              </h3>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-border text-xs font-medium">
              {(["all", "pending", "approved", "rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    filter === st
                      ? "bg-card text-foreground font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Add Manual Task Button */}
          {!isAddingTask ? (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-primary" />
              Add Manual Action Item
            </button>
          ) : (
            <form
              onSubmit={handleAddNewTask}
              className="p-4 rounded-xl border border-primary/30 bg-primary-light/40 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                Add New Action Item
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Task title (e.g., Finalize sponsorship letter)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Assignee (e.g., Maria)"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    type="date"
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-hover shadow-sm"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Task Cards */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border text-muted-foreground text-sm">
              No tasks found in this filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isEditing = editingTaskId === task.id;
              const isUnassigned = task.assignees.length === 0;
              const isAmbiguousDate = task.deadline.isAmbiguous;
              const hasUnverifiedEvidence =
                task.evidence.length > 0 && !task.evidence[0].isVerified;

              return (
                <div
                  key={task.id}
                  className={`bg-card rounded-xl border transition-all p-4 space-y-3 ${
                    task.reviewStatus === "approved"
                      ? "border-primary/40 shadow-sm"
                      : task.reviewStatus === "rejected"
                      ? "border-slate-200 opacity-60 bg-slate-50"
                      : "border-border shadow-sm hover:border-slate-300"
                  }`}
                >
                  {isEditing ? (
                    /* Edit Form Mode */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTaskTitle}
                        onChange={(e) => setEditTaskTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-border focus:ring-2 focus:ring-primary/20"
                      />
                      <textarea
                        rows={2}
                        placeholder="Context / description"
                        value={editTaskDesc}
                        onChange={(e) => setEditTaskDesc(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-border focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Assignees (comma separated)
                          </label>
                          <input
                            type="text"
                            value={editTaskAssignees}
                            onChange={(e) => setEditTaskAssignees(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-border"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Deadline Date
                          </label>
                          <input
                            type="date"
                            value={editTaskDeadline}
                            onChange={(e) => setEditTaskDeadline(e.target.value)}
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-border"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                            Priority
                          </label>
                          <select
                            value={editTaskPriority || ""}
                            onChange={(e) =>
                              setEditTaskPriority(
                                (e.target.value as any) || null
                              )
                            }
                            className="w-full px-2.5 py-1 text-xs rounded-lg border border-border"
                          >
                            <option value="">None</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingTaskId(null)}
                          className="px-3 py-1 text-xs text-muted-foreground rounded-lg hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEditTask}
                          className="px-3.5 py-1 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm"
                        >
                          Apply Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      {/* Top title and status badges */}
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
                            {task.commitmentStatus === "proposed" && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                Proposed
                              </span>
                            )}
                            {task.priority && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
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
                            <p className="text-xs text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Quick Approve / Reject / Edit Controls */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() =>
                              handleSetTaskStatus(
                                task.id,
                                task.reviewStatus === "approved" ? "pending" : "approved"
                              )
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              task.reviewStatus === "approved"
                                ? "bg-primary text-white border-primary"
                                : "text-slate-400 hover:text-primary hover:bg-primary-light border-border"
                            }`}
                            title="Approve task"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() =>
                              handleSetTaskStatus(
                                task.id,
                                task.reviewStatus === "rejected" ? "pending" : "rejected"
                              )
                            }
                            className={`p-1.5 rounded-lg border transition-colors ${
                              task.reviewStatus === "rejected"
                                ? "bg-danger text-white border-danger"
                                : "text-slate-400 hover:text-danger hover:bg-danger-light border-border"
                            }`}
                            title="Reject task"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => startEditTask(task)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-foreground hover:bg-slate-100 border border-border transition-colors"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-danger-light border border-border transition-colors"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Metadata Row: Assignees & Deadlines */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Assignee */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                            isUnassigned
                              ? "bg-warning-light text-warning border-warning/30 font-semibold"
                              : "bg-slate-50 text-foreground border-border"
                          }`}
                        >
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>
                            {isUnassigned ? "Unassigned ⚠️" : task.assignees.join(", ")}
                          </span>
                        </div>

                        {/* Deadline */}
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

                        {/* Evidence Quote Link */}
                        {task.evidence.length > 0 && task.evidence[0].quote && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEvidenceQuote(task.evidence[0].quote)
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-accent-teal hover:underline px-2 py-1 rounded-md bg-accent-light/40 border border-accent-teal/20"
                          >
                            <Quote className="w-3 h-3" />
                            <span>
                              Evidence: &quot;
                              {task.evidence[0].quote.length > 28
                                ? `${task.evidence[0].quote.slice(0, 28)}...`
                                : task.evidence[0].quote}
                              &quot;
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Warnings if ungrounded or incomplete */}
                      {(isUnassigned || isAmbiguousDate || hasUnverifiedEvidence) && (
                        <div className="text-[11px] text-warning flex items-center gap-1.5 pt-1">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {isUnassigned && "Needs owner assigned. "}
                            {isAmbiguousDate && "Deadline phrase is relative or ambiguous. "}
                            {hasUnverifiedEvidence && "Source quote could not be verified in text."}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right 1 Col: Decisions, Open Questions, and Export Center */}
        <div className="space-y-6">
          {/* Export Box */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileDown className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Export Action Plan
              </h3>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePendingExport}
                  onChange={(e) => setIncludePendingExport(e.target.checked)}
                  className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                />
                Include pending items with label
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download Markdown (.md)
                </button>

                <button
                  onClick={handleCopyMarkdown}
                  className="w-full py-2 px-3 rounded-xl border border-border hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-accent-teal" />
                  {copiedNotification ? "Copied to Clipboard!" : "Copy Markdown"}
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="w-full py-2 px-3 rounded-xl border border-border hover:bg-slate-50 text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-slate-600" />
                  Download CSV (Formula Safe)
                </button>
              </div>
            </div>
          </div>

          {/* Confirmed Decisions Section */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Decisions ({meeting.decisions.length})
                </h3>
              </div>
            </div>

            {meeting.decisions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No decisions recorded.</p>
            ) : (
              <div className="space-y-2">
                {meeting.decisions.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-border text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{dec.decision}</p>
                      {dec.evidence && dec.evidence[0]?.quote && (
                        <p className="text-[10px] text-muted-foreground italic">
                          &quot;{dec.evidence[0].quote}&quot;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteDecision(dec.id)}
                      className="text-slate-400 hover:text-danger p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add decision */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add confirmed decision..."
                value={newDecisionText}
                onChange={(e) => setNewDecisionText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddDecision()}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddDecision}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-foreground"
              >
                Add
              </button>
            </div>
          </div>

          {/* Open Questions & Follow-ups */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-bold text-foreground">
                Unresolved Questions ({meeting.openQuestions.length})
              </h3>
            </div>

            {meeting.openQuestions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No open questions detected.</p>
            ) : (
              <div className="space-y-2">
                {meeting.openQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-2.5 rounded-lg bg-warning-light/50 border border-warning/20 text-xs flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">❓ {q.question}</p>
                      {q.evidence && q.evidence[0]?.quote && (
                        <p className="text-[10px] text-muted-foreground italic">
                          &quot;{q.evidence[0].quote}&quot;
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-slate-400 hover:text-danger p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick add question */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add unresolved question..."
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
                className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-foreground"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Evidence Viewer Drawer/Modal */}
      {activeEvidenceQuote && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5 text-accent-teal" />
                <h3 className="font-bold text-foreground">
                  Source Evidence Grounding
                </h3>
              </div>
              <button
                onClick={() => setActiveEvidenceQuote(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Extracted Supporting Quote:
              </p>
              <div className="p-3 rounded-xl bg-accent-light/50 border border-accent-teal/30 text-sm font-medium text-foreground">
                &ldquo;{activeEvidenceQuote}&rdquo;
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                In Original Transcript Context:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-border text-xs font-mono max-h-56 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                {(() => {
                  const idx = meeting.rawTranscript.indexOf(activeEvidenceQuote);
                  if (idx === -1) {
                    return meeting.rawTranscript;
                  }
                  const before = meeting.rawTranscript.slice(0, idx);
                  const match = meeting.rawTranscript.slice(
                    idx,
                    idx + activeEvidenceQuote.length
                  );
                  const after = meeting.rawTranscript.slice(
                    idx + activeEvidenceQuote.length
                  );
                  return (
                    <>
                      <span>{before}</span>
                      <mark className="bg-amber-200 text-foreground font-semibold px-1 rounded">
                        {match}
                      </mark>
                      <span>{after}</span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveEvidenceQuote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-foreground transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
