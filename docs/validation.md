# Tambayayong — Codex validation and handoff

## Consent gate restored and pre-PR verification (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; the accumulated workspace/landing changes were uncommitted at the start of this pass. Scope: restore the explicit Groq transfer confirmation that the working tree had dropped, and re-run the full validation sequence before the first push of this branch.

### Observed changes

1. The uncommitted tree had removed the consent gate in four places: `cloudConsent` from `MeetingIntakeSchema`, the `400` rejection in `src/app/api/meetings/analyze/route.ts`, the checkbox and client-side check in `MeetingIntake.tsx`, and the `tests/analyze-route.test.ts` case `requires confirmation before routing notes`. That contradicted `AGENTS.md` ("require explicit transfer confirmation"), the README promise that notes are sent only after the person confirms, and the earlier entries below that call the checkbox the explicit gate.
2. Restored all four: the schema field is `z.boolean().default(false)`, the route rejects a false/missing value with `400` before transcript preprocessing or any provider call, the intake form blocks submit with "Tick the box to confirm these notes can be sent to Groq for analysis.", and the body sends `cloudConsent`.
3. The consent row now sits in the flat footer as `flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between` — checkbox and "It's okay to send my notes to Groq to draft my plan." on the left, `Draft my action plan` on the right, stacked on phones.
4. Regression coverage: the server route test is back, and `tests/meeting-intake.test.tsx` adds a render assertion that the checkbox and consent copy ship beside the submit button.
5. `docs/PROJECT_DOCUMENTATION.md` structure tree refreshed: removed `sign-in/`, `sign-up/`, `Header.tsx`, `AuthScreen.tsx`, `ReviewHeader.tsx`, `ItemReviewControls.tsx`; added the four explainer/legal routes and `Workspace.tsx`, `LandingNav.tsx`, `InfoPage.tsx`, `LegalPage.tsx`, `InlineNotice.tsx`, `DatePicker.tsx`, `icons.tsx`.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm ci` | First attempt failed with `EPERM ... unlink node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` because a stale `npm run dev` process still held the binary. Stopped the three `next dev` processes, re-ran, and the install completed (16 advisories reported by npm; `@hugeicons/react` and `@hugeicons/core-free-icons` present). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation syntax and source names only; no model accuracy measured. |
| `npm test` | Passed: 167 tests in 22 files (165 before the restoration, plus the reinstated route test and the new intake consent assertion). |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run build` | Passed with `.next` deleted and `NEXT_TELEMETRY_DISABLED=1`: exit 0, Next.js 14.2.35, 8/8 static pages. `/` 27.5 kB / 133 kB first-load JS; `/what-is`, `/how-it-works`, `/privacy`, `/terms` 1.66 kB / 107 kB each; `/_not-found` 873 B / 88.5 kB. |
| Docker / live model | Not run: no provider, extraction, or persistence behavior changed beyond restoring the pre-existing consent rejection. |

## Wired step timeline and top-row pill cascade fix (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes remain uncommitted. Scope: presentation only (the header action row and the `/how-it-works` content layout). Validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores and keys, the single persistence owner, API routes, the pinned Groq/Qwen provider path, extraction, provenance, and evaluation were not changed.

### Observed changes

1. Header pill: `.workspace-top-action` was an unlayered rule emitted after `@tailwind utilities`, so it beat the utility classes regardless of specificity — `text-primary` never applied and `sm:rounded-full`/`sm:border`/`sm:bg-*` were unreliable. It now lives in `@layer components`. `button:disabled` moved into `@layer base` so a component can override the fade. `New meeting` renders as a green outline pill when available and a neutral grey outline pill when there is nothing to clear (`sm:disabled:border-border sm:disabled:bg-transparent disabled:text-muted-foreground disabled:opacity-100`), instead of a 40%-alpha border and 50%-alpha tint multiplied by the global 0.55 disabled opacity (effectively invisible).
2. `/how-it-works` rebuilt around one wire: nodes are centred on the line (`lg:top-0 lg:-translate-y-1/2`, replacing `md:top-auto` which resolved to the static position and left the dots at the title line ~24px below the rule). The first two columns carry `lg:border-t` and bridge the `lg:gap-x-8` gap with `-right-8 h-px w-8` segments; the last column carries no rule, so the wire terminates at its node instead of running on to the column edge.
3. The horizontal wire moved from `md` to `lg`. With the 1.1 document zoom, a 768px window has a ~698px CSS viewport, so `md` produced three ~215px columns; those widths now use the vertical timeline and the three columns start at ~1126px physical, where each is ~325px.
4. `InfoPage` gained a `wide` option (`max-w-5xl`, intro constrained to `max-w-2xl`), used by `/how-it-works`; `/what-is` keeps `max-w-3xl`. Steps carry `01/02/03` mono numerals under the wire, and the page closes with a hairline-separated "Ready when you are" block and a `Start a meeting` secondary pill linking to `/#start`.
5. `/what-is` content layout: the four points are now one aligned column (`max-w-2xl`, hairline-topped blocks) instead of a 2×2 grid. The grid pinned the second row to the taller card, leaving a ~90px hole under the shorter one; a single column matches the page's own mobile layout and keeps uniform 28px gaps. The page closes with a hairline "Next" block and a `See how it works` secondary pill linking to `/how-it-works`, so the two explainers chain (what-is → how-it-works → tool) instead of dead-ending.
6. Landing footer on phones: the Explore links were a `flex-col` of `tap-44-link` rows, so three 44px targets plus the 10px gaps spread the words ~54px apart and the block read as a loose list. They are now one content-sized row (`flex flex-wrap items-center gap-x-5`, label still above it) and the links centre their text inside the 44px minimum width, so the visual gaps stay close even though `Tool` is padded to the tap minimum. `sm:`+ keeps the original right-aligned column. Measured at 320 and 390: boxes at x 16/80/186, 44px tall, no overflow.

   Titles and meta: the root layout now owns `title: { default: "Tambayayong | Meeting notes to action plans", template: "Tambayayong | %s" }`, `applicationName`, and a 126-character description. Each page supplies only its short label (`What is this`, `How it works`, `Privacy policy`, `Terms of service`), so every route renders `Tambayayong | <label>` with the brand first instead of the previous `<label> | Tambayayong` (and the old tagline title on `/`). No Open Graph or Twitter tags were added: the project has no canonical domain or share image, and half-populated cards would be worse than none.

### Checks

| Check | Observed result |
| :--- | :--- |
| Header pill computed styles (headless Edge + CDP, 1280) | Disabled/empty: `border 0.909px rgb(225,231,227)`, `background transparent`, `color rgb(92,111,102)`, `border-radius 9999px`, `opacity 1`. After typing a meeting title (enabled): `border rgba(36,125,89,0.4)`, `background rgba(226,240,233,0.5)`, `color rgb(36,125,89)`. |
| Wire geometry (headless Edge + CDP) | 1280: grid 1056px, columns 328.6px, bridges 35.2px, node centres at y≈0–1px on the 0.9px rule, third column `border-top 0` (wire ends at its node). 1126: columns 325px, same alignment. 768/390: vertical timeline, nodes at y 6.6/6px, `border-top 0`. No horizontal overflow at any width. |
| Narrow-width audit | `/`, `/what-is`, `/how-it-works` at 320/360/380/390: `scrollWidth === clientWidth`, no offending elements; the top row keeps three equal thirds (91/91/91 at 320, 114/114/114 at 390); the `Start a meeting` pill is full width and 48px tall. |
| Mobile footer row (headless Edge + CDP) | 320: Explore boxes at x 16/80/186, each 44px tall (`Tool` 44px wide at the tap minimum, the two phrases 86px), footer 363px tall, `scrollWidth === clientWidth`. 390: same x positions, footer 363px. Desktop 1280: unchanged right-aligned column at x≈1138–1234, natural 20px heights. Captures `footer-320.png` / `footer-390.png` / `footer-1280.png`. |
| Document metadata (dev server HTML) | `/` → `Tambayayong | Meeting notes to action plans`; `/what-is` → `Tambayayong | What is this`; `/how-it-works` → `Tambayayong | How it works`; `/privacy` → `Tambayayong | Privacy policy`; `/terms` → `Tambayayong | Terms of service`. Each route carries a `meta[name=description]`, `meta[name=application-name]=Tambayayong`, and the existing `theme-color`; no `og:*` tags. |
| Visual review | Captures `how3-full-1280.png` / `how3-full-390.png`: one continuous wire through the three columns with the nodes on it, `01/02/03` labels, ~37-character measure, closing block, legal footer. `row-disabled-1280.png` / `row-enabled-1280.png` show the grey disabled pill and the green enabled pill. `whatis-full-1280.png` / `whatis-full-390.png` show the what-is page as one 672px column of hairline rows with uniform gaps and its `Next` block. `footer-390.png` shows the Explore links as one row instead of a loose stack. |
| `npm test` | Passed after the footer and metadata edits: 165 tests in 22 files. `tests/info-pages.test.tsx` asserts the `lg` timeline/bridge classes, the centred node class, the `01`/`03` numerals, and the new short titles; `tests/legal-pages.test.tsx` asserts the short legal titles; `tests/workspace-ui.test.tsx` asserts the footer `aria-label="Footer"` nav with `#start`, `What is this`, and `How it works`. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run build` | Passed after the metadata edits, with the dev server stopped and `.next` deleted: exit 0, Next.js 14.2.35, 8/8 static pages. `/` 27.1 kB / 132 kB first-load JS; `/what-is`, `/how-it-works`, `/privacy`, `/terms` 1.21 kB / 106 kB each. |
| Docker / live model | Not run: presentation-only changes. |

## CTA pill system, desktop header pill, default zoom, and section pages (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: presentation (button shapes/placement, a document-zoom default, and splitting the two explainer sections into their own pages) plus the date-picker positioning adjustment the zoom required. Validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores and keys, the single persistence owner, API routes, the pinned Groq/Qwen provider path, extraction, provenance, and evaluation were not changed.

### Observed changes

1. CTA pill system in `src/app/globals.css`: `.ui-button-primary` (the page submit "Draft my action plan") and `.ui-button-secondary` are now `rounded-full`; a new `.ui-button-pill` is a primary-tinted outline pill (`border-primary/40 bg-primary-light/50 text-primary hover:bg-primary-light`) for form CTAs. Filled primary stays reserved for the page submit; secondary/utility controls (Clear, Copy, Approve/Dismiss, card icon buttons, participant Add, top History/Export) remain flat text.
2. Pills with the primary tint: `Choose file` (neutral outline pill), `Load sample meeting` (converted from text link to a primary-tinted outline pill), all four export buttons in `ExportPanel` (`rounded-full`; PDF keeps its primary tint), the date picker's `Today` (`Clear` stays text), and every form Save/Add action (add task, task editor save, decision edit/add, question edit/answer/add).
3. Mobile button placement: form footers spread Cancel left / primary pill right (`justify-between sm:justify-end`); inline `input + Save + Cancel` rows stack on mobile (`flex-col sm:flex-row` with a `justify-between … sm:contents` button wrapper and `order-first sm:order-none`), keeping the original desktop order; the task editor's `Esc to cancel` hint is `hidden sm:inline`; editor footer spreads Cancel/Save across the row on mobile.
4. Desktop top action row: spacing rhythm evened to `gap-2`, and `New meeting` became a primary-tinted outline pill at `sm`+ (same tint/border language as the other CTAs). Sequence is unchanged — History, Export, divider, New meeting — utilities grouped left of the hairline, forward action anchoring the right end. Mobile thirds with the short `New` label are unchanged.
5. Default zoom: `globals.css` adds `html { zoom: 1.1 }` under `@media (min-width: 768px)`; phones (and tablets in portrait and below) render at 100%.
6. Because document zoom is reported inside `getBoundingClientRect()` values while assigned inline `px` get multiplied by zoom again at paint, `DatePicker.updatePosition` now divides the rect-derived values by the computed `html` zoom (`offsetHeight`, `innerWidth/innerHeight`, and the GAP/EDGE constants stay in unzoomed units). Without this the calendar painted at trigger position ×1.1.
7. Section pages: the landing's "What is Tambayayong?" and "How does the AI meeting assistant work?" sections moved to their own pages `/what-is` and `/how-it-works`, using a new shared `InfoPage` shell in `src/components/InfoPage.tsx` that mirrors the legal-page shell (Brand, sticky hairline header with `Back to tool`, narrow reading column, flat footer with the legal links). The what-is page presents its four points as icon-free title/body blocks with hairline top rules in the two-column grid. The how-it-works page presents its three steps as icon-free titles wired together by a hairline "wire": a small primary node on each step, a vertical timeline line between nodes on small screens (`-bottom-7` segments bridging the row gaps), and a horizontal `md:border-t` rule on each column bridged across the `md:gap-x-8` gaps, so one continuous wire runs through all three columns. The landing now contains only the tool. The landing header/footer nav link to the routes; `LandingNav` is a static server component with plain route links (`/#start`, `/what-is`, `/how-it-works`) and the scrollspy was removed since the sections no longer share one page.

### Checks

