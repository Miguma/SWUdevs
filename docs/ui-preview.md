# UI and account-screen preview

This update continues from the reliability work at `f0479cd`.

The user explicitly chose polished account screens first, with real accounts to be connected later. No authentication service, user database, email delivery, OAuth, password storage, login session, or account synchronization is implemented or implied.

## Wired step timeline and header pill fix (23 October 2026)

- Header action row: the `New meeting` pill was effectively invisible because `.workspace-top-action` sat outside Tailwind's cascade layers and overrode the utility classes. It now lives in `@layer components` (and `button:disabled` in `@layer base`), so the label is primary green and the pill reads as a pill. When there is nothing to clear the button shows a neutral grey outline pill instead of vanishing; once a draft or meeting exists it becomes the green-tinted outline pill.
- `/how-it-works`: the steps share one hairline wire with a node centred on it for each step, `01/02/03` numerals, and the line terminating at the last node. The horizontal wire starts at `lg` (three columns at ~325px each); below that the page uses the vertical timeline. The shell is wider (`InfoPage wide`, `max-w-5xl`) with the intro kept at `max-w-2xl`, and the page closes with a "Ready when you are" block and a `Start a meeting` secondary pill.
- `/what-is`: the four points are now one aligned column of hairline-topped blocks (the 2×2 grid left a hole under the shorter card because the second row was pinned to the taller one), and the page closes with a `Next` block linking to `/how-it-works` — so the explainers chain into the tool.
- Landing footer on phones: the Explore links are one content-sized row under the label instead of a 44px-per-row stack, so `Tool · What is this · How it works` read as a single nav line; tap targets stay 44px tall and the desktop right-aligned column is unchanged.
- Page titles follow `Tambayayong | <label>` via a root-layout template (`Tambayayong | Meeting notes to action plans` on `/`, then `What is this`, `How it works`, `Privacy policy`, `Terms of service`), with a short description and `application-name`. No Open Graph tags: no canonical domain or share image exists yet.
- Verification: node/wire geometry measured in the browser (nodes at y≈0–1px on the rule, third column without a rule), header pill computed styles captured in both states, footer link boxes measured at 320/390 (44px tall, no overflow), titles read from the served HTML, no overflow at 320/360/380/390, 165 tests passing, typecheck clean, production build 8/8 pages.

## CTA pill system, desktop header pill, default zoom, and section pages (23 October 2026)

The calm mono system gains a deliberate button hierarchy, a slightly larger default rendering on desktop, and the two explainer sections on their own pages. Presentation only: validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores/keys, the persistence owner, providers, and evaluation are unchanged.

- Button hierarchy: the page submit `Draft my action plan` stays the only filled primary action and is now a rounded pill; a new `.ui-button-pill` class marks form CTAs as primary-tinted outline pills (`Add task`, `Save`, `Add`, the four export buttons — PDF keeps its tint — `Today` in the date picker, `Load sample meeting`). `Choose file` is a neutral outline pill. Secondary/utility controls (`Clear`, `Copy`, Approve/Dismiss, icon buttons, `History`/`Export`) stay flat text.
- Desktop header: `History · Export` sit left of a hairline divider as quiet mono actions; `New meeting` is a primary-tinted outline pill anchoring the right end. Mobile keeps the three actions sharing the row in thirds with the short `New` label.
- Mobile form rows: Cancel sits left and the primary pill right (`justify-between sm:justify-end`); inline `input + Save + Cancel` rows stack on mobile while keeping the desktop inline order (`sm:contents` wrapper); the task editor's desktop-only `Esc to cancel` hint is hidden on touch screens.
- Default zoom: `html { zoom: 1.1 }` applies at 768px and wider, so desktop content renders slightly larger; phones stay at 100%. The custom date picker compensates for the zoom's coordinate space, and headless checks measured 0px horizontal drift between the calendar and its trigger at 1280/1024/768px.
- Section pages: `What is Tambayayong?` now lives at `/what-is` and `How does the AI meeting assistant work?` at `/how-it-works`, both on the same legal-page shell (brand header with `Back to tool`, narrow reading column, flat legal footer) via a shared `InfoPage` component. The landing page is the tool alone; header and footer nav link to the two pages, and the landing scrollspy was retired. The what-is page shows its four points as icon-free hairline-topped text blocks in the two-column grid. The how-it-works page shows its three steps as icon-free titles connected by a hairline wire — one primary node per step, a vertical timeline line down the left on mobile, and one continuous horizontal rule bridged across the column gaps on desktop.

