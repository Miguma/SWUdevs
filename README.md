# Tambayayong (From conversation to action. Walay mabilin!)

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-orange)](https://ollama.com/)
[![CI](https://github.com/Miguma/SWUdevs/actions/workflows/ci.yml/badge.svg)](https://github.com/Miguma/SWUdevs/actions)

**Tambayayong** is an open-source, privacy-first meeting intelligence web application designed for student organizations, community volunteers, open-source teams, and hackathon groups.

It transforms unstructured multilingual meeting notes, chat logs, and transcripts into clear, editable, and accountable action plans using local open-source AI.

> *"Walay mabilin!" (No one left behind!)* — Mutual aid and collective community effort in action.

---

## 🌟 Key Features

1. **Bilingual Extraction (English & Cebuano / Bisaya):**
   - Model-assisted extraction from English, Cebuano, and code-switched meeting notes.
   - Intelligent relative deadline resolution (*"ugma sa hapon"*, *"karong biyernes"*, *"sa sunod adlaw"*, *"kutob Oct 26"*, *"next week"* anchored to the meeting date and `Asia/Manila` timezone).
   - Prompts the model to respect negations (*"dili na ta mag-order ug physical hoodies"*) and mid-meeting corrections (*"si Ana sa poster... ay si Mark na lang diay"*).
2. **100% Local & Private Open-Source AI:**
   - Powered by **Qwen3-4B** (or **Qwen 2.5**) running locally through **Ollama**.
   - Zero proprietary AI APIs (No OpenAI, Claude, or external cloud LLM dependencies).
   - Transcripts are sent to your app server and its configured Ollama host. Self-host both on trusted infrastructure; guest history stays in the browser.
3. **Verbatim Source Evidence Grounding & Provenance:**
   - Citations are checked against the exact source text. Unsupported names/deadline phrases are removed or flagged; a matching quote is not proof of semantic correctness.
   - Provenance tracking distinguishes exact verbatim matches, normalized matches, user manual entries, and unverified citations.
4. **Human-In-The-Loop Review Workspace:**
   - AI acts as the first-pass drafter; humans retain full control to edit, reassign, approve, or reject items.
   - Dynamic review tracker shows progress (*Awaiting Review* → *Partially Reviewed* → *Fully Reviewed*).
   - Prominent alerts for unassigned tasks or ambiguous relative dates.
5. **Workflow Integrity & Editing:**
   - "Edit Meeting Notes" reloads the selected meeting's original notes and preserves previously approved user edits when re-analyzing.
   - AI-extracted vs user-edited vs manual tasks are explicitly labeled.
6. **Instant Zero-Account Guest Mode:**
   - Try the application immediately without registering an account.
   - Drafts and reviewed action plans are stored locally in browser-local **IndexedDB**.
7. **Actionable Exports:**
   - **Markdown Checklist:** Ready to paste into GitHub Issues, READMEs, or Slack.
   - **RFC 4180 CSV Export:** Protected against CSV Formula Injection (CWE-1236).

---

## 🏗️ Tech Stack

- **Frontend:** Next.js 14 (App Router, standalone output), TypeScript (Strict Mode), Tailwind CSS, Lucide Icons, React Hook Form, Zod.
- **Backend:** Next.js Route Handlers with a modular Service Layer (`ollama-client`, `deadline-resolver`, `evidence-verifier`, `transcript-preprocessor`, `export-service`).
- **Database:** PostgreSQL with Drizzle ORM (Server) + IndexedDB (Guest Mode via `idb`).
- **AI Inference:** Ollama native chat API with schema-constrained JSON structured outputs.
- **Testing & Benchmarking:** Vitest unit and integration tests + tsx Evaluation Runner.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` to configure:

| Variable | Description | Default |
|---|---|---|
| `OLLAMA_HOST` | URL of the local Ollama daemon | `http://localhost:11434` |
| `OLLAMA_MODEL` | Open-source extraction model identifier | `qwen3:4b` |
| `DEFAULT_TIMEZONE` | Fallback IANA timezone for relative dates | `Asia/Manila` |
| `DATABASE_URL` | Optional PostgreSQL connection string | `postgresql://tambayayong:...@localhost:5432/tambayayong_db` |
| `INFERENCE_TIMEOUT_MS` | Max timeout for model inference | `90000` (90 seconds) |
| `MAX_PROMPT_CHARS` | Input limit before inference; larger notes are rejected | `24000` |
| `MAX_CONCURRENT_INFERENCES` | Max concurrent AI extractions | `2` |

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20+ (CI uses Node 20)
- **Ollama**: Installed from [ollama.com](https://ollama.com)

### 2. Pull the Open-Source Model
```bash
# Start Ollama daemon
ollama serve

# Pull the primary recommended model (Apache 2.0 license)
ollama pull qwen3:4b
# To use a different model, install and select that exact tag explicitly:
# ollama pull qwen2.5:3b
```

### 3. Install & Run
```bash
# Clone the repository
git clone https://github.com/Miguma/SWUdevs.git
cd SWUdevs

# Install dependencies
npm ci

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Choose an installed model in **Local AI model** and refresh after pulling models. No automatic fallback occurs. The review screen records the model used.

---

## 🐳 Docker Deployment

The repository includes a multi-stage `Dockerfile` and `docker-compose.yml` to run the Next.js app, PostgreSQL, and Ollama:

```bash
docker compose up -d
```

> [!NOTE]
> Ensure Docker Desktop is running on your host machine. Once started, pull the model inside the Ollama container:
> `docker exec -it tambayayong_ollama ollama pull qwen3:4b`

---

## 📊 Evaluation & Benchmarking

Tambayayong provides two independent evaluation commands:

### 1. Benchmark Dataset & Rule Validator
Validates annotation syntax, dates, timezones, unique IDs, and referenced owner names across 20 cases. This does not measure model accuracy or prove semantic label correctness:
```bash
npm run eval:validate
```

### 2. Live Model Inference Evaluation
Connects to the active Ollama daemon, submits each benchmark case, and strictly evaluates actual model predictions against the gold-standard ground truth.
*Ground truth answers are **never** substituted for missing predictions.*
```bash
npm run eval:model
```
Outputs: `eval/model-eval-report.json` and `eval/model-eval-report.md`.
If Ollama is offline, the runner reports `NOT RUN` rather than generating artificial scores.

---

## 🧪 Automated Tests

Run the test suite:
```bash
npm test
```
The suite covers deadlines, original-source offsets, exports, input validation, explicit model selection, inference failures, IndexedDB upserts, save ordering, re-analysis, review progress, and evaluation isolation.

```bash
npm run typecheck  # includes tests and evaluation code
npm run build
npm run check      # dataset + tests + types + build
```

See [observed validation results](docs/validation.md) for exact outcomes and limitations.
For a concise architecture and workflow reference, see the [technical and product guide](docs/PROJECT_DOCUMENTATION.md).

---

## 📑 Spec-Driven Development (SDD) Documentation

All architectural decisions and specifications are maintained in `/specs`:
- [`01-product-requirements.md`](specs/01-product-requirements.md): Vision, user personas, and MVP scope.
- [`02-user-stories.md`](specs/02-user-stories.md): Detailed acceptance scenarios.
- [`03-functional-requirements.md`](specs/03-functional-requirements.md): Input limits, structured schemas, evidence offset rules.
- [`04-system-architecture.md`](specs/04-system-architecture.md): Service layer diagrams and data flow.
- [`05-database-schema.md`](specs/05-database-schema.md): Relational schema and Drizzle ORM definitions.
- [`06-ai-extraction-pipeline.md`](specs/06-ai-extraction-pipeline.md): Bilingual extraction rules and prompting.
- [`07-api-contracts.md`](specs/07-api-contracts.md): REST endpoints and error codes.
- [`08-ui-ux-design.md`](specs/08-ui-ux-design.md): Color tokens, typography, and workspace layout.
- [`09-security-privacy.md`](specs/09-security-privacy.md): Formula injection, network isolation, and privacy.
- [`10-testing-strategy.md`](specs/10-testing-strategy.md): Testing pyramid & evaluation metrics.
- [`11-implementation-plan.md`](specs/11-implementation-plan.md): Milestone roadmap.
- [`12-acceptance-criteria.md`](specs/12-acceptance-criteria.md): Definition of Done checklist.
- [`implementation-progress.md`](specs/implementation-progress.md): Implementation tracking.

---

## 💡 Hackathon Demonstration Walkthrough

1. Open [http://localhost:3000](http://localhost:3000).
2. Click **"Load Sample Meeting"** to pre-fill realistic Cebuano-English hackathon notes.
3. Observe key linguistic challenges in the text:
   - Assignment correction (*"Si Ana sa poster. Ay wait, si Mark na lang diay..."*)
   - Cancellation/negation (*"Dili na ta mag-order ug physical hoodies..."*)
   - Unassigned responsibility (*"Wala pa tay assigned sa food sponsors outreach..."*)
   - Relative deadlines (*"ugma sa hapon"*, *"kutob October 26"*)
4. Click **"Analyze with Local AI & Extract Actions"**.
5. In the **Review Workspace**:
   - Inspect the **AI Meeting Summary**.
   - Review Mark's task: notice Ana was correctly superseded and the deadline resolved to tomorrow without fabricated hour timestamps.
   - Click the **Evidence badge** to see the verbatim quote highlighted in the original transcript.
   - Notice the unassigned sponsor task is flagged with a warning.
   - Click **Approve** or **Reject** on tasks.
   - Click **Download Markdown** or **Download CSV** to inspect the clean, injection-safe export!

---

## 🔒 Security & Privacy

- **No Remote AI APIs:** All processing occurs via local Ollama inference.
- **Formula Injection Defense:** Spreadsheets generated from meeting notes have formula characters (`=`, `+`, `-`, `@`, tab, CR) sanitized with leading apostrophes to protect users opening exports in Excel.
- **Guest Data Privacy:** Notes entered in guest mode are never persisted to the server database.

---

## 📄 License

This project is licensed under the **Apache License 2.0**. See [LICENSE](LICENSE) for details.
Open-source model: **Qwen3-4B** (Apache 2.0 license).
## Codex handoff and operational limits

See [AGENTS.md](AGENTS.md) for the development workflow and [validation report](docs/validation.md) for the CI blocker and checks. Re-analysis retains the meeting ID and human work, replaces the AI pass, and requests renewed review when source or extracted content changes. A conservative lexical matcher handles obvious duplicates; semantic paraphrases may still need human reconciliation.

The inference context is 16,384 tokens with a 4,096-token output budget. Oversized or apparently truncated responses fail explicitly. Long transcript chunking is not implemented. Guest mode is browser-local; the PostgreSQL schema is not a cloud sync feature. CLI evaluation uses shell environment variables, so set `OLLAMA_MODEL`/`OLLAMA_HOST` in the shell if they differ from the defaults. Model reports include the dataset hash, actual predictions, exact-set owner accuracy, commitment accuracy, errors, and coverage. Lexical title matching is a reproducible approximation; review multilingual paraphrases manually.

## Account screen preview

The UI includes `/sign-in` and `/sign-up`, with password visibility controls and guest access. These are explicitly labeled previews: account creation, password recovery, and real sign-in will be connected in a later update. The preview never claims a successful account operation and does not send/store passwords. See [UI validation](docs/ui-preview.md).

## Current workspace

The home page opens with an empty review area and keeps meeting notes beside the plan. **Explore example** loads a hand-authored review preview, clearly labeled as illustrative and never saved as an AI result. The intake form shows installed local Ollama models; analysis requires selecting an exact installed tag. Source quotes are presented for human verification, not as proof that a task, owner, commitment, or date is correct.