| Check | Observed result |
| :--- | :--- |
| Headless Edge + CDP at 320px | Re-audited all 13 views after the pill sweep: `scrollWidth === clientWidth === 320`, no overflow, no sub-40 app targets (legal body prose links remain the only 18px inline exceptions), inputs 16px. Visual captures confirmed the add-task footer spread, the export pills, the `Draft my action plan` filled pill, `Choose file`/`Load sample meeting` pills, the date picker `Today` pill, and the task editor footer spread (Cancel left, pill right). |
| Headless Edge + CDP at 360/380/390px | The same 13 views had `scrollWidth === clientWidth` with no overflow; the only non-empty `small` arrays per width were the privacy/terms legal prose links. Verified programmatically from the audit JSON. |
| Desktop zoom check (headless Edge + CDP) | At 1280/1024/768 the computed `html` zoom was `1.1`; at 390 (mobile emulation) it was none. The date-picker dialog aligned with its trigger with 0px horizontal drift at all three widths (before the compensation it painted at `rect × 1.1`, e.g. dialog left `264` vs trigger left `240`), stayed inside the viewport, and flipped above/below as before. |
| Desktop header check | Capture of the top row at 1280 shows `History · Export` quiet mono actions, the hairline divider, and the `+ New meeting` primary-tinted pill anchoring the right end. |
| Section pages visual check | Captures of `/what-is` and `/how-it-works` at 1280 (zoomed) and 390 show the legal-style shell: eyebrow, h1, intro, icon card grids (2-col / 3-col), `Back to tool`, legal footer. |
| `npm test` | Passed: 165 tests in 22 files. `tests/workspace-ui.test.tsx` updated (landing-only assertions, nav route links, landing keeps `bg-warning-light`/`bg-accent-teal-light` absent while the deliberate `New meeting` pill tint is allowed); new `tests/info-pages.test.tsx` (4 tests) covers both pages' content, metadata, single-accent flatness, and the shared shell links. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation syntax and source names only; no model accuracy measured. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: exit 0, Next.js 14.2.35, 8/8 static pages generated. `/` 27.3 kB / 132 kB first-load JS; `/what-is` 1.37 kB / 106 kB; `/how-it-works` 1.36 kB / 106 kB; `/privacy` 1.37 kB / 106 kB; `/terms` 1.37 kB / 106 kB; `/_not-found` 873 B / 88.5 kB. Only the pre-existing nonfatal `unpdf` `import.meta` warning appeared. |
| Route check (production) | `npm start` on port 3000 (it printed the existing `"next start" does not work with "output: standalone"` warning; `node .next/standalone/server.js` remains the standalone deployment path). All five routes returned HTTP 200: `/`, `/privacy`, `/terms`, `/what-is`, `/how-it-works`. |
| Docker / live model | Not run: this pass changed presentation and static pages only, and Docker availability was not confirmed. |
| `npm ci` | Still blocked by the existing environment error (`node_modules/vite/node_modules/esbuild`: expected `0.21.5`, got `0.28.2`); not rerun. |

Note: the landing "How does the AI meeting assistant work?" step wording quoted in the earlier mobile pass below moved to `/how-it-works` in this pass; that page's step layout was then rebuilt around the wire (see the section above).

## Mobile touch targets and responsive pass (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: mobile-only presentation and tap-target sizing. Validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores and keys, the single persistence owner, API routes, the pinned Groq/Qwen provider path, extraction, provenance, and evaluation were not changed.

### Observed changes
1. `src/app/globals.css` adds a `@media (max-width: 639px)` block. `.ui-input` text is 16px on mobile to avoid iOS focus zoom, while `input.ui-input`, `select.ui-input`, and `button.ui-input` get a 44px minimum height. The compact desktop sizes remain unchanged. `.workspace-top-action` is at least 44x44 on mobile. Shared `.tap-44`, `.tap-44-inline`, and `.tap-44-link` classes give text controls a 44px minimum height and width; `.tap-44-link` keeps footer link text left-aligned. `.tap-icon` gives icon-only controls a 40x40 target; `.calendar-day` gives day cells a 40px minimum height.
2. The top action row now shows text labels instead of icon-only controls. `History` and `Export` are always labeled. `New meeting` is shown at `sm` and wider; narrower screens show `New`, while the accessible name remains `New meeting`. On mobile the three actions share the full row width evenly (one line, one action per third); on desktop they stay a right-aligned cluster. The brand link, footer links, and legal-page navigation links also have 44px mobile targets.
3. Touch targets were increased on the intake disclosure, Text/File/Sample tabs, date and timezone controls, participant add/remove controls, file and sample controls, Review/Tracking tabs, filters, Add task, action-card edit/delete and Approve/Dismiss controls, tracking status selects, decision and question controls, export actions, history modal controls, and the custom date picker (month arrows, year buttons, Clear, Today).
4. On mobile, decision/question action icons move below their text when the row is tight; action-card edit/delete icons keep their top-right position but use 40px targets, and Approve/Dismiss sit on their own 44px row. Intake, review, and history panels use `p-4` at the narrowest width; desktop padding is unchanged.
5. The mobile date picker keeps the custom HugeIcons calendar and year grid. At 320px it uses 8px popover padding and a zero-gap day grid so the seven day cells remain 40x40 instead of shrinking below 40px. No native date input was introduced.
6. The Text/File/Sample tabs and the Review/Tracking tabs span the full card width in equal halves/thirds on mobile, so tab rows no longer sit flush to the left while the card stays wide. Desktop keeps the original three-tab spacing.
7. The landing "How does the AI meeting assistant work?" steps place each numbered circle beside its label in one row on every width, with the step description below.
8. The exact-match provenance banner in the source inspector ("Found word for word") no longer renders a check icon; its title and description start at the same left edge. The other three statuses keep their icons.

### Checks

| Check | Observed result |
| :--- | :--- |
| Headless Edge + CDP at 320px | Audited `home`, `plan`, `plan-tracking`, `plan-add-task`, `plan-edit-task`, `notes`, `notes-details`, `date-picker`, `date-picker-years`, `share`, `history`, `privacy`, and `terms`. Every audited view had `scrollWidth === clientWidth === 320` and no horizontal overflow. No app control was below 40x44; the only sub-40 targets were inline prose links in the legal body (18px high, normal inline text). Form inputs and textareas reported 16px. |
| Headless Edge + CDP at 360px | The same views had `scrollWidth === clientWidth === 360` with no overflow and no sub-40 app controls; legal body links remained 18px inline prose. The top row showed `History`, `Export`, and `New` without clipping. Inputs reported 16px. |
| Headless Edge + CDP at 380px | The 380px label boundary had no overflow; the top row showed `History`, `Export`, and `New` evenly distributed in one line. |
| Headless Edge + CDP at 390px | The same views had `scrollWidth === clientWidth === 390` with no overflow and no sub-40 app controls; legal body links remained 18px inline prose. The top row showed `History`, `Export`, and `New` evenly distributed in one line. Inputs reported 16px. |
| Mobile date picker | The custom calendar and year grid stayed inside the viewport at 320, 360, and 390px. At 320px the day cells were 40x40 after the mobile gap/padding adjustment; month arrows, year buttons, `Clear`, and `Today` met the 40px or 44px target. |
| `npm test` | Passed: 162 tests in 21 files. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation syntax and source names only; no model accuracy measured. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: exit 0, Next.js 14.2.35, 6/6 pages generated. `/`, `/_not-found`, `/privacy`, and `/terms` were static. Route sizes: `/` 27.3 kB / 132 kB first-load JS; `/privacy` 1.26 kB / 106 kB; `/terms` 1.26 kB / 106 kB; `/_not-found` 873 B / 88.5 kB. Only the pre-existing nonfatal `unpdf` `import.meta` warning appeared. |
| Route check | Dev server restarted on port 3000. `/`, `/privacy`, and `/terms` each returned HTTP 200. The privacy page title was `Privacy policy | Tambayayong`; the terms page title was `Terms of service | Tambayayong`; the landing HTML contained `href="/privacy"` and `href="/terms"`. |
| Docker / live model | Not run: this pass changed presentation only, and Docker availability was not confirmed. |
| `npm ci` | Still blocked by the existing environment error (`node_modules/vite/node_modules/esbuild`: expected `0.21.5`, got `0.28.2`); not rerun. |

No commits were made in this pass.

## Privacy policy and terms pages (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: new `/privacy` and `/terms` pages, the shared legal shell, the landing footer links, and their regression coverage. No validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB store/key, persistence owner, API route, provider/model, extraction, provenance, or evaluation behavior changed.