Verification: headless Edge audits at 320/360/380/390px were clean for all 13 views (plus the date-picker compensation check at 1280/1024/768). The full suite is 165 tests in 22 files; typecheck 0 errors; 70 evaluation cases validated; the production build completed 8/8 static pages with `/what-is` and `/how-it-works` at ~1.4 kB / 106 kB first-load JS, and all five routes returned HTTP 200 from the production server. Exact results and environment limitations are in `docs/validation.md`.

## Mobile touch targets and responsive pass (23 October 2026)

The narrow-screen layout now keeps the same flat mono system while making the controls usable with a thumb. Presentation only: validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores/keys, the persistence owner, providers, and evaluation are unchanged.

- A mobile-only `@media (max-width: 639px)` layer sets `.ui-input` to 16px and gives text inputs, selects, and the date/timezone triggers a 44px minimum height. The participant field and tracking status select also use 16px on mobile; desktop keeps its compact sizing. The Text/File/Sample and Review/Tracking tab rows fill the full card width in equal shares on mobile (thirds and halves respectively), so they no longer sit flush to the left while the card stays wide.
- Top actions are no longer icon-only. `History` and `Export` keep visible labels at every width; the new-meeting action shows `New` below `sm` and `New meeting` at `sm` and wider, with the same `New meeting` accessible name. On mobile the three top actions share the full row width evenly, each in its own third; the row stays one line instead of a right-floating cluster. The brand link has a 44px target.
- Shared `.tap-44`, `.tap-44-inline`, `.tap-44-link`, `.tap-icon`, and `.calendar-day` rules bring intake, review, decision/question, export, history, date-picker, and footer controls to at least 40x40, with text controls at 44x44. Footer links use the left-aligned variant. Decision/question action icons move below the text when the row is tight; intake, review, and history panels use `p-4` at the narrowest width.
- The custom calendar keeps its HugeIcons day grid and 10-year chooser. At 320px the popover uses 8px padding and a zero-gap day grid so the seven day cells are 40x40; month arrows, year buttons, `Clear`, and `Today` meet the 40px or 44px target. No native date input was added.
- Inline prose links in the legal body remain normal 18px text links; the footer and legal-page navigation links use 44px targets.

Headless Edge + CDP checks at 320, 360, and 390px covered home, plan, tracking, add-task, edit-task, notes, expanded details, the day and year calendars, share, history, privacy, and terms. Every view matched `scrollWidth` and `clientWidth`, with no horizontal overflow and no sub-40 app controls. Inputs reported 16px. The full suite is 162 tests in 21 files; typecheck passed with 0 errors; 70 evaluation cases validated; the production build completed 6/6 pages with `/` at 27.3 kB / 132 kB first-load JS. Exact results and the unchanged `npm ci`, Docker, and live-model limitations are in `docs/validation.md`.

## Privacy policy and terms pages (23 October 2026)

The footer legal links now open real pages instead of placeholders. Both pages use one shared `LegalPage` shell: the existing `Brand`, a sticky hairline header with a bare back arrow, a `Legal` eyebrow, the title, `Last updated 23 October 2026`, numbered sections separated by hairlines, and a flat footer with the two legal links. The active page is marked with `aria-current="page"`. The pages use only the existing mono, border, primary, and muted tokens; no new tint, gradient, capsule, or shadow treatment was added.

- `/privacy` describes the actual data flow: guest drafts and saved meetings in IndexedDB (`tambayayong_guest_db`) and localStorage (`tambayayong_active_draft`), the sample not being saved, analysis sending the entered meeting details and notes to Groq's pinned `qwen/qwen3.8-27b` model, server-side `GROQ_API_KEY`, text uploads parsed in the browser, PDF uploads parsed by `/api/transcript/parse` in memory, browser-generated exports in the current Share screen, the server export endpoint's existence, the in-memory 10-requests-per-minute IP limit, hosting logs, Google Fonts, GitHub, no advertising or analytics cookies, deletion choices, and the GitHub issue contact.
- `/terms` covers acceptance and eligibility, the preview's purpose, human review of AI output, the rule that a located quotation proves wording only, content permissions, acceptable use, third-party processing, guest storage and backups, the Apache 2.0 source license, availability, disclaimers, liability, indemnity, governing law, and contact.
- The landing footer now points to `/privacy` and `/terms`; the legal pages cross-link each other and identify the current page.

