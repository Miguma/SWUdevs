# Spec 10: Testing Strategy & Benchmarking

## 1. Testing Pyramid

Tambayayong implements a 4-tier testing hierarchy:
1. **Unit Tests (Vitest / Jest):** Pure functions, date resolution, quote verifier, CSV/Markdown sanitization.
2. **Integration Tests:** Next.js route handlers, schema validation, mock AI extraction pipeline.
3. **End-to-End Tests (Playwright / Vitest E2E):** Note intake -> analysis -> review actions -> export download.
4. **AI Evaluation Benchmark (20+ Cases):** Metric evaluation against gold-standard annotated meeting notes in English, Cebuano, and Code-switching.

---

## 2. Unit & Integration Test Matrix

| Area | Test Suite | Focus |
|---|---|---|
| Relative Date Resolver | `deadline-resolver.test.ts` | Resolving "ugma", "sunod semana", "this Friday", "before Oct 25", unknown meeting dates |
| Evidence Verifier | `evidence-verifier.test.ts` | Exact quote locating, whitespace normalization, ungrounded quote detection, offset calculation |
| Export Serializer | `export.test.ts` | Markdown formatting, RFC 4180 CSV compliance, Formula injection neutralization |
| Preprocessor | `preprocessor.test.ts` | Transcript file parsing (`.txt`, `.md`, `.csv`), column detection, size limits |
| API Route | `analyze-route.test.ts` | Validation errors, empty input rejection, schema conformance |

---

## 3. Ground Truth Evaluation Dataset (20 Annotated Cases)

The dataset in `eval/dataset.json` contains 20 real-world styled meetings:
- **5 English Meetings:** Student council, open-source triage, community planning.
- **8 Cebuano (Bisaya) Meetings:** Barangay assembly, youth fiesta committee, relief operations.
- **7 Cebuano-English Code-Switched Meetings:** Hackathon sprint planning, tech meetup, volunteer orientation.

### Evaluation Metrics Evaluated:
- **Task Precision:** $\frac{\text{Correct Tasks Extracted}}{\text{Total Tasks Extracted}}$
- **Task Recall:** $\frac{\text{Correct Tasks Extracted}}{\text{Total Ground Truth Tasks}}$
- **Task F1 Score:** $2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$
- **Assignee Accuracy:** Percentage of tasks with exactly correct assignees.
- **Deadline Accuracy:** Percentage of tasks with accurately resolved or null deadlines.
- **Evidence Validity Rate:** Percentage of extractions with verified verbatim quotes.
- **Per-Language Breakdown:** Separate accuracy reports for English vs Cebuano vs Mixed.