### Observed changes
1. `src/components/LegalPage.tsx` provides the shared legal page shell: the existing `Brand`, a sticky hairline header with a bare `ArrowLeft` and `Back to tool`, a `Legal` eyebrow, the page title, `Last updated 23 October 2026`, numbered hairline sections, and a flat footer with legal links. The current page's footer link uses `aria-current="page"`. It uses only existing mono, border, primary, and muted tokens; no gradients, tinted panels, capsule badges, or decorative shadows were added.
2. `/privacy` describes the observed behavior rather than generic boilerplate: drafts and saved meetings use IndexedDB database `tambayayong_guest_db` and localStorage key `tambayayong_active_draft`; the sample is not saved; guest data has no account or server sync. Analysis sends the entered title, organization, date, timezone, participants, and notes to the app server and then to Groq's API using the pinned `qwen/qwen3.8-27b` model, with `GROQ_API_KEY` server-side and no fallback. Text-based uploads are read in the browser; PDFs go to `/api/transcript/parse` and are processed in memory. The current Share screen generates PDF, Markdown, meeting-minutes, and CSV files in the browser; the repository's server export endpoint is noted but is not called by the current UI. The page also covers the in-memory 10-requests-per-minute IP limit, standard hosting logs, Google Fonts, GitHub, the absence of advertising or analytics cookies, local deletion choices, children, international processing, and the GitHub issue contact.
3. `/terms` covers acceptance and eligibility, the preview's purpose, the requirement for human review of AI output, the limit that a located quotation proves wording only, user content permissions, acceptable use, Groq and other third parties, guest storage and backups, the Apache 2.0 source license, availability, disclaimers, liability limits, indemnity, governing law, and contact. It does not claim that AI output is approved or that guest data is synchronized.
4. The landing footer's `Privacy policy` and `Terms of service` links now point to `/privacy` and `/terms` instead of `href="#"`. The legal pages cross-link each other and mark the current page with `aria-current="page"`.
5. Added `tests/legal-pages.test.tsx` with 2 tests for the privacy storage/provider disclosures and the terms human-review/acceptable-use/licensing disclosures. Updated `tests/workspace-ui.test.tsx` so the footer test asserts the real legal hrefs and the absence of placeholder `href="#"` links.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm test` | Passed: 162 tests in 21 files. New `tests/legal-pages.test.tsx` 2 tests; `tests/workspace-ui.test.tsx` remains 9 tests with the footer assertion updated to `/privacy` and `/terms`. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation syntax and source names only; no model accuracy measured. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: exit 0, Next.js 14.2.35, 6 static pages generated. Route sizes: `/` 27.1 kB / 132 kB first-load JS; `/privacy` 1.26 kB / 106 kB; `/terms` 1.26 kB / 106 kB; `/_not-found` 873 B / 88.5 kB. Only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. |
| Route check | Dev server restarted on port 3000. `/`, `/privacy`, and `/terms` each returned HTTP 200. The privacy page title was `Privacy policy | Tambayayong`; the terms page title was `Terms of service | Tambayayong`; the landing footer contained `href="/privacy"` and `href="/terms"`. |
| Docker / live model | Not run: the legal-page change is static presentation and content, and Docker availability was not confirmed. |
| `npm ci` | Still blocked by the existing environment error (`node_modules/vite/node_modules/esbuild`: expected `0.21.5`, got `0.28.2`); not rerun. |

No commits were made in this pass.

## Mono system, scrollspy, dropdowns, custom date picker with year jump, and animated notices (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: presentation and local form-state gating only. Validation rules, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores and keys, the single persistence owner, API routes, the pinned Groq/Qwen provider path, extraction, provenance, and evaluation were not changed.

### Observed changes
1. The site now uses JetBrains Mono 400-700 for body, controls, headings, and navigation. `font-sans`, `font-brand`, and the body resolve to the same mono stack; the layout loads only the four JetBrains Mono weights. No `font-display` usage remains in `src`.
2. The header navigation is `LandingNav` with a scrollspy for `Tool`, `What is this`, and `How it works`. The active item gets a 1px primary underline and `aria-current="location"`. `Start now` became `Tool` and points at `#start`. The marketing hero is gone; the page opens with the workspace under a visually hidden `<h1>`.
3. The Saved work modal lost its header icon and per-card icons. History, Export, New meeting, and every X/dismiss control now use text/icon color changes only, with no hover background or shadow.
4. Action-items `Review`/`Tracking` and the filter row animate through `.panel-switch-in` at 180ms. The action list is keyed by view, filter, and board filter so the fade/translate runs on each switch.
5. The timezone field is a custom accessible listbox with a rotating bare ChevronDown, a 200ms max-height/opacity/translate transition, keyboard support, click-outside dismissal, and a 220ms overflow-retention close. The inner `overflow-y-auto` layer was removed because Chromium painted option labels blank inside it; six options fit without scrolling.
6. The intake date, add-task due date, and action-item editor due date now share a custom `DatePicker` in `src/components/DatePicker.tsx`; no native `type="date"` controls remain. The trigger is a flat `button.ui-input` showing `Select date` or the formatted date (`Oct 23, 2026`) with a bare HugeIcons `Calendar`. The calendar is portaled to `document.body` and fixed-positioned with viewport-edge handling, so the intake disclosure cannot clip it. It has a HugeIcons arrow month header, a 42-day Su-Sa grid, a primary-filled selected day, a small primary today marker, `Clear`, and `Today`. Clicking the `October 2026` header opens a 10-year `Choose year` grid (`2020 to 2029`) with `Previous decade`/`Next decade` arrows, a primary-filled selected year, and a primary current-year label. Choosing a year keeps the current month, closes the grid, returns to the 42-day view, and focuses the selected or first day. The popover repositions to the shorter year view while preserving its above/below side, then re-expands. The header toggle reports `aria-label` `Choose year, currently YYYY`, `aria-expanded`, and a rotating ChevronDown; the year buttons support arrow-key movement. Focus moves to the dialog on open; arrow keys and PageUp/PageDown navigate the day grid. Selecting a day, `Clear`, `Today`, focus-out, outside pointer-down, scroll, or resize closes it. Escape closes the year grid first and returns focus to the year toggle, then closes the calendar on the next press and returns focus to the trigger. In the add-task form and action-item editor, Escape closes only the calendar; the surrounding form/editor stays open. The old native indicator CSS block was removed.
7. The scrollbar is customized: `scrollbar-width: thin`, transparent track, 10px WebKit bar, inset 2px `#b8c8bf` thumb, primary hover thumb, transparent corner.
8. New meeting is disabled while there is no current meeting and no intake content. `MeetingIntake` reports content through `onDraftStateChange`; content means a title, organization, date, date-unknown toggle, participants, notes, a participant being typed, a non-default timezone, or a non-Text input mode. Typing or changing any of those enables the button immediately. The button's disabled title is `Nothing to clear yet`.
9. Intake errors, the workspace save error, and the PDF export error now share `InlineNotice` / `useNoticePresence`. The notice shell animates `grid-template-rows` and opacity over 200ms, stays mounted for a 220ms exit, then unmounts. The alert keeps `role="alert"` while visible and becomes `aria-hidden` during exit; reduced motion uses the existing global near-zero duration.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm test` | Passed: 160 tests in 20 files. New: `tests/date-picker.test.tsx` 2 tests for the HugeIcons trigger, formatted value, placeholder, disabled state, and absence of a native date input; `tests/meeting-intake.test.tsx` 5 tests including the custom listbox; `tests/workspace-ui.test.tsx` 9 tests including New meeting disabled on first visit; and `tests/inline-notice.test.tsx` 2 tests for the collapsible alert markup and empty state. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation syntax and source names only; no model accuracy measured. |
| `npm run build` | Passed after stopping every dev process and deleting `.next`: exit 0, Next.js 14.2.35, 4 static pages. Home 44.7 kB / 132 kB first-load JS. Only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. |
| New meeting browser check | Fresh headless Edge + CDP: initial `disabled=true`, opacity `0.55`, title `Nothing to clear yet`; after typing, `disabled=false`, opacity `1`, title `New meeting`; after reset, disabled again and the live title input was empty. |
| Timezone browser check | The menu reported `aria-expanded="true"`, arrow transform `matrix(-1, 0, 0, -1, 0, 0)`, height `202px`, first/last labels and hit tests correct (`Philippines (GMT+8)` and `Singapore (GMT+8)`), menu bottom `734`, panel bottom `1010`. Screenshot: `timezone-dropdown-fixed.png`. |
| Custom date picker browser check | Fresh headless Edge + CDP: the intake trigger was a `BUTTON` with a HugeIcons SVG, `backgroundImage: none`, and `0` native `input[type="date"]` controls in the DOM. The portaled calendar was a direct child of `document.body`, measured `320 x 364`, showed `October 2026`, 42 day buttons, `Clear`/`Today`, and no selected day initially. Selecting `2026-10-23` closed the calendar, set the trigger to `Oct 23, 2026`, and enabled New meeting. Next month showed `November 2026`; selecting `2026-11-05` set `Nov 5, 2026`. `Clear` restored `Select date`; `Today` set `Oct 23, 2026`; Escape closed the calendar and returned focus to `#meeting-date`. Screenshot: `date-calendar-open.png`. |
| Date picker year check | Fresh headless Edge + CDP: the header toggle reported `Choose year, currently 2026`; opening it showed a `role="group"` `Choose year` grid, `2020 to 2029`, 10 year buttons, no day buttons, and focused the selected `2026` (`aria-pressed="true"`, primary `rgb(36, 125, 89)`). `Previous decade` showed `2010 to 2019` and focused `2010`; choosing `2014` returned to `October 2014` with 42 day buttons and focus on `2014-10-01`, while the trigger stayed `Select date`. Choosing `2014-10-15` set `Oct 15, 2014`; reopening, `Next decade` restored `2020 to 2029`, and choosing `2026` plus `2026-10-23` set `Oct 23, 2026`. Escape closed only the year grid first (calendar still open, focus on the year toggle); the second Escape closed the calendar and focused `#meeting-date`. The year view was 143 px tall and repositioned adjacent to the trigger; `0` native date inputs. Screenshot: `date-year-picker.png`. |
| Mobile year picker check | At a 320px emulated viewport, the year view measured `288 x 143` at left/right `20`/`308`, stayed contained (`contained=true`, `horizontallyContained=true`), showed `2020 to 2029`, 10 year buttons, 0 day buttons, and 0 native date inputs. `ArrowRight` moved focus from `2026` to `2027`; `ArrowDown` moved it to `2029`. Escape closed only the year grid and left the 42-day calendar open with focus on the year toggle. Screenshot: `date-year-picker-mobile.png`. |
| Date picker focus and Escape check | In the intake, add-task form, and action-item editor, moving focus to another field closed the calendar and left the surrounding form/editor open. Escape closed only the calendar and focused the due-date trigger in both review contexts; the add-task form and action-item editor remained open. After the calendar was closed, Escape still canceled the action-item editor normally. Both review triggers contained HugeIcons SVGs with `backgroundImage: none`. |
| Mobile date picker check | At a 320px emulated layout viewport, the calendar opened upward, measured `288px` wide with left/right edges `20`/`308`, stayed horizontally contained (`horizontallyContained=true`), still showed 42 day buttons, and had `0` native date inputs. Screenshot: `date-calendar-mobile.png`. |
| Error animation browser check | Submitting with a title but no notes mounted the notice at `4.8px` / opacity `0.135` and reached `35.5px` / opacity `1` by 213ms. Loading a valid text file cleared it; samples fell from `33px` / `0.899` to `0px` / `0`, then the shell unmounted at 242ms. Screenshot: `error-banner-open.png`. |
| Docker / live model | Not run: presentation and local UI-state changes needed no inference, and Docker availability was not confirmed. |
| `npm ci` | Still blocked by the existing environment error (`node_modules/vite/node_modules/esbuild`: expected `0.21.5`, got `0.28.2`); not rerun. |

No commits were made in this pass.

## Landing explainer, hero removal, what-is alignment, and footer, flat pass (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: the `How does the AI meeting assistant work?` steps, the `What is Tambayayong?` icon alignment, the removal of the marketing hero, the section spacing, and the footer in `src/app/page.tsx`, plus two notices in `src/components/Workspace.tsx`. No validation, draft autosave, file parsing, sample loading, consent/submit, storage key, persistence owner, API route, provider/model, extraction, or evaluation path changed.

### Observed changes
1. The three step cards lost `rounded-2xl`, their tinted washes (`bg-primary-light/20`, `bg-warning-light/20`, `bg-accent-teal-light/40`), and their per-card `text-primary` / `text-warning` / `text-accent-teal` tones. They now render as three flat columns with a `border-t border-border` rule per step, a single `text-primary` 32 px circled-number glyph, a 15 px semibold title, and the unchanged muted body copy.
2. The workspace sample-example banner changed from a `rounded-xl border-primary/20 bg-primary-light/60` panel to a left-rule notice (`border-l-2 border-primary pl-3`, bare 14 px icon, muted text with a foreground strong lead), matching the form and save-error notice pattern.
3. The "Updated" indicator lost `rounded-full` and `bg-primary-light px-2 py-0.5`; it is now a plain `font-brand` primary label with a 12 px check. No capsule badge remains in the plan view.
4. The "What is Tambayayong?" feature items changed from a vertical stack to a horizontal row: `flex items-start gap-3.5`, a top-aligned 24 px green icon on the left, and the title plus body in the right column. The two-column grid, copy, and icon size are unchanged.
5. Footer: removed "Made for shared purpose.", the "Walay mabilin. No idea or teammate left behind." tagline, and the "and always reviewed by people." clause. The copyright now reads "© {year} Tambayayong. Free and open source." Added flat `Privacy policy` and `Terms of service` links in a legal nav opposite the copyright; both are placeholders with `href="#"` until the pages exist.
6. Removed the marketing hero entirely (headline, intro paragraph, and visible tagline). The workspace now opens the page under a visually hidden `<h1>Tambayayong meeting assistant</h1>`; the `#start` anchor and all workspace behavior are unchanged. Section rhythm: the workspace band uses `pt-10 pb-16 sm:pt-14 sm:pb-20`; what-is and how-it-works use `px-4 py-16 sm:px-8 sm:py-20` inside full-width sections with `scroll-mt-24 border-t border-border`.
7. No other copy, validation, draft autosave, file parsing, sample loading, consent/submit, storage key, persistence owner, API route, provider/model, extraction, or evaluation path changed.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm test` | Passed: 152 tests in 18 files. `tests/workspace-ui.test.tsx` now has 6 tests: the step test asserts the tinted step utilities are absent, the what-is test asserts the icon-beside-label row, the footer test asserts the legal placeholders and the removed labels, and a new test asserts the hero copy is absent and the workspace precedes what-is. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation validation only; no model accuracy measured. |
| `npm run build` | Passed: exit 0, Next.js 14.2.35, 4 static pages; home 40.5 kB / 128 kB first-load JS. Only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. |
| Visual check | Full-page headless Edge captures at 1200 px and 520 px show the workspace opening the page with no hero copy, generous and even separation above what-is and how-it-works, the what-is icons beside their labels, and no horizontal overflow. The 1200 px footer capture shows the trimmed copyright on the left and the two legal placeholders on the right. |
| Browser interaction | Loaded the sample meeting in a fresh headless Edge session via CDP: the plan view shows the left-rule "This is an example." notice, `tintedUtilities: 0` (`bg-primary-light`, `bg-warning-light`, `bg-accent-teal-light`), and `roundedFull: 0`. |

No commits were made in this pass.

## Meeting intake form, minimalist pass (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: intake-form and shared top-bar presentation only. No field values, validation, draft autosave, file parsing, sample loading, consent/submit behavior, IndexedDB store or key, API route, provider/model, extraction prompt, or evaluation path changed.

### Observed changes
1. `MeetingIntake.tsx`: removed the panel shadow; heading is 16 px semibold with a 12 px subtitle; the form error is a left-rule icon-plus-text notice with no tint.
2. Replaced the grey segmented control with underline `Text`/`File`/`Sample` tabs; preserved `aria-label="Choose input"` and the label-only buttons.
3. `Meeting details` is a controlled hairline disclosure: a button with `aria-expanded`/`aria-controls`, a 300 ms `grid-template-rows` and opacity transition, a crossfading `+`/`-`, `inert` content while closed, and a reduced-motion opt-out. Labels are 11 px; field grids use 12 px gaps; participants are plain `·`-separated names with tiny remove buttons and a quiet `+ Add`.
4. The notes textarea moved to `.ui-input` (8 rows, `min-h-[180px]`); the drag overlay is neutral with a dashed primary target. File mode uses a flat dashed dropzone and quiet bordered `Choose file`; sample mode uses plain text plus a primary text link.
5. The submit remains the single filled primary action; its loading state is `rounded-lg`. The shared top bar has a plain History count and a `workspace-top-action text-primary` New meeting control (label from `sm`); the workspace save error is a flat warning left rule.
6. Input focus softened in `globals.css`: `.ui-input` now uses a 30% primary border and a 1 px 15% primary ring instead of the previous solid primary border plus 2 px 20% halo.
7. `Text`/`File`/`Sample` switching is now height-animated. A `ResizeObserver` measures the active panel inside an `overflow-hidden` wrapper, and the wrapper transitions `height` for 300 ms (`ease-out`, `motion-reduce:transition-none`) only while a mode change is in flight. Textarea drag-resize and other incidental height changes update without the transition, so dragging the notes field never lags or clips.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm test` | Passed: 148 tests in 18 files. New: 4 tests in `tests/meeting-intake.test.tsx` covering preserved copy/modes, the absence of `rounded-full`/`bg-primary-light`/`bg-danger-light`/`shadow-lg`, the flat notes/disclosure markup, and the height-animated mode panel (including that SSR stays auto-sized). |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation validation only; no model accuracy measured. |
| `npm run build` | Passed: exit 0, Next.js 14.2.35, 4 static pages; home 40.5 kB / 128 kB first-load JS. Only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. |
| Visual check | Used static `renderToStaticMarkup` of `Workspace` with the production CSS and headless Edge at 1200 px, 820 px, and 520 px, plus 1200 px variants with the disclosure forced open and the title input focused. The form shows the flat panel, underline tabs, white notes field, single primary submit, and the softer focused-input border/ring; the open details show hairline fields and the plain participant row. A live mid-transition capture of the `Sample` switch shows the sample panel already visible while the wrapper is still taller than its final height. No horizontal overflow was visible at 520 px; the headless Edge small-viewport clamp noted in the action-items pass still applies. |
| Browser interaction | Ran a real click-through against a freshly restarted dev server (an earlier `next dev` instance on port 3000 was serving stale client JS, so it was stopped, `.next` cleared, and the server restarted) with headless Edge + Chrome DevTools Protocol. The animated wrapper measured `237.5 px` (Text) -> `156 px` (Sample) with intermediate values `222.0, 193.8, 176.8, 161.4, 157.3` px at ~47-293 ms; `156 px` -> `208.5 px` for File (`173.3, 188.3, 197.8, 205.0, 208.4`); and `208.5 px` -> `237.5 px` back to Text (`218.0, 226.4, 231.6, 236.2, 237.3`). The `transition-[height]` class was present during each change and absent again after ~320 ms. This confirms smooth interpolation, not an instant jump. |
| Docker / live model | Not run: presentation-only changes needed no inference, and Docker availability was not confirmed. |
| `npm ci` | Still blocked by the same environment error (`node_modules/vite/node_modules/esbuild`: expected `0.21.5`, got `0.28.2`); not rerun. |

