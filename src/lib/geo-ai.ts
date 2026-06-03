import type {
  GeoRecommendation,
  ReadinessSignal,
  ResponseAnalysis,
  ScanInput,
} from "@/types/scan";

const OPENAI_MODEL = "gpt-4.1-mini";
const PERPLEXITY_MODEL = "sonar";

interface PerplexityResult {
  answer: string;
  citations: string[];
}

const parseJsonObject = <T>(content: string): T | null => {
  const jsonText = content.match(/\{[\s\S]*\}/)?.[0];

  if (!jsonText) {
    return null;
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    return null;
  }
};

const parseJsonArray = <T>(content: string): T[] | null => {
  const jsonText = content.match(/\[[\s\S]*\]/)?.[0];

  if (!jsonText) {
    return null;
  }

  try {
    return JSON.parse(jsonText) as T[];
  } catch {
    return null;
  }
};

const extractOpenAIText = (data: unknown) => {
  const response = data as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  return String(response.output_text ?? response.output?.[0]?.content?.[0]?.text ?? "");
};

export const callOpenAI = async (input: string, maxOutputTokens = 700) => {
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
      input,
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI returned HTTP ${response.status}`);
  }

  return extractOpenAIText(await response.json());
};

export const generateFallbackPrompts = ({ brandName, industry, targetMarket, promptStrategy }: ScanInput) => {
  const discoveryPrompts = [
    `What are the best ${industry} products or brands for customers in ${targetMarket}?`,
    `Which ${industry} options are most recommended in ${targetMarket}?`,
    `What should I buy if I want high-quality ${industry} products?`,
    `Which ${industry} brands are most trusted by experts or reviewers?`,
    `What are the best alternatives in ${industry} for people comparing premium options?`,
    `Which ${industry} products are worth considering for first-time buyers?`,
  ];
  const directPrompts = [
    `Compare ${brandName} with other ${industry} brands available in ${targetMarket}.`,
    `What should I know before choosing ${brandName} for ${industry}?`,
    `What are alternatives to ${brandName} in ${targetMarket}?`,
  ];

  if (promptStrategy === "direct") {
    return directPrompts;
  }

  if (promptStrategy === "mixed") {
    return [...discoveryPrompts.slice(0, 4), ...directPrompts];
  }

  return discoveryPrompts;
};

export const generatePrompts = async (input: ScanInput) => {
  const strategy = input.promptStrategy ?? "discovery";
  const prompt = [
    "Generate 6 to 10 realistic generative-search prompts for GEO visibility monitoring.",
    `Brand being monitored: ${input.brandName}`,
    `Website: ${input.websiteUrl}`,
    `Industry/category: ${input.industry}`,
    `Target market: ${input.targetMarket}`,
    `Prompt strategy: ${strategy}`,
    "If strategy is discovery, most or all prompts must NOT mention the monitored brand by name. They should test whether the brand appears when buyers ask generic category, problem-led, trust, recommendation, or market questions.",
    "If strategy is mixed, include mostly unnamed category/discovery prompts and a few direct brand/comparison prompts.",
    "If strategy is direct, include direct brand, comparison, and alternative prompts.",
    "Return strict JSON as an array of strings only. Do not hardcode one brand category. Avoid forcing the brand into discovery prompts.",
  ].join("\n");

  const content = await callOpenAI(prompt, 700);
  const parsed = parseJsonArray<string>(content);

  if (!parsed || parsed.length === 0) {
    return generateFallbackPrompts(input);
  }

  return parsed.map((item) => item.trim()).filter(Boolean).slice(0, 10);
};

export const callPerplexity = async (prompt: string, brandName: string): Promise<PerplexityResult> => {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
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
          content: "You are simulating a real consumer AI search. Answer naturally and cite sources where relevant.",
        },
        {
          role: "user",
          content: [
            "User query:",
            prompt,
            "",
            "Brand being monitored:",
            brandName,
            "",
            "Do not force the brand into the answer. Answer honestly based on available evidence.",
          ].join("\n"),
        },
      ],
      max_tokens: 700,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
    search_results?: Array<{ url?: string }>;
  };

  const citations = [
    ...(data.citations ?? []),
    ...((data.search_results ?? []).map((item) => item.url).filter(Boolean) as string[]),
  ];

  return {
    answer: String(data.choices?.[0]?.message?.content ?? ""),
    citations: Array.from(new Set(citations)),
  };
};

const domainFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? url;
  }
};

const normalizeAnalysis = (analysis: Partial<ResponseAnalysis> | null, answer: string, citations: string[], input: ScanInput): ResponseAnalysis => {
  const lowerAnswer = answer.toLowerCase();
  const brandMentioned = Boolean(analysis?.brandMentioned ?? lowerAnswer.includes(input.brandName.toLowerCase()));
  const domain = domainFromUrl(input.websiteUrl).toLowerCase();
  const citedBrandDomain = Boolean(
    analysis?.citedBrandDomain ?? citations.some((citation) => citation.toLowerCase().includes(domain))
  );

  return {
    brandMentioned,
    brandPosition: analysis?.brandPosition ?? (brandMentioned ? "middle" : "absent"),
    citedBrandDomain,
    competitors: Array.isArray(analysis?.competitors) ? analysis.competitors.slice(0, 8) : [],
    sentiment: analysis?.sentiment ?? (brandMentioned ? "neutral" : "absent"),
    mentionStrength: analysis?.mentionStrength ?? (brandMentioned ? "medium" : "absent"),
    answerShareEstimate: Math.max(0, Math.min(1, Number(analysis?.answerShareEstimate ?? (brandMentioned ? 0.35 : 0)))),
    explanation: analysis?.explanation ?? (brandMentioned ? "Brand appeared in the answer." : "Brand was absent from the answer."),
  };
};

export const analyzeResponse = async (params: {
  input: ScanInput;
  prompt: string;
  answer: string;
  citations: string[];
}) => {
  const content = await callOpenAI(
    [
      "Analyze this AI-generated answer for GEO visibility.",
      `Brand: ${params.input.brandName}`,
      `Website/domain: ${params.input.websiteUrl}`,
      `Industry: ${params.input.industry}`,
      `Prompt: ${params.prompt}`,
      `Answer: ${params.answer}`,
      `Citations: ${JSON.stringify(params.citations)}`,
      "Return strict JSON:",
      '{ "brandMentioned": boolean, "brandPosition": "early" | "middle" | "late" | "absent", "citedBrandDomain": boolean, "competitors": string[], "sentiment": "positive" | "neutral" | "negative" | "absent", "mentionStrength": "strong" | "medium" | "weak" | "absent", "answerShareEstimate": number, "explanation": string }',
      "Rules: answerShareEstimate must be 0 to 1. Do not invent citations. Competitors are other brands/products recommended in the answer. If the brand is absent, sentiment and mentionStrength must be absent.",
    ].join("\n\n"),
    600
  );

  return normalizeAnalysis(parseJsonObject<Partial<ResponseAnalysis>>(content), params.answer, params.citations, params.input);
};

const textIncludesAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export const fetchReadinessSignals = async (websiteUrl: string, industry: string): Promise<ReadinessSignal> => {
  try {
    const response = await fetch(websiteUrl, {
      headers: { "User-Agent": "geo-visibility-scanner/0.1" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const lowerHtml = html.toLowerCase();
    const text = lowerHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");

    return {
      semanticAnchoring: /<title[\s\S]*?<\/title>/i.test(html) && /<h1[\s\S]*?<\/h1>/i.test(html),
      contextTriggering: textIncludesAny(text, [industry.toLowerCase(), "compare", "alternative", "best", "reviews"]),
      pragmaticRecomposition: textIncludesAny(text, ["faq", "frequently asked", "benefits", "features", "how to", "ingredients"]),
      structuredData: /application\/ld\+json|schema.org/i.test(html),
      citationPotential: textIncludesAny(text, ["study", "source", "award", "certified", "research", "clinical", "reference"]),
      summary: "Readiness checks are lightweight page-text heuristics for demo recommendations.",
    };
  } catch (error) {
    return {
      semanticAnchoring: false,
      contextTriggering: false,
      pragmaticRecomposition: false,
      structuredData: false,
      citationPotential: false,
      summary: `Website readiness could not be checked: ${error instanceof Error ? error.message : "unknown error"}.`,
    };
  }
};

export const generateRecommendations = async (params: {
  input: ScanInput;
  readiness: ReadinessSignal;
  score: number;
  weakestMetrics: string[];
}) => {
  const fallback: GeoRecommendation[] = [
    {
      title: "Strengthen citation potential",
      priority: "High",
      action: "Add evidence blocks with statistics, expert references, awards, and source links on important pages.",
      rationale: "Generative engines are more likely to cite pages that expose verifiable claims clearly.",
    },
    {
      title: "Add modular comparison content",
      priority: "Medium",
      action: "Create short FAQ, alternatives, and comparison sections that answer common buyer questions directly.",
      rationale: "Standalone facts and list structures are easier for answer engines to extract and recombine.",
    },
    {
      title: "Improve semantic anchoring",
      priority: "Medium",
      action: "Make sure page titles, H1s, summaries, and headings clearly name the brand, category, market, and use cases.",
      rationale: "Clear anchors help models connect the brand to the right industry and target-market queries.",
    },
  ];

  try {
    const content = await callOpenAI(
      [
        "Create 3 to 5 concise GEO visibility recommendations for this MVP scan.",
        `Brand: ${params.input.brandName}`,
        `Industry: ${params.input.industry}`,
        `Target market: ${params.input.targetMarket}`,
        `Score: ${params.score}`,
        `Weakest metrics: ${params.weakestMetrics.join(", ")}`,
        `Readiness signals: ${JSON.stringify(params.readiness)}`,
        "Use these lenses: semantic anchoring, context triggering, pragmatic recomposition, structured data, citation potential.",
        "Return strict JSON array with title, priority, action, rationale. Priority must be High, Medium, or Low.",
      ].join("\n"),
      700
    );
    const parsed = parseJsonArray<GeoRecommendation>(content);

    return parsed && parsed.length > 0 ? parsed.slice(0, 5) : fallback;
  } catch {
    return fallback;
  }
};

