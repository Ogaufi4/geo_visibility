export type BadgeTone = "good" | "warn" | "neutral";

export interface SummaryMetric {
  label: string;
  value: string;
  badge: string;
  tone: BadgeTone;
}

export interface EngineScore {
  engine: string;
  score: number;
  status?: string;
}

export interface CompetitorShare {
  name: string;
  share: number;
  color: string;
}

export type PromptStatus = "Strong" | "Watch" | "Weak";

export interface PromptResult {
  id: string;
  prompt: string;
  engine: string;
  score: number;
  status: PromptStatus;
  summary: string;
  model?: string;
  scannedAt?: string;
}

export type RecommendationPriority = "High" | "Medium" | "Low";

export interface Recommendation {
  title: string;
  priority: RecommendationPriority;
  action: string;
}

export type AgentStatus = "Ready" | "Running" | "Needs proof";

export interface EvaluationAgent {
  criterion: string;
  agent: string;
  score: number;
  status: AgentStatus;
  checks: string[];
  evidence: string;
  nextStep: string;
}

export type BenchmarkSuiteStatus = "Covered" | "Queued" | "Needs source";

export interface BenchmarkPromptSuite {
  source: string;
  status: BenchmarkSuiteStatus;
  focus: string;
  prompts: string[];
}

export type BenchmarkAuditStatus = "Healthy" | "Watch" | "Gap";

export interface BenchmarkAuditAgent {
  agent: string;
  status: BenchmarkAuditStatus;
  score: number;
  remit: string;
  signals: string[];
  risk: string;
  nextStep: string;
}

export type ProviderAgentStatus = "Runnable";

export interface ProviderAgent {
  provider: string;
  status: ProviderAgentStatus;
  envVar: string;
  role: string;
  models: string[];
  nextStep: string;
}
