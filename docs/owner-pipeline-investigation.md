# Missing-owner investigation — 21 October 2026

Branch: `codex/owner-pipeline-regression`, based on existing fixes at `1d97081`.
Provider remains Groq, pinned to `qwen/qwen3.8-27b`. No approval is inferred.

## Reproduced root causes

At baseline `1d97081`, `assembleMeetingExtraction` only filtered `item.assignees`.
It never recovered an omitted model owner from the cited speaker's explicit
first-person statement. A raw `[]` therefore became assembled `[]`, persisted
`[]`, and rendered `Unassigned`, even with exact evidence for Liza or Jun.
The new pipeline regression demonstrated this before the implementation changed:
22 of the initial 23 tests failed, including the mocked-model → IndexedDB → UI test.

The previous `validateAssignee` also had unsafe acceptance paths: a matching
speaker header returned true without a commitment, and the final turn branch
returned true even when its first-person check failed. It could accept an earlier
speaker for another speaker's speech. The tokenizer required punctuation after
bracketed names, so bare `[Liza]` / `(Liza)` labels were not supported, and `\s`
inside names could cross PDF line breaks.

`missingInformation` copied model warnings without removing an obsolete
`assignee` entry. This was stale metadata; the existing cards and clarification
helper already read the actual assignee array. They were not secretly rendering
a different owner property.

These are reproduced failure paths, not proof that every historical user meeting
failed for the same reason. The user's original failing saved record/PDF was not
modified or inspected. In the live public smoke test the model supplied the names
correctly; the omitted-owner branch is exercised by deterministic fixtures.

## Pipeline audit

| Stage | Observed behavior / change |
|---|---|
| PDF upload | `transcript-preprocessor.ts` extracts selectable text with `unpdf`, joins pages, normalizes line endings. Scanned images still need OCR elsewhere. A generated selectable PDF is covered by regression. |
| Normalization | `/api/meetings/analyze` uses normalized text for minimum-length validation but passes the exact submitted `rawText` into inference/assembly. Upload-extracted text is the subsequent source of truth. |
| AI request | `groq-client.ts` sends the source JSON and strict extraction schema to the pinned model. No provider, prompt, or model changes in this fix. |
| Raw response | Parsed with `RawExtractionResponseSchema`; public live trace records raw owner arrays separately from assembled arrays. |
| Evidence | Existing `verifyEvidenceQuote` preserves exact source slices and offsets; no verifier changes. Offset zero is explicitly tested. |
| Attribution | New `owner-attribution.ts` isolates cited speech by speaker boundaries, supports bare brackets/parentheses, bullets, markdown, timestamps and multiline speech. |
| Validation | Requires supported first-person or explicit third-person assignment. Rejects mere mentions, refusals, past reports, anonymous labels without an explicit identity mapping, and ambiguous repeated quotes. A multi-speaker quote with multiple commitments requires a narrower citation. |
| Assembly | `extraction-core.ts:262` calls `resolveOwners`. An empty model owner array can recover one unambiguous identified speaker from a singular commitment. Contradictory model names are rejected, not replaced with guesses. New items remain pending. |
| Reconciliation | `meeting-workflow.ts` retains its existing matching and preservation rules. Human-edited/manual items remain authoritative; changed source/content needs review again. Only derived owner metadata is normalized. |
| Persistence | Page remains the sole persistence owner through the serial saver. IndexedDB database version, stores, keys and meeting IDs are unchanged. Save/read normalize derived owner warnings without inferring new owners in historical records. |
| Rendering | Cards, counters and clarification reasons share `hasTaskOwner`; whitespace-only names do not count as owners. Editor save normalizes stale owner warnings. |
| Running app | The already-open tab still showed the older interface without PDF upload. A fresh page from the production build displays the current interface. This does not establish which version produced a historical saved record. |

## Before / after trace

The following is a **deterministic mocked-model regression**, not model accuracy:

| Task | Raw model owners | Baseline assembly → storage → card | Fixed assembly → reload → card |
|---|---|---|---|
| Liza, create/submit poster | `[]` | `[]` → `[]` → Unassigned / Needs owner | `["Liza"]` → `["Liza"]` → Liza / Pending review |
| Jun, check supply prices | `[]` | `[]` → `[]` → Unassigned / Needs owner | `["Jun"]` → `["Jun"]` → Jun / Pending review |
| Mark, arrange permit | `[]` | `[]` → `[]` → Unassigned / Needs owner | `["Mark"]` → `["Mark"]` → Mark / Pending review |
| Registration task without commitment | `[]` | Unassigned | Unassigned / Needs owner |

All cited offsets are checked against the exact original source after reload.
The full rendered review workspace has exactly **1 Need owner** for these four
fixture tasks. Liza, Jun and Mark have no missing-owner clarification.
Jun still has a missing deadline and an unresolved budget question.
An unspecified meeting year does not turn October 27 into a guessed ISO date.

Actual inference is recorded separately in `owner-live-verification.json`:

| Public live task | Raw owners → assembled owners | Verified source offsets | Review |
|---|---|---|---|
| Create and submit poster | Liza → Liza | 0–62 | pending |
| Check prices of gloves and sacks | Jun → Jun | 63–158 | pending |
| Handle permit | Mark → Mark | 159–205 | pending |

All three live citations match the source slices; all three missing-owner
clarifications are absent. This is a small public smoke test, not the full
70-case model benchmark. The live model expressed the unassigned volunteer need
as an open question rather than a fourth task; the report preserves that output.

