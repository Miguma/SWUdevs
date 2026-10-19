# Spec 12: Acceptance Criteria & Definition of Done

## 1. Feature Acceptance Checklist

### 1. Intake Module
- [ ] Accepts plain text up to 100,000 characters.
- [ ] Drag-and-drop file upload parses `.txt`, `.md`, and `.csv`.
- [ ] Validates empty or whitespace-only text with polite inline message.
- [ ] Saves draft locally to browser storage to survive accidental refresh.
- [ ] Preserves meeting date context and default `Asia/Manila` timezone.

### 2. AI Extraction Engine
- [ ] Runs against local Ollama `qwen3:4b-instruct` (or configured Ollama model).
- [ ] Enforces JSON schema structure with zero malformed JSON errors.
- [ ] Adheres to Rule 1: Never invents owners (unassigned if no volunteer).
- [ ] Adheres to Rule 2: Never invents deadlines.
- [ ] Adheres to Rule 3: Correctly computes relative dates ("ugma", "by Friday").
- [ ] Adheres to Rule 6: Negated tasks ("Dili na ta...") are not converted into to-dos.
- [ ] Adheres to Rule 7: Corrections ("Ay, si Mark na lang diay") supersede original statement.
- [ ] Adheres to Rule 10: Every action, decision, and question has verbatim evidence.

### 3. Review Workspace
- [ ] Dynamic review tracker displays progress ("x of y approved").
- [ ] Inline editing for task title, description, assignees, deadline, and priority.
- [ ] 1-Click Approve and Reject buttons.
- [ ] Ability to manually add a new task, decision, or open question.
- [ ] Clicking evidence highlights exact quote in raw transcript view.

### 4. Export & History
- [ ] Markdown export produces formatted GitHub checklist with `- [ ]`.
- [ ] CSV export complies with RFC 4180 and prepends `'` to malicious formula symbols.
- [ ] IndexedDB stores guest meetings locally; works completely without an account.
- [ ] Meeting history allows re-opening, editing, duplicating, or deleting past meetings.

### 5. Evaluation & Tests
- [ ] 20 labeled test cases covering English, Cebuano, and Mixed text.
- [ ] Automated evaluation script runs and prints Precision, Recall, F1, and breakdown.
- [ ] Unit test suite passes for date resolution, evidence matching, and CSV sanitization.

### 6. Deployment & Docs
- [ ] Docker Compose starts PostgreSQL, Ollama, and Next.js seamlessly.
- [ ] Health check endpoints `/api/health` and `/api/ai/health` report live status.
- [ ] README.md contains complete setup, architecture, and offline instructions.
