# Spec 11: Implementation Plan & Milestone Roadmap

## 1. Milestones Breakdown

### Milestone 1: Foundation & Project Scaffolding
- Initialize Next.js 14/15 App Router with TypeScript strict mode.
- Install and configure Tailwind CSS, custom design tokens, Lucide icons, and core UI components.
- Establish Docker Compose configuration for PostgreSQL, Ollama, and Next.js.
- Setup Vitest testing environment.

### Milestone 2: AI Pipeline & Service Layer
- Create `src/server/services/ollama-client.ts` with model readiness check and structured JSON schema streaming.
- Implement `src/server/services/deadline-resolver.ts` for English and Cebuano date expressions.
- Implement `src/server/services/evidence-verifier.ts` for substring offset mapping and groundedness scoring.
- Implement `src/server/services/transcript-preprocessor.ts` for file ingestion and text normalization.
- Build unit test suite with 100% pass rate.

### Milestone 3: Intake & Review Workspace
- Build Meeting Intake form with draft auto-save, character count, and file uploader.
- Build Interactive Review Workspace:
  - Action item cards with edit modal, assignee pills, deadline controls.
  - Evidence quote drawer with original text highlighting.
  - Decision cards & Open Question cards.
  - Review status progress meter.

### Milestone 4: Export Engine & Guest Persistence
- Implement Markdown export with checkbox format.
- Implement RFC 4180 CSV export with formula injection defense.
- Implement IndexedDB local storage adapter (`tambayayong_meetings`) for guest mode.
- Build Meeting History list with open, duplicate, delete actions.

### Milestone 5: Evaluation Benchmark & Demo Mode
- Author 20 gold-standard meeting transcripts in `eval/dataset.json` (English, Cebuano, Code-switching).
- Build automated evaluation runner (`eval/run-eval.ts`).
- Measure and document Precision, Recall, F1, Assignee Accuracy, and Deadline Accuracy.
- Pre-load rich interactive demo sample meeting.

### Milestone 6: Docker Deployment & Final Polish
- Create multi-stage `Dockerfile` and `docker-compose.yml`.
- Verify full offline operation with local Ollama instance.
- Complete documentation: `README.md`, setup guide, and hackathon presentation summary.
