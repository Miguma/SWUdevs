import { openDB, DBSchema, IDBPDatabase } from "idb";
import { MeetingExtraction } from "@/types/meeting";

interface TambayayongDB extends DBSchema {
  meetings: {
    key: string;
    value: MeetingExtraction;
    indexes: { "by-date": string };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      title: string;
      organization: string;
      meetingDate: string;
      dateUnknown: boolean;
      timezone: string;
      participants: string;
      rawText: string;
      savedAt: string;
    };
  };
}

const DB_NAME = "tambayayong_guest_db";
const DB_VERSION = 1;

export interface GuestDraft {
  id: string;
  title: string;
  organization: string;
  meetingDate: string;
  dateUnknown: boolean;
  timezone: string;
  participants: string;
  rawText: string;
  savedAt: string;
}

let dbPromise: Promise<IDBPDatabase<TambayayongDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TambayayongDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in browser environments"));
  }
  if (!dbPromise) {
    dbPromise = openDB<TambayayongDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("meetings")) {
          const meetingStore = db.createObjectStore("meetings", {
            keyPath: "id",
          });
          meetingStore.createIndex("by-date", "updatedAt");
        }
        if (!db.objectStoreNames.contains("drafts")) {
          db.createObjectStore("drafts", { keyPath: "id" });
        }
      },
    }).catch((error) => { dbPromise = null; throw error; });
  }
  return dbPromise;
}

export async function saveGuestMeeting(meeting: MeetingExtraction): Promise<void> {
  const db = await getDB();
  // The caller owns revision time. Re-saving must not invent a new revision.
  await db.put("meetings", meeting);
}

export async function getAllGuestMeetings(): Promise<MeetingExtraction[]> {
  const db = await getDB();
  const meetings = await db.getAllFromIndex("meetings", "by-date");
  return meetings.reverse(); // Newest first
}

export async function getGuestMeetingById(id: string): Promise<MeetingExtraction | undefined> {
  const db = await getDB();
  return db.get("meetings", id);
}

export async function deleteGuestMeeting(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("meetings", id);
}

export async function duplicateGuestMeeting(id: string): Promise<MeetingExtraction | undefined> {
  const existing = await getGuestMeetingById(id);
  if (!existing) return undefined;

  const duplicated: MeetingExtraction = {
    ...existing,
    id: crypto.randomUUID(),
    title: `${existing.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveGuestMeeting(duplicated);
  return duplicated;
}

export async function clearAllGuestData(): Promise<void> {
  const db = await getDB();
  await db.clear("meetings");
  await db.clear("drafts");
}

// Auto-save intake draft
export async function saveDraftNotes(draft: {
  title: string;
  organization: string;
  meetingDate: string;
  dateUnknown: boolean;
  timezone: string;
  participants: string;
  rawText: string;
}, meetingId?: string, newDraftId = "current_draft"): Promise<void> {
  const db = await getDB();
  await db.put("drafts", {
    ...draft,
    id: meetingId ? `meeting:${meetingId}` : newDraftId,
    savedAt: new Date().toISOString(),
  });
}

export async function getDraftNotes(meetingId?: string, newDraftId = "current_draft"): Promise<
  | {
      title: string;
      organization: string;
      meetingDate: string;
      dateUnknown: boolean;
      timezone: string;
      participants: string;
      rawText: string;
      savedAt: string;
    }
  | undefined
> {
  const db = await getDB();
  return db.get("drafts", meetingId ? `meeting:${meetingId}` : newDraftId);
}

export async function getAllNewMeetingDrafts(): Promise<GuestDraft[]> {
  const db = await getDB();
  const drafts = await db.getAll("drafts");
  return drafts
    .filter((draft) => draft.id === "current_draft" || draft.id.startsWith("draft:"))
    .filter((draft) => Boolean(draft.title.trim() || draft.rawText.trim()))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
