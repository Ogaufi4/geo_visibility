import type { GeoScanResult } from "@/types/scan";

interface SupabaseInsertResult {
  persisted: boolean;
  error?: string;
}

const getSupabaseServiceKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_KEY;

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = getSupabaseServiceKey();

  if (!url || !key) {
    return null;
  }

  return { url, key };
};

export const saveScanToSupabase = async (scan: GeoScanResult): Promise<SupabaseInsertResult> => {
  const config = getSupabaseConfig();

  if (!config) {
    return {
      persisted: false,
      error: "Supabase env vars are not configured. Set SUPABASE_URL plus SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_KEY.",
    };
  }

  const response = await fetch(`${config.url}/rest/v1/geo_scans`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: scan.id,
      brand_name: scan.input.brandName,
      website_url: scan.input.websiteUrl,
      industry: scan.input.industry,
      target_market: scan.input.targetMarket,
      geo_visibility_score: scan.scores.geoVisibilityScore,
      scores: scan.scores,
      competitors: scan.competitors,
      recommendations: scan.recommendations,
      scan_json: scan,
      scanned_at: scan.scannedAt,
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    return { persisted: false, error: `Supabase returned HTTP ${response.status}${message ? `: ${message}` : ""}` };
  }

  return { persisted: true };
};
