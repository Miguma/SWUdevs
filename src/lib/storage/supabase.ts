import type { SupabaseClient } from "@supabase/supabase-js";
import type { MeetingExtraction } from "@/types/meeting";
import { syncMeetingOwnerInformation } from "@/lib/owner-state";
import { traceOwnerState } from "@/lib/owner-diagnostics";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

type Client = SupabaseClient<Database>;

function requireClient(client?: Client | null): Client {
  const resolved = client ?? createClient();
  if (!resolved) throw new Error("Supabase is not configured");
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
  const { error } = await requireClient(client)
    .from("user_meetings")
    .upsert({ id: snapshot.id, document: toJson(snapshot), updated_at: snapshot.updatedAt }, { onConflict: "id" });
  if (error) throw new Error("Could not save the meeting to your account");
  traceOwnerState("persisted", snapshot.actionItems);
}

export async function getAllCloudMeetings(client?: Client | null): Promise<MeetingExtraction[]> {
  const { data, error } = await requireClient(client)
    .from("user_meetings")
    .select("document")
    .order("updated_at", { ascending: false });
  if (error) throw new Error("Could not load meetings from your account");
  return (data ?? []).map(({ document }) => fromJson(document));
}

export async function getCloudMeetingById(id: string, client?: Client | null): Promise<MeetingExtraction | undefined> {
  const { data, error } = await requireClient(client)
    .from("user_meetings")
    .select("document")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load the meeting from your account");
  return data ? fromJson(data.document) : undefined;
}

export async function deleteCloudMeeting(id: string, client?: Client | null): Promise<void> {
  const { error } = await requireClient(client).from("user_meetings").delete().eq("id", id);
  if (error) throw new Error("Could not delete the meeting from your account");
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