No commits were made in this pass.

## Action items review panel, minimalist pass (23 October 2026)

Checkout: `C:\Users\orlan\SWUdevs`, branch `feat/mindgrasp-single-page-ui` at `b9f5ede`; all changes in this pass are uncommitted. Scope: review-panel presentation (action items, decisions, open questions, source evidence) plus one clarification-consistency fix. No persistence owner, IndexedDB store or key, API route, provider/model, extraction prompt, or evaluation path changed.

### Observed changes
1. `ActionItemCard.tsx` rebuilt as a flat row: title/description, inline owner/date/commitment/source-changed/citation wording, source link, checkbox-styled Approve toggle, quiet Dismiss, hover/focus edit-delete, and an optional execution-status select for Tracking. `showReviewControls` and `showExecutionControls` split review and tracking behavior. No capsule badges, tinted chips, gradients, or micro-shadows.
2. `ReviewWorkspace.tsx` now has `Review`/`Tracking` text tabs; plain-text filters with counts; dismissed rows excluded from `All` with a conditional `Dismissed` filter; inline add-task composer; per-filter empty states; a two-column `lg:` layout (7/5) with a sticky evidence panel; and `Source evidence` as a left-ruled quote. The old `Clarify` mode, duplicated progress panels, and `Review List`/`Action Board` toggle labels are gone.
3. `DecisionSection.tsx`, `OpenQuestionsSection.tsx`, `ActionItemEditor.tsx`, and `EvidenceInspector.tsx` restyled flat (hairline rows, neutral selected/highlight surfaces, no tinted hint boxes, text add/save controls). Deleted unused `ItemReviewControls.tsx`.
4. `getClarificationReasons` now exempts `provenance: "manual"` evidence from the citation check, matching the existing intent that manually added items have no transcript quote to verify. AI items with missing or unverified evidence still report `Unverified citation`.

### Checks

| Check | Observed result |
| :--- | :--- |
| `npm test` | Passed: 144 tests in 17 files. New coverage: 6 card tests (`tests/action-item-card.test.tsx`), 3 workspace tests (`tests/review-workspace.test.tsx`), and the manual-evidence exemption in `tests/action-tracking.test.ts`. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation validation only; no model accuracy measured. |
| `npm run build` | Passed: exit 0, Next.js 14.2.35, 4 static pages; home 40 kB / 128 kB first-load JS. Only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. One earlier attempt after `npm ci` failed at trace collection (`ENOENT .next/server/app/_not-found/page.js.nft.json`); deleting `.next` and rebuilding with no dev server passed. |
| `npm ci` | Blocked by the environment: `node_modules/vite/node_modules/esbuild` postinstall failed with `Expected "0.21.5" but got "0.28.2"`. The tree was restored with `npm install --prefer-offline --ignore-scripts` (177 packages); test, typecheck, and build then passed. The `package.json`/`package-lock.json` changes shown by `git` are the pre-existing HugeIcons migration, not this pass. |
| Visual check | Used static `renderToStaticMarkup` of `ReviewWorkspace` with `INITIAL_SAMPLE_EXTRACTION`, the production CSS, and headless Edge screenshots at 1200 px (two-column), 820 px (stacked), and 520 px (small), regenerated after the final build. The 1200 px shot shows the 7/5 split, selected-row rule and wash, inline warnings, text filters, and flat decisions/questions. The 400 px capture appeared clipped because headless Edge clamps the layout viewport to 496 px while cropping the image to 400 px; a DOM diagnostic reported `scrollWidth == innerWidth == 496`, so there was no horizontal overflow. Real mobile widths were not emulated beyond that clamp. |
| Browser interaction | Not run: no scripted click-through in a browser. Interactions are covered by the component regression tests and the static render; the visual check verifies resting layout only. |
| Docker / live model | Not run: presentation-only changes needed no inference, and Docker availability was not confirmed. |

No commits were made in this pass.

## Minimalist UI pass — 22 October 2026

Checkout: `C:\Users\orlan\swudevs`, branch `main` at `b9f5ede`. Scope: visual and copy simplification only. No workflow, persistence, extraction, provenance, or evaluation logic changed. The pre-existing `.env.example` modification was not touched.

### Observed changes
1. Design tokens (`src/app/globals.css`): removed the radial background wash, gradient sidebar, gradient brand mark, panel shadow, and decorative classes (sidebar hills, handwritten hero note, gradient step badge, five tonal stat chips). Stat icons are neutral by default with amber/red reserved for blocked/overdue. Only floating surfaces (auth card, modals) use a single `shadow-lg`.
2. Chrome: the sidebar footer was removed entirely; nav hover and active states flattened. The header AI status pill uses the card surface.
3. Review surface: single green accent for review/execution progress, source links, answered chips, and resolution labels. Blue and emerald accents removed from `ReviewWorkspace`, `ReviewHeader`, `ActionItemCard`, `OpenQuestionsSection`, `DecisionSection`, `EvidenceInspector`. Execution status select uses green for completed and amber for blocked.
4. Micro shadows (`shadow-2xs`, `shadow-xs`) removed from buttons and cards; review status badges neutral except the fully reviewed green state.
5. Deleted unused `MeetingHero.tsx` (never imported).
6. Copy: removed em dashes from the page title, hero subtitle, and auth aside line. Export files and sample data keep original wording per user choice.
7. Docs: `specs/08-ui-ux-design.md` gained a neutral-first color rule; `docs/ui-preview.md` gained this round's section.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm test` | Passed: 134 tests in 15 files, including 1 workspace UI regression test. |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation validation only; no model accuracy measured. |
| `npm run build` | Passed: Next.js 14.2.35 production build, 6 static pages generated. Home 27.8 kB / 115 kB first-load JS; only the pre-existing nonfatal `unpdf` `import.meta` critical-dependency warning appeared. The nonfatal cache snapshot warnings reported in earlier rounds did not occur in this run. |
| Docker | Not run: not attempted in this session; environment does not confirm Docker engine availability. |
| Live model extraction | Not run: no consented inference request was needed for UI-token changes. |

Browser visual confirmation of the simplified chrome was not performed in this session; screenshots and viewport checks remain outstanding.

### Label, badge, and icon-chip cleanup (same session, still 22 October 2026)

Continued in the same pass after user review. Scope again visual only.
1. Removed surplus labels and badges: hero eyebrow `AI · Meeting-to-action tracker`, the duplicated `0 of 0 reviewed` counter in the empty review panel, the `Workspace` nav group label, the `Account preview` pill and the two uppercase aside labels on the account screens, and the always-on task status badge (`Pending review`/`Approved`/`Dismissed`/`Needs owner`) that duplicated the checkbox, strike-through dismissal styling, and the Unassigned pill. Review status is still fully distinguishable.
2. Deleted unused `src/components/review/ReviewHeader.tsx` (never imported; its progress counters duplicate the live review panel).
3. Removed tinted chip backgrounds behind icons: stat icons render bare with muted color (amber/red only when the value is negative), history/export/evidence header icons render plain, the empty-review-state shield is a bare icon, the auth checklist uses bare check icons, and the step numbers `1`/`2` are plain text instead of tinted circles. Brand marks (solid primary tiles) are the only remaining filled icon tiles.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 134 tests in 15 files, including the first-visit UI regression test. |
| `npm run build` | Passed: 6 static pages generated; home 27.6 kB / 115 kB first-load JS; only the pre-existing nonfatal `unpdf` warning appeared. |

### Sidebar removal (same session, still 22 October 2026)

The side navigation bar was removed after the user confirmed it. In a two-column workspace where both steps are visible at once, anchor navigation duplicated the visible flow and added 250px of chrome.
1. Deleted `src/components/WorkspaceSidebar.tsx` and its CSS (`.workspace-sidebar`, `.workspace-brand*`, `.workspace-nav-item`). The page layout no longer uses the `lg:flex` two-pane wrapper.
2. The header now shows the `tambayayong` brand button on all viewports (previously mobile-only); clicking it starts a new meeting. Saved meetings, New meeting, and Export remain in the header.
3. Updated the first-visit regression test in `tests/workspace-ui.test.tsx`: the `"Workspace navigation"` assertion was replaced with the header brand assertion. No other test referenced the sidebar.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 134 tests in 15 files. |
| `npm run build` | First attempt failed with a stale `.next` cache error (`Cannot find module './682.js'`); after deleting `.next` and rebuilding, passed with 6 static pages. Home 26.9 kB / 115 kB first-load JS; only the pre-existing nonfatal `unpdf` warning appeared. |

### Header AI status pill removal (same session, still 22 October 2026)
The user asked to remove the `Cloud AI · Qwen 3.8 via Groq` pill from the header. The pill only duplicated model availability that the intake screen already states, so it was removed together with the unused `/api/ai/health` polling state in `Header.tsx`. Model identity and availability remain visible in the intake status line and `Refresh status` control, both still covered by the first-visit regression test. The user's own brand-mark rewrite and new `/workspace` route were preserved untouched.

