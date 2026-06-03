"use client";

import { useMemo, useState } from "react";
import type { GeoScanResult, PromptScanResult, ScanInput } from "@/types/scan";

const emptyForm: Required<ScanInput> = {
  brandName: "",
  websiteUrl: "",
  industry: "",
  targetMarket: "",
  optionalPrompts: "",
};

const sampleForm: Required<ScanInput> = {
  brandName: "Nuxe",
  websiteUrl: "https://www.nuxe.com",
  industry: "Premium skincare",
  targetMarket: "France / Europe",
  optionalPrompts: [
    "What are the best premium skincare brands in France?",
    "Which skincare brands are most recommended for dry skin in Europe?",
    "Compare Nuxe with other premium skincare brands.",
  ].join("\n"),
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

const readinessItems = [
  ["semanticAnchoring", "Semantic anchoring"],
  ["contextTriggering", "Context triggering"],
  ["pragmaticRecomposition", "Modular content"],
  ["structuredData", "Structured data"],
  ["citationPotential", "Citation potential"],
] as const;

export function GeoDashboard() {
  const [form, setForm] = useState<Required<ScanInput>>(emptyForm);
  const [scan, setScan] = useState<GeoScanResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedResult = useMemo(() => {
    if (!scan) {
      return null;
    }

    return scan.results.find((result) => result.id === selectedId) ?? scan.results[0] ?? null;
  }, [scan, selectedId]);

  const metrics = useMemo(() => {
    if (!scan) {
      return [];
    }

    return [
      ["Mention Rate", scan.scores.mentionRate, "30%"],
      ["Citation Rate", scan.scores.citationRate, "25%"],
      ["Average Position", scan.scores.positionScore, "15%"],
      ["Share of Voice", scan.scores.shareOfVoice, "15%"],
      ["Query Coverage", scan.scores.queryCoverage, "10%"],
      ["Sentiment", scan.scores.sentimentScore, "5%"],
    ] as const;
  }, [scan]);

  const updateField = (field: keyof Required<ScanInput>, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const runScan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Scan failed.");
      }

      setScan(payload);
      setSelectedId(payload.results?.[0]?.id ?? null);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="kicker">Generative Search Visibility Intelligence</p>
          <h1>GEO Visibility Scanner</h1>
          <p className="subtle">
            Enter any brand, run AI-search prompts through Perplexity, analyze the responses with OpenAI, and save scan output to Supabase when configured.
          </p>
        </div>
        {scan ? <Status scan={scan} /> : null}
      </header>

      <section className="card form-card">
        <form className="form-grid" onSubmit={runScan}>
          <label>
            Brand name
            <input value={form.brandName} onChange={(event) => updateField("brandName", event.target.value)} placeholder="Nuxe" required />
          </label>
          <label>
            Website URL
            <input type="url" value={form.websiteUrl} onChange={(event) => updateField("websiteUrl", event.target.value)} placeholder="https://www.nuxe.com" required />
          </label>
          <label>
            Industry
            <input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} placeholder="Premium skincare" required />
          </label>
          <label>
            Target market
            <input value={form.targetMarket} onChange={(event) => updateField("targetMarket", event.target.value)} placeholder="France / Europe" required />
          </label>
          <label className="wide">
            Optional target prompts
            <textarea value={form.optionalPrompts} onChange={(event) => updateField("optionalPrompts", event.target.value)} placeholder="One prompt per line. Leave empty to generate prompts with OpenAI." />
          </label>
          <div className="actions">
            <button className="primary" type="submit" disabled={isLoading}>
              {isLoading ? "Running scan..." : "Run GEO Scan"}
            </button>
            <button className="secondary" type="button" onClick={() => setForm(sampleForm)}>
              Load Nuxe sample
            </button>
          </div>
        </form>
        {error ? <div className="error">{error}</div> : null}
      </section>

      {!scan ? (
        <section className="empty">Results will appear here after a scan.</section>
      ) : (
        <>
          <section className="score-row">
            <article className="card score-card">
              <p className="kicker">Overall score</p>
              <div className="score">{scan.scores.geoVisibilityScore}</div>
              <p>{scan.input.brandName} in {scan.input.targetMarket}</p>
            </article>
            {metrics.slice(0, 3).map(([label, value, weight]) => (
              <MetricCard key={label} label={label} value={value} weight={weight} />
            ))}
          </section>

          <section className="metric-grid">
            {metrics.slice(3).map(([label, value, weight]) => (
              <MetricCard key={label} label={label} value={value} weight={weight} />
            ))}
          </section>

          <section className="content-grid">
            <article className="card">
              <div className="panel-head"><h2>Prompt Results</h2></div>
              <table>
                <thead>
                  <tr><th>Prompt</th><th>Mention</th><th>Citation</th><th>Position</th><th>Sentiment</th><th /></tr>
                </thead>
                <tbody>
                  {scan.results.map((result) => (
                    <tr key={result.id}>
                      <td>{result.prompt}</td>
                      <td>{result.analysis.brandMentioned ? "Yes" : "No"}</td>
                      <td>{result.analysis.citedBrandDomain ? "Yes" : "No"}</td>
                      <td>{result.analysis.brandPosition}</td>
                      <td>{result.analysis.sentiment}</td>
                      <td><button className="link-button" type="button" onClick={() => setSelectedId(result.id)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="card">
              <div className="panel-head"><h2>Top Competitors</h2></div>
              <div className="panel-body">
                <ul className="list">
                  {scan.competitors.length ? scan.competitors.map((item) => (
                    <li className="list-item" key={item.name}><strong>{item.name}</strong><span>{item.share}%</span></li>
                  )) : <li className="muted">No competitors extracted.</li>}
                </ul>
              </div>
            </article>
          </section>

          <section className="content-grid">
            <article className="card">
              <div className="panel-head"><h2>AI Response Viewer</h2></div>
              <div className="panel-body">{selectedResult ? <ResponseViewer result={selectedResult} /> : null}</div>
            </article>

            <article className="card">
              <div className="panel-head"><h2>Recommendations</h2></div>
              <div className="panel-body">
                <ul className="list">
                  {scan.recommendations.map((item) => (
                    <li className="card panel-body" key={item.title}>
                      <h3>{item.title} <span className={`badge ${item.priority === "High" ? "bad" : item.priority === "Medium" ? "warn" : "good"}`}>{item.priority}</span></h3>
                      <p>{item.action}</p>
                      <p className="muted">{item.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </section>

          <section className="card panel-body">
            <h2>GEO Readiness</h2>
            <div className="readiness">
              {readinessItems.map(([key, label]) => {
                const passed = Boolean(scan.readiness[key]);
                return <div className="list-item" key={key}><strong>{label}</strong><span className={`badge ${passed ? "good" : "warn"}`}>{passed ? "Ready" : "Check"}</span></div>;
              })}
            </div>
            <p className="muted">{scan.readiness.summary}</p>
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <article className="card metric">
      <p className="muted">{label}</p>
      <div className="metric-value">{percent(value)}</div>
      <div className="bar"><span style={{ width: percent(value) }} /></div>
      <p className="muted">Weight {weight}</p>
    </article>
  );
}

function ResponseViewer({ result }: { result: PromptScanResult }) {
  return (
    <div>
      <p><strong>Prompt:</strong> {result.prompt}</p>
      <div className="answer">{result.answer || "No answer text returned."}</div>
      <p><strong>Analysis:</strong> {result.analysis.explanation}</p>
      <p><strong>Citations</strong></p>
      <div className="citations">
        {result.citations.length ? result.citations.map((citation) => <div key={citation}>{citation}</div>) : "No citations returned."}
      </div>
    </div>
  );
}

function Status({ scan }: { scan: GeoScanResult }) {
  if (scan.cached) {
    return <span className="badge warn">Session cache</span>;
  }

  if (scan.persistence?.persisted) {
    return <span className="badge good">Saved to Supabase</span>;
  }

  return <span className="badge warn">Not saved to Supabase</span>;
}
