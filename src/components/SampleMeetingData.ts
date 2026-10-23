import { MeetingExtraction } from "@/types/meeting";
import { verifyEvidenceQuote } from "@/server/services/evidence-verifier";

export interface SampleMeeting {
  title: string;
  organization: string;
  meetingDate: string;
  timezone: string;
  participants: string;
  rawText: string;
}

export const SAMPLE_CEBUANO_ENGLISH_MEETING: SampleMeeting = {
  title: "Community Outreach Planning",
  organization: "Tambayayong",
  meetingDate: "2026-10-19",
  timezone: "Asia/Manila",
  participants: "Ana, Maria, John, Carlo, Lena",
  rawText: `Tambayayong Community Outreach Planning — October 19, 2026

Ana: Maayong gabi, team! For our outreach event, need nato og posters and venue.
Maria: Ako bahala sa poster. I'll finish it by October 23, 2026.
John: I will reserve the barangay hall tomorrow, ugma gyud.
Carlo: Maybe ako magdala sa sound system, pero dili pa sure.
Ana: We agreed to hold the event on November 7, 2026.
John: Si Lena unta sa sponsors? Wait, wala pa tay assigned sa sponsors. Who can take this?`,
};

const raw = SAMPLE_CEBUANO_ENGLISH_MEETING.rawText;

export const INITIAL_SAMPLE_EXTRACTION: MeetingExtraction = {
  id: "sample-outreach-2026-10-19",
  title: SAMPLE_CEBUANO_ENGLISH_MEETING.title,
  organization: SAMPLE_CEBUANO_ENGLISH_MEETING.organization,
  meetingDate: SAMPLE_CEBUANO_ENGLISH_MEETING.meetingDate,
  timezone: SAMPLE_CEBUANO_ENGLISH_MEETING.timezone,
  participants: SAMPLE_CEBUANO_ENGLISH_MEETING.participants,
  rawTranscript: raw,
  summary:
    "The team planned the November 7 community outreach event, assigning poster design to Maria and barangay hall reservation to John, while Carlo tentatively offered the sound system and sponsor outreach remains unassigned.",
  actionItems: [
    {
      id: "sample-act-1",
      title: "Finish event poster",
      description: "Poster for the outreach event.",
      assignees: ["Maria"],
      deadline: {
        originalText: "October 23, 2026",
        date: "2026-10-23",
        time: null,
        timezone: "Asia/Manila",
        relation: "by",
        isAmbiguous: false,
      },
      commitmentStatus: "confirmed",
      priority: "medium",
      evidence: verifyEvidenceQuote(
        raw,
        "Maria: Ako bahala sa poster. I'll finish it by October 23, 2026."
      ).verifiedEvidence,
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved",
      status: "in_progress",
    },
    {
      id: "sample-act-2",
      title: "Reserve barangay hall",
      description: "Venue reservation for the event.",
      assignees: ["John"],
      deadline: {
        originalText: "tomorrow",
        date: "2026-10-20",
        time: null,
        timezone: "Asia/Manila",
        relation: "by",
        isAmbiguous: false,
      },
      commitmentStatus: "confirmed",
      priority: "high",
      evidence: verifyEvidenceQuote(
        raw,
        "John: I will reserve the barangay hall tomorrow, ugma gyud."
      ).verifiedEvidence,
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved",
      status: "todo",
    },
    {
      id: "sample-act-3",
      title: "Bring the sound system",
      description: "Sound system for the event.",
      assignees: ["Carlo"],
      deadline: {
        originalText: null,
        date: null,
        time: null,
        timezone: "Asia/Manila",
        relation: null,
        isAmbiguous: true,
      },
      commitmentStatus: "proposed",
      priority: "medium",
      evidence: verifyEvidenceQuote(
        raw,
        "Carlo: Maybe ako magdala sa sound system, pero dili pa sure."
      ).verifiedEvidence,
      missingInformation: [
        "Commitment is tentative ('dili pa sure')",
        "No specific deadline mentioned",
      ],
      needsReview: true,
      reviewStatus: "pending",
      status: "todo",
    },
    {
      id: "sample-act-4",
      title: "Find event sponsors",
      description: "Find and coordinate sponsors.",
      assignees: [],
      deadline: {
        originalText: null,
        date: null,
        time: null,
        timezone: "Asia/Manila",
        relation: null,
        isAmbiguous: true,
      },
      commitmentStatus: "unclear",
      priority: "medium",
      evidence: verifyEvidenceQuote(
        raw,
        "John: Si Lena unta sa sponsors? Wait, wala pa tay assigned sa sponsors. Who can take this?"
      ).verifiedEvidence,
      missingInformation: ["Needs responsible person", "No deadline specified"],
      needsReview: true,
      reviewStatus: "pending",
      status: "todo",
    },
    {
      id: "sample-act-5",
      title: "Hold the outreach event",
      description: "Community outreach event day.",
      assignees: ["Team"],
      deadline: {
        originalText: "November 7, 2026",
        date: "2026-11-07",
        time: null,
        timezone: "Asia/Manila",
        relation: "on",
        isAmbiguous: false,
      },
      commitmentStatus: "confirmed",
      priority: "high",
      evidence: verifyEvidenceQuote(
        raw,
        "Ana: We agreed to hold the event on November 7, 2026."
      ).verifiedEvidence,
      missingInformation: [],
      needsReview: false,
      reviewStatus: "approved",
      status: "todo",
    },
  ],
  decisions: [
    {
      id: "sample-dec-1",
      decision: "Hold the community outreach event on November 7, 2026.",
      evidence: verifyEvidenceQuote(
        raw,
        "Ana: We agreed to hold the event on November 7, 2026."
      ).verifiedEvidence,
      needsReview: false,
      reviewStatus: "approved",
    },
  ],
  openQuestions: [
    {
      id: "sample-q-1",
      question: "Who will be assigned to find and coordinate with sponsors?",
      evidence: verifyEvidenceQuote(
        raw,
        "John: Si Lena unta sa sponsors? Wait, wala pa tay assigned sa sponsors. Who can take this?"
      ).verifiedEvidence,
      needsReview: true,
      reviewStatus: "pending",
      status: "open",
      answer: null,
    },
  ],
  nextMeeting: null,
  warnings: [],
  createdAt: "2026-10-19T14:00:00.000Z",
  updatedAt: "2026-10-19T14:00:00.000Z",
};
