import React, { useState, useEffect } from "react";
import { ActionItem, PriorityLevel, TaskStatus } from "@/types/meeting";

interface ActionItemEditorProps {
  task: ActionItem;
  onSave: (updatedTask: ActionItem) => void;
  onCancel: () => void;
}

export function ActionItemEditor({
  task,
  onSave,
  onCancel,
}: ActionItemEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");
  const [assignees, setAssignees] = useState(task.assignees.join(", "));
  const [deadlineDate, setDeadlineDate] = useState(task.deadline.date || "");
  const [priority, setPriority] = useState<PriorityLevel>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status || "todo");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedAssignees = assignees
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const updated: ActionItem = {
      ...task,
      sourceTitle: task.sourceTitle || task.title,
      title: title.trim(),
      description: desc.trim() || null,
      assignees: parsedAssignees,
      priority,
      status,
      deadline: {
        ...task.deadline,
        date: deadlineDate || null,
        isAmbiguous: false,
      },
      reviewStatus: task.reviewStatus,
      needsReview: task.reviewStatus === "approved" ? false : task.needsReview,
      isUserEdited: true,
    };

    onSave(updated);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border border-primary/40 bg-card shadow-xs space-y-3"
    >
      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title *"
          required
          autoFocus
          className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
        />

        <textarea
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Additional context or notes (optional)"
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
        />

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Assignees
            </label>
            <input
              type="text"
              value={assignees}
              onChange={(e) => setAssignees(e.target.value)}
              placeholder="Maria, Mark"
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Work Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary font-medium"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Priority
            </label>
            <select
              value={priority || ""}
              onChange={(e) => setPriority((e.target.value as any) || null)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
            >
              <option value="">Normal</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">Esc to cancel</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3.5 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
