import type { ActionItem, MeetingExtraction } from "@/types/meeting";

export const hasTaskOwner = (task: Pick<ActionItem, "assignees">): boolean =>
  task.assignees.some(name => Boolean(name.trim()));

const ownerWarning = /^(?:assignee|owner|missing (?:owner|assignee)|needs? (?:an? )?(?:owner|assignee|responsible person)|(?:owner|assignee) (?:missing|unspecified)|unassigned|no (?:owner|assignee)(?: specified)?)$/i;

export function syncOwnerInformation(task: ActionItem): ActionItem {
  const missingInformation = task.missingInformation.filter(info => !ownerWarning.test(info.trim()));
  if (!hasTaskOwner(task)) missingInformation.push("assignee");
  return { ...task, missingInformation };
}

// Normalize derived metadata only; do not infer owners or change approvals on
// hydration. Existing records, IDs, drafts and human choices remain intact.
export function syncMeetingOwnerInformation(meeting: MeetingExtraction): MeetingExtraction {
  return { ...meeting, actionItems: meeting.actionItems.map(syncOwnerInformation) };
}
