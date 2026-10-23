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
  --accent-teal: #2C8C89;       /* Deprecated: single-accent rule, do not use in new UI */
  --accent-light: #EAF5ED;      /* Pale eucalyptus badge tint */
  --card: #FFFFFF;              /* Crisp card surface */
  --border: #DEE8E1;            /* Subtle warm green-grey border */
  --warning: #A86E19;           /* Amber caution */
  --warning-bg: #FEF7E8;
  --danger: #B42318;            /* Coral danger */
  --danger-bg: #FEF3F2;
}
```

### 1.2.1 Neutral-first color rule (observed implementation)
- The forest green is the only accent color in the UI. Blue and teal accents were removed from stat chips, links, progress bars, and status pills.
- Neutral gray (`slate-*` / `#f2f6f3`) is the default for icons, empty states, and informational surfaces.
- Color appears only where it carries meaning: primary actions and progress in green, `warning` for pending attention (missing dates, blocked, open clarification reasons), and `danger` for overdue and errors.
- Surfaces are flat: no gradients anywhere, no decorative background washes, and no shadows on inline cards. Only floating surfaces (auth card and modals) use a single `shadow-lg`.
- Icons render bare: no tinted chip backgrounds or bordered tiles behind icons. Stat icons, panel headers, and empty-state icons are plain glyphs in muted color; only the brand mark remains a filled tile.
- Icons come from the HugeIcons free stroke-rounded set (`@hugeicons/react` + `@hugeicons/core-free-icons`) through the central wrapper `src/components/icons.tsx`, which keeps the previous component names and a single default stroke weight (1.75). No icon contains fills, rounded transparent backgrounds, or decorative styling of its own.
- Decorative elements (CSS hills, handwritten hero note, Comic Sans font, illustration circles on the auth aside) were removed.
- Em dashes are not used in UI wording; sentences use commas, colons, or periods instead.

### 1.2.2 Dark default (observed implementation, October 2026)
- Dark theme is the default (`color-scheme: dark` on `:root`); there is no light theme or toggle. Tokens follow 60-30-10: near-black green page `#0A100D` (60), lifted card surfaces `#101713` with `#1C2621` muted fills (30), one green accent `#3FA46F` (10) with dark on-accent text.
- The header and auth screens use a text-only lowercase `tambayayong.` wordmark (Sora bold, tight tracking, primary `.`); the Sparkles logo tile and the `T.` brand tile were removed.
- Inputs share one recessed style (`.ui-input`); primary actions share `.ui-button-primary`; links share `.ui-link`. First-visit markup carries no `bg-white`/`bg-slate-*`/`text-white` utilities (covered by `tests/workspace-ui.test.tsx`).

### 1.3 Typography
- **Font Family:** Inter / Plus Jakarta Sans / system font fallback.
- **Scale:**
  - `h1`: 2.25rem (36px), Bold, line-height 1.25.
  - `h2`: 1.5rem (24px), SemiBold, line-height 1.3.
  - `h3`: 1.125rem (18px), Medium, line-height 1.4.
  - `body`: 0.9375rem (15px), Regular, line-height 1.5.
  - `caption`: 0.8125rem (13px), Regular.
- **Observed (October 2026):** UI text renders in Inter, with Sora (`font-display`) for the wordmark and main headings, loaded from Google Fonts with system fallbacks.


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

### 2.3 Meeting History Modal
- Displays past meetings saved in local IndexedDB.
- Shows meeting title, date, action item count, and approval status.
- Actions: Open, Duplicate, Delete, Clear All Data.

### 2.4 Workspace chrome (observed implementation)
- There is no side navigation bar. A single sticky top bar carries the brand (opens a new meeting), the cloud AI status pill, Saved meetings, Export, and New meeting.
- Saved meetings open in a modal, reachable from the top bar.
