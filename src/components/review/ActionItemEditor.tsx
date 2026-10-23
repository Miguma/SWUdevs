import React, { useState, useEffect } from "react";
import { DatePicker } from "@/components/DatePicker";
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
      if (e.key !== "Escape") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[role="dialog"]')) return;
      onCancel();
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

    const deadlineChanged = deadlineDate !== (task.deadline.date || "");

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
        isAmbiguous: deadlineChanged ? false : task.deadline.isAmbiguous,
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
      className="-mx-3 space-y-3 border-b border-border bg-muted/30 px-3 py-4"
    >
      <div>
        <label
          htmlFor="edit-task-title"
          className="mb-1 block text-[11px] font-medium text-muted-foreground"
        >
          Task
        </label>
        <input
          id="edit-task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
          autoFocus
          className="ui-input font-medium"
        />
      </div>

      <div>
        <label
          htmlFor="edit-task-notes"
          className="mb-1 block text-[11px] font-medium text-muted-foreground"
        >
          Notes
        </label>
        <textarea
          id="edit-task-notes"
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Additional context (optional)"
          className="ui-input"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="edit-task-owner"
            className="mb-1 block text-[11px] font-medium text-muted-foreground"
          >
            Owner
          </label>
          <input
            id="edit-task-owner"
            type="text"
            value={assignees}
            onChange={(e) => setAssignees(e.target.value)}
            placeholder="Maria, Mark"
            className="ui-input"
          />
        </div>

        <div>
          <label
            htmlFor="edit-task-due"
            className="mb-1 block text-[11px] font-medium text-muted-foreground"
          >
            Due date
          </label>
          <DatePicker
            id="edit-task-due"
            value={deadlineDate}
            onChange={setDeadlineDate}
            ariaLabel="Choose due date"
          />
        </div>

        <div>
          <label
            htmlFor="edit-task-status"
            className="mb-1 block text-[11px] font-medium text-muted-foreground"
          >
            Status
          </label>
          <select
            id="edit-task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="ui-input"
          >
            <option value="todo">To do</option>
            <option value="in_progress">In progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="edit-task-priority"
            className="mb-1 block text-[11px] font-medium text-muted-foreground"
          >
            Priority
          </label>
          <select
            id="edit-task-priority"
            value={priority || ""}
            onChange={(e) => setPriority((e.target.value as PriorityLevel) || null)}
            className="ui-input"
          >
            <option value="">Normal</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-0.5">
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Esc to cancel</span>
        <div className="flex flex-1 items-center justify-between gap-4 sm:flex-none sm:justify-end sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="tap-44-inline text-xs text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="tap-44-inline ui-button-pill"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