Regression coverage: new `tests/legal-pages.test.tsx` (2 tests) and the updated footer assertion in `tests/workspace-ui.test.tsx`. The full suite is 162 tests in 21 files. Exact build and route results are in `docs/validation.md`.

## Mono system, navigation, custom date picker with year jump, and control polish (23 October 2026)

The site now reads as one calm mono system, with the same flat green/white surfaces and bare icons throughout. Presentation only: validation, draft autosave, file parsing, sample loading, consent/submit, IndexedDB stores/keys, the persistence owner, providers, and evaluation are unchanged.

- Typography is JetBrains Mono 400-700 everywhere: body, controls, headings, navigation, and the `font-sans`/`font-brand` utilities. The marketing hero is gone; the workspace opens the page under a visually hidden `<h1>`, with `pt-10 pb-16 sm:pt-14 sm:pb-20` and section bands at `py-16 sm:py-20`.
- `LandingNav` adds a scrollspy underline to `Tool`, `What is this`, and `How it works`. The active item is a 1px primary rule with `aria-current="location"`; `Start now` became `Tool` and still points at `#start`.
- The Saved work modal dropped its header icon and the icons on saved cards. History, Export, New meeting, and the X/dismiss controls now respond with text/icon color only, with no hover tint or shadow.
- Action-items Review/Tracking and the filter row use the 180ms `.panel-switch-in` fade/translate; the action list is keyed by view, filter, and board filter.
- The timezone select is a custom accessible listbox: a rotating bare chevron, 200ms max-height/opacity/translate opening and closing, keyboard navigation, click-outside dismissal, and a 220ms overflow-retention close. The nested scroll layer was removed because Chromium painted its option labels blank.
- The intake date and both due-date fields now use one custom `DatePicker` instead of native date inputs. The trigger is a flat `button.ui-input` with the formatted date (`Oct 23, 2026`) or `Select date` and a bare HugeIcons `Calendar`. The calendar opens in a body portal with viewport-edge placement, a HugeIcons arrow month header, a 42-day grid, a primary selected day, a small primary today marker, `Clear`/`Today`, and Escape/arrow/PageUp/PageDown handling. Selections, `Clear`, and `Today` close it and return focus; focus-out, outside pointer-down, scroll, or resize dismisses it. In the add-task form and action-item editor, Escape closes only the calendar, not the surrounding editor.
- Clicking the calendar's `October 2026` header opens a compact 10-year `Choose year` grid with `Previous decade`/`Next decade` arrows, a primary-filled selected year, and a primary current-year label. Choosing a year keeps the current month, returns to the day grid, and focuses the selected or first day. The popover stays adjacent to the trigger by repositioning to the shorter year view and re-expanding when the day grid returns. The header toggle has a rotating chevron and `aria-expanded`; year buttons support arrow-key movement. Escape closes the year grid first, then the calendar.
- The page scrollbar uses a thin transparent track, a 10px WebKit bar, an inset neutral thumb, and a primary hover thumb.
- New meeting is disabled on a first visit with nothing to clear (`Nothing to clear yet`, 0.55 opacity). It enables as soon as the intake reports content: title, organization, date or date-unknown, participants, notes, a typed participant, a changed timezone, or a non-Text input mode.
- Intake, save, and PDF-export errors share a collapsible notice shell. Height and opacity animate in over 200ms; on clear, the notice collapses for 220ms before unmounting. It keeps `role="alert"` while visible and is `aria-hidden` during exit.

Regression coverage: `tests/date-picker.test.tsx` 2 tests, `tests/meeting-intake.test.tsx` 5 tests, `tests/workspace-ui.test.tsx` 9 tests, and `tests/inline-notice.test.tsx` 2 tests. The full suite is 160 tests in 20 files. The interactive year grid is covered by the headless Edge check recorded in `docs/validation.md`, along with the browser measurements and production build size.

## Minimalist design pass (October 2026)

The user requested a minimal, professional, modern but simple UI: no flashy colors, no emoji, icon-only symbology, no em dashes, and reduced visual crowding. Observed changes:

