# Tambayayong — Technical and product guide

**Project Name:** Tambayayong

**Tagline:** *From conversation to action. Walay mabilin!* ("Better together — no idea or teammate left behind.")

**Category:** Open-source bilingual (English and Cebuano) meeting-to-action workspace

**Repository:** `https://github.com/Miguma/SWUdevs`

---

## 1. Executive Summary & Core Philosophy

**Tambayayong** transforms unstructured English, Cebuano, and code-switched (Bislish) meeting notes, chat logs, and transcripts into structured, human-verified action plans.

### Core Architectural Principles
1. **Explicit Open-Weight Inference:** The app uses the Apache-2.0 Qwen 3.8 27B model through Groq's free tier. Notes are sent only after the user confirms the transfer. It never switches models or providers.
2. **Evidence-Grounded Extraction:** Every extracted action item, decision, and open question must cite a verbatim passage from the raw meeting notes. A deterministic verifier locates character offsets (`startOffset`, `endOffset`) and assigns provenance (`exact_match`, `normalized_match`, `unverified`, or `manual`).
3. **Provenance vs. Semantics Separation:** Locating a quote in the transcript proves **textual provenance only**—it does not prove task ownership, commitment, or human approval. Unsupported assignees or deadlines not grounded in the item's cited quote are stripped or flagged for review.
4. **Human-in-the-Loop Control:** AI outputs start in `pending` review status. Users can inspect source quotes, edit fields, approve (`approved`), or dismiss (`rejected`) items before exporting. Rejected items are never exported as commitments.
5. **Local-First Guest Privacy & Single-Owner Persistence:** Guest meetings and drafts are stored in browser-local IndexedDB (`tambayayong_guest_db`). The root page owns meeting persistence via a serialized snapshot queue (`createSerialMeetingSaver`), preventing race conditions and preserving user edits across re-analysis passes (`reconcileMeeting`).

---

## 2. Technology Stack

