import { z } from "zod";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "completed";
export type QuestionAnswerStatus = "open" | "answered";
export type CommitmentStatus = "confirmed" | "proposed" | "unclear";
export type PriorityLevel = "low" | "medium" | "high" | null;
export type DeadlineRelation = "before" | "by" | "on" | "after" | null;

export type EvidenceProvenance =
  | "exact_match"
  | "normalized_match"
  | "unverified"
  | "manual";

export interface Evidence {
  quote: string;
  startOffset: number | null;
  endOffset: number | null;
  isVerified?: boolean;
  provenance?: EvidenceProvenance;
  provenanceNote?: string;
}

export interface Deadline {
  originalText: string | null;
  date: string | null; // ISO YYYY-MM-DD
  time: string | null; // HH:mm
  timezone: string;
  relation: DeadlineRelation;
  isAmbiguous: boolean;
}

export interface ActionItem {
  sourceTitle?: string;
  retainedFromReview?: boolean;
  id: string;
  title: string;
  description: string | null;
  assignees: string[];
  deadline: Deadline;
  commitmentStatus: CommitmentStatus;
  priority: PriorityLevel;
  evidence: Evidence[];
  missingInformation: string[];
  needsReview: boolean;
  reviewStatus: ReviewStatus;
  status?: TaskStatus;
  isUserEdited?: boolean;
  isManual?: boolean;
}

export interface MeetingDecision {
  retainedFromReview?: boolean;
  id: string;
  decision: string;
  evidence: Evidence[];
  needsReview: boolean;
  reviewStatus: ReviewStatus;
  isUserEdited?: boolean;
  isManual?: boolean;
}

export interface OpenQuestion {
  retainedFromReview?: boolean;
  id: string;
  question: string;
  evidence: Evidence[];
  needsReview: boolean;
  reviewStatus: ReviewStatus;
  status?: QuestionAnswerStatus;
  answer?: string | null;
  isUserEdited?: boolean;
  isManual?: boolean;
}

export interface MeetingExtraction {
  id: string;
  title: string;
  organization?: string;
  meetingDate?: string;
  timezone: string;
  rawTranscript: string;
  participants?: string;
  analysis?: { provider?: "ollama" | "huggingface" | "groq"; model: string; analyzedAt: string };
  summary: string;
  actionItems: ActionItem[];
  decisions: MeetingDecision[];
  openQuestions: OpenQuestion[];
  nextMeeting: Deadline | null;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
}

// Zod schema for the model's raw extraction JSON
export const RawExtractionResponseSchema = z.object({
  summary: z.string(),
  actionItems: z.array(
    z.object({
      title: z.string(),
      description: z.string().nullable().default(null),
      assignees: z.array(z.string()).default([]),
      originalDeadlineText: z.string().nullable().default(null),
      deadlineRelation: z
        .enum(["before", "by", "on", "after"])
        .nullable()
        .default(null),
      commitmentStatus: z
        .enum(["confirmed", "proposed", "unclear"])
        .default("confirmed"),
      priority: z.enum(["low", "medium", "high"]).nullable().default(null),
      evidenceQuote: z.string().default(""),
      missingInformation: z.array(z.string()).default([]),
    }),
  ),
  decisions: z.array(
    z.object({
      decision: z.string(),
      evidenceQuote: z.string().default(""),
    }),
  ),
  openQuestions: z.array(
    z.object({
      question: z.string(),
      evidenceQuote: z.string().default(""),
    }),
  ),
  nextMeetingText: z.string().nullable().default(null),
});

export type RawExtractionResponse = z.infer<typeof RawExtractionResponseSchema>;

// Intake Form Validation Schema
export const MeetingIntakeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Meeting title is required")
    .max(200, "Title is too long"),
  organization: z.string().max(100).optional().default(""),
  meetingDate: z
    .string()
    .refine(
      (value) =>
        !value ||
        (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
          !Number.isNaN(Date.parse(value)) &&
          new Date(value).toISOString().slice(0, 10) === value),
      "Invalid meeting date",
    )
    .optional()
    .default(""),
  dateUnknown: z.boolean().default(false),
  timezone: z
    .string()
    .refine((value) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }, "Invalid timezone")
    .default("Asia/Manila"),
  model: z.string().max(200).optional(),
  provider: z.literal("groq").default("groq"),
  cloudConsent: z.boolean().default(false),
  participants: z.string().optional().default(""),
  rawText: z
    .string()
    .min(10, "Meeting notes must be at least 10 characters long")
    .max(100000, "Notes exceed maximum 100,000 characters limit"),
});

export type MeetingIntakeInput = z.infer<typeof MeetingIntakeSchema>;
