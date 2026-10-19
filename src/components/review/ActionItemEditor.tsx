import React, { useState, useEffect } from "react";
import { ActionItem, PriorityLevel } from "@/types/meeting";

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
      title: title.trim(),
      description: desc.trim() || null,
      assignees: parsedAssignees,
      priority,
      deadline: {
        ...task.deadline,
        date: deadlineDate || null,
        isAmbiguous: false, // Explicit user edit resolves date ambiguity
      },
      needsReview: false,
      isUserEdited: true,
    };

    onSave(updated);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border border-primary/30 bg-primary-light/30 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
          Edit Action Item
        </h4>
        <span className="text-[11px] text-muted-foreground">Press Esc to cancel</span>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          required
          className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <textarea
          rows={2}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Context or notes..."
          className="w-full px-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Assignees (comma-separated)
            </label>
            <input
              type="text"
              value={assignees}
              onChange={(e) => setAssignees(e.target.value)}
              placeholder="e.g. Maria, Mark"
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Confirmed Deadline
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Priority
            </label>
            <select
              value={priority || ""}
              onChange={(e) =>
                setPriority((e.target.value as any) || null)
              }
              className="w-full px-2.5 py-1 text-xs rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary/20"
            >
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-xs text-muted-foreground hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3.5 py-1 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
