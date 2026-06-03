import { NextResponse } from "next/server";
import { generatePrompts } from "@/lib/geo-ai";
import type { ScanInput } from "@/types/scan";

const validateInput = (body: Partial<ScanInput>) => {
  const brandName = body.brandName?.trim();
  const websiteUrl = body.websiteUrl?.trim();
  const industry = body.industry?.trim();
  const targetMarket = body.targetMarket?.trim();

  if (!brandName || !websiteUrl || !industry || !targetMarket) {
    return null;
  }

  return { brandName, websiteUrl, industry, targetMarket, optionalPrompts: body.optionalPrompts?.trim() ?? "" };
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Missing API key: OPENAI_API_KEY." }, { status: 503 });
  }

  const input = validateInput((await request.json()) as Partial<ScanInput>);

  if (!input) {
    return NextResponse.json({ error: "brandName, websiteUrl, industry, and targetMarket are required." }, { status: 400 });
  }

  try {
    new URL(input.websiteUrl);
  } catch {
    return NextResponse.json({ error: "websiteUrl must be a valid URL." }, { status: 400 });
  }

  const prompts = await generatePrompts(input);
  return NextResponse.json({ prompts });
}
