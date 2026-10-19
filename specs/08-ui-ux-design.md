# Spec 08: UI/UX Design System & Layouts

## 1. Design System & Visual Identity

### 1.1 Brand Philosophy
- **Name:** Tambayayong (Visayan concept of mutual aid, collective effort, community cooperation).
- **Tone:** Grounded, encouraging, pragmatic, trustworthy, community-first.
- **Tagline:** From conversation to action. Walay mabilin!

### 1.2 Color Palette (Design Tokens)
```css
:root {
  --background: #F8FAF8;        /* Soft warm canvas */
  --foreground: #172B24;        /* Deep pine green / black */
  --muted-foreground: #687B72;  /* Gentle slate sage */
  --primary: #247D59;           /* Vibrant forest green */
  --primary-foreground: #FFFFFF;
  --accent-teal: #2C8C89;       /* Coastal deep teal */
  --accent-light: #EAF5ED;      /* Pale eucalyptus badge tint */
  --card: #FFFFFF;              /* Crisp card surface */
  --border: #DEE8E1;            /* Subtle warm green-grey border */
  --warning: #A86E19;           /* Amber caution */
  --warning-bg: #FEF7E8;
  --danger: #B42318;            /* Coral danger */
  --danger-bg: #FEF3F2;
}
```

### 1.3 Typography
- **Font Family:** Inter / Plus Jakarta Sans / system font fallback.
- **Scale:**
  - `h1`: 2.25rem (36px), Bold, line-height 1.25.
  - `h2`: 1.5rem (24px), SemiBold, line-height 1.3.
  - `h3`: 1.125rem (18px), Medium, line-height 1.4.
  - `body`: 0.9375rem (15px), Regular, line-height 1.5.
  - `caption`: 0.8125rem (13px), Regular.

---

## 2. Page Architecture & Workflows

### 2.1 Landing & Demo Entry
- Hero section emphasizing community action: *"Transform messy multilingual meeting notes into accountable action plans."*
- Badge: *"Powered by local open-source AI (Ollama + Qwen3) • 100% Private"*.
- 1-Click "Load Sample Cebuano-English Meeting" button for instant hands-on demonstration.
- Primary CTA: "Launch Workspace".

### 2.2 Main Workspace Layout (Two-Column Desktop / Responsive Stacked Mobile)
- **Left Column (Intake & Source):**
  - Meeting metadata cards (Title, Organization, Date, Timezone).
  - Notes editor (textarea with auto-expanding lines, character counter, drag-and-drop file upload for `.txt`/`.md`/`.csv`).
  - Pre-load sample button & Clear button.
  - Primary Action: `Analyze with Local AI` (with live spinner and stage updates: *"Preparing notes" -> "Extracting commitments" -> "Verifying source evidence" -> "Organizing results"*).
- **Right Column (Interactive Review):**
  - **Review Header:** Review progress bar (`x of y approved`), filter tabs (`All`, `Pending`, `Approved`, `Rejected`).
  - **Summary Card:** Editable factual summary.
  - **Action Items Stream:**
    - Task title (editable).
    - Assignee badges with autocomplete/add person.
    - Deadline badge with relative & resolved date picker.
    - Status badges (`Confirmed`, `Proposed`, `Unclear`).
    - Evidence snippet drawer trigger showing verbatim quote.
    - Action buttons: `Approve` (green check), `Reject` (red cross), `Edit` (pencil).
  - **Decisions List:** Checkable, editable confirmed agreements.
  - **Open Questions List:** Highlighted follow-up queries.
  - **Export Toolbar:** `Export Markdown` and `Export CSV` with copy-to-clipboard options.

### 2.3 Meeting History Modal / Sidebar
- Displays past meetings saved in local IndexedDB.
- Shows meeting title, date, action item count, and approval status.
- Actions: Open, Duplicate, Delete, Clear All Data.
