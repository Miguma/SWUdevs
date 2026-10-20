# Tambayayong

**From conversation to action. Walay mabilin!** Tambayayong turns English and Cebuano meeting notes into a reviewable action plan.

The app uses the Apache-2.0 [Qwen 3.8 27B](https://huggingface.co/Qwen/Qwen3.8-27B) open-weight model through Groq's free API tier. There is no automatic model or provider fallback. Meeting notes are sent to Groq only after the person analyzing them confirms the transfer. Guest drafts and reviewed meetings remain in browser IndexedDB.

## What it does

- Extracts proposed and confirmed tasks, decisions, and unanswered questions from English, Cebuano, and mixed notes.
- Checks each AI quotation against the exact source and flags unsupported owner or deadline details. A matching quote proves source location, not task correctness or approval.
- Lets people edit and review every suggested item. Re-analysis preserves the meeting ID and human work while rechecking citations against revised notes.
- Exports reviewed plans as Markdown or formula-safe CSV.
- Offers a clearly labeled hand-authored example for exploration without presenting it as AI output.

## Run locally

Install Node.js 20 or newer, then:

```bash
npm ci
```

Create a free [Groq API key](https://console.groq.com/keys), then add it to `.env.local` in the project root:

```dotenv
GROQ_API_KEY=your_key_here
```

Keep the key only in `.env.local` or the server environment; never use a `NEXT_PUBLIC_` variable or commit it. The app never shows the key to the browser. Groq's free plan has [model-specific rate limits](https://console.groq.com/docs/rate-limits); requests stop when a limit is reached.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The model status appears in the header and intake form. The exact destination is `qwen/qwen3.8-27b` via `https://api.groq.com/openai/v1/chat/completions`. Refresh the status after changing the server key; restart the server to load a newly added `.env.local` value. Stay on Groq's Free plan to avoid paid usage.

The public guest analysis endpoint uses the server's token. Until accounts and server-side access controls are added, run this preview on a trusted/private instance.

## Docker

`docker-compose.yml` runs Next.js and PostgreSQL. Supply `GROQ_API_KEY` in the Compose environment before starting:

```bash
docker compose up -d
```

The Compose stack does not include a local AI server. Existing guest drafts are stored in the browser; PostgreSQL is not a guest sync feature.

## Validate

```bash
npm run eval:validate
npm test
npm run typecheck
npm run build
```

`npm run eval:validate` checks the 20-case dataset structure, not model accuracy. `npm run eval:model` calls the pinned cloud model using source fields only and scores actual predictions after inference. It needs `GROQ_API_KEY` in the shell environment because the CLI does not load `.env.local` automatically. If the key or model is unavailable, it writes `NOT_RUN` with null metrics rather than inventing predictions. The evaluation sends benchmark notes to Groq and can consume free-tier request and token quota.

See [observed validation results](docs/validation.md) and the [technical and product guide](docs/PROJECT_DOCUMENTATION.md). The design and acceptance specifications in [`specs/`](specs/) also document earlier local-inference plans; use the current app and validation report for observed behavior.

## Current limits

Accounts screens are previews; sign-in and sign-up are not connected. Long transcript chunking is not implemented. People must review model suggestions and citations. The model response limit is 4,096 output tokens; oversized, truncated, empty, or malformed results fail explicitly. Model evaluation uses a reproducible lexical matcher that can miss multilingual paraphrases.

Licensed under [Apache 2.0](LICENSE).
