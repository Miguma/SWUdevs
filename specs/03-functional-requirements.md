# Spec 03: Functional Requirements

## 1. Input Processing & Validation (FR-1)
- **FR-1.1:** The system shall accept plain text meeting notes up to 100,000 characters.
- **FR-1.2:** The system shall reject empty, whitespace-only, or binary inputs with clear user-facing messages.
- **FR-1.3:** The system shall accept transcript uploads in `.txt`, `.md`, and `.csv` formats (up to 5MB).
- **FR-1.4:** When a `.csv` transcript is uploaded, the parser shall detect transcript text columns (e.g. `text`, `message`, `content`, `utterance`, or column index 0/1) and extract sequential dialogue.
- **FR-1.5:** The meeting intake form shall capture:
  - `title` (required, 1-200 characters)
  - `organization` (optional, 0-100 characters)
  - `meetingDate` (required unless `dateUnknown` is true, format: YYYY-MM-DD)
  - `timezone` (required, IANA timezone string, default: `Asia/Manila`)
  - `participants` (optional string or tag list)
  - `rawText` (required, min 10 characters).

---

## 2. Extraction Pipeline (FR-2)
- **FR-2.1:** Extraction must execute via local Ollama inference using `qwen3:4b-instruct` (or configured Ollama model).
- **FR-2.2:** Output format must be strictly enforced through JSON Schema structured output mode in Ollama.
- **FR-2.3:** The extraction service shall produce:
  - `summary`: Concise factual summary (2-4 sentences).
  - `actionItems`: List of actionable commitments.
  - `decisions`: Explicit agreements made by the group.
  - `openQuestions`: Unanswered queries or topics requiring follow-up.
  - `nextMeeting`: Explicit next meeting date/time if stated, else null.
  - `warnings`: Extraction notes or ambiguities.
- **FR-2.4:** For each `actionItem`:
  - `title`: Short imperative action (e.g., "Design event poster").
  - `description`: Contextual notes or details.
  - `assignees`: String array of named persons or empty array if unassigned.
  - `deadline`: Object containing `originalText`, `date` (ISO 8601 YYYY-MM-DD or null), `time` (HH:mm or null), `timezone`, `relation` (`before` | `by` | `on` | `after`), and `isAmbiguous` (boolean).
  - `commitmentStatus`: `confirmed` | `proposed` | `unclear`.
  - `priority`: `low` | `medium` | `high` | null.
  - `evidence`: Array of `{ quote: string, startOffset: number | null, endOffset: number | null }`.
  - `missingInformation`: Array of specific missing fields (e.g., ["assignee", "deadline"]).
  - `needsReview`: Boolean flag (true if missing owner, ambiguous deadline, proposed status, or unverified quote).
- **FR-2.5:** Post-processing Evidence Verification & Provenance:
  - The backend service must search the raw meeting text for the exact verbatim quote (`provenance = 'exact_match'`).
  - If exact match fails, perform normalized whitespace and casing matching (`provenance = 'normalized_match'`).
  - If match is not found in source text, flag as `provenance = 'unverified'` and set `needsReview = true`.
  - User-created tasks in review are designated `provenance = 'manual'` and are never described as AI transcript quotes.
- **FR-2.6:** Relative Deadline Resolver:
  - Relative temporal phrases ("ugma", "tomorrow", "this Friday", "next Monday", "before Oct 25") must be resolved relative to the user-provided `meetingDate` and `timezone`.
  - Vague dayparts (e.g., "ugma sa hapon") must not have artificial exact hour timestamps fabricated (time remains null or preserved in originalText).
  - If `meetingDate` is unknown, relative dates must NOT be guessed from server system time; they must remain `date = null` with `isAmbiguous = true`.

---

## 3. Human-In-The-Loop Review Workspace (FR-3)
- **FR-3.1:** Extracted items shall display in an interactive review list with statuses: `pending`, `approved`, `rejected`.
- **FR-3.2:** Users can modify all fields of an action item inline without losing original AI extraction history.
- **FR-3.3:** Users can add new manual action items, decisions, and open questions.
- **FR-3.4:** Users can permanently delete extracted or manual items.
- **FR-3.5:** Review progress bar dynamically displays percent and count of items reviewed.
- **FR-3.6:** Highlighting interaction: Clicking an evidence quote highlights the corresponding characters in the original transcript view.

---

## 4. Export Generation (FR-4)
- **FR-4.1 Markdown Export:**
  - Generates downloadable `.md` file and provides a 1-click "Copy to Clipboard" button.
  - Markdown layout includes metadata header, summary, approved tasks with markdown checkboxes (`- [ ]`), owner and due date, decisions list, open questions list, and next meeting.
  - Option to include pending items with a `[PENDING REVIEW]` tag (rejected items are strictly excluded).
- **FR-4.2 CSV Export:**
  - Generates downloadable `.csv` file compliant with RFC 4180.
  - Headers: `Meeting Title, Task Title, Description, Assignees, Deadline, Original Deadline Text, Commitment Status, Priority, Review Status, Source Evidence`.
  - Sanitizes all fields to prevent CSV Formula Injection by prepending `'` to values starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.

---

## 5. Persistence & History (FR-5)
- **FR-5.1:** Guest mode stores meetings in browser IndexedDB (store name: `tambayayong_meetings`).
- **FR-5.2:** Meeting history view provides list of past meetings sorted by last updated timestamp.
- **FR-5.3:** Ability to view, re-edit, duplicate, or delete any locally saved meeting.
- **FR-5.4:** Storage indicator shows approximate storage used and offers "Clear all local data" option.
- **FR-5.5:** Server persistence schema defined in PostgreSQL with Drizzle ORM ready for authenticated organization workspaces.
