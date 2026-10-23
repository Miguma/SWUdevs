import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INITIAL_SAMPLE_EXTRACTION } from "@/components/SampleMeetingData";
import { getAllCloudMeetings, saveCloudMeeting, classifySupabaseError, CloudSyncError, getCloudMeetingById, deleteCloudMeeting } from "@/lib/storage/supabase";
import type { Database } from "@/lib/supabase/database.types";
import { didStorageOwnerChange } from "@/lib/storage/ownership";

describe("signed-in meeting storage", () => {
  it("detects account boundaries so an open record is never copied between guest and cloud stores", () => {
    expect(didStorageOwnerChange(undefined, null)).toBe(false);
    expect(didStorageOwnerChange(null, "user-a")).toBe(true);
    expect(didStorageOwnerChange("user-a", null)).toBe(true);
    expect(didStorageOwnerChange("user-a", "user-b")).toBe(true);
    expect(didStorageOwnerChange("user-a", "user-a")).toBe(false);
  });

  it("writes the exact meeting document without accepting a browser-supplied user id", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upsert });
    const client = { from } as unknown as SupabaseClient<Database>;

    await saveCloudMeeting(INITIAL_SAMPLE_EXTRACTION, client);

    expect(from).toHaveBeenCalledWith("user_meetings");
    const [record, options] = upsert.mock.calls[0];
    expect(record).toMatchObject({
      id: INITIAL_SAMPLE_EXTRACTION.id,
      document: { id: INITIAL_SAMPLE_EXTRACTION.id, title: INITIAL_SAMPLE_EXTRACTION.title },
      updated_at: INITIAL_SAMPLE_EXTRACTION.updatedAt,
    });
    expect(record).not.toHaveProperty("user_id");
    expect(options).toEqual({ onConflict: "id" });
  });

  it("hydrates cloud documents in server-provided update order", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ document: JSON.parse(JSON.stringify(INITIAL_SAMPLE_EXTRACTION)) }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const client = { from: vi.fn().mockReturnValue({ select }) } as unknown as SupabaseClient<Database>;

    const meetings = await getAllCloudMeetings(client);

    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(meetings).toHaveLength(1);
    expect(meetings[0].id).toBe(INITIAL_SAMPLE_EXTRACTION.id);
  });
});

describe("user_meetings migration", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20261020164254_add_user_meetings.sql"),
    "utf8",
  );

  it("enables RLS and scopes every operation to auth.uid()", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on table public.user_meetings from anon");
    expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(5);
    expect(migration).toContain("references auth.users(id) on delete cascade");
  });
});

describe("Supabase error classification and diagnostics", () => {
  it("classifies missing table (404 PGRST205) with clear migration instructions", () => {
    const error = classifySupabaseError(
      { code: "PGRST205", message: "Could not find the table 'public.user_meetings' in the schema cache" },
      404
    );
    expect(error).toBeInstanceOf(CloudSyncError);
    expect(error.kind).toBe("database_missing_table");
    expect(error.status).toBe(404);
    expect(error.code).toBe("PGRST205");
    expect(error.userMessage).toContain("public.user_meetings");
    expect(error.actionHint).toContain("20261020164254_add_user_meetings.sql");
  });

  it("classifies session expiration and unauthenticated requests", () => {
    const error = classifySupabaseError({ code: "PGRST301", message: "JWT expired" }, 401);
    expect(error.kind).toBe("not_authenticated");
    expect(error.status).toBe(401);
    expect(error.userMessage).toContain("session has expired");
  });

  it("classifies permission and RLS violations", () => {
    const error = classifySupabaseError({ code: "42501", message: "new row violates row-level security policy" }, 403);
    expect(error.kind).toBe("permission_denied");
    expect(error.status).toBe(403);
    expect(error.userMessage).toContain("permission");
  });

  it("classifies network and offline errors", () => {
    const error = classifySupabaseError(new Error("Failed to fetch"));
    expect(error.kind).toBe("network_error");
    expect(error.userMessage).toContain("Network connection lost");
    expect(error.actionHint).toContain("Retry save");
  });

  it("classifies unconfigured Supabase gracefully", () => {
    const error = classifySupabaseError(new Error("Supabase is not configured"));
    expect(error.kind).toBe("not_configured");
    expect(error.actionHint).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("keeps diagnostics safe without leaking bearer tokens or notes", () => {
    const rawError = {
      code: "PGRST205",
      message: "Could not find the table 'public.user_meetings' in the schema cache",
      details: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive_payload",
    };
    const classified = classifySupabaseError(rawError, 404);
    expect(classified.userMessage).not.toContain("eyJ");
    expect(classified.userMessage).not.toContain("Bearer");
    expect(classified.actionHint).not.toContain("eyJ");
    expect(classified.code).toBe("PGRST205");
    expect(classified.status).toBe(404);
  });

  it("saveCloudMeeting throws classified CloudSyncError on missing table", async () => {
    const upsert = vi.fn().mockResolvedValue({
      error: { code: "PGRST205", message: "Could not find the table 'public.user_meetings' in the schema cache" },
      status: 404,
    });
    const client = { from: vi.fn().mockReturnValue({ upsert }) } as unknown as SupabaseClient<Database>;

    await expect(saveCloudMeeting(INITIAL_SAMPLE_EXTRACTION, client)).rejects.toMatchObject({
      name: "CloudSyncError",
      kind: "database_missing_table",
      status: 404,
      code: "PGRST205",
    });
  });

  it("getAllCloudMeetings, getCloudMeetingById, and deleteCloudMeeting propagate CloudSyncError", async () => {
    const mockMissingTable = {
      error: { code: "PGRST205", message: "Could not find table" },
      status: 404,
    };
    const client = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockMissingTable),
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue(mockMissingTable),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockMissingTable),
        }),
      }),
    } as unknown as SupabaseClient<Database>;

    await expect(getAllCloudMeetings(client)).rejects.toBeInstanceOf(CloudSyncError);
    await expect(getCloudMeetingById("test-id", client)).rejects.toBeInstanceOf(CloudSyncError);
    await expect(deleteCloudMeeting("test-id", client)).rejects.toBeInstanceOf(CloudSyncError);
  });
});
