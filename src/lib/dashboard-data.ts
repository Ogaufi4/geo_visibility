import type {
  CompetitorShare,
  EngineScore,
  PromptResult,
  Recommendation,
  SummaryMetric,
} from "@/types/dashboard";

export const summaryMetrics: SummaryMetric[] = [
  { label: "Overall GEO", value: "82", badge: "+4.1%", tone: "good" },
  { label: "OpenAI", value: "85", badge: "Strong", tone: "good" },
  { label: "Perplexity", value: "76", badge: "Watch", tone: "warn" },
  { label: "Mention Rate", value: "41%", badge: "+3 pts", tone: "good" },
  { label: "Citation Rate", value: "29%", badge: "-1 pt", tone: "warn" },
];

export const engineScores: EngineScore[] = [
  { engine: "OpenAI", score: 85 },
  { engine: "Perplexity", score: 76 },
  { engine: "Claude", score: 73 },
  { engine: "Gemini", score: 69 },
];

export const competitorShare: CompetitorShare[] = [
  { name: "You", share: 34, color: "#0f766e" },
  { name: "Comp A", share: 28, color: "#0ea5e9" },
  { name: "Comp B", share: 22, color: "#f59e0b" },
  { name: "Comp C", share: 16, color: "#64748b" },
];

export const promptResults: PromptResult[] = [
  {
    id: "p1",
    prompt: "Best platform for geo analytics?",
    engine: "OpenAI",
    score: 88,
    status: "Strong",
    summary: "You are mentioned early with one source link and clear value framing.",
  },
  {
    id: "p2",
    prompt: "Compare top visibility tools",
    engine: "Perplexity",
    score: 75,
    status: "Watch",
    summary: "Brand appears mid-list; competitor tables have stronger proof points.",
  },
  {
    id: "p3",
    prompt: "How to improve citation rate?",
    engine: "OpenAI",
    score: 81,
    status: "Strong",
    summary: "Advice aligns with your docs, but citations are still lighter than peers.",
  },
  {
    id: "p4",
    prompt: "Top AI answer engine mentions",
    engine: "Claude",
    score: 71,
    status: "Watch",
    summary: "Mention appears, but category page depth is cited less frequently.",
  },
  {
    id: "p5",
    prompt: "Who leads GEO in SaaS?",
    engine: "Gemini",
    score: 67,
    status: "Weak",
    summary: "Low mention share due to missing benchmark snippets on landing content.",
  },
  {
    id: "p6",
    prompt: "Reliable sources for GEO metrics",
    engine: "Perplexity",
    score: 79,
    status: "Watch",
    summary: "Source quality is good, but your case study links are not surfaced often.",
  },
];

export const recommendations: Recommendation[] = [
  {
    title: "Add source links",
    priority: "High",
    action: "Attach trusted citations in top funnel pages.",
  },
  {
    title: "Refresh FAQ schema",
    priority: "Medium",
    action: "Update FAQ blocks for comparison prompts.",
  },
  {
    title: "Boost category pages",
    priority: "Low",
    action: "Add concise feature tables for engine extraction.",
  },
];
