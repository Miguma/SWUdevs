# Tambayayong

**From conversation to action. Walay mabilin!**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tambayayong.artecloud.site-247D59?style=for-the-badge&logo=googlechrome&logoColor=white)](https://tambayayong.artecloud.site)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=for-the-badge)](LICENSE)

> 🌐 **Live Demo:** [https://tambayayong.artecloud.site](https://tambayayong.artecloud.site)

Tambayayong turns multilingual meeting notes, transcripts, and uploaded PDFs (English, Cebuano/Bisaya, Tagalog, and code-switched notes) into structured, reviewable action plans with verified task ownership, explicit deadlines, decisions, and open questions.

The application uses the Apache-2.0 open-weight [Qwen 3.8 27B](https://huggingface.co/Qwen/Qwen3.8-27B) model hosted on Groq's free API tier. The model destination is strictly pinned with no automatic provider fallback. Meeting notes are transmitted to Groq only after the user explicitly confirms cloud analysis. Guest drafts remain private in browser IndexedDB, while signed-in meeting records sync through Supabase with per-user Row-Level Security (RLS).

---

## Features

- **Multilingual Task & Decision Extraction:** Accurately extracts proposed tasks, commitments, formal decisions, and unanswered questions from English, Cebuano (Bisaya), Tagalog, and code-switched meeting transcripts.
- **Evidence-Grounded Provenance:** Every suggested item is tied to a verbatim quotation from the source transcript. Quotation verification proves exact textual location and respects speaker-turn boundaries to prevent false attribution.
- **Speaker-Aware Ownership:** Distinguishes explicit first-person commitments (e.g., Jun checking prices vs. Jun purchasing supplies) from casual mentions.
- **Human-in-the-Loop Review:** AI-generated items remain tentative drafts until explicitly approved, modified, or rejected by human reviewers.
- **Action Board & Progress Tracking:** Track approved action items across To Do, In Progress, and Completed states.
- **Flexible Privacy & Storage:**
  - **Guest Mode by Default:** No account required to draft, analyze, review, and track meetings. Data is saved locally in browser IndexedDB (`tambayayong_guest_db`).
  - **Account Cloud Sync:** Optional Supabase authentication with user-scoped Row-Level Security (`public.user_meetings`) for cross-device access.
- **Comprehensive Multi-Format Export:**
  - **Formal PDF Report:** Formatted action plan with review status stamps, metadata, and sign-off blocks.
  - **Markdown Document:** Clean documentation ready for version control or internal wikis.
  - **Formula-Safe CSV:** Spreadsheet export sanitized against formula injection.
  - **Meeting Minutes:** Formal executive summary format.
- **Responsive Mobile Navigation:** Accessible slide-down hamburger menu with smooth transitions, screen reader support, keyboard navigation (`Escape` dismissal), and clean section hierarchy.

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with semantic color-token system
- **AI Inference:** Pinned open-weight `qwen/qwen3.8-27b` via [Groq Cloud API](https://groq.com/)
- **Document Processing:** [unpdf](https://github.com/unjs/unpdf) for in-browser and serverless PDF extraction
- **Reporting:** [@react-pdf/renderer](https://react-pdf.org/) for vector PDF generation
- **Persistence:** Browser IndexedDB (Dexie / IDB) for guests; [Supabase](https://supabase.com/) PostgreSQL + RLS for authenticated accounts
- **Testing:** [Vitest](https://vitest.dev/) with 238 unit and integration tests across 25 suites

---

## Run Locally

### Prerequisites

- Node.js 20.x or 22.x
- Free [Groq API Key](https://console.groq.com/keys)
- (Optional) [Supabase Project](https://supabase.com/) for cloud synchronization

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/Miguma/SWUdevs.git
cd SWUdevs
npm ci
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```dotenv
# Server-side Groq API key for Qwen 3.8 27B extraction (never exposed to client)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Supabase configuration for signed-in account sync
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Default timezone for relative meeting date calculations
DEFAULT_TIMEZONE=Asia/Manila
PORT=3000
```

> [!IMPORTANT]
> Keep `GROQ_API_KEY` strictly server-side. Never prefix it with `NEXT_PUBLIC_`. The client browser never receives the key.

3. (Optional) Set up Supabase database schema for cloud sync:

If you are using Supabase for authenticated sync, run the SQL migration in `supabase/migrations/20261020164254_add_user_meetings.sql` in your Supabase SQL Editor.

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Docker Deployment

To build and run the production application using Docker:

```bash
# Set your Groq API key in your environment or a .env file
export GROQ_API_KEY=your_groq_api_key_here

# Build and start containers
docker compose up -d --build
```

The app will be available on [http://localhost:3000](http://localhost:3000).

---

## Validation & Testing

Tambayayong maintains a comprehensive automated test suite and an honest evaluation benchmark:

```bash
# 1. Validate the 70-case multilingual benchmark dataset
npm run eval:validate

# 2. Run unit and integration tests (238 tests in 25 suites)
npm test

# 3. Check TypeScript types
npm run typecheck

# 4. Compile production build
npm run build
```

### Model Evaluation Benchmark

Tambayayong includes a 70-case multilingual benchmark (15 English, 15 Cebuano, 15 Tagalog, 15 mixed, and 10 edge cases) evaluating actual model inference against expected outcomes. Evaluation predictions are scored only from real model outputs; empty results and errors are never filled with expected answers.

To run model benchmark inference (requires valid `GROQ_API_KEY`):

```bash
npm run eval:model
```

For observed performance metrics and validation history, see [docs/validation.md](docs/validation.md).

---

## Project Documentation

Detailed architecture specifications, research context, and evaluation metrics are available in the repository documentation:

- [docs/validation.md](docs/validation.md) — Comprehensive log of observed validation results, test outputs, and diagnostic notes.
- [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md) — Full technical architecture, design principles, and user workflows.
- [specs/](specs/) — Product specifications, UI requirements, and acceptance criteria.

---

## License

This project is licensed under the [Apache License 2.0](LICENSE).
