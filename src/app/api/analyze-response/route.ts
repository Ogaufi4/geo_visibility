import { NextResponse } from "next/server";
import { analyzeResponse } from "@/lib/geo-ai";
import type { PromptStrategy, ScanInput } from "@/types/scan";

interface AnalyzeRequest extends ScanInput {
  prompt?: string;
  answer?: string;
  citations?: string[];
}

const normalizePromptStrategy = (value: unknown): PromptStrategy => {
  if (value === "direct" || value === "mixed" || value === "discovery") {
    return value;
  }

  return "discovery";
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing API key: OPENAI_API_KEY." }, { status: 503 });
  }

  const body = (await request.json()) as AnalyzeRequest;
  const input = {
    brandName: body.brandName?.trim(),
    websiteUrl: body.websiteUrl?.trim(),
    industry: body.industry?.trim(),
    targetMarket: body.targetMarket?.trim(),
    optionalPrompts: body.optionalPrompts?.trim() ?? "",
    promptStrategy: normalizePromptStrategy(body.promptStrategy),
  };

  if (!input.brandName || !input.websiteUrl || !input.industry || !input.targetMarket || !body.prompt || !body.answer) {
    return NextResponse.json(
      { error: "brandName, websiteUrl, industry, targetMarket, prompt, and answer are required." },
      { status: 400 }
    );
  }

  const analysis = await analyzeResponse({
    input: input as Required<ScanInput>,
    prompt: body.prompt,
    answer: body.answer,
    citations: body.citations ?? [],
  });

  return NextResponse.json({ analysis });
}
