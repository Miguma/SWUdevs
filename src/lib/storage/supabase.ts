import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeetingExtraction } from "@/types/meeting";
import { syncMeetingOwnerInformation } from "@/lib/owner-state";
import { traceOwnerState } from "@/lib/owner-diagnostics";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type Client = SupabaseClient<Database>;

export type CloudSyncErrorKind =
  | "database_missing_table"
  | "not_authenticated"
  | "permission_denied"
  | "not_configured"
  | "network_error"
  | "validation_error"
  | "unknown";

export class CloudSyncError extends Error {
  readonly kind: CloudSyncErrorKind;
  readonly status?: number;
  readonly code?: string;
  readonly actionHint?: string;
  readonly userMessage: string;

  constructor(params: {
    kind: CloudSyncErrorKind;
    userMessage: string;
    actionHint?: string;
    status?: number;
    code?: string;
  }) {
    super(params.userMessage);
    this.name = "CloudSyncError";
    this.kind = params.kind;
    this.userMessage = params.userMessage;
    this.actionHint = params.actionHint;
    this.status = params.status;
    this.code = params.code;
    Object.setPrototypeOf(this, CloudSyncError.prototype);
  }
}

export function classifySupabaseError(error: unknown, status?: number): CloudSyncError {
  if (error instanceof CloudSyncError) return error;

  const errObj = typeof error === "object" && error !== null
    ? (error as { code?: unknown; message?: unknown; details?: unknown; status?: unknown })
    : null;

  const code = typeof errObj?.code === "string" ? errObj.code : undefined;
  const message = typeof errObj?.message === "string"
    ? errObj.message
    : (error instanceof Error ? error.message : String(error ?? ""));
  const rawStatus = typeof status === "number"
    ? status
    : (typeof errObj?.status === "number" ? errObj.status : undefined);

  // 1. Not configured
  if (message.includes("Supabase is not configured")) {
    return new CloudSyncError({
      kind: "not_configured",
      userMessage: "Supabase account sync is not configured on this server.",
      actionHint: "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your environment.",
    });
  }

  // 2. Database table missing (PostgREST PGRST205, Postgres 42P01, HTTP 404 on table endpoint)
  if (
    code === "PGRST205" ||
    code === "42P01" ||
    rawStatus === 404 ||
    message.includes("schema cache") ||
    message.includes("user_meetings")
  ) {
    return new CloudSyncError({
      kind: "database_missing_table",
      status: rawStatus ?? 404,
      code: code ?? "PGRST205",
      userMessage: "The account sync table (public.user_meetings) is missing from your Supabase project.",
      actionHint: "Apply the database migration 'supabase/migrations/20261020164254_add_user_meetings.sql' in your Supabase project SQL Editor to enable cloud meeting sync.",
    });
  }

  // 3. Not authenticated / session expired (HTTP 401, PGRST301, JWT expired/missing)
  if (
    rawStatus === 401 ||
    code === "PGRST301" ||
    message.toLowerCase().includes("jwt") ||
    message.toLowerCase().includes("expired") ||
    message.includes("Auth session missing")
  ) {
    return new CloudSyncError({
      kind: "not_authenticated",
      status: rawStatus ?? 401,
      code: code ?? "401",
      userMessage: "Your session has expired. Please sign in again to sync your meetings.",
      actionHint: "Sign out and sign in again to refresh your account authentication.",
    });
  }

  // 4. Permission denied / RLS policy violation (HTTP 403, 42501)
  if (
    rawStatus === 403 ||
    code === "42501" ||
    message.toLowerCase().includes("policy") ||
    message.toLowerCase().includes("permission denied")
  ) {
    return new CloudSyncError({
      kind: "permission_denied",
      status: rawStatus ?? 403,
      code: code ?? "42501",
      userMessage: "You do not have permission to sync this meeting.",
      actionHint: "Row-level security policies only allow saving meetings belonging to your authenticated account.",
    });
  }

  // 5. Network / Offline error
  if (
    message.includes("Failed to fetch") ||
    message.includes("NetworkError") ||
    message.toLowerCase().includes("offline") ||
    (typeof navigator !== "undefined" && !navigator.onLine)
  ) {
    return new CloudSyncError({
      kind: "network_error",
      status: 0,
      code: "NETWORK_ERROR",
      userMessage: "Network connection lost. Could not connect to Supabase.",
      actionHint: "Check your internet connection and click 'Retry save' to sync.",
    });
  }

  // 6. Validation / payload error (HTTP 400, 22P02, etc.)
  if (
    rawStatus === 400 ||
    code === "22P02" ||
    code?.startsWith("22") ||
    code?.startsWith("23")
  ) {
    return new CloudSyncError({
      kind: "validation_error",
      status: rawStatus ?? 400,
      code,
      userMessage: "Meeting document validation error.",
      actionHint: "Export your plan to prevent data loss.",
    });
  }

  // Fallback unknown
  return new CloudSyncError({
    kind: "unknown",
    status: rawStatus,
    code,
    userMessage: "Could not sync this meeting to your account.",
    actionHint: "Export your plan to keep a copy, or click 'Retry save' to try again.",
  });
}