## Diagnostics

Development-only, opt-in diagnostics are in `src/lib/owner-diagnostics.ts`.
Set `OWNER_DIAGNOSTICS=1` before starting `npm run dev` for server assembly traces.
For the browser, set sessionStorage key `tambayayong_owner_diagnostics` to `1`
in developer tools. Remove the opt-in values after investigation.

Events include generated task ID, raw/accepted/rejected owner aliases, rejection
reason codes, detected-speaker aliases, verified offsets, and final reconciled,
persisted, hydrated and rendered owner aliases. Names become session-local
`person-N` identifiers. No transcript, quotation, task title, credential or literal
person name is logged. Production ignores these switches. Automated tests verify
redaction and that default diagnostics stay silent.

## Existing saved meetings

Refresh the app, open the meeting from **Saved meetings**, check its source notes,
and run **Analyze with Cloud AI** with consent. Re-analysis keeps the meeting ID,
replaces unedited AI suggestions, and preserves human edits/manual tasks.
Unchanged approved items keep approval; changed source/content returns to pending.
No automatic rewrite of saved owner assignments runs on page load.

If a task was manually edited (including execution-status edits), its saved owner
choice is deliberately preserved. Use **Edit task** to correct that owner after
checking its source. This avoids silently overwriting human work. The integration
test preserves a human-chosen owner, an unchanged approval, an unrelated meeting,
and an unrelated draft across reconciliation and save/reload.

## Validation and limits

- `npm ci --cache .npm-cache --no-audit --no-fund`: passed, 200 packages.
- `npm test`: 185 tests passed across 16 files, including 30 owner-pipeline tests.
- `npm run typecheck`: passed. TSX regression tests and the live verification
  script are now included in the explicit check config.
- `npm run eval:validate`: passed, 70 cases (15 English, 15 Cebuano, 15 Tagalog,
  15 mixed, 10 edge cases). Dataset syntax validation, not model accuracy.
- `npm run build`: passed, Next.js 14.2.35; home 28.8 kB, first-load 116 kB.
  Existing `unpdf` import.meta warning remains. Initial attempts failed with
  missing generated route/page files; one coincided with a restarted dev server
  writing `.next`. A later retry with no competing dev server passed.
- `git diff --check`: passed.
- Actual pinned-model inference: passed for the three public examples.
- Docker runtime: unavailable, `dockerDesktopLinuxEngine` named pipe missing.
- No repository Playwright/browser test runner is installed. The integration
  test uses mocked network responses, real evidence/assembly/reconciliation,
  fake IndexedDB, and actual React review components. Interactive browser
  verification is recorded separately below.

## Actual browser verification

The production server was started on port 3000 after the successful build.
Tests used `http://127.0.0.1:3000/`, separate from the user's normal localhost
storage origin. Only the public regression transcript was submitted.

1. Entered the Liza, Jun and Mark examples, plus an explicit registration-desk
   action with no assigned owner. Marked meeting date unknown and accepted the
   Groq transfer checkbox.
2. Clicked **Analyze with Cloud AI**. Actual inference produced four tasks:
   Liza/poster, Jun/price checking, Mark/permit, and unassigned/registration desk.
   The budget remained an open question.
3. Reloaded the page, opened **History**, then reopened the analyzed meeting
   **Owner regression — public verification** from IndexedDB.
4. Verified all three named owners were still present and pending review.
   Summary: **4 actions, 0 reviewed, 3 with assignees, 4 needing dates, 1 needing
   an owner**. Review progress includes the open question: **0 of 5 reviewed**.
5. Opened **Clarify**. All four tasks need date clarification; only registration
   has the `Missing owner` warning. The page contained exactly one such warning.
   Returned to Review List and left the result open.

Evidence:

- [Screenshot after reload](verification/owners-after-reload.png)
- [Full accessibility trace after reload](verification/owners-after-reload.txt)
- [Full clarification trace](verification/owner-clarifications.txt)

No existing localhost meetings or drafts were deleted or rewritten, and no
approval buttons were clicked. Human-edit and approval preservation were checked
by the deterministic integration test, not by changing a real user's records.

## Files changed

- `src/server/services/owner-attribution.ts`: bounded speaker attribution.
- `src/server/services/extraction-core.ts`: assembly integration and trace.
- `src/lib/owner-state.ts`: common owner state / derived-warning normalization.
- `src/lib/owner-diagnostics.ts`: opt-in anonymized diagnostics.
- `src/lib/meeting-workflow.ts`: common clarification predicate and reconciliation metadata.
- `src/lib/storage/indexeddb.ts`: normalized save/hydration metadata and trace.
- `src/components/ReviewWorkspace.tsx`: common counter predicate and render trace.
- `src/components/review/ActionItemCard.tsx`: common owner predicate.
- `src/components/review/ActionItemEditor.tsx`: normalize owner warnings on save.
- `tests/owner-pipeline.test.tsx`: 30 regressions, including the full mocked pipeline.
- `scripts/verify-owner-live.ts`: reproducible public real-inference smoke test.
- `tsconfig.check.json`: include TSX tests and the verification script.
- `docs/validation.md`, this report, live JSON and browser evidence: observed results.

Attribution is deliberately conservative and uses a bounded language grammar;
unfamiliar phrasing, missing speaker labels, ambiguous repeated quotations or
multi-speaker evidence may still need manual owner entry or a narrower quote.
Text provenance and speaker attribution do not establish task semantics or
human approval. No model output is filled from expected labels.
