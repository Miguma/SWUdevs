# Spec 02: User Stories & Acceptance Scenarios

## User Personas
- **US-P1 (Maria):** Student council secretary who takes quick bilingual notes during weekly committee meetings. Needs clean action items before sending email blasts.
- **US-P2 (Jun):** Open-source project lead running virtual standups across Visayas and Luzon. Wants to copy-paste chat logs into GitHub issue-ready checklists.
- **US-P3 (Kath):** Volunteer coordinator managing community food drives. Needs to track who volunteered for what without accidentally assigning tasks that were cancelled.

---

## User Stories

### Epic 1: Intake & Upload
- **US-1.1: Pasting Meeting Notes**
  - *As* Maria,
  - *I want to* paste unstructured notes taken in English, Cebuano, or mixed text into a comfortable web editor,
  - *So that* I do not have to format or structure the text before analyzing.
  - *Acceptance:* Editor displays character count, preserves linebreaks, auto-saves to local draft storage, and accepts at least 50,000 characters.

- **US-1.2: Transcript File Upload**
  - *As* Jun,
  - *I want to* drag and drop a `.txt`, `.md`, or `.csv` meeting transcript,
  - *So that* I can process chat logs exported from Slack, Discord, or Zoom without copying manually.
  - *Acceptance:* Validates MIME type, extension, and content encoding. Parses text cleanly into the intake form.

- **US-1.3: Setting Date Context and Timezone**
  - *As* Maria,
  - *I want to* specify the meeting date and timezone (defaulting to Asia/Manila),
  - *So that* relative terms like "ugma" (tomorrow) or "by Friday" resolve into exact calendar dates.
  - *Acceptance:* Date picker defaults to current date if known, or user can toggle "Date Unknown". Timezone selector includes Asia/Manila, UTC, and standard offsets.

---

### Epic 2: AI Extraction & Nuance Detection
- **US-2.1: Action Item & Assignee Extraction**
  - *As* Kath,
  - *I want to* see distinct action items with assigned persons extracted,
  - *So that* every task has a clear owner.
  - *Acceptance:* If no one is assigned (e.g., *"Wala pa tay assigned sa sponsors"*), owner is marked `Unassigned` and flagged with a warning.

- **US-2.2: Negation & Cancellation Detection**
  - *As* Kath,
  - *I want the system to* recognize when an idea was cancelled (e.g., *"Dili na ta mag-order ug shirts"*),
  - *So that* cancelled proposals do not turn into active to-dos.
  - *Acceptance:* AI ignores cancelled tasks or records them as a decision NOT to do the task.

- **US-2.3: Assignment Corrections**
  - *As* Maria,
  - *I want the system to* recognize when an assignment changed mid-meeting (e.g., *"Si Ana sa poster. Ay, si Mark na lang diay"*),
  - *So that* Mark is assigned the poster and Ana is not burdened with a stale task.
  - *Acceptance:* The later explicit correction supersedes the previous one; supporting evidence captures the correction.

- **US-2.4: Decisions and Open Questions**
  - *As* Jun,
  - *I want to* separate confirmed agreements from unresolved questions,
  - *So that* next week's agenda can immediately target open questions.
  - *Acceptance:* Distinct lists for "Decisions" and "Unresolved Questions" are generated and editable.

---

### Epic 3: Verification & Human-In-The-Loop Review
- **US-3.1: Evidence Inspection**
  - *As* Maria,
  - *I want to* click on any task or decision and view the exact quote in the original text,
  - *So that* I can verify why the AI suggested that task.
  - *Acceptance:* Clicking an evidence badge highlights or jumps to the original quote passage in the notes panel.

- **US-3.2: Task Editing & Correction**
  - *As* Maria,
  - *I want to* edit task titles, descriptions, assignees, dates, and priorities inline,
  - *So that* I can fix any AI misunderstanding before sharing with the team.
  - *Acceptance:* Editing retains user overrides; if the AI is re-run, user-edited values are flagged and preserved.

- **US-3.3: Approval Workflow**
  - *As* Maria,
  - *I want to* mark tasks as Approved or Rejected,
  - *So that* only verified commitments make it to the final report.
  - *Acceptance:* Top bar displays review progress ("3 of 5 approved"). Exports only include approved items by default.

---

### Epic 4: Export & Sharing
- **US-4.1: Markdown Export**
  - *As* Jun,
  - *I want to* download or copy a Markdown document formatted with checkbox tasks,
  - *So that* I can paste it directly into a GitHub Issue, README, or Slack announcement.
  - *Acceptance:* Produces formatted Markdown with headers, metadata, tasks `- [ ]`, decisions, and open questions.

- **US-4.2: CSV Export**
  - *As* Kath,
  - *I want to* export a clean CSV spreadsheet with sanitized values,
  - *So that* I can import it into Google Sheets or Excel without spreadsheet formula injection risks.
  - *Acceptance:* Valid CSV RFC 4180 format. Formula trigger characters (`=`, `+`, `-`, `@`, tab) at the start of values are neutralized with a leading apostrophe.

---

### Epic 5: Local History & Offline Guest Mode
- **US-5.1: Zero-Account Exploration**
  - *As* a first-time visitor,
  - *I want to* test Tambayayong immediately with sample notes without signing up,
  - *So that* I can evaluate its speed and Cebuano handling instantly.
  - *Acceptance:* Guest session uses client-side IndexedDB for history and state. Server receives notes only during the extraction API request and does not retain transcripts.
