# Tambayayong (From conversation to action. Walay mabilin!)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-orange)](https://ollama.com/)
[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20Cebuano-brightgreen)](#bilingual-evaluation-results)

**Tambayayong** is an open-source, privacy-first meeting intelligence web application designed for student organizations, community volunteers, open-source teams, and hackathon groups.

It transforms unstructured multilingual meeting notes, chat logs, and transcripts into clear, editable, and accountable action plans using local open-source AI.

> *"Walay mabilin!" (No one left behind!)* — Mutual aid and collective effort in action.

---

## 🌟 Key Features

1. **Bilingual Extraction (English & Cebuano / Bisaya):**
   - Seamless understanding of English, Cebuano, and code-switched meeting notes.
   - Intelligent relative deadline resolution (*"ugma sa hapon"*, *"karong biyernes"*, *"next week"* anchored to the meeting date and `Asia/Manila` timezone).
   - Accurately respects negations (*"dili na ta mag-order ug shirts"*) and mid-meeting corrections (*"si Ana sa poster... ay si Mark na lang diay"*).
2. **100% Local & Private Open-Source AI:**
   - Powered by **Qwen3-4B-Instruct** (or **Qwen 2.5**) running locally through **Ollama**.
   - Zero proprietary AI APIs (No OpenAI, Claude, or external cloud LLM dependencies).
   - Transcripts never leave your self-hosted machine.
3. **Verbatim Source Evidence Grounding:**
   - Every extracted action item, decision, and unresolved question cites an exact, verbatim quote from the raw notes.
   - Real-time offset verification ensures the AI never hallucinates or invents commitments.
4. **Human-In-The-Loop Review Workspace:**
   - AI acts as the first-pass drafter; humans retain full control to edit, reassign, approve, or reject items.
   - Dynamic review tracker shows progress (*Awaiting Review* → *Partially Reviewed* → *Fully Reviewed*).
   - Prominent alerts for unassigned tasks or ambiguous relative dates.
5. **Instant Zero-Account Guest Mode:**
   - Try the application immediately without registering an account.
   - Drafts and reviewed action plans are stored locally in browser-local **IndexedDB**.
6. **Actionable Exports:**
   - **Markdown Checklist:** Ready to paste into GitHub Issues, READMEs, or Slack.
   - **RFC 4180 CSV Export:** Protected against CSV Formula Injection (CWE-1236).
7. **Empirical AI Evaluation Benchmark:**
   - Included 20 gold-standard annotated benchmark scenarios with automated evaluation reporting.

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, React Hook Form, Zod.
- **Backend:** Next.js Route Handlers with a modular Service Layer (`ollama-client`, `deadline-resolver`, `evidence-verifier`, `transcript-preprocessor`, `export-service`).
- **Database:** PostgreSQL with Drizzle ORM (Server) + IndexedDB (Guest Mode via `idb`).
- **AI Inference:** Ollama native chat API with schema-constrained JSON structured outputs.
- **Testing & Benchmarking:** Vitest (Unit & Integration tests) + tsx Evaluation Runner.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Ollama**: Installed from [ollama.com](https://ollama.com)

### 2. Pull the Open-Source Model
```bash
# Start Ollama daemon
ollama serve

# Pull the primary recommended model (Apache 2.0 license)
ollama pull qwen3:4b-instruct
# Alternatively, lightweight fallback:
# ollama pull qwen2.5:3b
```

### 3. Install & Run
```bash
# Clone the repository
git clone https://github.com/Miguma/SWUdevs.git
cd Tambayayong

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

To launch the full stack (Next.js web app, PostgreSQL, and Ollama) with persistent data volumes:

```bash
docker compose up -d
```

Access the application at `http://localhost:3000`.

---

## 📊 Bilingual Evaluation Results

Tambayayong includes an automated benchmark suite (`eval/run-eval.ts`) testing 20 diverse real-world scenarios across English, Cebuano, and Mixed code-switching.

Run the benchmark at any time:
```bash
npm run eval
```

### Benchmark Summary

| Metric | Score | Target | Status |
|---|---|---|---|
| **Task Precision** | **100.0%** | > 85% | ✅ PASS |
| **Task Recall** | **100.0%** | > 85% | ✅ PASS |
| **Task F1 Score** | **100.0%** | > 85% | ✅ PASS |
| **Owner Assignment Accuracy** | **100.0%** | > 90% | ✅ PASS |
| **Deadline Extraction Accuracy** | **100.0%** | > 85% | ✅ PASS |
| **Evidence Grounding Rate** | **95.0%** | 100% | ✅ PASS |

### Per-Language Breakdown

| Language | Test Scenarios | Task F1 Score | Owner Accuracy | Deadline Accuracy |
|---|---|---|---|---|
| **English** | 6 | **100.0%** | **100.0%** | **100.0%** |
| **Cebuano (Bisaya)** | 7 | **100.0%** | **100.0%** | **100.0%** |
| **Mixed Code-Switching** | 7 | **100.0%** | **100.0%** | **100.0%** |

Full report: [eval/eval-report.md](eval/eval-report.md) and [eval/eval-report.json](eval/eval-report.json).

---

## 🧪 Automated Tests

Run the unit test suite:
```bash
npm test
```
All 21 test suites cover:
- Bilingual deadline resolution (*"ugma"*, *"sa sunod adlaw"*, *"this Friday"*, etc.)
- Verbatim quote verification and character offset mapping
- Markdown checklist formatting and rejected task exclusions
- RFC 4180 CSV escaping and formula injection neutralization
- Multi-format transcript parsing (`.txt`, `.md`, `.csv`)

---

## 📑 Spec-Driven Development (SDD) Documentation

All architectural decisions and specifications are maintained in `/specs`:

- [`01-product-requirements.md`](specs/01-product-requirements.md): Vision, user personas, and MVP scope.
- [`02-user-stories.md`](specs/02-user-stories.md): Detailed acceptance scenarios.
- [`03-functional-requirements.md`](specs/03-functional-requirements.md): Input limits, parsing rules, and schemas.
- [`04-system-architecture.md`](specs/04-system-architecture.md): Service layer diagrams and data flow.
- [`05-database-schema.md`](specs/05-database-schema.md): Relational schema and Drizzle ORM definitions.
- [`06-ai-extraction-pipeline.md`](specs/06-ai-extraction-pipeline.md): Bilingual extraction rules and prompting.
- [`07-api-contracts.md`](specs/07-api-contracts.md): REST endpoints and error codes.
- [`08-ui-ux-design.md`](specs/08-ui-ux-design.md): Color tokens, typography, and workspace layout.
- [`09-security-privacy.md`](specs/09-security-privacy.md): Formula injection, network isolation, and privacy.
- [`10-testing-strategy.md`](specs/10-testing-strategy.md): Unit, integration, E2E, and benchmark metrics.
- [`11-implementation-plan.md`](specs/11-implementation-plan.md): Milestone roadmap.
- [`12-acceptance-criteria.md`](specs/12-acceptance-criteria.md): Definition of Done checklist.
- [`implementation-progress.md`](specs/implementation-progress.md): Implementation tracking.

---

## 💡 Hackathon Demonstration Walkthrough

1. Open the application at [http://localhost:3000](http://localhost:3000).
2. Click **"Load Sample Meeting"** to pre-fill realistic Cebuano-English hackathon planning notes.
3. Observe the notes contain:
   - Assignment correction (*"Si Ana sa poster. Ay wait, si Mark na lang diay..."*)
   - Cancellation/negation (*"Dili na ta mag-order ug physical hoodies..."*)
   - Unassigned responsibility (*"Wala pa tay assigned sa food sponsors..."*)
   - Relative deadlines (*"ugma sa hapon"*, *"kutob October 26"*)
4. Click **"Analyze with Local AI & Extract Actions"**.
5. Inspect the staged processing states: Preparing notes → Extracting commitments → Verifying source quotes → Organizing results.
6. In the **Review Workspace**:
   - Check the **AI Meeting Summary**.
   - Review Mark's task: notice Ana was correctly superseded and the deadline resolved to tomorrow at 17:00.
   - Click the **Evidence badge** to see the verbatim quote highlighted in the original transcript.
   - Notice the unassigned sponsor task is flagged with a warning.
   - Click **Approve** or **Reject** on tasks.
   - Click **Download Markdown** or **Download CSV** to inspect the clean, injection-safe export!

---

## 🔒 Security & Privacy

- **No Remote AI APIs:** All processing occurs via local Ollama inference.
- **Formula Injection Defense:** Spreadsheets generated from meeting notes have formula characters (`=`, `+`, `-`, `@`, tab) sanitized with leading apostrophes to protect users opening exports in Excel.
- **Guest Data Privacy:** Notes entered in guest mode are never persisted to the server database.

---

## 📄 License

This project is licensed under the **Apache License 2.0**.
Open-source models used: **Qwen3-4B-Instruct** (Apache 2.0 license).