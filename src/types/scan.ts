export type BrandPosition = "early" | "middle" | "late" | "absent";
export type GeoSentiment = "positive" | "neutral" | "negative" | "absent";
export type MentionStrength = "strong" | "medium" | "weak" | "absent";

export interface ScanInput {
  brandName: string;
  websiteUrl: string;
  industry: string;
  targetMarket: string;
  optionalPrompts?: string;
}

export interface ResponseAnalysis {
  brandMentioned: boolean;
  brandPosition: BrandPosition;
  citedBrandDomain: boolean;
  competitors: string[];
  sentiment: GeoSentiment;
  mentionStrength: MentionStrength;
  answerShareEstimate: number;
  explanation: string;
}

export interface PromptScanResult {
  id: string;
  prompt: string;
  answer: string;
  citations: string[];
  analysis: ResponseAnalysis;
}

export interface ScoreBreakdown {
  mentionRate: number;
  citationRate: number;
  positionScore: number;
  shareOfVoice: number;
  queryCoverage: number;
  sentimentScore: number;
  geoVisibilityScore: number;
}

export interface CompetitorSummary {
  name: string;
  count: number;
  share: number;
}

export interface GeoRecommendation {
  title: string;
  priority: "High" | "Medium" | "Low";
  action: string;
  rationale: string;
}

export interface ReadinessSignal {
  semanticAnchoring: boolean;
  contextTriggering: boolean;
  pragmaticRecomposition: boolean;
  structuredData: boolean;
  citationPotential: boolean;
  summary: string;
}

export interface PersistenceResult {
  persisted: boolean;
  error?: string;
}

export interface GeoScanResult {
  id: string;
  input: Required<ScanInput>;
  prompts: string[];
  results: PromptScanResult[];
  scores: ScoreBreakdown;
  competitors: CompetitorSummary[];
  recommendations: GeoRecommendation[];
  readiness: ReadinessSignal;
  scannedAt: string;
  cached?: boolean;
  persistence?: PersistenceResult;
}
