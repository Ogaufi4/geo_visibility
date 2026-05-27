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
}

export type RecommendationPriority = "High" | "Medium" | "Low";

export interface Recommendation {
  title: string;
  priority: RecommendationPriority;
  action: string;
}