function requireClient(client?: Client | null): Client {
  const resolved = client ?? createClient();
  if (!resolved) throw classifySupabaseError(new Error("Supabase is not configured"));
  return resolved;
}

function toJson(meeting: MeetingExtraction): Json {
  return JSON.parse(JSON.stringify(meeting)) as Json;
}

function fromJson(document: Json): MeetingExtraction {
  const meeting = syncMeetingOwnerInformation(document as unknown as MeetingExtraction);
  traceOwnerState("hydrated", meeting.actionItems);
  return meeting;
}

export async function saveCloudMeeting(meeting: MeetingExtraction, client?: Client | null): Promise<void> {
  const snapshot = syncMeetingOwnerInformation(meeting);
  const resolvedClient = requireClient(client);
  const { error, status } = await resolvedClient
    .from("user_meetings")
    .upsert({ id: snapshot.id, document: toJson(snapshot), updated_at: snapshot.updatedAt }, { onConflict: "id" });
  if (error) {
    throw classifySupabaseError(error, status);
  }
  traceOwnerState("persisted", snapshot.actionItems);
}

export async function getAllCloudMeetings(client?: Client | null): Promise<MeetingExtraction[]> {
  const resolvedClient = requireClient(client);
  const { data, error, status } = await resolvedClient
    .from("user_meetings")
    .select("document")
    .order("updated_at", { ascending: false });
  if (error) {
    throw classifySupabaseError(error, status);
  }
  return (data ?? []).map(({ document }) => fromJson(document));
}

export async function getCloudMeetingById(id: string, client?: Client | null): Promise<MeetingExtraction | undefined> {
  const resolvedClient = requireClient(client);
  const { data, error, status } = await resolvedClient
    .from("user_meetings")
    .select("document")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw classifySupabaseError(error, status);
  }
  return data ? fromJson(data.document) : undefined;
}

export async function deleteCloudMeeting(id: string, client?: Client | null): Promise<void> {
  const resolvedClient = requireClient(client);
  const { error, status } = await resolvedClient.from("user_meetings").delete().eq("id", id);
  if (error) {
    throw classifySupabaseError(error, status);
  }
}

export async function duplicateCloudMeeting(id: string, client?: Client | null): Promise<MeetingExtraction | undefined> {
  const resolved = requireClient(client);
  const existing = await getCloudMeetingById(id, resolved);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const copy: MeetingExtraction = {
    ...existing,
    id: crypto.randomUUID(),
    title: `${existing.title} (Copy)`,
    createdAt: now,
    updatedAt: now,
  };
  await saveCloudMeeting(copy, resolved);
  return copy;
}
