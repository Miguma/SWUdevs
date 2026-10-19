# Spec 01: Product Requirements Document (PRD)

## 1. Product Overview
- **Product Name:** Tambayayong
- **Tagline:** From conversation to action. Walay mabilin!
- **Mission:** Help community organizations, student groups, volunteers, and open-source teams transform unstructured meeting notes into clear, editable, accountable action plans.
- **Category:** Open-source AI productivity / Meeting intelligence
- **Architecture Principle:** Spec-Driven Development (SDD), local open-source AI, zero proprietary API dependencies, human-in-the-loop review.

## 2. Problem Statement
Meetings in grassroots organizations, universities, hackathons, and volunteer teams frequently suffer from:
1. **Unclear ownership & lost commitments:** Notes are hastily taken in bullet points, chat threads, or collaborative docs. No one is explicitly assigned or accountable.
2. **Multilingual code-switching:** In regions like the Philippines and specifically the Visayas/Mindanao regions, conversations fluidly switch between English, Cebuano (Bisaya), and Tagalog ("Taglish"/"Bislish"). Conventional AI tools fail or invent details when faced with Cebuano expressions (e.g., *"si Maria na lang diay"*, *"dili na ta mag-order ug shirts"*, *"ugma sa hapon"*).
3. **AI hallucination & false commitments:** Naive LLM summarizers turn hypothetical suggestions (*"maybe si Carlo mag-design"*) or rejected ideas into confirmed tasks.
4. **Data privacy & cost barriers:** Student and volunteer groups cannot pay monthly SaaS per-seat licenses or risk exposing private meeting transcripts to external proprietary cloud APIs.

## 3. Target User Personas
- **Student Leaders (SSG, department clubs, university organizations):** Fast-paced agenda meetings, budget discussions, multilingual note-taking.
- **Hackathon & Dev Teams:** Rapid standups, task delegation, quick GitHub task breakdowns.
- **Community & NGO Volunteers:** Barangay/local community assemblies, relief coordination, project timelines.
- **Open-source Project Maintainers:** Community triage, working group meetings, decision records.

## 4. Value Proposition
- **Paste & Extract:** Turn messy notes into structured tasks, decisions, and open questions within seconds.
- **Evidence-Grounded:** Every extraction is linked to an exact verbatim quote in the original text. No invented owners, no invented deadlines.
- **Bilingual & Nuance-Aware:** Robust handling of English, Cebuano, and Cebuano-English code-switching, including negations and assignment corrections.
- **Human In Control:** AI serves as the drafter; humans review, refine, approve, or reject items before finalizing.
- **Privacy & Open Source:** Powered by local Ollama models (`qwen3:4b-instruct` / `qwen2.5:7b`), zero external API keys needed, works fully offline with guest mode.
- **Actionable Outputs:** Clean export to GitHub/GitLab-ready Markdown checklists and formula-injection-safe CSV.

## 5. MVP Feature Scope
1. **Meeting Intake Module:**
   - Title, organization name, meeting date & timezone (default: `Asia/Manila`).
   - Rich text notes input with live character count, quick sample data loader, and draft autosave.
   - Text transcript file upload (`.txt`, `.md`, `.csv`).
2. **Bilingual Extraction Pipeline:**
   - Action items (title, description, assignees, original deadline phrase, resolved ISO deadline, commitment status, priority).
   - Confirmed decisions vs rejected proposals.
   - Unresolved open questions & follow-ups.
   - Grounded meeting summary.
   - Next meeting detection.
   - Source evidence quotation and string offset validation.
3. **Interactive Review Workspace:**
   - Real-time review progress indicator (Awaiting Review, Partially Reviewed, Fully Reviewed).
   - Editable action item cards with assignee tags, deadline pickers, and priority controls.
   - Approve, Reject, Edit, and Add Task controls.
   - Evidence inspector drawer showing exact quote location in context.
   - Prominent warnings for missing owners, ambiguous relative dates, or unverified evidence.
4. **Export Engine:**
   - Structured GitHub-flavored Markdown checklist export.
   - RFC 4180 compliant CSV export with formula injection sanitization.
5. **Persistence & Guest Mode:**
   - Local browser persistence (IndexedDB) for instant zero-registration guest usage.
   - Meeting history list with reload, edit, duplicate, and delete actions.
   - Server-ready PostgreSQL schema with Drizzle ORM for multi-tenant workspaces.
6. **Evaluation & Quality Assurance:**
   - 20+ annotated test scenarios covering English, Cebuano, and mixed notes.
   - Automated benchmark runner reporting precision, recall, F1, owner accuracy, deadline accuracy, and language breakdown.

## 6. Constraints & Non-Goals for MVP
- **No proprietary AI APIs:** Zero OpenAI, Anthropic, or proprietary cloud endpoints.
- **No fake hardcoding:** AI processing must execute against actual local inference or cleanly report offline status.
- **Audio/Speech-to-Text deferral:** Transcripts must be provided as text (`.txt`, `.md`, `.csv`) in MVP; audio transcription (e.g. Whisper) is deferred to post-MVP.