- Removed all gradients and decorative elements: the radial background wash, the gradient sidebar and brand mark, the CSS hills in the sidebar footer (footer removed entirely), the handwritten Comic Sans hero note with sun icon, and the outline circles on the sign-in/sign-up aside.
- Replaced the five colored stat icon chips (blue, teal, green, amber, red) with neutral chips. Color now appears only where it carries meaning: green for primary actions and progress, amber for blocked and clarification warnings, red for overdue. Review status badges are neutral except the fully reviewed green state.
- Removed all blue and emerald accents in review components; source-link buttons, answered-status chips, execution status selects, progress bars, and the normalized-match notice now use the single green accent, warning tokens, or neutral gray.
- Replaced `bg-emerald-500` with `bg-primary` on the execution progress bar. Removed micro shadows (`shadow-2xs`, `shadow-xs`, `shadow-sm`) from inline cards and buttons; only the auth card and modals use a single `shadow-lg`.
- Deleted the unused `MeetingHero.tsx` component (a second competing hero that was never imported).
- Rewrote UI wording to remove em dashes: page title, hero subtitle, "No idea or teammate left behind", and the board date row. Export files and sample data intentionally keep their original wording per user choice.
- Updated `specs/08-ui-ux-design.md` with the neutral-first color rule.
- Dark-default pass (same month): dark tokens are now the default `:root` (60-30-10: `#0A100D` page, `#101713` cards / `#1C2621` fills, `#3FA46F` accent); the header and auth brand are a text-only `tambayayong.` wordmark with the logo tiles removed; intake fields share one `.ui-input` style and the submit shares `.ui-button-primary`; the AI panel names the pinned model once while the duplicate pill, the `(optional)` upload tag, and the repeated footnote were removed; the first-visit panel no longer renders the all-zero stats grid.

## Three-step workspace and sign-in removal (23 October 2026)

The user asked for a cleaner flow between the notes form and the action items (results previously appeared below the always-open form) and removed account sign-in entirely.

- `Workspace.tsx` is now a three-screen flow owned by one `step` state: `notes`, `plan`, `share`.
- Notes stays the intake card as-is. First analysis auto-switches to Plan and scrolls the panel into view; the first-visit empty "Your action plan starts here" panel was removed.
- Plan shows a session bar with meeting title, "Updated" chip after re-analysis, date, organization, "X of Y reviewed" progress, and quiet "Edit notes" and "New" controls; `ReviewWorkspace` renders full width below it. `ExportPanel` moved out of `ReviewWorkspace` into the Share step.
- Share is now a dedicated screen ("Share your plan") with a "Back to plan" control; the header "Export" button opens it directly.
- Sample meetings land on Plan with the example banner; opening a saved meeting from History lands on its Plan screen; drafts open on Notes.
- Friendly wording applied across the UI (button "Draft my action plan", consent "It's okay to send my notes to Groq to draft my plan.", provenance labels such as "Found word for word", "Added by you"; the matched-quote-proves-wording-only rule kept in plain words).
- Deleted `src/app/sign-in/page.tsx`, `src/app/sign-up/page.tsx`, and `src/components/AuthScreen.tsx`; the header and footer no longer link to sign-in. Footer rebuilt with brand, Explore links (Start now, What is this, How it works), and a copyright bar.
- Regression test updated: first visit must show only the notes step (no review screens, no share options) and asserts the new button and consent wording.

## Light default theme (23 October 2026)

The user asked for a light default theme. The UI is fully token-driven, so the change is one synchronized palette flip, restoring the original brand tokens on the light side of the same calm system:

- `:root` in `globals.css` is now the light 60-30-10 palette with `color-scheme: light`: `#F8FAF8` page, `#FFFFFF` cards and `#EEF2EF` neutral fills, forest ink `#172B24` text with `#5C6F66` muted text, `#247D59` pine green as the single accent (white text on it), and meaning-only amber/red pairs on light tints. Selection highlight and scrollbar thumbs updated to light counterparts.
- `tailwind.config.js` mirrors the same palette literally (its colors are hex, not CSS vars), including the tint tokens `primary.light`, `accent.light`, `teal-light`, `warning.light`, and `danger.light` which are now light green/amber/red washes used by badges and chips.
- `themeColor` in the viewport is `#f8faf8`.
- Nothing else in `src` carried raw theme colors except the `bg-black/40` modal scrims, which read correctly on light backgrounds too; grep confirmed no other hex literals or raw white/slate utilities.
- The theme regression test now asserts the light default via the same meaningful absences (no raw `bg-white`, `bg-slate-`, `text-white`, `border-slate-` utilities in the first-visit markup).

## Action items review panel, minimalist pass (23 October 2026)

The user asked for the action-items area to read like a calm transcript-review tool: clear spacing and hierarchy, no capsule badges, no tinted hint surfaces, no gradients, emoji, or flashy color, and smooth conventional interactions. The pass covers the full review panel: action items, decisions, open questions, and source evidence. Providers, IndexedDB stores and keys, API routes, and the single meeting-persistence owner are unchanged.

