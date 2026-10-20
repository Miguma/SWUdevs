# Codex development workflow

Use feature branches based on `main` and deliver reviewable commits/PRs. Keep the existing green/white visual system and Next.js structure. Use the specifications as context, but report observed behavior and exact validation results rather than completion percentages.

- Use the pinned open-weight `Qwen/Qwen3-32B:deepinfra` model through Hugging Face Inference Providers. Keep `HF_TOKEN` server-side, require explicit transfer confirmation, and do not fall back to another model or provider. Preserve historical provider metadata in saved meetings.
- Guest meetings and drafts belong to the user. Preserve existing IndexedDB stores and keys. Do not clear, migrate destructively, or overwrite unrelated records while fixing bugs.
- Keep one persistence owner for meeting changes. Re-analysis updates an existing meeting and rechecks citations against the exact revised source.
- A located quotation proves textual provenance only. It does not prove task semantics, ownership, commitment, or human approval.
- Evaluation predictions come only from actual inference. Labels may enter scoring after inference; empty results and errors must never be filled from expected answers. Clearly distinguish unit fixtures from real-model evidence.
- Run `npm ci`, `npm run eval:validate`, `npm test`, `npm run typecheck`, and `npm run build`. Add regression coverage for workflow, extraction, provenance, or evaluation changes. Run Docker and real-model checks when services are available; state exact blockers otherwise.
- Read `docs/validation.md` for the most recent observed results and environment limitations. Refresh that report when validating new changes.
