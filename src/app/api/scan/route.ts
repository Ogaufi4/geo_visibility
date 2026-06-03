import { NextResponse } from "next/server";
import {
  analyzeResponse,
  callPerplexity,
  fetchReadinessSignals,
  generatePrompts,
  generateRecommendations,
} from "@/lib/geo-ai";
import { calculateGeoScore, summarizeCompetitors } from "@/lib/scoring";
import { saveScanToSupabase } from "@/lib/supabase";
import type { GeoScanResult, PromptScanResult, PromptStrategy, ScanInput, ScoreBreakdown } from "@/types/scan";

const scanCache = new Map<string, GeoScanResult>();

const requiredFields: Array<keyof Pick<ScanInput, "brandName" | "websiteUrl" | "industry" | "targetMarket">> = [
  "brandName",
  "websiteUrl",
  "industry",
  "targetMarket",
];

const normalizePromptStrategy = (value: unknown): PromptStrategy => {
  if (value === "direct" || value === "mixed" || value === "discovery") {
    return value;
  }

  return "discovery";
};

const normalizeInput = (body: Partial<ScanInput>): Required<ScanInput> | null => {
  const input = {
    brandName: body.brandName?.trim() ?? "",
    websiteUrl: body.websiteUrl?.trim() ?? "",
    industry: body.industry?.trim() ?? "",
    targetMarket: body.targetMarket?.trim() ?? "",
    optionalPrompts: body.optionalPrompts?.trim() ?? "",
    promptStrategy: normalizePromptStrategy(body.promptStrategy),
  };

  if (requiredFields.some((field) => !input[field])) {
    return null;
  }

  return input;
};

const promptsFromTextarea = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 10);

const cacheKeyFor = (input: Required<ScanInput>) =>
  JSON.stringify({
    brandName: input.brandName.toLowerCase(),
    websiteUrl: input.websiteUrl.toLowerCase(),
    industry: input.industry.toLowerCase(),
    targetMarket: input.targetMarket.toLowerCase(),
    optionalPrompts: input.optionalPrompts,
    promptStrategy: input.promptStrategy,
  });

const weakestMetrics = (scores: ScoreBreakdown) =>
  [
    ["Mention Rate", scores.mentionRate],
    ["Citation Rate", scores.citationRate],
    ["Position Score", scores.positionScore],
    ["Share of Voice", scores.shareOfVoice],
    ["Query Coverage", scores.queryCoverage],
    ["Sentiment", scores.sentimentScore],
  ]
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .slice(0, 3)
    .map(([label]) => String(label));

const scanPrompt = async (input: Required<ScanInput>, prompt: string, index: number): Promise<PromptScanResult> => {
  const { answer, citations } = await callPerplexity(prompt, input.brandName);
  const analysis = await analyzeResponse({ input, prompt, answer, citations });

  return {
    id: `prompt-${index + 1}`,
    prompt,
    answer,
    citations,
    analysis,
  };
};

export async function POST(request: Request) {
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

  const input = normalizeInput((await request.json()) as Partial<ScanInput>);

  if (!input) {
    return NextResponse.json(
      { error: "brandName, websiteUrl, industry, and targetMarket are required." },
      { status: 400 }
    );
  }

  try {
    new URL(input.websiteUrl);
  } catch {
    return NextResponse.json({ error: "websiteUrl must be a valid URL." }, { status: 400 });
  }

  const cacheKey = cacheKeyFor(input);
  const cached = scanCache.get(cacheKey);

  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const prompts = promptsFromTextarea(input.optionalPrompts);
  const scanPrompts = prompts.length > 0 ? prompts : await generatePrompts(input);
  const results = await Promise.all(scanPrompts.map((prompt, index) => scanPrompt(input, prompt, index)));
  const scores = calculateGeoScore(results);
  const competitors = summarizeCompetitors(results);
  const readiness = await fetchReadinessSignals(input.websiteUrl, input.industry);
  const recommendations = await generateRecommendations({
    input,
    readiness,
    score: scores.geoVisibilityScore,
    weakestMetrics: weakestMetrics(scores),
  });
  const scan: GeoScanResult = {
    id: crypto.randomUUID(),
    input,
    prompts: scanPrompts,
    results,
    scores,
    competitors,
    recommendations,
    readiness,
    scannedAt: new Date().toISOString(),
  };
  const persistence = await saveScanToSupabase(scan);
  const responseScan: GeoScanResult = { ...scan, persistence };

  scanCache.set(cacheKey, responseScan);

  return NextResponse.json(responseScan);
}