- Two views replace the old three-mode switch: `Review` and `Tracking` text tabs with counts. `Clarify` is gone because `Needs info` already covers the same rows.
- Filters are plain text with counts (`All`, `To review`, `Approved`, `Needs info`). Dismissed rows leave `All`; a `Dismissed` filter appears only when something has been dismissed. Tracking filters come from `getExecutionProgress`.
- Rows are flat: hairline separators, a 2px primary left rule plus a neutral `bg-muted/50` wash for the selected row, and no `rounded-full` badges or tinted chips. Missing owner/date, ambiguous dates, proposed/unclear commitments, changed sources, and unverified citations are plain inline words in the existing warning/danger tokens.
- Approve is a single checkbox-styled text toggle (`Approve`/`Approved`, `aria-pressed`); Dismiss is quiet text. Tracking rows hide review decisions and show a borderless native status select. Edit/delete stay as quiet icons that reveal on hover/focus on pointer devices and remain visible on touch.
- The add-task composer is inline and uses the shared `.ui-input`; decisions and questions are flat lists with hairline separators, visible status actions, and text add/save controls. The evidence panel is a left-ruled quote with provenance text and sticky positioning at `lg`+, and the evidence modal drops the tinted banners for bare icon-plus-text provenance.
- Manual tasks are no longer reported as having an "Unverified citation": `getClarificationReasons` now treats `provenance: "manual"` as intentionally uncited, so user-added items do not land in `Needs info` for a missing transcript quote.
- Removed the unused `src/components/review/ItemReviewControls.tsx`.

Regression coverage: `tests/action-item-card.test.tsx` (6 tests, flat-row and tracking-row checks), new `tests/review-workspace.test.tsx` (3 tests, tabs, filters, and dismissed behavior), and the manual-evidence exemption in `tests/action-tracking.test.ts`. Exact results are in `docs/validation.md`.

## Meeting intake form, minimalist pass (23 October 2026)

The user asked for the form to match the calm, flat action-items review panel. Scope was presentation only: field values, validation, draft autosave, sample loading, file parsing, consent, submit behavior, IndexedDB stores/keys, and the single persistence owner are unchanged. The existing labels `Choose input`, `Text`, `File`, `Sample`, `Meeting title`, `Meeting details`, and `Draft my action plan` remain because tests and copy depend on them.

- The panel lost `shadow-lg`; the heading is 16 px semibold with a 12 px muted subtitle.
- The grey segmented control became underline text tabs (`Text`, `File`, `Sample`) matching Review/Tracking. The `aria-label="Choose input"` group and the label-only buttons remain.
- `Meeting details` is a plain disclosure row with a hairline top border and a `+`/`-` affordance, not a tinted rounded bar. The row is a controlled `button` with `aria-expanded`/`aria-controls`; the content expands with a 300 ms `grid-template-rows` and opacity transition, the `+`/`-` crossfades, and the fields are `inert` while closed. `prefers-reduced-motion` disables the transition. Labels are 11 px, field grids use 12 px gaps, and inputs keep the shared `.ui-input` focus treatment.
- Input focus is softer: `.ui-input` uses a 30% primary border and a 1 px 15% primary ring instead of the previous solid primary border plus 2 px halo.
- Switching `Text`/`File`/`Sample` animates the panel height. A `ResizeObserver` measures the active panel inside an `overflow-hidden` wrapper and the wrapper transitions `height` for 300 ms `ease-out` only during a mode change (`motion-reduce:transition-none`). Incidental height changes such as dragging the notes textarea resizer update immediately, without the transition.
- Participant capsules are gone: names sit in a hairline field separated by `·`, each with a tiny remove `×`, and `Add` is a quiet primary text control.
- The notes area is a normal `.ui-input` textarea (8 rows, `min-h-[180px]`) instead of the large muted box. Drag/drop keeps a neutral card overlay with a dashed primary target border.
- File mode is a borderless-content dashed dropzone with a quiet bordered `Choose file`; sample mode is plain centered text with a primary text link. No tinted hint panels.
- The submit stays the single filled primary action; its loading state is a flat `rounded-lg` muted status. The form error and the workspace save error are now left-rule icon-plus-text notices with no tint.
- The shared top bar is flat: the History count is plain tabular text and `New meeting` is a quiet primary text action that shows its label from `sm` up.

