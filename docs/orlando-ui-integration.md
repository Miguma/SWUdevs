# Orlando UI and existing AI integration

## Sources inspected

- Main: b9f5ede15959dd3b5b8d4a6f52e127e2795d7bcc.
- PR #2: a07ef4a193fd9bf2bca1548dedaf91d7ff3c5c39, feat/landing-and-workspace.
- Existing working local branch: 79742be, including multilingual extraction, speaker attribution, evidence normalization and Supabase accounts.

## Design retained

Orlando replaces the old sidebar/header/hero with LandingNav and a Workspace controller, and introduces information/legal pages, Hugeicons, DatePicker, InlineNotice and new design tokens. Intake, history, review cards, evidence, decisions, questions and exports were restyled. The main page remains his flat green/white design with notes, plan and share steps. Tracking is the approved Action Board; Needs info is the clarification filter.

## Connections

The PR already calls /api/meetings/analyze, parses PDF via /api/transcript/parse, parses TXT/MD/CSV with the existing preprocessor, and uses existing exports. Its base predates the working owner/deadline fixes and account implementation. Those commits are incorporated without replacing the inference backend.

- Server: groq-client → extraction-core → evidence-verifier / owner-attribution / deadline-resolver.
- Exact model: qwen/qwen3.8-27b; Groq credentials remain server-only. Explicit notes-transfer consent remains required.
- Data: MeetingExtraction, ActionItem, Evidence, MeetingDecision and OpenQuestion retain the existing schemas and provider metadata.
- Workspace is the sole meeting persistence owner. Serial saves route to the existing guest IndexedDB or signed-in storage. Re-analysis uses reconcileMeeting and preserves meeting identity and human edits.
- The original guest database, stores, draft keys and unrelated records are preserved.
- Account routes/provider/history are retained; sign-in/out and save retry are accessible from the new workspace.
- Owner rendering uses the same hasTaskOwner rule as clarification metadata. Liza/Jun/Mark regressions now exercise Orlando's components.
- Source highlights require verified, non-manual quotations. A quotation is textual provenance, not approval or proof of task semantics.
- Hand-authored samples have an explicit preview notice and are never saved as actual AI output.
- Review approval is explicit. Tracking and approved-only exports consume that review status.

## Validation

See docs/validation.md for observed commands and live workflow results. Deterministic fixtures are separate from actual model evidence. The uploaded transcript in docs/verification/orlando-bisaya.txt is public synthetic test data.