| Layer | Technology | Version / Details |
| :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `14.2.35` (`output: "standalone"`) |
| **Language** | TypeScript | `^5.6.3` (strict mode, checked via `tsconfig.check.json`) |
| **UI Library** | React | `18.3.1` |
| **Styling** | Tailwind CSS | `^3.4.14` + custom CSS variables (`#F8FAF8` canvas, `#247D59` pine green, `#172B24` ink) |
| **Icons** | HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`) | `@hugeicons/react` `^1.1.10`, free set `^4.3.5` |
| **Validation** | Zod | `^3.23.8` (request payloads & structured LLM JSON outputs) |
| **Client Persistence** | IndexedDB (`idb`) | `^8.0.0` (`meetings` and `drafts` object stores) |
| **AI Inference** | Groq free tier | Pinned `qwen/qwen3.8-27b` chat completion |
| **Date Handling** | `date-fns` + deterministic resolver | `^3.6.0` + bilingual English/Cebuano relative deadline parser |
| **Testing** | Vitest + `fake-indexeddb` | See `docs/validation.md` for the latest observed results |
| **Containerization** | Docker + Docker Compose | Next.js and PostgreSQL services |

---

## 3. Repository & Directory Structure

```text
Tambayayong/
├── .github/workflows/ci.yml           # GitHub Actions CI pipeline (eval:validate, test, typecheck, build)
├── Dockerfile                         # Multi-stage production container build
├── docker-compose.yml                 # Orchestrates Next.js and PostgreSQL
├── AGENTS.md                          # Engineering & verification operating rules
├── docs/
│   ├── validation.md                  # Observed verification results & environment notes
│   ├── workspace-consolidation.md     # Workspace consolidation notes
│   ├── ui-preview.md                  # UI & preview route notes
│   └── PROJECT_DOCUMENTATION.md       # Full project documentation
├── specs/                             # Spec-Driven Development (SDD) documents (01 to 12)
├── eval/
│   ├── dataset.json                   # 20 human-annotated benchmark cases (6 EN, 7 CEB, 7 Mixed)
│   ├── metrics.ts                     # One-to-one lexical matching & precision/recall/F1 scorer
│   ├── validate-dataset.ts            # Deterministic dataset & schema validator (npm run eval:validate)
│   ├── run-model-eval.ts              # Live pinned cloud-model benchmark runner (npm run eval:model)
│   └── run-eval.ts                    # Delegates to live runner (no synthetic fallback)
├── src/
│   ├── app/
│   │   ├── globals.css                # Brand color tokens & base styles
│   │   ├── layout.tsx                 # Root HTML layout & metadata
│   │   ├── page.tsx                   # Landing page and tool entry point
│   │   ├── what-is/page.tsx           # Product explainer route
│   │   ├── how-it-works/page.tsx      # Workflow explainer route
│   │   ├── privacy/page.tsx           # Privacy policy route
│   │   ├── terms/page.tsx             # Terms of service route
│   │   └── api/
│   │       ├── health/route.ts        # App health endpoint (GET /api/health)
│   │       ├── ai/health/route.ts     # Cloud model availability (GET /api/ai/health)
│   │       └── meetings/
│   │           ├── analyze/route.ts   # Rate-limited AI extraction endpoint (POST /api/meetings/analyze)
│   │           └── [id]/export/route.ts # Server-side Markdown/CSV export (POST /api/meetings/[id]/export)
│   ├── components/
│   │   ├── Workspace.tsx              # Single-page notes and review workspace owner
│   │   ├── MeetingIntake.tsx          # Step 1 card: metadata, participant pills, transcript editor, file upload
│   │   ├── ReviewWorkspace.tsx        # Step 2 card: progress, task stream, evidence and export
│   │   ├── MeetingHistoryModal.tsx    # Modal for reopening, duplicating, or deleting IndexedDB meetings
│   │   ├── SampleMeetingData.ts       # Bilingual example and hand-authored review preview
│   │   ├── Brand.tsx                  # Shared brand mark component
│   │   ├── LandingNav.tsx             # Static landing header and footer route links
│   │   ├── InfoPage.tsx               # Shared shell for the explainer routes
│   │   ├── LegalPage.tsx              # Shared shell for the legal routes
│   │   ├── InlineNotice.tsx           # Inline status/notice component
│   │   ├── DatePicker.tsx             # Accessible calendar popover
│   │   ├── icons.tsx                  # HugeIcons wrapper re-exports
│   │   └── review/
│   │       ├── ActionItemCard.tsx     # Selectable task card with checkbox, status badge, metadata, source link
│   │       ├── ActionItemEditor.tsx   # Inline editor (returns edited tasks to pending review)
│   │       ├── DecisionSection.tsx    # Confirmed decisions list with approve/dismiss & quote inspection
│   │       ├── OpenQuestionsSection.tsx # Open questions list with approve/dismiss & quote inspection
│   │       ├── EvidenceInspector.tsx  # Full-transcript modal highlighting exact character offsets
│   │       └── ExportPanel.tsx        # Side-by-side Markdown (.md) and formula-safe CSV (.csv) export card
│   ├── lib/
│   │   ├── meeting-workflow.ts        # reconcileMeeting, getReviewProgress, createSerialMeetingSaver
│   │   ├── use-dialog-focus.ts        # Accessible modal focus trap & Escape handler
│   │   ├── utils.ts                   # Date formatting & class utilities
│   │   └── storage/
│   │       └── indexeddb.ts           # Browser IndexedDB CRUD for guest meetings & scoped drafts
│   ├── server/
│   │   ├── db/schema.ts               # Optional PostgreSQL schema reference
│   │   └── services/
│   │       ├── extraction-core.ts     # Shared prompt, schema, source checks, and extraction assembly
│   │       ├── groq-client.ts         # Pinned cloud model, health check, and inference limits
│   │       ├── deadline-resolver.ts   # Bilingual EN/Cebuano relative deadline resolver
│   │       ├── evidence-verifier.ts   # Verbatim & whitespace-normalized substring offset locator
│   │       ├── transcript-preprocessor.ts # Normalizes .txt, .md, and .csv uploads
│   │       └── export-service.ts      # Markdown checklist & RFC 4180 CSV generator (CWE-1236 safe)
│   └── types/
│       └── meeting.ts                 # TypeScript interfaces & Zod schemas (MeetingExtraction, ActionItem, etc.)
└── tests/                             # Vitest regressions; see validation.md for latest results
```

---

## 4. Data Contracts & Schemas (`src/types/meeting.ts`)

### 4.1 Core Domain Model (`MeetingExtraction`)
```typescript
export type ReviewStatus = "pending" | "approved" | "rejected";
export type CommitmentStatus = "confirmed" | "proposed" | "unclear";
export type PriorityLevel = "low" | "medium" | "high" | null;
export type DeadlineRelation = "before" | "by" | "on" | "after" | null;
export type EvidenceProvenance = "exact_match" | "normalized_match" | "unverified" | "manual";

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
  date: string | null;       // ISO YYYY-MM-DD (or null if unresolved/ambiguous)
  time: string | null;       // HH:mm (only when an explicit clock time is stated)
  timezone: string;
  relation: DeadlineRelation;
  isAmbiguous: boolean;
}

