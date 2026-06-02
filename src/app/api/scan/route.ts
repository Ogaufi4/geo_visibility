import { NextResponse } from "next/server";
import { promptResults } from "@/lib/dashboard-data";
import type { PromptResult, PromptStatus } from "@/types/dashboard";

type Provider = "OpenAI" | "Perplexity";

interface ScanRequest {
  url?: string;
}

interface ProviderScore {
  score?: number;
  status?: PromptStatus;
  summary?: string;
}

const OPENAI_MODEL = "gpt-4.1-mini";
const PERPLEXITY_MODEL = "sonar";

const providerModels: Record<Provider, string> = {
  OpenAI: OPENAI_MODEL,
  Perplexity: PERPLEXITY_MODEL,
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

const statusFromScore = (score: number): PromptStatus => {
  if (score >= 80) {
    return "Strong";
  }

  if (score >= 65) {
    return "Watch";
  }

  return "Weak";
};

const getHostParts = (targetUrl: string) => {
  const parsed = new URL(targetUrl);
  const host = parsed.hostname.replace(/^www\./, "");
  const brand = host.split(".")[0]?.replace(/[-_]/g, " ") || host;

  return { host, brand };
};

const extractText = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4500);

const fetchTargetContext = async (targetUrl: string) => {
  try {
    const response = await fetch(targetUrl, {
      headers: { "User-Agent": "geo-visibility-benchmark/0.1" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return `Target URL responded with HTTP ${response.status}.`;
    }

    return extractText(await response.text()) || "Target page had no extractable text.";
  } catch (error) {
    return `Target page could not be fetched: ${error instanceof Error ? error.message : "unknown error"}.`;
  }
};

const parseJsonScore = (content: string): ProviderScore => {
  const jsonText = content.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    return {};
  }

  try {
    return JSON.parse(jsonText) as ProviderScore;
  } catch {
    return {};
  }
};

const heuristicScore = (content: string, host: string, brand: string) => {
  const lowerContent = content.toLowerCase();
  const mentionsHost = lowerContent.includes(host.toLowerCase());
  const mentionsBrand = lowerContent.includes(brand.toLowerCase());
  const hasSourceLanguage = /source|citation|reference|according to|https?:\/\//i.test(content);
  const hasUsefulAnswer = content.trim().length > 240;
  const score = 45 + (mentionsHost ? 30 : 0) + (mentionsBrand ? 15 : 0) + (hasSourceLanguage ? 8 : 0) + (hasUsefulAnswer ? 7 : 0);

  return clampScore(score);
};

const buildPrompt = (prompt: string, targetUrl: string, targetContext: string) => {
  const { host, brand } = getHostParts(targetUrl);

  return [
    "You are a GEO visibility evaluator.",
    `Target URL: ${targetUrl}`,
    `Target host: ${host}`,
    `Likely brand/entity: ${brand}`,
    `Target page context: ${targetContext}`,
    `Benchmark user query: ${prompt}`,
    "Score how visible this target would be in a generative-engine answer to the benchmark query.",
    "Return only JSON with score from 0-100, status as Strong, Watch, or Weak, and a short summary.",
  ].join("\n\n");
};

const callOpenAI = async (prompt: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: prompt,
      max_output_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return String(data.output_text ?? data.output?.[0]?.content?.[0]?.text ?? "");
};

const callPerplexity = async (prompt: string) => {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const response = await fetch("https://api.perplexity.ai/v1/sonar", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        {
          role: "system",
          content: "Return compact JSON only. Do not include markdown.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity returned HTTP ${response.status}`);
  }

  const data = await response.json();
  return String(data.choices?.[0]?.message?.content ?? "");
};

const callProvider = (provider: Provider, prompt: string) => {
  if (provider === "OpenAI") {
    return callOpenAI(prompt);
  }

  return callPerplexity(prompt);
};

const scanPrompt = async (row: PromptResult, targetUrl: string, targetContext: string): Promise<PromptResult> => {
  const provider = row.engine as Provider;
  const { host, brand } = getHostParts(targetUrl);
  const evaluatorPrompt = buildPrompt(row.prompt, targetUrl, targetContext);
  const scannedAt = new Date().toISOString();

  try {
    const content = await callProvider(provider, evaluatorPrompt);
    const parsed = parseJsonScore(content);
    const score = clampScore(Number(parsed.score ?? heuristicScore(content, host, brand)));
    const status = parsed.status ?? statusFromScore(score);

    return {
      ...row,
      score,
      status,
      summary: parsed.summary ?? content.slice(0, 180),
      model: providerModels[provider],
      scannedAt,
    };
  } catch (error) {
    return {
      ...row,
      score: 0,
      status: "Weak",
      summary: error instanceof Error ? error.message : "Provider scan failed.",
      model: providerModels[provider],
      scannedAt,
    };
  }
};

export async function POST(request: Request) {
  const body = (await request.json()) as ScanRequest;
  const targetUrl = body.url?.trim();
  const missingKeys = [
    process.env.OPENAI_API_KEY ? null : "OPENAI_API_KEY",
    process.env.PERPLEXITY_API_KEY ? null : "PERPLEXITY_API_KEY",
  ].filter(Boolean);

  if (missingKeys.length > 0) {
    return NextResponse.json(
      { error: `Missing API key${missingKeys.length > 1 ? "s" : ""}: ${missingKeys.join(", ")}.` },
      { status: 503 }
    );
  }

  if (!targetUrl) {
    return NextResponse.json({ error: "A target URL is required." }, { status: 400 });
  }

  try {
    new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Target URL must be valid." }, { status: 400 });
  }

  const targetContext = await fetchTargetContext(targetUrl);
  const results = await Promise.all(promptResults.map((row) => scanPrompt(row, targetUrl, targetContext)));

  return NextResponse.json({
    targetUrl,
    scannedAt: new Date().toISOString(),
    results,
  });
}
