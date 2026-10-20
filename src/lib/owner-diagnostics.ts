import type { ActionItem, Evidence } from "@/types/meeting";

// Temporary investigation aid: opt in only in development. No transcript,
// quotes, titles, credentials or literal person names are emitted.
const personAliases = new Map<string, string>();
function alias(name: string) {
  const key = name.trim().toLocaleLowerCase();
  if (!personAliases.has(key)) personAliases.set(key, `person-${personAliases.size + 1}`);
  return personAliases.get(key)!;
}
function enabled() {
  if (process.env.NODE_ENV !== "development") return false;
  if (typeof window === "undefined") return process.env.OWNER_DIAGNOSTICS === "1";
  try { return window.sessionStorage?.getItem("tambayayong_owner_diagnostics") === "1"; }
  catch { return false; }
}
export function traceOwnerAssembly(
  taskId: string,
  raw: string[],
  evidence: Evidence[],
  resolved: { accepted: string[]; rejected: { name: string; reason: string }[]; detectedSpeakers: string[] },
) {
  if (!enabled()) return;
  console.debug("[owner-trace]", {
    stage: "assembly", taskId, rawModelAssignees: raw.map(alias),
    evidence: evidence.map(ev => ({ verified: ev.isVerified, start: ev.startOffset, end: ev.endOffset })),
    detectedSpeakers: resolved.detectedSpeakers.map(alias),
    acceptedAssignees: resolved.accepted.map(alias),
    rejectedAssignees: resolved.rejected.map(r => ({ person: alias(r.name), reason: r.reason })),
  });
}
export function traceOwnerState(stage: "reconciled" | "persisted" | "hydrated" | "rendered", tasks: ActionItem[]) {
  if (!enabled()) return;
  for (const task of tasks) console.debug("[owner-trace]", {
    stage, taskId: task.id, assignees: task.assignees.map(alias), reviewStatus: task.reviewStatus,
  });
}