export interface ActionItem {
  id: string;
  sourceTitle?: string;      // Preserves original AI title across user edits for re-analysis matching
  retainedFromReview?: boolean;
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
  isUserEdited?: boolean;
  isManual?: boolean;
}
```

---

## 5. Backend Services & AI Pipeline (`src/server/services/`)

### 5.1 Pinned Open-Weight Cloud Inference (`groq-client.ts`)
- Requires `GROQ_API_KEY` on the server and checks the authenticated Groq model catalog for the exact `qwen/qwen3.8-27b` model. The key never appears in browser responses. Catalog presence does not guarantee unused free-tier quota.
- Sends notes to Groq only after the user confirms the transfer. A missing key, unavailable model, timeout, malformed output, or model identity mismatch returns an error without trying another model.
- Caps input length at 24,000 characters, output at 4,096 tokens, and concurrent cloud requests at two. It rejects truncated or empty results.
- Records the model and provider in the saved analysis. `extraction-core.ts` holds the bilingual prompt, JSON schema, and deterministic post-inference source checks.

### 5.1a Extraction Assembly (`extraction-core.ts`)
- The bilingual prompt distinguishes negation, reassignment, proposals, and confirmed commitments in English and Cebuano.
- `assembleMeetingExtraction` verifies every extracted assignee name and deadline phrase against the item's cited quote. Unsupported details are stripped or flagged for review.
### 5.2 Bilingual Relative Deadline Resolver (`deadline-resolver.ts`)
- Resolves English and Cebuano relative expressions against the meeting's reference date (`meetingDate`):
  - `"today"` / `"karong adlawa"` / `"karong gabii"` -> `+0 days`
  - `"tomorrow"` / `"ugma"` -> `+1 day`
  - `"next week"` / `"sunod semana"` -> no exact date without a specified day; flagged as ambiguous
  - `"this <Weekday>"` / `"karong <Adlaw>"` (e.g., *Lunes, Martes, Miyerkules, Huwebes, Biyernes, Sabado, Dominggo*)
- **No Fabricated Timestamps:** Vague dayparts (*"ugma sa hapon"*, *"tonight"*) resolve the calendar date (when `meetingDate` is known) without inventing fake `HH:mm` clock times, and set `isAmbiguous: true`.
- **No Arbitrary Year Defaults:** Month/day expressions without a year (*"October 26"*) inherit the year from `meetingDate` only if `meetingDate` is provided; if `meetingDate` is unknown, `date` remains `null` and `isAmbiguous: true`. Invalid calendar dates (e.g., `2026-02-30`) are rejected.

### 5.3 Verbatim Evidence Verifier (`evidence-verifier.ts`)
- **Tier 1 (`exact_match`):** Exact substring lookup (`rawTranscript.indexOf(trimmedQuote)`), recording exact `startOffset` and `endOffset`.
- **Tier 2 (`normalized_match`):** Case-insensitive, whitespace-flexible regular expression match against the original transcript so CRLF line breaks or Unicode casing differences never shift character offsets.
- **Tier 3 (`unverified`):** If the quote cannot be found, `startOffset` and `endOffset` are set to `null`, `isVerified: false`, and `provenance: "unverified"`.
- **Manual Items (`manual`):** Items added manually during review use `createManualEvidence()` with `provenance: "manual"` and are never rendered as AI transcript quotes.

### 5.4 Re-Analysis & Single-Owner Persistence (`src/lib/meeting-workflow.ts`)
- **`reconcileMeeting(previous, fresh)`:** When a user edits meeting notes and re-runs analysis:
  - Preserves the meeting's `id` and `createdAt`.
  - Matches items one-to-one by normalized `sourceTitle`/`title` or shared quote + lexical overlap.
  - Retains human-edited (`isUserEdited`), manual (`isManual`), and previously reviewed items.
  - Re-anchors all citations against the revised `rawTranscript`.
  - Resets `reviewStatus` to `"pending"` whenever the source transcript/date/timezone changed or the AI extraction content changed on an unedited item.
- **`createSerialMeetingSaver(write)`:** Clones each `MeetingExtraction` snapshot (`structuredClone`) and serializes writes in invocation order so a failed or slow IndexedDB write never drops or overwrites subsequent saves.

### 5.5 Export Service & Formula Injection Defense (`export-service.ts`)
- **Markdown Export (`generateMarkdownExport`):** Produces a structured document with meeting metadata, summary, approved action items (with assignees, deadlines, commitment status, provenance labels, and quotes), confirmed decisions, and open questions.
- **CSV Export (`generateCsvExport`):** Generates an RFC 4180 CSV with CWE-1236 spreadsheet formula injection defense—neutralizing leading `=`, `+`, `-`, `@`, `\t`, or `\r` characters (even when preceded by leading whitespace) by prefixing a single quote (`'`).