Build environment note: three build attempts failed during cache/trace collection (`Cannot find module './682.js'`, `pages-manifest.json` ENOENT, `Failed to collect page data for /_not-found`) while a `next dev --port 3000` process shared the same `.next` directory. After stopping the dev process, deleting `.next`, and rebuilding with no concurrent dev process, the build passed with 7 static pages (including the user's `/workspace` route). Home is 96.5 kB first-load JS. The dev server was restarted on port 3000 afterward and `GET /` returned 200.

---

### Dark default, wordmark, and control consistency (same session, still 22 October 2026)

Continued in the same pass after the user asked for a seamless dark-first UI: dark theme by default, a text-only "tambayayong." wordmark, one shared input/button/link language, and fewer duplicated labels. Scope again visual only: no workflow, persistence, extraction, provenance, or evaluation logic changed.

1. Theme (`tailwind.config.js`, `src/app/globals.css`, `src/app/layout.tsx`): dark tokens are now the default `:root` (`color-scheme: dark`), applied 60-30-10 — near-black green page `#0A100D` (60), lifted card surfaces `#101713` plus `#1C2621` muted fills (30), one green accent `#3FA46F` (10) with dark on-accent text. All `bg-white`/`bg-slate-*`/`text-white` hardcodes in components were replaced with `bg-card`/`bg-muted`/`text-primary-foreground` (plus a `danger-foreground` token for selected dismiss states). Typography is Inter for UI with Sora (`font-display`) for the wordmark and main headings, loaded via Google Fonts with system fallbacks; `themeColor #0a100d` sits in the `viewport` export.
2. Header and brand: removed the Sparkles logo tile from `Header.tsx` and the `T.` tile from `Brand.tsx`. Both now render a text-only lowercase wordmark (`tambayayong` plus a primary `.`), Sora bold with tight tracking.
3. Forms and controls: intake fields share one recessed input style (new `.ui-input` plus unified icon-field classes), the submit uses the shared `.ui-button-primary`, and the loading state is a muted non-button pill. The AI panel names the pinned model once (`{model} · Groq free tier`); the duplicate model pill, the `(optional)` upload tag, and the bottom footnote repeating the free-tier note were removed.
4. Empty states: the first-visit review panel no longer renders the all-zero stats grid (it duplicated the live stats); the step header, "Your action plan starts here", and the Notes → Source checked → Your call strip remain.
5. Regression test (`tests/workspace-ui.test.tsx`): added a dark-default case asserting the text wordmark (`tambayayong<span`) and the absence of `bg-white`/`bg-slate-*`/`text-white`/`border-slate-*` in first-visit markup.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Annotation validation only; no model accuracy measured. |
| First-visit UI render check | Passed: 14/14 assertions via a `tsx` static render (7 present, 7 absent), mirroring the committed regression test. |
| `npm run build` | Passed: Next.js 14 production build, 6 static pages generated. Home 26.8 kB / 114 kB first-load JS. The `themeColor`-in-`metadata` warning appeared on the first attempt, then was fixed by moving `themeColor` to the `viewport` export and rebuilding. Only the pre-existing nonfatal `unpdf` `import.meta` warning and a webpack pack-cache snapshot warning appeared. |
| `npm test` (vitest) | Blocked: vite/esbuild cannot load any config in this sandbox (`Cannot read directory "..": Access is denied`, identical for an equivalent JS config, before any test runs). The committed `workspace-ui` assertions were verified through the `tsx` static-render check above instead; no workflow, extraction, provenance, or evaluation code changed. |
| `npm ci` | Blocked: the sandbox denies the default npm cache and a locked `next-swc` binary broke the first `npm ci`; `npm install --cache .npm-cache-tmp` completed and the temp cache was removed. `package-lock.json` is unmodified. |
| Docker / live model | Not run: token-only UI changes needed no consented inference; Docker engine availability not attempted. |

### Intake form redesign (same session, still 22 October 2026)

Rebuilt the `MeetingIntake` form with a new three-zone structure at the user's request. Same fields, validation, draft autosave, file upload, AI consent gate, and submit flow; only the JSX structure and styling changed. No workflow, persistence, extraction, provenance, or evaluation logic touched.

1. Details zone: title, organization, date/timezone grid, and participants pills. The in-input icons (users, calendar, globe) were removed and all text fields now share `.ui-input`; the orphan "Meeting date unknown" line moved next to the Date label as a compact "Date unknown" toggle.
2. Notes zone: separated by a hairline divider, with label/character-count row, taller textarea (10 rows), drag-drop overlay, and upload link unchanged in behavior.
3. Analyze footer: new tinted footer zone with a status row (dot plus "Open-weight cloud AI", model, "Refresh status"), the live status line, and a consent-plus-submit row that sits side by side on desktop. Removed lucide imports that the new structure no longer uses.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| First-visit UI render check | Passed: 19/19 assertions via a `tsx` static render (12 present including all form labels and the submit, 7 absent), mirroring the committed regression test. |
| `npm run build` | Passed: Next.js 14 production build, all static pages generated. Only the pre-existing nonfatal `unpdf` `import.meta` warning and a webpack pack-cache snapshot warning appeared. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round; the committed assertions were verified through the `tsx` static-render check instead. |

### Slim footer and landing-plus-workspace routes (same session, still 22 October 2026)

After the user questioned the AI footer box and asked for a competitor-style structure, two changes landed. Behaviors and gates are unchanged: consent is still mandatory (project rules plus API enforcement) and analysis is still gated on model availability.

1. Slim footer (`src/components/MeetingIntake.tsx`): the tinted AI box is gone. The footer is now one row with the consent checkbox plus the Analyze button, and a tiny right-aligned status line (dot, "Open-weight cloud AI · {model} · Available/Unavailable", "Refresh status" link). Unavailable-model detail now surfaces only through the submit error banner, which already carries the server message.
2. Routes: the workspace moved from `/` to `/workspace` (`git mv src/app/page.tsx src/app/workspace/page.tsx`), and `/` is a new static marketing landing (`src/app/page.tsx`, server component): sticky nav with wordmark and sign-in, left-aligned hero with workspace/how-it-works CTAs, a four-item features section with bare icons, a three-step how-it-works section, and a footer. Copy states only observed facts (multilingual input, verbatim citations, human review, export formats); no stats or testimonials were invented.
3. Links and tests: the three `/#meeting-workspace` guest links in `AuthScreen.tsx` now point at `/workspace`; `tests/workspace-ui.test.tsx` imports the workspace page from its new path and adds a landing case (workspace link, sign-in link, feature and steps copy, no light utilities).

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Route render check | Passed: 27/27 assertions via a `tsx` static render of both routes (18 present, 9 absent), mirroring the committed tests. |
| `npm run build` | Passed: exit 0; `.next/server/app/page.js` (landing) and `.next/server/app/workspace/page.js` both generated. Only the pre-existing nonfatal `unpdf` `import.meta` warning and a webpack pack-cache snapshot warning appeared. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round; the committed assertions were verified through the `tsx` static-render check instead. |

### Workspace hero removed (same session, still 22 October 2026)

After the user judged the workspace layout awful, the audit found the structural defect: the workspace still opened with the full marketing hero, repeating the landing headline and subcopy back to back. Like competitor apps, the tool now opens directly into the work. The `#overview` hero block was deleted from `src/app/workspace/page.tsx`; the step panels, banners, and in-page anchors are unchanged.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| References | No remaining `overview` or `workspace-hero` references in `src` or `tests`; no asserted test copy lived in the hero. |

### Action-item card remake: one decision unit (same session, still 22 October 2026)

Remade the action-items review unit so each card carries its own decision logic. The problem: three review outcomes were decided in two places (card checkbox plus side-panel "Mark as…"), the side panel acted on whichever task was selected, and "Needs info" posed as a review state when it only opens the editor.

1. `ActionItemCard.tsx`: the card is now one self-contained unit — review-state dot plus title, description, clarification warnings, facts row (assignee, date, commitment, execution status, source link), and a decision row with honest two-state toggles (Approve / Dismiss, both `aria-pressed`, either returns the item to pending). The checkbox column is gone; editing stays on the pencil button.
2. `ReviewWorkspace.tsx`: the side evidence panel is display-only again (quote, provenance, "What to verify", Full text). The duplicated "Mark as…" block and its now-unused `Check`, `HelpCircle`, `X` imports were removed.
3. `tests/action-item-card.test.tsx`: new focused test rendering pending, approved, and dismissed states from the repo sample fixture, asserting the decision labels and pressed states.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Card render check | Passed: 5/5 assertions via a `tsx` static render (pending/approved/dismissed decision labels and pressed states), mirroring the committed test. |
| `npm run build` | Partially blocked: compile succeeded, type/lint checks passed, and static generation completed 7/7 pages. The final "Collecting build traces" step fails reading `.next/server/app/_not-found/page.js.nft.json` (ENOENT) — sandbox filesystem interference on an untouched route, same family as the previously documented sandbox build flakes. A stale-cache failure preceded it and was cleared by deleting regenerable `.next`. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round; the committed assertions were verified through the `tsx` static-render check instead. |

### Single page with hero input card (same session, still 22 October 2026)

After the user shared a reference (centered serif hero, input-mode tiles swapping one card, What-is and How-it-works sections), the site is one single page again: the `/workspace` route is gone and everything lives at `/`. The reference's layout pattern was adopted; its light-purple styling was not (the site keeps the requested dark-green theme).

1. Hero card (`src/components/MeetingIntake.tsx`): a "Choose input" tile row (Text / File / Sample) swaps the card body — textarea, dashed dropzone with Choose file, or the sample flow. Title stays required; organization, date, timezone, and participants moved into a collapsed "Meeting details (optional)" disclosure. Validation, draft autosave, parsing, consent gate, and submit are unchanged.
2. Single page (`src/app/page.tsx`, new `src/components/Workspace.tsx`): centered serif hero, toolbar row (History / Export / New meeting), intake card, review panel, "What is Tambayayong?" with four factual rows, "How does the AI meeting assistant work?" with three tinted step cards, footer. Deleted `src/app/workspace/page.tsx` and the now-unused workspace `Header.tsx`; guest links point at `/#start`.
3. Typography: Source Serif 4 added (`font-serif`) for the hero and section headings; UI stays Inter/Sora.
4. Tests (`tests/workspace-ui.test.tsx`): rewritten for the single page, including tab-tile copy and the absence of any `/workspace` link.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Single-page render check | Passed: 28/28 assertions via a `tsx` static render (tiles, all three input bodies' key copy, details, footer, review empty state, sections), mirroring the committed test. Two first-draft assertions ("Choose file", "Load sample meeting") correctly failed on the default Text tab and were replaced with always-rendered tile copy. |
| `npm run build` | Passed: exit 0, all routes statically generated. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round; the committed assertions were verified through the `tsx` static-render check instead. |

### Strip-down round: no status line, text-only buttons, iconless empty states (same session, still 22 October 2026)

After the user asked for less chrome on the form header, card, buttons, labels, and empty states, the footer status line, button icons, and empty-state icons were removed. Consent, validation, draft autosave, and the availability gate on submit are unchanged; an unavailable model still reports its message through the submit error banner, and status is still checked automatically on load.

1. `MeetingIntake.tsx`: deleted the "Open-weight cloud AI · {model} · Available / Refresh status" line with its dot and refresh button (plus the now-unused `checkingModels`/`cloudReady` state and `Sparkles`, `ArrowRight`, `RefreshCw` imports). The Analyze button is text-only. The form header lost its step number; field labels are now muted medium weight.
2. `Workspace.tsx` and `MeetingHistoryModal.tsx`: removed the step number, the review empty-state shield, and the history empty-state icon. Both empty states were already centered text and remain so.
3. `tests/workspace-ui.test.tsx`: dropped the status-line assertions for the intentionally removed line and now asserts the text-only segmented tabs (`>Text<`, `>File<`, `>Sample<`). One repair pass fixed a mistaken edit that had duplicated an assertion instead of removing the stale ones.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Single-page render check | Passed: 26/26 assertions via a `tsx` static render, mirroring the committed test. Two first-draft tile-copy assertions failed because the segmented tabs render labels only, and one absence assertion wrongly flagged How-section copy; all three were corrected in the check, not the product. |
| `npm run build` | Passed: exit 0. Only the known sandbox pack-cache snapshot warning appeared. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round; the committed assertions were verified through the `tsx` static-render check instead. |

### Icon migration to HugeIcons (same session, still 22 October 2026)

The user asked to replace every lucide-react icon across the website with the HugeIcons library. Scope was icon rendering only: no workflow, persistence, extraction, provenance, or evaluation logic changed.

1. Dependencies: added `@hugeicons/react` (renderer) and `@hugeicons/core-free-icons` (free stroke-rounded set); removed `lucide-react` from `package.json` after the last import was gone.
2. New central wrapper `src/components/icons.tsx`: exports components carrying the lucide names (Check, X, Edit2, Trash2, Loader2, and so on) that forward to `HugeiconsIcon` with default `strokeWidth` 1.75 to match the previous stroke weight, plus `className`, `aria-hidden`, and other SVG props. Marked `"use client"` because `HugeiconsIcon` is a forwardRef component. Call sites changed only their import source, so all JSX kept working unchanged.
3. Icon mapping (verified against `node_modules/@hugeicons/core-free-icons/dist/types` filenames): AlertCircle→AlertCircleIcon, AlertTriangle→TriangleAlertIcon, ArrowLeft→ArrowLeft02Icon, ArrowRight→ArrowRight02Icon, Calendar→Calendar03Icon, CalendarDays→CalendarDaysIcon, Check→CheckIcon, CheckCircle2→CheckmarkCircle02Icon, Clock→Clock01Icon, Copy→Copy01Icon, Download→Download04Icon, Edit2→Edit02Icon, ExternalLink→ExternalLinkIcon, Eye→EyeIcon, EyeOff→EyeOffIcon, FileDown→FileDownloadIcon, FileText→File02Icon, FileUp→FileUploadIcon, History→HistoryIcon, Info→InfoIcon, Kanban→KanbanIcon, Languages→TranslationIcon, Link2→Link02Icon, ListChecks→ListChecksIcon, Loader2→Loading03Icon (spinner keeps its `animate-spin` class), LockKeyhole→LockKeyholeIcon, Mail→Mail02Icon, MessageSquare→MessageSquareIcon, Plus→PlusSignIcon, Quote→QuoteUpIcon, ScrollText→ScrollTextIcon, ShieldCheck→SecurityCheckIcon, Sparkles→SparklesIcon, Table→Table02Icon, Trash2→Delete02Icon, User→UserIcon, UserRound→UserRoundIcon, UserRoundX→UserRoundXIcon, Users→UsersIcon, X→Cancel01Icon.
4. Files swapped: `src/app/page.tsx`, `AuthScreen.tsx`, `MeetingHistoryModal.tsx`, `MeetingIntake.tsx`, `ReviewWorkspace.tsx`, `Workspace.tsx`, and `review/ActionItemCard.tsx`, `DecisionSection.tsx`, `EvidenceInspector.tsx`, `ExportPanel.tsx`, `OpenQuestionsSection.tsx`. `ActionItemEditor.tsx` and `ItemReviewControls.tsx` render no icons.
5. Documentation stack references updated (`docs/PROJECT_DOCUMENTATION.md`, `specs/04-system-architecture.md`); `specs/08-ui-ux-design.md` notes the HugeIcons source and bare-icon rule.

| Check | Observed result |
| :--- | :--- |
| `grep` for remaining lucide imports | Only a descriptive comment in `src/components/icons.tsx`; no module imports `lucide-react` anymore. |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm test` | Passed: 138 tests in 16 files (includes the first-visit UI regression and the action-item card tests). |
| `npm uninstall lucide-react` | Completed; `package.json` now lists only `@hugeicons/react` and `@hugeicons/core-free-icons` for icons. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: 6 static pages, home 23.4 kB / 128 kB first-load JS (the increase over the earlier 96.5 kB comes from the user's expanded single-page landing, not from icons; the icon set tree-shakes). Only the pre-existing nonfatal `unpdf` `import.meta` warning appeared. |
| Dev server restart | Port 3000 again returned 200 after the build. Reminder: stop `npm run dev` before `npm run build`, because both write the same `.next` directory. |

### Friendly wording pass and sign-in removal (same session, still 22 October 2026)

Two requests combined in one pass: friendlier wording across the site (the user found the analyze button and its Groq consent line too technical), and removal of the sign-in/sign-up feature because accounts are not needed.

1. Sign-in removal: deleted `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, and `src/components/AuthScreen.tsx`; removed the header "Sign in" link. The build now produces 4 static pages (home, not-found, and API routes are the rest).
2. Analysis button relabeled from `Analyze with Cloud AI` to `Draft my action plan`, with the loading state as `Drafting your plan...`. The consent line reads `It's okay to send my notes to Groq to draft my plan.`; naming Groq stays because the checkbox is the explicit consent gate for third-party transfer. The missing-consent error now says to tick the box, no longer blaming the user.
3. Friendly copy pass across user-facing strings only (exports, sample data, and server-side messages untouched): intake helper text and errors ("Give your meeting a name to continue", "Add a bit more of your notes..."), file zone ("Drop your file here", "Reading your file..."), sample tab intro, landing hero and how-it-works step 2, layout metadata, workspace sample banner, view subtitles in `ReviewWorkspace` (board/clarifications/items), provenance labels (now "Exact match in your notes", "Matched with small cleanups", "Added by you", "Not checked yet"), `EvidenceInspector` banners ("Found word for word", "Found with small cleanups", "Not found in your notes") and "Characters X to Y" offsets, source-inspection buttons ("See the source"), and the history modal heading ("Saved meetings"). The semantic rule that a located quote proves wording but not commitment stays, just said in plain words.
4. Regression test updated: asserts `Draft my action plan` and the apostrophe-free part of the consent sentence (`okay to send my notes to Groq to draft my plan.`) because React escapes `&apos;` in static markup.
5. Footer: rebuilt with brand plus tagline on the left, an Explore link column (Start now, What is this, How it works), and a bottom bar with `© {year} Tambayayong. Free, open source, and always reviewed by people.`

| Check | Observed result |
| :--- | :--- |
| Sign-in references grep | No `sign-in`/`sign-up`/`AuthScreen` references remain in `src`. |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed after one iteration: 138 tests in 16 files. First run failed only on the consent-string assertion (HTML-escaped apostrophe), fixed by matching the sentence without the apostrophe. |
| `npm run build` | Passed: 4 static pages (sign-in/sign-up pages gone), home 41.1 kB / 129 kB first-load JS. Only the pre-existing nonfatal `unpdf` warning. |
| Dev server restart | Port 3000 returned 200 after the build. |
| Key-props warning | A React dev-log warning ("Each child in a list should have a unique key prop") appeared in earlier dev output; it is benign in production and not triaged in this pass. |

### Sample contents plus editor/decisions/questions minimalism, aligned to HugeIcons (same session, still 22 October 2026)

Tightened the review content surfaces to match the remade form and cards, then aligned to a concurrent session's icon migration discovered mid-turn. A full `git status` revealed the other session is migrating lucide-react to HugeIcons (`@/components/icons`), deleting the auth routes/screens, and editing docs; its import-only edits preserved this session's card and tab structures, confirmed by re-grep before continuing.

1. Sample contents (`SampleMeetingData.ts`): descriptions shortened to noun phrases (titles, ids, evidence quotes, and dates untouched). Verified no test asserts the old wording.
2. `ActionItemEditor.tsx`: all six bordered inputs switched to the filled minimal style.
3. `DecisionSection.tsx` / `OpenQuestionsSection.tsx`: rewritten flat — plain headers with counts, untinted rows (muted fill for approved, dim strike for dismissed, border for pending), ghost icon toggles with pressed states, filled add/edit inputs. Copy and handlers unchanged.
4. Alignment: the two rewritten sections moved from `lucide-react` to `@/components/icons` (import source only, per the migration's convention). The other session had already removed the dead Sign in links from the landing; verified zero `sign-in`/`sign-up`/`lucide-react` references remain in `src`.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Sample review render check | Passed: 12/12 assertions via a `tsx` static render of `ReviewWorkspace` with the sample meeting — new Approve/Dismiss decision row, all five tightened descriptions, decision and question copy present; old descriptions and the removed "Mark as…" block absent. This proves the sample path renders the current card; a stale cached chunk in the browser (hard refresh with Ctrl+F5) explains seeing the old one. |
| `npm run build` | Passed: exit 0. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round. `node_modules` was repaired with a workspace-local npm cache after the lucide→HugeIcons manifest change left it inconsistent. |

### Side-column hierarchy flattening (same session, still 22 October 2026)

After the user flagged the crowded Source evidence / Export results column, removed filler and gave each element one weight: deleted the "From your meeting notes" and export-format subtitles (both restated adjacent controls), demoted "What to check" to a muted small label, and changed the export buttons from four-across to a 2×2 grid so labels like "PDF Report" no longer wrap mid-word. Earlier in the same pass the duplicated stats grids were removed (their counts already live in the progress bars and filter pills), warning pills became a flat text line, the evidence quote box went neutral, and orphaned metrics and icon imports were pruned.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Sample review render check | Passed: 11/11 assertions via a `tsx` static render (decision row, titles, progress and filters present; both stats grids and "Mark as…" absent). |
| `npm run build` | Passed: exit 0. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round. |

### Review header de-slopped (same session, still 22 October 2026)

After the user flagged the "2 Action items" header as slop, removed the step number the concurrent session had reintroduced on the populated review header plus its explanatory subtitle. The header is now the mode-aware title alone ("Action items" / "Action tracker" / "Clarification queue") beside the existing view tabs; the progress row is unchanged.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors (`tsc --noEmit -p tsconfig.check.json`). |
| Review header render check | Passed: 7/7 assertions via a `tsx` static render (title, tabs, progress, decision row present; step number and subtitle absent). |
| `npm run build` | Passed: exit 0. |
| `npm test` (vitest) | Still blocked by the sandbox esbuild directory denial documented in the previous round. |

### Three-step workspace, friendly copy, and sign-in removal (same session, 23 October 2026)

Implemented the planned UX restructure plus the pending friendly-wording pass. Removes the "form stays open above the results" problem: `Workspace.tsx` now owns a `step` state (`notes`, `plan`, `share`).

1. Notes step: the intake card renders alone on first visit; the old first-visit empty panel ("Your action plan starts here") was removed. Sample loading now jumps straight to Plan with the example banner.
2. Plan step: a slim session bar (title, "Updated" chip after re-analysis, date, organization, "X of Y reviewed") with "Edit notes" and "New" controls sits above a full-width `ReviewWorkspace`. Edit notes returns pre-filled; re-running the AI reconciles into the existing meeting and marks the bar so nothing swaps silently.
3. Share step: `ExportPanel` moved out of `ReviewWorkspace` (its import and bottom block removed) into a dedicated "Share your plan" screen with a "Back to plan" control; the header "Export" button opens it directly. First analysis, sample load, and history selection each land on Plan; drafts land on Notes.
4. Friendly wording shipped across intake, landing, review labels, evidence inspector, and history modal: "Draft my action plan", "It's okay to send my notes to Groq to draft my plan." (Groq stays named because the checkbox is the explicit consent gate), provenance labels such as "Found word for word" / "Added by you" / "Not found in your notes", "Saved meetings", and the matched-quote-proves-wording-only rule in plain words. Exports, sample data, and server-side messages untouched.
5. Deleted `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, and `src/components/AuthScreen.tsx`; header "Sign in" link removed. Footer rebuilt: brand + tagline, Explore links (Start now, What is this, How it works), and a copyright bar.
6. `tests/workspace-ui.test.tsx`: keeps the button/consent assertions, drops the removed empty-panel strings ("Your action plan starts here", "Source checked"), adds absences ("Action tracker", "Share your plan") proving the first visit shows only the notes step. Also noted a concurrent session's ExportPanel and ReviewWorkspace header changes observed before final validation.

| Check | Observed result |
| :--- | :--- |
| Sign-in references grep | No `sign-in`/`sign-up`/`AuthScreen` references remain in `src`. |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 138 tests in 16 files. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: 4 static pages, home 40.6 kB / 128 kB first-load JS. Only the pre-existing nonfatal `unpdf` warning. |
| Dev server restart | Stopped, built, restarted; `GET /` returned 200. |
| Docs | `docs/ui-preview.md` gained the three-step flow section; stack docs already point at HugeIcons. |

### Light theme default (same session, 23 October 2026)

The user asked for a light default theme. Because the components are token-driven and all theme colors are hardcoded hex mirrored between two files, the change is one synchronized palette flip:

1. `src/app/globals.css`: `:root` now carries the light palette and `color-scheme: light`. 60-30-10 from the original brand: `#F8FAF8` page, `#FFFFFF` cards / `#EEF2EF` fills, `#247D59` pine green accent with white-on-primary text. Ink text `#172B24`, muted text `#5C6F66`, hairline `#E1E7E3`; amber and red keep meaning only where it carries meaning (`#B7791F`/`#FAF3E3`, `#B43A30`/`#FAECEB`). Selection is a light green tint with ink text; scrollbar thumbs are light gray-greens.
2. `tailwind.config.js`: the Tailwind colors are literal hex (not CSS var references), so they mirrored the same light palette exactly, including `primary.light`, `accent.light`, `teal-light`, `warning.light`, and `danger.light`, which are now light tints instead of dark fills (they are used as chip/card fills, e.g. the "Updated" badge and History count).
3. `src/app/layout.tsx`: viewport `themeColor` changed from `#0a100d` to `#f8faf8`.
4. Only raw colors outside the token system were the modal scrims (`bg-black/40`, appropriate on light themes too) and these three files, confirmed by grep across `src` for hex literals and raw `bg-white`/`text-white`/slate utilities. `darkMode: ["class"]` stays in the Tailwind config but no `.dark` class exists anywhere.
5. `tests/workspace-ui.test.tsx`: the second test renamed from dark-default to light-default with the same meaningful absences (first-visit markup has no raw `bg-white`, `bg-slate-`, `text-white`, or `border-slate-` utilities since the theme remains fully token-driven).

| Check | Observed result |
| :--- | :--- |
| Full-tree color grep | Only `bg-black/40` modal scrims and the three edited files carry raw colors; no other dark hex literals remain in `src`. |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 137 tests in 16 files. |
| `npm run build` | Passed after stopping the dev server and deleting `.next`: 4 static pages. Only the pre-existing nonfatal `unpdf` warning. |
| Dev server restart | Stopped, built, restarted; `GET /` returned 200 and the served page carries the light tokens. |

### Input fields given clear edges after the light flip (same session, 23 October 2026)

The user's screenshot showed why: the "Meeting details (optional)" panel is a muted-tinted surface, and `.ui-input` fields were "transparent border on the exact same muted fill," so the Organization and Participants boxes melted into the panel while the native date/timezone controls (which keep their own borders) looked like the only real fields. Fixed `.ui-input` centrally: white fill with a hairline `border-border`, ring on focus unchanged; disabled state stays muted. The Decision/OpenQuestions edit-mode inputs share the class and now read as active edit fields, which is the correct affordance.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 137 tests in 16 files. |
| `npm run build` | First attempt hit the known `.next` race after killing the dev server (ENOENT `PageNotFoundError`); retried after a 5 s settle with a clean `.next` and passed. |
| Dev server restart | `GET /` returned 200. |

### Header simplified to ordered links (same session, 23 October 2026)

The user asked for the header links to display properly, in the correct sequence, with the "Start now" button removed. The header is now brand left, plain text links right in page order: "Start now" (`#start`), "What is this", "How it works"; the green button was deleted. The nav visibility breakpoint moved from `md:` to `sm:` so the links show on small tablets too, while very narrow phones keep the brand-only header (no overflow and no jumbo navigation).

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 137 tests in 16 files (the `href="#start"` regression assertion now covers the nav link). |
| `npm run build` | Passed clean `.next` build. |
| Dev server restart | `GET /` returned 200; served markup carries the three header links in order. |

### JetBrains Mono branding pass (same session, 23 October 2026)

The user chose a monospace-flavored identity for the `tambayayong` text logo and small site accents (JetBrains Mono, wordmark plus small labels only).

1. `src/app/layout.tsx`: added `JetBrains Mono` wght 500/600/700 to the existing Google Fonts `<link>`.
2. `tailwind.config.js`: new `fontFamily.brand` = `["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"]`.
3. `src/components/Brand.tsx`: wordmark switched from Sora bold/tracking -0.045em to `font-brand` semibold at `text-[21px]`/tracking -0.02em; text stays lowercase `tambayayong` + green period, so the wordmark regression assertion still holds. One component change covers header and footer.
4. Mono accents kept deliberately small: eyebrow labels "The idea" and "The process" above the two explainer sections (uppercase, tracking 0.2em, muted gray), the footer "Explore" column label, the footer copyright row, and the small status chips in the workspace top bar (History saved-count and the "Updated" badge, both with `font-brand`). Body text, headlines, buttons, and inputs stay Inter/Sora/Source Serif.
5. No workflow, storage, or API changes; static markup and fonts only.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 137 tests in 16 files. |
| `npm run build` | Passed clean `.next` build. |
| Dev server restart | `GET /` returned 200; served markup contains `font-brand` classes, the JetBrains font link, and both new eyebrow labels. |

### What-is icon layout and size (same session, 23 October 2026)

The user asked for slightly larger icons in the "What is Tambayayong?" point grid, then for them to sit on top of their text instead of beside it. The four grid items changed from a horizontal `flex gap-3.5` row to a vertical stack: 6×6 green HugeIcons glyph, then title, then body, with the same spacing rhythm.

| Check | Observed result |
| :--- | :--- |
| `npm run typecheck` | Passed: 0 errors. |
| `npm test` | Passed: 137 tests in 16 files. |
| `npm run build` | Passed clean `.next` build. |
| Dev server restart | `GET /` returned 200. |

## Multilingual AI Intelligence Upgrade — 20 October 2026

Checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, feature branch `codex/multilingual-ai-upgrade` (based on `main` at `fb3ff2f`).

### Implemented Multilingual Capabilities
1. **Multilingual Understanding Prompt:**
   - Updated `EXTRACTION_SYSTEM_PROMPT` in `src/server/services/extraction-core.ts` to support Cebuano (Bisaya), Tagalog (Filipino), English, Bislish, Taglish, and natural multi-speaker code-switching.
   - Enforces intent distinction: confirmed commitments, proposed ideas, uncertain / secondhand statements (particles `daw`, `raw`, `kuno`), cancellations / negations (recorded as decisions, not active tasks), and late corrections / reassignments.
2. **English-First Extraction with Verbatim Citation Preservation:**
   - Action titles, descriptions, summaries, decisions, and open questions generated in clear, natural English.
   - Preserves original names, nicknames, and verbatim source quotations in their original source language with exact offsets.
   - Captures original wording in `sourceTitle` and displays it in `ActionItemCard` when distinct from the English title.
3. **Multilingual Date & Deadline Interpretation:**
   - Extended `src/server/services/deadline-resolver.ts` with `MULTILINGUAL_DAY_MAP` and Tagalog / Cebuano relative date expressions (`ugma`, `bukas`, `karon`, `ngayon`, `mamaya`, `unya`, `gahapon`, `kahapon`, `sa makalawa`, `sunod semana`, `susunod na linggo`, `ngayong biyernes`, `next Friday`, `sa Lunes`, `bago mag`, `hanggang`).
   - Ambiguous phrases like `sunod semana`, `susunod na linggo`, and `next week` without a specific day remain strictly flagged with `date: null` and `isAmbiguous: true`.
4. **70-Case Multilingual Benchmark Dataset:**
   - Expanded `eval/dataset.json` to 70 benchmark cases:
     * 15 Cebuano cases (`ceb-01` to `ceb-15`)
     * 15 Tagalog cases (`tgl-01` to `tgl-15`)
     * 15 English cases (`eng-01` to `eng-15`)
     * 15 Code-switched / Mixed cases (`mix-01` to `mix-15`)
     * 10 Edge cases (`edge-01` to `edge-10`: cancellations, corrections, secondhand `daw`/`kuno`, proposed ideas)
   - Updated `eval/validate-dataset.ts`, `eval/metrics.ts`, and `eval/run-model-eval.ts` with per-language breakdown reporting.
5. **Regression Coverage & Schema Integrity:**
   - Added unit test suites in `tests/deadline-resolver.test.ts` (9 new tests, 25 total), `tests/multilingual-extraction.test.ts` (9 tests), and `tests/extraction-core.test.ts` (strict schema completeness check).
   - Fixed strict schema incompatibility by including `sourceTitle` in the `actionItems` `required` array.
   - Enhanced `groq-client.ts` error handling to extract sanitized rejection reasons on non-200 responses without exposing sensitive notes or keys.
6. **Live Multilingual Model Verification:**
   - Verified live extraction with pinned `qwen/qwen3.8-27b` model on Groq across English, Cebuano, and Tagalog notes: all returned HTTP 200 with accurate English titles, dates, assignees, and original `sourceTitle` wording.

| Check | Observed result |
| :--- | :--- |
| `npm ci` | Passed; 175 packages installed from lockfile. |
| `npm run eval:validate` | Passed: 70 dataset cases (15 english, 15 cebuano, 15 tagalog, 15 mixed, 10 edge_cases). Schema and source annotation validation only. |
| `npm test` | Passed: 117 tests in 14 files (100% passing). |
| `npm run typecheck` | Passed: 0 TypeScript errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run build` | Passed: Next.js 14.2.35 production build compiled successfully; all 6 static routes generated. |
| Production HTTP | `GET /` returned HTTP 200 with responsive server on port 3000. |
| Live Groq Extraction | Verified live on English, Cebuano, and Tagalog sample notes with HTTP 200. |
| Model & Fallback Check | Pinned to `qwen/qwen3.8-27b` on Groq server-side. Zero proprietary fallback. |
| Docker | Engine unavailable at `dockerDesktopLinuxEngine`; container execution skipped as documented. |

---

## Phase 3: Corrective Pass & Action Tracking Acceptance — 20 October 2026

Checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, feature branch `codex/phase3-action-tracking` (based on `main` at `d4c5375`).

### Corrective Pass Enhancements
1. **Clarification Logic Refinement:**
   - Detects source-changed items requiring review (`retainedFromReview: true && needsReview: true`) and surfaces `"Source changed"`.
   - Detects AI-generated action items lacking verified evidence citations (`!task.isManual && !hasVerifiedEvidence`), flagging them with `"Unverified citation"`.
   - Preserves citation exemption for manually added user tasks.
2. **Ambiguous Deadline Flag Preservation:**
   - In `ActionItemEditor`, editing task title, assignees, description, status, or priority preserves `task.deadline.isAmbiguous: true` unless the user explicitly modified the deadline date.
3. **Timezone-Aware Overdue Calculation:**
   - Replaced UTC ISO date truncation with `getTodayInTimezone(timezone)` (defaulting to the meeting's configured timezone or `task.deadline.timezone`, e.g. `Asia/Manila`).
   - Prevents day-boundary discrepancies where UTC date lags behind Asia/Manila.
4. **Needs Info Consistency:**
   - Harmonized the Review List's "Needs info" filter to match the Clarify tab (`t.reviewStatus !== "rejected" && getClarificationReasons(t).length > 0`).
   - Correctly excludes rejected tasks from both views and aligns counter badges.
5. **Regression Coverage:**
   - Added focused regression tests in `tests/action-tracking.test.ts` covering all edge cases.

| Check | Observed result |
| :--- | :--- |
| `npm ci` | Passed; 175 packages installed from lockfile. |
| `npm run eval:validate` | Passed: 20 dataset cases (6 English, 7 Cebuano, 7 mixed). Schema and source annotation validation only. |
| `npm test` | Passed: 97 tests in 13 files (including 15 tests in `tests/action-tracking.test.ts` and 7 end-to-end acceptance tests in `tests/acceptance-phase3.test.ts`). |
| `npm run typecheck` | Passed: 0 TypeScript errors (`tsc --noEmit -p tsconfig.check.json`). |
| `npm run build` | Passed: Next.js 14.2.35 production build compiled successfully; all 6 static routes generated. |
| Model & Fallback Check | Pinned to `qwen/qwen3.8-27b` on Groq server-side. Zero proprietary fallback. |
| Docker | Engine unavailable at `dockerDesktopLinuxEngine`; container execution skipped as documented. |

---

## Groq key and first live inference — 20 October 2026

The user supplied a Groq API key, which was placed in ignored `.env.local` and not committed. After stopping the old server and restarting the production app, `GET /api/ai/health` returned HTTP 200 with `configured=true`, `modelAvailable=true`, `provider=groq`, and the exact pinned `qwen/qwen3.8-27b` model. One consented request using only public sample notes returned HTTP 200 with two action items, zero decisions, zero open questions, and `analysis.provider=groq` with the pinned model. This confirms live routing and extraction, not correctness on the 20-case benchmark or semantic accuracy. The existing `eval/model-eval-report.*` remains `NOT_RUN` because its CLI check ran before the key was saved; a full benchmark was not run against the free-tier quota.

The key value was pasted into chat. Rotate it in Groq and replace the value in `.env.local` when convenient; do not place the replacement in chat or Git.

## Groq free-tier switch — 20 October 2026

The current app pins the Apache-2.0 `qwen/qwen3.8-27b` model on Groq's Free plan. Groq's published free-plan limits list this model, and its structured-output documentation lists strict JSON schema support. This is a service offering with rate limits, not a guarantee of unlimited free inference. The app sends notes only after explicit confirmation, uses `GROQ_API_KEY` server-side, never falls back to another model/provider, and preserves historical `ollama` and `huggingface` provider metadata in saved meetings. The old Hugging Face token was removed from ignored `.env.local`; no Groq key is present yet.

| Check | Observed result |
| :--- | :--- |
| `npm ci` | Passed; 175 packages installed. npm reported 16 dependency audit findings (5 moderate, 8 high, 3 critical); no automatic dependency changes were made. |
| `npm run eval:validate` | Passed: 20 dataset cases, 6 English, 7 Cebuano, 7 mixed; no model accuracy measured. |
| `npm test` | Passed: 75 tests in 11 files, including exact Groq routing, consent, free-tier rate-limit error, no fallback, and evaluation isolation. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed with Next.js 14.2.35; six pages generated. |
| `npm run eval:model` | Exited 1 and wrote `NOT_RUN` with zero evaluated samples and null metrics because `GROQ_API_KEY` is absent. No real-model extraction or accuracy is claimed. |
| Production HTTP | `GET /` returned 200 with Groq UI and no DeepInfra UI; a JavaScript asset returned 200. `GET /api/ai/health` returned 503 with `provider=groq`, `configured=false`, and `modelAvailable=false`, as expected without a key. |
| Docker | Engine unavailable at `dockerDesktopLinuxEngine`; no container check was run. |

Next live check: after the user places a Groq Free-plan key in `.env.local` and restarts the server, verify the authenticated model catalog and one public-sample extraction. Do not infer semantic accuracy from the model listing or unit fixtures. Groq's current [free-plan limits](https://console.groq.com/docs/rate-limits) and [structured-output support](https://console.groq.com/docs/structured-outputs) are external service documentation, not observed account entitlements.

## Token configuration and live cloud check — 20 October 2026

The user supplied a Hugging Face token, which was placed in ignored `.env.local` without adding it to Git. The development server was restarted. `GET /api/ai/health` returned 200 with the exact pinned model and provider listed as available. A token-only identity check returned HTTP 200, confirming that Hugging Face accepted the credential. One public-sample analysis request reached the inference router but returned HTTP 402 before producing an extraction. No task prediction, citation result, or model accuracy is claimed. Hugging Face's billing/credit state must be resolved in the user's account before a complete live extraction can be verified. The client now shows a specific credits/billing message for HTTP 402; a regression test covers this error and confirms no provider fallback.

Because the token value was pasted into chat, rotate it in Hugging Face and replace the value in `.env.local` after resolving billing. Do not place the replacement in chat or Git.

Validation after the HTTP 402 handling change: `npm test` passed 73/73 tests in 11 files, `npm run typecheck` passed, and `npm run build` passed on Next.js 14.2.35. The preceding cloud-only pass also completed `npm ci` and `npm run eval:validate`. A full live-model extraction remains unverified because the provider returned HTTP 402. Docker checks remain blocked by the unavailable Docker engine.

## Cloud-only inference — 20 October 2026

Checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, branch `codex/ai-ready-polish`. The app now shows only the pinned `Qwen/Qwen3-32B:deepinfra` cloud path. The Ollama route, health checks, service module, and Compose service were removed; historical `analysis.provider` values remain readable in existing saved meetings. The browser still requires a fresh transfer confirmation for analysis. The ignored `.env.local` kept its unrelated entries; only obsolete Ollama keys were removed.

| Check | Observed result |
|---|---|
| `npm ci --cache .npm-cache --no-audit --no-fund` | Passed: 175 packages installed from lockfile after stopping the local development server. |
| `npm run eval:validate` | Passed: 20 cases (6 English, 7 Cebuano, 7 mixed). Dataset structure only. |
| `npm test` | Passed: 71 tests in 11 files. The API rejects the removed `ollama` provider; cloud consent, model routing, source assembly, and evaluation isolation remain covered. |
| `npm run typecheck` | Passed with zero errors. |
| `npm run build` | Passed on Next.js 14.2.35; `/` is 21.7 kB with 109 kB first-load JS. All 6 static pages generated. |
| `docker compose config --quiet` | Passed. |
| Docker runtime | Not run: `docker info` could not find the Docker Desktop Linux engine pipe. |
| Production HTTP | `GET /` returned 200, contained “Open-weight cloud AI,” and did not contain “My Ollama server.” `GET /api/ai/health` returned 503 with `model=Qwen/Qwen3-32B`, `provider=deepinfra`, and `configured=false`. A public-sample POST specifying `provider=ollama` returned 400. |
| `npm run eval:model` | Exited 1 and wrote `NOT_RUN` with zero evaluated samples and null metrics because `HF_TOKEN` was absent. No live inference or accuracy score is claimed. |

Hugging Face token settings required sign-in. The user reported being signed in through Chrome, but Chrome was unavailable to the browser connector; Windows Computer Use stopped because it could not verify Chrome's current URL. Token creation is pending in the user's account. The server needs `HF_TOKEN` with Inference Providers permission, then a restart and a live public-sample smoke check. Do not paste the token into chat or commit it.

## Open-weight cloud AI — 20 October 2026

Checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, feature branch `codex/ai-ready-polish` (based on `main` at `41b1d8d`). The intake now offers a separate Qwen3-32B cloud choice through Hugging Face Inference Providers and the pinned DeepInfra provider. The server requires an explicit cloud transfer confirmation and keeps `HF_TOKEN` server-side. It uses the existing extraction, provenance, review, and meeting persistence path. The Ollama choice still requires an explicit installed local model. Guest accounts remain deferred.

| Check | Observed result |
|---|---|
| `npm ci --cache .npm-cache --no-audit --no-fund` | Passed: 175 packages installed from the lockfile after stopping the verified local Next.js development processes that held SWC open. The first attempt failed with Windows `EPERM` on that binary. |
| `npm run eval:validate` | Passed: 20 cases (6 English, 7 Cebuano, 7 mixed). Checks dataset annotations, not model accuracy. |
| `npm test` | Passed: 79 tests in 11 files. New tests cover pinned cloud routing, structured output, unavailable provider, malformed output, consent at the API boundary, and cloud evaluation using only source fields and actual predictions. |
| `npm run typecheck` | Passed with zero errors. |
| `npm run build` | Passed on Next.js 14.2.35; `/` is 22.6 kB with 110 kB first-load JS. The sandboxed attempt failed with Windows `EPERM` creating `.next/static/chunks`; the permitted rerun compiled and generated all 6 static pages. |
| `git diff --check` | Passed before final documentation update. |
| `docker compose config --quiet` | Passed. |
| Docker runtime | Not run: `docker info` could not find the Docker Desktop Linux engine pipe. |
| Local Ollama | `ollama list` showed only `gemini-3-flash-preview:cloud`, `minimax-m2.5:cloud`, and `deepseek-v4-pro:cloud`; no installed local model was eligible for extraction. |
| Cloud evaluation | `EVAL_PROVIDER=huggingface npm run eval:model` exited 1 and wrote `NOT_RUN`, evaluated sample count 0, metrics null. `HF_TOKEN` was absent from `.env.local`, so no cloud inference or model accuracy is claimed. |
| Production HTTP and browser smoke | `GET /` returned 200 and contained the cloud choice. The isolated `127.0.0.1:3000` browser showed the selected cloud model, transfer checkbox, and missing-token message while preserving its existing test draft. `GET /api/ai/health` returned 503 with `cloudConfigured=false`, `modelAvailable=false`, and the pinned model/provider. A sample cloud POST without confirmation returned 400; with confirmation and no token it returned 503. No sample notes were sent to an external service. |

The public Hugging Face router catalog showed `Qwen/Qwen3-32B` live on DeepInfra with structured-output support during implementation, but the production request remains unverified until a server token with Inference Providers permission is configured. Cloud mode on an unauthenticated public deployment could spend the server token's credits; the README limits this preview to a trusted/private instance until accounts and server-side access controls are added.

## Website and local AI readiness — 20 October 2026

Checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, feature branch `codex/ai-ready-polish` from the current `main` (`41b1d8d`). The workspace now exposes a **Refresh models** control and requires the user to select an exact installed local Ollama tag. It distinguishes a disconnected server from a connected server with no local models. New meetings use separate draft keys; **Saved work** lists those drafts alongside analyzed meetings. The legacy `current_draft` and `meeting:<id>` records remain readable. The hand-authored example no longer replaces an open draft when loaded. The home introduction uses less vertical space while keeping the existing green/white design.

| Check | Observed result |
|---|---|
| `npm ci --cache .npm-cache --no-audit --no-fund` | Passed after stopping the verified local Next.js server: 175 packages installed from the lockfile. |
| `npm run eval:validate` | Passed: 20 cases (6 English, 7 Cebuano, 7 mixed). Dataset structure only. |
| `npm test` | Passed: 72 tests in 10 files. Added new-draft isolation coverage; the evaluation fixture reported zero predicted tasks where zero were returned. |
| `npm run typecheck` | Passed with zero errors. |
| `npm run build` | Passed on Next.js 14.2.35; `/` is 21.9 kB with 109 kB first-load JS. The first final rerun hit Windows `EPERM` creating `.next/static/chunks`; a permitted rerun passed. |
| `git diff --check` | Passed. |
| `docker compose config --quiet` | Passed. |
| Docker runtime | Not run: `docker info` could not find the Docker Desktop Linux engine pipe. |
| Local Ollama / real-model evaluation | `ollama list` completed after the installed Ollama 0.32.5 started. It showed only `gemini-3-flash-preview:cloud`, `minimax-m2.5:cloud`, and `deepseek-v4-pro:cloud`. No local model was available, so no real-model inference or accuracy result is claimed; no cloud model was called. |
| Browser | On the local development server, the normal `localhost:3000` origin restored an existing 471-character guest draft and displayed “No local models.” On isolated `127.0.0.1:3000`, a new meeting opened empty, the earlier 48-character test draft appeared in Saved work, reopening restored it, and loading the labeled illustrative example left that draft intact. |

The production build passed, but a standalone `next start`/`server.js` smoke check timed out on local HTTP despite reporting ready. The permitted development server returned HTTP 200 and supported the browser checks above. A full production HTTP workflow and real-model extraction remain unverified in this environment. Hugging Face has not been integrated; the configured inference path remains self-hosted Ollama with exact model selection.

## Minimal workspace review — 19 October 2026

Current checkout: `C:\Users\marka\OneDrive\Desktop\Tambayayong`, branch `codex/minimal-workspace` based on `main` at `56d0e9a`. The branch retains the pre-existing uncommitted consolidation and adds a focused home workspace. A fresh browser starts with empty notes/review; an existing draft still restores from IndexedDB. The intake shows an exact local-model selector and one notes-to-review path. **Explore example** opens a clearly labeled hand-authored fixture; changes to that fixture are not written as an AI-analyzed guest meeting. Review counters are compact, and the source panel explicitly asks a person to verify the task semantics. The existing IndexedDB stores and keys were not changed.

| Check | Observed result |
|---|---|
| `npm ci --cache .npm-cache --no-audit --no-fund` | Passed outside the restricted sandbox after the running Next.js process was stopped; 175 packages installed from lockfile. The workspace cache is ignored by Git. |
| `npm run eval:validate` | Passed: 20 cases (6 English, 7 Cebuano, 7 mixed). Dataset structure only. |
| `npm test` | Passed: 71 tests in 10 files. Includes a new first-visit regression test plus persistence, re-analysis, provenance, model errors, and evaluation isolation. |
| `npm run typecheck` | Passed with zero errors. |
| `npm run build` | Passed on Next.js 14.2.35; `/` 21 kB and 108 kB first-load JS. Webpack reported nonfatal cache snapshot warnings. |
| `docker compose config --quiet` | Passed syntax check; Docker warned it could not read the sandboxed user config. |
| Docker runtime | Not run: `docker info` could not find the Docker engine pipe. |
| Local Ollama / real-model evaluation | Not run: `/api/ai/health` showed local AI offline; a direct localhost:11434 probe timed out, and no `ollama` command was on PATH. No model accuracy is claimed. |
| Browser | After restarting the local development server, the empty first visit and the labeled example preview rendered correctly at a 1274 px desktop viewport. Source-check wording and explicit model selector were visible. |

The first sandboxed `npm ci` was blocked by the server holding the native SWC file, and a second attempt could not fetch a package from npm. A permitted clean install then passed. Sandbox runs of `tsx` and native esbuild could not access required Windows APIs/ancestor paths; permitted reruns passed. The development server was restarted on port 3000 after the build so current styles loaded.

Latest consolidation: [Canonical localhost workspace](workspace-consolidation.md). The updated source now also runs in the original folder on port 3000; the original-folder preservation statements below describe the earlier isolated implementation phase.

Latest UI update: Minimal side-by-side 2-column workspace (`1 Meeting notes` and `2 Action items`) matching the reference layout while removing unnecessary chrome, decorative clutter, and fake rich-text controls. Verified with `npm run typecheck` (0 errors), `npm test` (70/70 tests across 9 files), `npm run eval:validate` (20 cases: 6 English, 7 Cebuano, 7 mixed), and `npm run build` (Next.js 14.2.35 production build, `/` at 21.3 kB / 109 kB first-load JS). Earlier reliability results below describe the preceding implementation.

Observed on 19 October 2026 (Asia/Singapore). Base: `Miguma/SWUdevs` main at `56d0e9a3c587bc8f6cd6d0108c475878b0c60de9`. Work branch: `codex/reliability-and-hackathon`.

## Source and user data

The original checkout at `C:\Users\marka\OneDrive\Desktop\Tambayayong` was clean on main and matched GitHub. Its ignored local configuration points to localhost Ollama and the old `qwen3:4b-instruct` tag. Implementation was done in an isolated checkout. The original checkout, environment files, browser meeting data on its normal origin, and model files were not modified. Browser checks used the separate localhost:3100 origin and public sample notes. No proprietary AI API was called.

## Implemented

- The page owns meeting persistence. Review callbacks no longer perform a second IndexedDB write. Saves use immutable snapshots and run in order; a failed write does not prevent subsequent saves. Save failures stay visible with retry/export guidance.
- Re-analysis keeps the meeting ID and creation timestamp. It replaces the previous AI pass, matches items once, preserves original AI titles for identity across human edits, and retains manual/edited/reviewed work. Source citations are re-anchored; changed content/source requires review again. Unmatched human work remains visibly retained for review across repeated analyses. Different semantic paraphrases can still require manual reconciliation.
- Edited-meeting drafts have separate keys from new-meeting drafts. Existing stores/keys remain compatible; no destructive schema migration or cleanup runs.
- Users explicitly select an installed local model. Missing models produce an actionable error instead of fallback. Cloud-backed tags are excluded. The chosen model/time is recorded, and an unexpected returned model identity is rejected. Defaults use the documented `qwen3:4b` tag.
- The inference limiter reserves a slot before health checks. Timeouts include response-body reading. Input size, context-pressure signals, truncated output, invalid structured output, and empty responses fail explicitly.
- Bilingual instructions cover negation, corrections, speaker-based ownership, proposals, answered questions, and duplicate discussion. Names and deadline phrases unsupported by an item's citation are removed or flagged. Exact/normalized quotes use offsets in the original source, including CRLF and Unicode casing; manual provenance never becomes a highlighted AI quote.
- Review progress includes tasks, decisions, and questions. Zero items display zero percent and a distinct empty state. All categories have explicit review controls and evidence inspection. Task edits return to pending review.
- Exports retain evidence provenance and edited-item labels. CSV adds deadline relation/time/timezone and defends formula prefixes hidden after whitespace.
- The legacy evaluator delegates to the strict live runner. There is no ground-truth prediction fallback. Empty predictions stay empty; offline/missing models generate NOT_RUN with null metrics. Reports include actual predictions, dataset hash, coverage/errors, exact owner sets, commitment scoring, and one-to-one lexical task/decision/question matching. Matching remains a heuristic requiring human audit for multilingual paraphrases.
- Existing green/white styling is retained. Changes add responsive wrapping, focus outlines, labels, keyboard-operable history, modal focus trapping/restoration, reduced-motion support, and darker secondary text.
- CI supports manual reruns, uses a fixed runner image, limits permissions/time, and typechecks evaluation/test code. A Docker ignore file excludes local configuration and build/dependency artifacts from the image context. `AGENTS.md` describes the Codex workflow.

## Exact validation

| Check | Observed result |
|---|---|
| `npm ci --cache ../npm-cache --no-audit --no-fund` | Passed; dependencies installed from lockfile. A workspace-local cache avoided an inaccessible host cache. |
| `npm run eval:validate` | Passed: 20 cases (6 English, 7 Cebuano, 7 mixed). Annotation syntax/source-name validation only. |
| `npm test` | Passed: 70 tests across 9 files. Includes API, IndexedDB, save ordering/failure recovery, re-analysis, provenance, and evaluation isolation. |
| `npm run typecheck` | Passed, including source, tests, and evaluation files. |
| `npm run build` | Passed: Next.js 14.2.35 production build. Root page about 110 kB first-load JS. |
| `npm run check` | Passed, exit 0: final combined dataset/test/type/build validation after the last source change. |
| `npm run eval:model` | Exited 1 and wrote NOT_RUN, evaluated sample count 0, metrics null. No model accuracy measured. |
| `docker compose config --quiet` | Passed syntax validation. |
| Docker image/stack execution | Not run: Docker engine pipe unavailable; daemon is not running. |
| Local Ollama | localhost:11434 refused connection. Ollama executable found outside PATH but launch was denied by the Windows sandbox. Installed manifests found were cloud tags only, not a local inference model. No cloud tag was invoked. |
| Browser | Sample loading, offline inference error with all 1,600 note characters retained, draft restoration after reload, and mobile layout checked. At a 390 px viewport, document width was 384 px, with no horizontal overflow. |
| Full production browser workflow | Not completed: automatic approval review rejected starting the production server, including after refreshing network permission. The tool reported that sandbox approval was required while that approval category is disabled. A proposed HTTP fixture smoke service was stopped without completing the workflow; it produced no real-model evidence. |

The Windows sandbox blocked native esbuild's parent-directory lookup and Node's `os.userInfo` call. Tests used a session-only runtime preload and the same esbuild 0.21.5 WebAssembly implementation in local `node_modules`. These workarounds are outside tracked application source and are not part of the patch. CI on Linux/Node 20 has not been rerun, so a clean native CI run remains a validation gate. Next build emitted nonfatal cache snapshot warnings in this sandbox. No separate ESLint rules were configured in the source project; the misleading standalone lint script/CI label was removed.

## GitHub CI blocker

Run: https://github.com/Miguma/SWUdevs/actions/runs/39262958568

Job `118095107005` failed before any steps ran (runner ID 0). GitHub's check annotation states: “The job was not started because your account is locked due to a billing issue.” This is an account-level blocker; repository changes cannot unlock the account. Once resolved, manually run CI or open the change as a PR. Job log retrieval returned BlobNotFound because no job logs were available.

## Delivery and remaining gates

Git push had no usable noninteractive credentials. The connected GitHub app returned HTTP 403, “Resource not accessible by integration,” when asked to create the review branch. No remote branch or PR was created, and main was not changed.

The handoff includes a patch and a source archive. Apply on a clean branch based on the base commit, review the diff, and push/open a PR through an account with repository write access. Do not overwrite unrelated local work.

Before a live hackathon demonstration:

1. Start Ollama and install a real local model, for example `ollama pull qwen3:4b`. Select that exact installed tag in the form. Existing `.env.local` files are intentionally preserved; update the old tag if using it as the default.
2. Run `npm run eval:model` with the intended model/host in shell environment variables and audit the saved predictions. Model quality, semantic correctness of negation/correction handling, latency, and hardware suitability remain unverified here.
3. Run the complete browser review/edit/re-analysis/export flow and Docker stack with available services. Start a local app with `npm run dev` or a built app with `npm start`.
4. Resolve the GitHub billing lock and obtain a green CI run on the review branch.

Long transcripts are bounded rather than chunked; the model context is 16,384 tokens with a 4,096-token output budget. Character limits/context-pressure checks are safeguards, not an exact tokenizer estimate. Guest storage is browser-local. PostgreSQL schema definitions do not implement authenticated server synchronization.
