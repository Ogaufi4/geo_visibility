import type {
  BenchmarkAuditAgent,
  BenchmarkPromptSuite,
  CompetitorShare,
  EvaluationAgent,
  ProviderAgent,
  PromptResult,
  Recommendation,
} from "@/types/dashboard";

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
    engine: "OpenAI",
    score: 71,
    status: "Watch",
    summary: "Mention appears, but category page depth is cited less frequently.",
  },
  {
    id: "p5",
    prompt: "Who leads GEO in SaaS?",
    engine: "Perplexity",
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

export const evaluationAgents: EvaluationAgent[] = [
  {
    criterion: "Functionality",
    agent: "End-to-end Runner",
    score: 78,
    status: "Running",
    checks: ["Real URL scan", "Prompt replay", "Result export"],
    evidence: "Runs the dashboard flow against OpenAI and Perplexity, then flags any broken demo path.",
    nextStep: "Connect the Apply action to a live two-provider scan job and persist the latest run.",
  },
  {
    criterion: "Code",
    agent: "Structure Reviewer",
    score: 84,
    status: "Ready",
    checks: ["Typed data", "Component boundaries", "Lint health"],
    evidence: "Reviews readability, naming, and whether implementation choices are easy to explain.",
    nextStep: "Add focused tests around scoring transforms once live data is introduced.",
  },
  {
    criterion: "Leverage",
    agent: "Reuse Scout",
    score: 79,
    status: "Ready",
    checks: ["GEO-bench prompts", "OpenAI API", "Perplexity API"],
    evidence: "Tracks reuse of the GEO paper's benchmark framing while focusing implementation on available APIs.",
    nextStep: "Run the seed benchmark across OpenAI and Perplexity before adding other providers.",
  },
  {
    criterion: "Execution with AI",
    agent: "AI Workflow Auditor",
    score: 80,
    status: "Ready",
    checks: ["Agent usage", "Verification loop", "Speed of iteration"],
    evidence: "Captures how coding agents were guided, what was verified, and what changed as a result.",
    nextStep: "Keep a concise build log showing prompts, decisions, and test results.",
  },
  {
    criterion: "Critical thinking",
    agent: "Strategy Critic",
    score: 76,
    status: "Running",
    checks: ["Known limits", "Prioritized next steps", "Long-term vision"],
    evidence: "Surfaces gaps between the current prototype and a production GEO intelligence product.",
    nextStep: "Rank the next three product bets by user value, effort, and evidence quality.",
  },
];

export const benchmarkPromptSuites: BenchmarkPromptSuite[] = [
  {
    source: "ORCAS",
    status: "Covered",
    focus: "Short informational and recommendation-style web queries.",
    prompts: ["what does globalization mean", "wine pairing list"],
  },
  {
    source: "AllSouls",
    status: "Covered",
    focus: "Academic debate questions with broad social or curriculum implications.",
    prompts: [
      "Are open-access journals the future of academic publishing?",
      "Should the study of non-Western philosophy be a requirement for a philosophy degree in the UK?",
    ],
  },
  {
    source: "Davinci-Debate",
    status: "Covered",
    focus: "Normative policy and ideology debates.",
    prompts: ["Should all citizens receive a basic income?", "Should governments promote atheism?"],
  },
  {
    source: "ELI5",
    status: "Covered",
    focus: "Plain-language explanations for everyday science and behavior questions.",
    prompts: [
      "Why does my cat kick its toys when playing with them?",
      "what does caffeine actually do your muscles, especially regarding exercising?",
    ],
  },
  {
    source: "GPT-4",
    status: "Covered",
    focus: "General knowledge synthesis and health-adjacent benefit questions.",
    prompts: [
      "What are the benefits of a keto diet?",
      "What are the most profound impacts of the Renaissance period on modern society?",
    ],
  },
  {
    source: "LIMA",
    status: "Covered",
    focus: "Helpful assistant tasks requiring business reasoning or creative ideation.",
    prompts: [
      "What are the primary factors that influence consumer behavior?",
      "What would be a great twist for a murder mystery? I'm looking for something creative, not to rehash old tropes.",
    ],
  },
  {
    source: "MS-Macro",
    status: "Covered",
    focus: "Definition and health-reference queries from search logs.",
    prompts: ["what does monogamous", "what is the normal fbs range for children"],
  },
  {
    source: "Natural Questions",
    status: "Covered",
    focus: "Fact-seeking questions that benefit from cited source grounding.",
    prompts: ["where does the phrase bee line come from", "what is the prince of persia in the bible"],
  },
  {
    source: "Perplexity.ai",
    status: "Covered",
    focus: "Real generative-engine prompts spanning growth advice and medical-style explanations.",
    prompts: ["how to gain more followers on LinkedIn", "why is blood sugar higher after a meal"],
  },
];

export const benchmarkAuditAgents: BenchmarkAuditAgent[] = [
  {
    agent: "Coverage Auditor",
    status: "Healthy",
    score: 86,
    remit: "Checks whether the prompt set spans query styles, domains, and difficulty levels instead of overfitting to one demo path.",
    signals: ["9 source suites", "18 seed prompts", "Informational, debate, health, creative, and growth tasks"],
    risk: "Small seed sets can look diverse while still missing product-specific buyer questions.",
    nextStep: "Add category, competitor, pricing, and integration prompts for the target customer segment.",
  },
  {
    agent: "Source Validator",
    status: "Healthy",
    score: 88,
    remit: "Confirms each suite maps back to a named benchmark source or real generative-engine prompt class.",
    signals: ["GEO paper grounded", "Named benchmark families", "Perplexity.ai real-engine coverage"],
    risk: "Some seed prompts are copied as examples, not yet linked to stable dataset ids.",
    nextStep: "Store source ids, paper section references, or dataset row ids beside each prompt.",
  },
  {
    agent: "Metric Alignment Critic",
    status: "Watch",
    score: 74,
    remit: "Tests whether the benchmark can measure GEO outcomes that matter: mention, citation, position, sentiment, and source influence.",
    signals: ["Mention rate tracked", "Share of voice tracked", "Engine score tracked"],
    risk: "A prompt can be answered correctly while still failing to expose brand visibility or citation quality.",
    nextStep: "Define per-prompt expected metrics and pass thresholds before running live scans.",
  },
  {
    agent: "Bias and Safety Reviewer",
    status: "Watch",
    score: 71,
    remit: "Flags medical, ideological, religious, or culturally loaded prompts that need careful evaluation rules.",
    signals: ["Health prompts present", "Religion prompts present", "Non-Western philosophy prompt present"],
    risk: "Sensitive prompts can reward confident answers without checking nuance, uncertainty, or source quality.",
    nextStep: "Add stricter rubrics for health-adjacent and normative prompts, including citation quality checks.",
  },
  {
    agent: "Regression Sentinel",
    status: "Gap",
    score: 63,
    remit: "Makes sure benchmark results are repeatable across available engines, dates, prompt variants, and content changes.",
    signals: ["OpenAI available", "Perplexity available", "No historical run ids yet"],
    risk: "One-off benchmark runs can mistake engine randomness for product improvement.",
    nextStep: "Persist run history with provider, model, timestamp, prompt variant, and confidence interval.",
  },
];

export const providerAgents: ProviderAgent[] = [
  {
    provider: "OpenAI",
    status: "Runnable",
    envVar: "OPENAI_API_KEY",
    role: "Runs general answer-engine prompts, extracts brand mentions, and scores answer quality.",
    models: ["gpt-4.1-mini", "gpt-4.1"],
    nextStep: "Use as the baseline benchmark runner for every prompt suite.",
  },
  {
    provider: "Perplexity",
    status: "Runnable",
    envVar: "PERPLEXITY_API_KEY",
    role: "Runs web-grounded prompts where citations, retrieved sources, and freshness matter.",
    models: ["sonar", "sonar-pro"],
    nextStep: "Use as the citation and source-visibility benchmark runner.",
  },
];
