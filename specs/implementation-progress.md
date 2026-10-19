# Implementation Progress Checklist

## Status Legend
- ⏳ Pending
- 🔄 In Progress
- ✅ Completed

---

## Phase 1: MVP Scaffolding & Initial Delivery
- [x] SDD Specifications (Specs 01 to 12)
- [x] Scaffolding: Next.js 14, Tailwind, TypeScript strict mode
- [x] Core extraction pipeline and Ollama integration
- [x] Relative deadline resolution & evidence verification
- [x] Intake module, interactive review workspace, export panel
- [x] IndexedDB guest persistence & history modal

---

## Phase 2: Repository-Grounded Improvement Phase
- [x] **Milestone 1 — Correctness & Reliability**
  - [x] Task 1: Repair evaluation runner — eliminated synthetic ground-truth substitutions; split into `eval:validate` and `eval:model`
  - [x] Task 2: Harden Ollama client — explicit model allowlist, timeout controller, concurrency limits, safe sanitized errors
  - [x] Task 3: Improve deadline accuracy — removed arbitrary year defaults, stopped fabricating times for vague dayparts, handled invalid calendar dates
  - [x] Task 4: Strengthen evidence provenance — classified exact match, normalized match, unverified, and manual entries
  - [x] Task 5: Fix deployment & docs — standalone Next.js output, public assets, parameterized credentials, Apache 2.0 LICENSE, GitHub Actions CI
- [x] **Milestone 2 — UI/UX Refinement**
  - [x] Modularized `ReviewWorkspace.tsx` into 7 subcomponents (`ReviewHeader`, `ActionItemCard`, `ActionItemEditor`, `EvidenceInspector`, `DecisionSection`, `OpenQuestionsSection`, `ExportPanel`)
  - [x] Real drag-and-drop file upload on intake notes dropzone
  - [x] Removed arbitrary timer-based staged loading states in favor of honest progress reporting
  - [x] Accessible evidence inspector with Escape key dismissal and focus management
- [x] **Milestone 3 — Workflow Integrity**
  - [x] "Edit Notes" action cleanly loads selected meeting's original notes without draft collisions
  - [x] Preserved approved user edits when re-analyzing an existing meeting
  - [x] Labeled AI-extracted vs user-edited vs manual tasks
  - [x] Eliminated redundant persistence writes causing race conditions
- [x] **Milestone 4 — Security & Testing**
  - [x] Sliding-window rate limiter and 1MB payload size guard on `/api/meetings/analyze`
  - [x] Expanded test coverage to 36 tests across 5 test suites (`npm test`)
  - [x] Verified zero TypeScript errors (`npx tsc --noEmit`)
  - [x] Verified Next.js standalone production build (`npm run build`)
- [x] **Milestone 5 — Hackathon Readiness & Documentation**
  - [x] Truthful documentation distinguishing fixture validation from live LLM evaluation
  - [x] Updated specifications in `/specs`
