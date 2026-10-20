# Tambayayong — Codex validation and handoff

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