Regression coverage: new `tests/meeting-intake.test.tsx` (4 tests) asserts the preserved copy/modes, the absence of `rounded-full`, `bg-primary-light`, `bg-danger-light`, and `shadow-lg`, the flat notes/disclosure markup, and the height-animated mode panel. Exact results, including the measured tab-switch heights, are in `docs/validation.md`.

## Landing explainer and workspace notices, flat pass (23 October 2026)

The user asked whether the rest of the site matched the flat review panel and form. The "What is Tambayayong?" grid and the footer were largely flat already; the how-it-works steps were the remaining tinted surfaces. The user then asked for the what-is icons to sit beside their labels, for the footer copy to be trimmed and to gain legal placeholders, and for the marketing hero to be removed with more generous section spacing.

- `src/app/page.tsx`: the three how-it-works cards lost their `rounded-2xl` tinted washes (`bg-primary-light/20`, `bg-warning-light/20`, `bg-accent-teal-light/40`) and multi-color tones. They are now a flat three-column band with a hairline top rule per step, and each numbered-circle glyph sits beside its step label in one row with the description below. No `accent-teal` or `warning` color is used in this section.
- `src/components/Workspace.tsx`: the sample-example banner is now a left-rule primary notice with a bare icon and muted text, matching the form and save-error notices; the "Updated" chip lost its `rounded-full` and `bg-primary-light` capsule and is now a plain mono primary label with a small check.
- `src/app/page.tsx`: the "What is Tambayayong?" feature items now use `flex items-start gap-3.5`, with the 24 px green icon on the left and the title plus body in the right column. The two-column grid, copy, and icon size are unchanged.
- Footer: removed the "Made for shared purpose." line, the "Walay mabilin. No idea or teammate left behind." tagline, and the "and always reviewed by people." clause; the copyright now reads "© {year} Tambayayong. Free and open source." Added `Privacy policy` and `Terms of service` placeholder links (currently `href="#"`) in a flat legal nav opposite the copyright.
- `src/app/page.tsx`: removed the marketing hero (headline, intro paragraph, and visible tagline). The workspace now opens the page under a visually hidden `<h1>Tambayayong meeting assistant</h1>`. Section rhythm is `pt-10 pb-16 sm:pt-14 sm:pb-20` for the workspace and `py-16 sm:py-20` for what-is and how-it-works, each separated by a full-width `border-t border-border` hairline with `scroll-mt-24` anchor offsets.
- No other copy, workflow, persistence, provider, or evaluation behavior changed.

Regression coverage: `tests/workspace-ui.test.tsx` (6 tests; the step test asserts the tinted step utilities are absent, the what-is test asserts the icon sits beside the label, the footer test asserts the legal placeholders are present and the removed labels are absent, and the hero test asserts the marketing copy is gone and the workspace precedes what-is). Exact results are in `docs/validation.md`.

## What changed

- Refined the green/white home page with clearer navigation, typography, spacing, and a labeled illustrative action-plan preview.
- Added shared branding and clear sign-in/sign-up entry points.
- Added `/sign-in` and `/sign-up` with responsive layouts, visible labels, browser validation, password visibility toggles, preview feedback, and guest return links.
- Account forms do not submit credentials, call an authentication endpoint, or serialize named password controls. Submitting shows an honest coming-soon notice; it does not claim an account was created or a user signed in.
- Preserved the meeting workflow, source verification, model selection, review, and guest storage. A final draft snapshot is saved when navigating away before the normal debounce completes.
- Fixed the Tailwind secondary-text token to match the accessible CSS color and added a missing accent-light token.

## Verification

- Existing 70 tests across 9 files passed.
- Expanded TypeScript check passed.
- Dataset validation passed: 20 cases (6 English, 7 Cebuano, 7 mixed).
- Final `npm run check` passed with exit 0, including the production build. `/sign-in` and `/sign-up` were statically generated (about 100 kB first-load JS each); home was about 120 kB. Only the existing nonfatal sandbox cache warnings appeared.
- Browser: home-to-sign-up navigation, sign-in/sign-up switching, password visibility, sign-in and sign-up preview submissions, guest return, and immediate draft preservation checked with public sample/test text.
- Mobile: home and sign-up checked at 320 px (document width 314 px); sign-up checked at 390 px (document width 384 px). No horizontal overflow observed. Viewport override reset afterward.
- Screenshots captured for desktop sign-in/sign-up and mobile sign-up. No real credentials were used.

Tests used the same session-only Windows sandbox runtime/esbuild workarounds described in `validation.md`. No new dependencies were introduced. This update does not change the previously recorded GitHub permission/billing, Docker, or live-model limitations.
