# Tambayayong

**From conversation to action. Walay mabilin!** Tambayayong turns English and Cebuano meeting notes into a reviewable action plan.

The app uses the Apache-2.0 [Qwen3-32B](https://huggingface.co/Qwen/Qwen3-32B) open-weight model through Hugging Face Inference Providers, pinned to DeepInfra. There is no automatic model or provider fallback. Meeting notes are sent to Hugging Face and DeepInfra only after the person analyzing them confirms the transfer. Guest drafts and reviewed meetings remain in browser IndexedDB.

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

Create `.env.local` in the project root and add a Hugging Face user access token with **Inference Providers** permission:

```dotenv
HF_TOKEN=your_token_here
```

Use a dedicated fine-grained token. Keep the actual value only in `.env.local` or the server environment; never use a `NEXT_PUBLIC_` variable or commit it. Hugging Face explains token creation in its [access-token guide](https://huggingface.co/docs/hub/security-tokens). The app never shows the token to the browser.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The model status appears in the header and intake form. The exact destination is `Qwen/Qwen3-32B:deepinfra` via `https://router.huggingface.co/v1/chat/completions`. Refresh the status after changing the server token; restart the server to load a newly added `.env.local` value. Cloud inference can consume Hugging Face credits.

The public guest analysis endpoint uses the server's token. Until accounts and server-side access controls are added, run this preview on a trusted/private instance.

## Docker

`docker-compose.yml` runs Next.js and PostgreSQL. Supply `HF_TOKEN` in the Compose environment before starting:

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

`npm run eval:validate` checks the 20-case dataset structure, not model accuracy. `npm run eval:model` calls the pinned cloud model using source fields only and scores actual predictions after inference. It needs `HF_TOKEN` in the shell environment because the CLI does not load `.env.local` automatically. If the token or model is unavailable, it writes `NOT_RUN` with null metrics rather than inventing predictions. The evaluation sends benchmark notes to Hugging Face and DeepInfra and may use credits.

See [observed validation results](docs/validation.md) and the [technical and product guide](docs/PROJECT_DOCUMENTATION.md). The design and acceptance specifications in [`specs/`](specs/) also document earlier local-inference plans; use the current app and validation report for observed behavior.

## Current limits

Accounts screens are previews; sign-in and sign-up are not connected. Long transcript chunking is not implemented. People must review model suggestions and citations. The model response limit is 4,096 output tokens; oversized, truncated, empty, or malformed results fail explicitly. Model evaluation uses a reproducible lexical matcher that can miss multilingual paraphrases.

Licensed under [Apache 2.0](LICENSE).
