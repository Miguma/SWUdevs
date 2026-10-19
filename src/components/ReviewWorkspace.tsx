"use client";

import React, { useState } from "react";
import { ListTodo, Plus, Sparkles } from "lucide-react";
import {
  MeetingExtraction,
  ActionItem,
  MeetingDecision,
  OpenQuestion,
  ReviewStatus,
  Evidence,
} from "@/types/meeting";
import { saveGuestMeeting } from "@/lib/storage/indexeddb";
import { createManualEvidence } from "@/server/services/evidence-verifier";

import { ReviewHeader } from "./review/ReviewHeader";
import { ActionItemCard } from "./review/ActionItemCard";
import { ActionItemEditor } from "./review/ActionItemEditor";
import { EvidenceInspector } from "./review/EvidenceInspector";
import { DecisionSection } from "./review/DecisionSection";
import { OpenQuestionsSection } from "./review/OpenQuestionsSection";
import { ExportPanel } from "./review/ExportPanel";

interface ReviewWorkspaceProps {
  meeting: MeetingExtraction;
  onUpdateMeeting: (updated: MeetingExtraction) => void;
  onEditNotes: (meeting: MeetingExtraction) => void;
}

export function ReviewWorkspace({
  meeting,
  onUpdateMeeting,
  onEditNotes,
}: ReviewWorkspaceProps) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [activeEvidence, setActiveEvidence] = useState<Evidence | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  // Update meeting helper: updates state & persists once (eliminating duplicate race condition writes)
  const commitMeetingUpdate = (updated: MeetingExtraction) => {
    onUpdateMeeting(updated);
    saveGuestMeeting(updated);
  };

  // Task review status toggle
  const handleSetTaskStatus = (taskId: string, status: ReviewStatus) => {
    const updatedTasks = meeting.actionItems.map((task) =>
      task.id === taskId ? { ...task, reviewStatus: status } : task
    );
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
  };

  // Task deletion
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = meeting.actionItems.filter((t) => t.id !== taskId);
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
  };

  // Save edited task
  const handleSaveEditedTask = (updatedTask: ActionItem) => {
    const updatedTasks = meeting.actionItems.map((t) =>
      t.id === updatedTask.id ? updatedTask : t
    );
    commitMeetingUpdate({ ...meeting, actionItems: updatedTasks });
    setEditingTaskId(null);
  };

  // Add new manual task
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
      evidence: [createManualEvidence("Manually added action item during review")],
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

    setNewTaskTitle("");
    setNewTaskAssignee("");
    setNewTaskDeadline("");
    setIsAddingTask(false);
  };

  // Decision operations
  const handleAddDecision = (newDecision: MeetingDecision) => {
    commitMeetingUpdate({
      ...meeting,
      decisions: [...meeting.decisions, newDecision],
    });
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

  // Question operations
  const handleAddQuestion = (newQuestion: OpenQuestion) => {
    commitMeetingUpdate({
      ...meeting,
      openQuestions: [...meeting.openQuestions, newQuestion],
    });
  };

  const handleDeleteQuestion = (id: string) => {
    commitMeetingUpdate({
      ...meeting,
      openQuestions: meeting.openQuestions.filter((q) => q.id !== id),
    });
  };

  // Manual save trigger
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
      {/* Header with accurate progress calculation and save button */}
      <ReviewHeader
        meeting={meeting}
        onEditNotes={() => onEditNotes(meeting)}
        onSaveMeeting={handleExplicitSave}
        saveSuccess={saveSuccessNotification}
      />

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

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Items Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                Action Items ({meeting.actionItems.length})
              </h3>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-border text-xs font-medium">
              {(["all", "pending", "approved", "rejected"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilter(st)}
                  type="button"
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
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

          {/* Add Manual Task Form or Trigger */}
          {!isAddingTask ? (
            <button
              onClick={() => setIsAddingTask(true)}
              type="button"
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                Add Manual Action Item
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Prepare volunteer snacks)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Assignee (e.g. Maria)"
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

          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border border-border text-muted-foreground text-sm">
              No tasks found under the &quot;{filter}&quot; filter.
            </div>
          ) : (
            filteredTasks.map((task) => {
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
                  onSetStatus={handleSetTaskStatus}
                  onEdit={() => setEditingTaskId(task.id)}
                  onDelete={handleDeleteTask}
                  onInspectEvidence={(ev) => setActiveEvidence(ev)}
                />
              );
            })
          )}
        </div>

        {/* Right 1 Col: Export Panel, Decisions, Questions */}
        <div className="space-y-6">
          <ExportPanel meeting={meeting} />

          <DecisionSection
            decisions={meeting.decisions}
            onAddDecision={handleAddDecision}
            onDeleteDecision={handleDeleteDecision}
            onSetStatus={handleSetDecisionStatus}
          />

          <OpenQuestionsSection
            questions={meeting.openQuestions}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>
      </div>

      {/* Accessible Evidence Inspector Modal */}
      <EvidenceInspector
        evidence={activeEvidence}
        rawTranscript={meeting.rawTranscript}
        onClose={() => setActiveEvidence(null)}
      />
    </div>
  );
}