---

## 6. UI/UX Workspace Architecture

The home page (`src/app/page.tsx`) keeps meeting notes beside the review plan on wide screens and stacks them on narrower screens:

1. **Top header:** Brand, available AI status, saved work, and new meeting controls. The status polls `/api/ai/health` every 30 seconds.
2. **Meeting notes:** A fresh browser starts empty; an existing draft restores from IndexedDB. The form contains meeting metadata, participants, text/file intake, the pinned open-weight cloud model, and explicit transfer confirmation. New-meeting drafts use `current_draft` or a `draft:<uuid>` key; edited meeting drafts use `meeting:<id>`. Saved work can reopen new-meeting drafts.
3. **Example preview:** **Explore example** loads hand-authored example items and displays an illustrative-preview notice. The preview is not saved as an AI result. Real analysis replaces it with model output.
4. **Action review:** Progress covers actions, decisions, and questions. Compact counts call out missing owners and dates. Filters, manual additions, editing, approval, dismissal, source inspection, and Markdown/CSV export remain available. A located quote establishes text provenance; the reviewer checks whether it supports the task details.

---

## 7. API Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Returns application liveness and timestamp. |
| `/api/ai/health` | `GET` | Checks the configured Groq cloud model. |
| `/api/meetings/analyze` | `POST` | Validates intake payload (max 1 MB, sliding-window rate limit of 10 req/min/IP), requires transfer confirmation, invokes the pinned cloud model, resolves relative deadlines, verifies quote offsets, and returns `MeetingExtraction`. |
| `/api/meetings/[id]/export` | `POST` | Generates downloadable `.md` or `.csv` file responses from a validated `MeetingExtraction` payload. |

---

## 8. Evaluation Harness & Testing (`eval/` & `tests/`)

### 8.1 Two Independent Evaluation Commands
- **`npm run eval:validate` (`eval/validate-dataset.ts`):** Validates the 20 human-labeled benchmark cases (`6` English, `7` Cebuano, `7` mixed) in `eval/dataset.json` for schema integrity, verbatim quote existence, and assignee grounding. Does not claim model accuracy.
- **`npm run eval:model` (`eval/run-model-eval.ts`):** Invokes the pinned cloud model on each benchmark case using only source fields (`title`, `meetingDate`, `timezone`, `rawText`). Never substitutes ground-truth labels for empty or failed predictions. If the provider is unavailable, exits `1` and writes `status: "NOT_RUN"` with `null` metrics.

### 8.2 Observed Validation Results
| Check | Command | Observed Result |
| :--- | :--- | :--- |
| **TypeScript Check** | `npm run typecheck` | **Passed** (`0` errors across `src/`, `tests/`, and `eval/`) |
| **Unit & Integration Tests** | `npm test` | See `docs/validation.md` for the latest exact result. |
| **Dataset Validation** | `npm run eval:validate` | **Passed** (`20` cases validated: `6` English, `7` Cebuano, `7` mixed) |
| **Production Build** | `npm run build` | See `docs/validation.md` for the latest exact result. |
| **Live Dev Server** | `npm run dev` | **Verified** on `http://localhost:3000`; `/api/health` returned HTTP 200 |
| **Live Model Evaluation** | `npm run eval:model` | See `docs/validation.md` for the latest observed result. The runner reports `NOT_RUN` when the selected provider is unavailable. |

For the full command history, browser observations, sandbox limits, and Docker blocker, see [validation.md](validation.md). The `/sign-in` and `/sign-up` routes are account-screen previews; they do not create accounts or sessions.
