import type {
  BrandPosition,
  CompetitorSummary,
  GeoSentiment,
  PromptScanResult,
  ScoreBreakdown,
} from "@/types/scan";

const positionValues: Record<BrandPosition, number> = {
  early: 1,
  middle: 0.6,
  late: 0.3,
  absent: 0,
};

const sentimentValues: Record<GeoSentiment, number> = {
  positive: 1,
  neutral: 0.6,
  negative: 0.2,
  absent: 0,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

export const calculateMentionRate = (results: PromptScanResult[]) =>
  results.length === 0 ? 0 : results.filter((result) => result.analysis.brandMentioned).length / results.length;

export const calculateCitationRate = (results: PromptScanResult[]) =>
  results.length === 0 ? 0 : results.filter((result) => result.analysis.citedBrandDomain).length / results.length;

export const calculatePositionScore = (results: PromptScanResult[]) =>
  average(results.map((result) => positionValues[result.analysis.brandPosition]));

export const calculateShareOfVoice = (results: PromptScanResult[]) =>
  average(results.map((result) => clamp01(result.analysis.answerShareEstimate)));

export const calculateQueryCoverage = (results: PromptScanResult[]) => calculateMentionRate(results);

export const calculateSentimentScore = (results: PromptScanResult[]) =>
  average(results.map((result) => sentimentValues[result.analysis.sentiment]));

export const calculateGeoScore = (results: PromptScanResult[]): ScoreBreakdown => {
  const mentionRate = calculateMentionRate(results);
  const citationRate = calculateCitationRate(results);
  const positionScore = calculatePositionScore(results);
  const shareOfVoice = calculateShareOfVoice(results);
  const queryCoverage = calculateQueryCoverage(results);
  const sentimentScore = calculateSentimentScore(results);

  const weighted =
    mentionRate * 0.3 +
    citationRate * 0.25 +
    positionScore * 0.15 +
    shareOfVoice * 0.15 +
    queryCoverage * 0.1 +
    sentimentScore * 0.05;

  return {
    mentionRate,
    citationRate,
    positionScore,
    shareOfVoice,
    queryCoverage,
    sentimentScore,
    geoVisibilityScore: Math.round(weighted * 100),
  };
};

export const summarizeCompetitors = (results: PromptScanResult[]): CompetitorSummary[] => {
  const counts = new Map<string, number>();

  results.forEach((result) => {
    result.analysis.competitors.forEach((competitor) => {
      const name = competitor.trim();

      if (name) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    });
  });

  const total = Array.from(counts.values()).reduce((sum, count) => sum + count, 0);

  return Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      share: total === 0 ? 0 : Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};
