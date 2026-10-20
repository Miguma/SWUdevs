import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INITIAL_SAMPLE_EXTRACTION } from "@/components/SampleMeetingData";
import { getAllCloudMeetings, saveCloudMeeting } from "@/lib/storage/supabase";
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
