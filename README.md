# GEO Visibility Dashboard

A Next.js prototype for measuring how visible a target URL is across generative answer engines. The dashboard combines benchmark prompt suites, provider agents, evaluation guardrails, summary metrics, and live scan results from OpenAI and Perplexity.

## Features

- Live target URL scan through `/api/scan`
- OpenAI and Perplexity provider runners
- GEO benchmark prompt suites inspired by the GEO paper datasets
- Evaluation agent and benchmark guardrail panels
- Summary score, mention rate, provider score, and share-of-voice charts

## Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Then add your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
pnpm dev
pnpm build
pnpm lint
```

## How Scans Work

1. Enter a target URL in the dashboard.
2. The API route fetches extractable page context from the target.
3. OpenAI and Perplexity evaluate the benchmark prompts against that context.
4. Results return with score, status, summary, model, and timestamp metadata.

If either provider key is missing, the scan route returns a configuration error and the dashboard keeps the seeded benchmark data visible.

## Notes

`.env` is intentionally ignored. Commit only `.env.example` with placeholder values.
