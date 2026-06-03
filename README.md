# GEO Visibility Scanner

A one-day MVP for Generative Search Visibility Intelligence. The app scans any brand across AI-search-style prompts, checks whether the brand is mentioned and cited, scores the visibility result, and shows competitors, prompt-level findings, AI responses, and recommendations.

This is not "SEO for AI". It is a lightweight visibility intelligence tool for generative search experiences.

## What It Does

1. A user enters a brand name, website URL, industry, and target market.
2. The app generates 6 to 10 consumer-style prompts with OpenAI, unless custom prompts are supplied.
3. Each prompt is sent to Perplexity Sonar to simulate a web-grounded AI search response with citations.
4. Each Perplexity response is analyzed by OpenAI into structured GEO signals.
5. Pure scoring functions calculate a transparent GEO Visibility Score out of 100.
6. The UI shows score cards, competitors, citations, prompt results, an answer viewer, readiness signals, and recommendations.
7. If Supabase is configured, the full scan JSON is saved to the `geo_scans` table.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create `.env` from the example:

```bash
cp .env.example .env
```

Required AI variables:

```bash
OPENAI_API_KEY=your_openai_api_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

Optional Supabase persistence:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key`n# Also accepted by the app: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_KEY
```

Run locally:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Table

Create a `geo_scans` table if persistence is needed:

```sql
create table if not exists geo_scans (
  id uuid primary key,
  brand_name text not null,
  website_url text not null,
  industry text not null,
  target_market text not null,
  geo_visibility_score integer not null,
  scores jsonb not null,
  competitors jsonb not null,
  recommendations jsonb not null,
  scan_json jsonb not null,
  scanned_at timestamptz not null
);
```

Use the service role key only on the server. Do not expose it in client-side code. The app reads `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, or `SUPABASE_SERVICE_KEY`.

## API Process

### `POST /api/scan`

Input:

```json
{
  "brandName": "Nuxe",
  "websiteUrl": "https://www.nuxe.com",
  "industry": "Premium skincare",
  "targetMarket": "France / Europe",
  "optionalPrompts": "Optional newline-separated prompts"
}
```

Process:

1. Validate required fields and URL format.
2. Check `OPENAI_API_KEY` and `PERPLEXITY_API_KEY`.
3. Use custom prompts when provided, otherwise call `/api/generate-prompts` logic through OpenAI.
4. For each prompt, call Perplexity Sonar.
5. Analyze each answer with OpenAI.
6. Calculate the score with pure functions in `src/lib/scoring.ts`.
7. Run lightweight readiness checks against the website HTML.
8. Generate recommendations with OpenAI, with fallback recommendations for demo resilience.
9. Save the scan to Supabase when Supabase env vars are configured.
10. Return the full scan JSON.

### `POST /api/generate-prompts`

Uses OpenAI to create realistic discovery, trust, comparison, alternatives, and recommendation prompts for the submitted brand context.

### `POST /api/analyze-response`

Uses OpenAI to extract strict structured fields from one AI response: mention, position, citation, competitors, sentiment, mention strength, answer share estimate, and explanation.

## Scoring Matrix

The GEO Visibility Score is out of 100. Each metric is normalized from 0 to 1, then weighted.

| Metric | Weight | Implementation |
| --- | ---: | --- |
| Mention Rate | 30% | Prompts where the brand is mentioned divided by total prompts |
| Citation Rate | 25% | Prompts where the brand domain is cited divided by total prompts |
| Position Score | 15% | early = 1, middle = 0.6, late = 0.3, absent = 0 |
| Share of Voice | 15% | Average `answerShareEstimate` from response analysis |
| Query Coverage | 10% | Same as mention rate for MVP |
| Sentiment / Context | 5% | positive = 1, neutral = 0.6, negative = 0.2, absent = 0 |

## GEO Readiness Layer

The readiness layer is deliberately simple for the MVP. It checks website/page text for signals that support generative search visibility:

- Semantic anchoring: title and H1 presence
- Context triggering: industry terms, best/compare/review/alternative language
- Pragmatic recomposition: FAQ, benefits, features, how-to, modular content
- Structured data: JSON-LD or schema.org markup
- Citation potential: studies, sources, awards, certifications, research, references

These checks mainly explain recommendations. They are not a full technical audit.

## Architecture

- `src/components/geo-dashboard.tsx`: form, loading/error states, results dashboard, response viewer
- `src/app/api/scan/route.ts`: full scan orchestration
- `src/app/api/generate-prompts/route.ts`: prompt generation endpoint
- `src/app/api/analyze-response/route.ts`: single response analysis endpoint
- `src/lib/geo-ai.ts`: OpenAI, Perplexity, readiness, and recommendation helpers
- `src/lib/scoring.ts`: pure scoring functions
- `src/lib/supabase.ts`: optional Supabase REST persistence
- `src/types/scan.ts`: shared scan and scoring types

## MVP Limits

- Runs scans synchronously, so large prompt sets can be slow.
- Query coverage is currently equal to mention rate.
- Share of voice is an OpenAI-estimated value, not a token-level measurement.
- Website readiness uses lightweight HTML heuristics.
- Supabase persistence stores the full JSON result but does not yet provide history views in the UI.
- No auth, organizations, billing, or scheduled monitoring.

## Production Roadmap

- Add authenticated workspaces and scan history views.
- Move scans to background jobs with progress updates.
- Store prompt, answer, citation, and analysis rows separately for analytics.
- Add scheduled monitoring and trend charts.
- Add prompt categories for richer query coverage.
- Add citation quality scoring and source authority checks.
- Add exports for PDF, CSV, and client-ready reports.
- Add provider comparisons beyond Perplexity where API access allows.

