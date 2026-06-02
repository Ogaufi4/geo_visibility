"use client";

import { Fragment, useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  benchmarkAuditAgents,
  benchmarkPromptSuites,
  competitorShare,
  evaluationAgents,
  providerAgents,
  promptResults,
  recommendations,
} from "@/lib/dashboard-data";
import type {
  AgentStatus,
  BadgeTone,
  BenchmarkAuditStatus,
  BenchmarkSuiteStatus,
  EngineScore,
  ProviderAgentStatus,
  PromptResult,
  PromptStatus,
  RecommendationPriority,
  SummaryMetric,
} from "@/types/dashboard";

const badgeToneStyles: Record<BadgeTone, string> = {
  good: "bg-emerald-100 text-emerald-700",
  warn: "bg-amber-100 text-amber-700",
  neutral: "bg-slate-100 text-slate-700",
};

const statusStyles: Record<PromptStatus, string> = {
  Strong: "bg-emerald-100 text-emerald-700",
  Watch: "bg-amber-100 text-amber-700",
  Weak: "bg-rose-100 text-rose-700",
};

const priorityStyles: Record<RecommendationPriority, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const agentStatusStyles: Record<AgentStatus, string> = {
  Ready: "bg-emerald-100 text-emerald-700",
  Running: "bg-sky-100 text-sky-700",
  "Needs proof": "bg-amber-100 text-amber-700",
};

const benchmarkStatusStyles: Record<BenchmarkSuiteStatus, string> = {
  Covered: "bg-emerald-100 text-emerald-700",
  Queued: "bg-sky-100 text-sky-700",
  "Needs source": "bg-amber-100 text-amber-700",
};

const benchmarkAuditStatusStyles: Record<BenchmarkAuditStatus, string> = {
  Healthy: "bg-emerald-100 text-emerald-700",
  Watch: "bg-amber-100 text-amber-700",
  Gap: "bg-rose-100 text-rose-700",
};

const providerStatusStyles: Record<ProviderAgentStatus, string> = {
  Runnable: "bg-emerald-100 text-emerald-700",
};

const subscribeToClientMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

const scoreTone = (score: number): BadgeTone => {
  if (score >= 80) {
    return "good";
  }

  if (score >= 70) {
    return "warn";
  }

  return "neutral";
};

export function GeoDashboard() {
  const isMounted = useSyncExternalStore(subscribeToClientMount, getClientSnapshot, getServerSnapshot);
  const [urlValue, setUrlValue] = useState("https://example.com");
  const [activeUrl, setActiveUrl] = useState("https://example.com");
  const [livePromptResults, setLivePromptResults] = useState<PromptResult[]>(promptResults);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const chartData = useMemo<EngineScore[]>(() => {
    const engines = Array.from(new Set(livePromptResults.map((row) => row.engine)));

    return engines.map((engine) => ({
      engine,
      score: average(livePromptResults.filter((row) => row.engine === engine).map((row) => row.score)),
      status: "API ready",
    }));
  }, [livePromptResults]);

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    const overallGeo = average(livePromptResults.map((row) => row.score));
    const openAiScore = chartData.find((row) => row.engine === "OpenAI")?.score ?? 0;
    const perplexityScore = chartData.find((row) => row.engine === "Perplexity")?.score ?? 0;
    const mentionRate = Math.round(
      (livePromptResults.filter((row) => row.status === "Strong").length / livePromptResults.length) * 100
    );
    const benchmarkFit = average(benchmarkAuditAgents.map((agent) => agent.score));

    return [
      { label: "Overall GEO", value: String(overallGeo), badge: `${livePromptResults.length} prompts`, tone: scoreTone(overallGeo) },
      { label: "OpenAI", value: String(openAiScore), badge: "API ready", tone: scoreTone(openAiScore) },
      { label: "Perplexity", value: String(perplexityScore), badge: "API ready", tone: scoreTone(perplexityScore) },
      { label: "Mention Rate", value: `${mentionRate}%`, badge: "Strong prompts", tone: scoreTone(mentionRate) },
      { label: "Benchmark Fit", value: String(benchmarkFit), badge: "Audited", tone: scoreTone(benchmarkFit) },
    ];
  }, [chartData, livePromptResults]);

  const shareData = useMemo(() => competitorShare, []);
  const benchmarkPromptCount = useMemo(
    () => benchmarkPromptSuites.reduce((total, suite) => total + suite.prompts.length, 0),
    []
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeHost = useMemo(() => {
    try {
      return new URL(activeUrl).host;
    } catch {
      return activeUrl;
    }
  }, [activeUrl]);

  const runScan = async (nextUrl: string) => {
    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: nextUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Scan failed.");
      }

      setLivePromptResults(data.results);
      setActiveUrl(data.targetUrl ?? nextUrl);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Scan failed.");
      setActiveUrl(nextUrl);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-slate-900 sm:text-3xl">
            GEO Visibility
          </h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Live
          </span>
        </div>
        <form
          className="flex w-full max-w-xl items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const nextUrl = urlValue.trim();
            if (nextUrl) {
              void runScan(nextUrl);
            }
          }}
        >
          <input
            aria-label="Target URL"
            type="url"
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://your-site.com"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-teal-500 transition focus:ring-2"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isScanning ? "Scanning" : "Apply"}
          </button>
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
            {activeHost}
          </span>
        </form>
      </header>
      {scanError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {scanError}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryMetrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className="mt-2 font-[family-name:var(--font-sora)] text-2xl font-semibold text-slate-900">
              {metric.value}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeToneStyles[metric.tone]}`}
            >
              {metric.badge}
            </span>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
            Evaluation Agents
          </h2>
          <span className="text-sm font-medium text-slate-500">Interview criteria tracker</span>
        </div>
        <div className="grid gap-0 divide-y divide-slate-100 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
          {evaluationAgents.map((item) => (
            <article key={item.criterion} className="flex min-h-80 flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.criterion}</p>
                  <h3 className="mt-1 font-[family-name:var(--font-sora)] text-base font-semibold text-slate-900">
                    {item.agent}
                  </h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${agentStatusStyles[item.status]}`}>
                  {item.status}
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-end justify-between">
                  <span className="font-[family-name:var(--font-sora)] text-3xl font-semibold text-slate-900">
                    {item.score}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-700"
                    style={{ width: `${item.score}%` }}
                    aria-label={`${item.criterion} score ${item.score}`}
                  />
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {item.checks.map((check) => (
                  <li key={check} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-sm text-slate-700">{item.evidence}</p>
              <p className="mt-auto pt-4 text-sm font-medium text-slate-900">{item.nextStep}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              Provider Agents
            </h2>
            <p className="mt-1 text-sm text-slate-500">Live benchmark runners are scoped to the API keys available today.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            2 runnable
          </span>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {providerAgents.map((item) => (
            <article key={item.provider} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-[family-name:var(--font-sora)] text-base font-semibold text-slate-900">
                  {item.provider}
                </h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${providerStatusStyles[item.status]}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.envVar}</p>
              <p className="mt-3 text-sm text-slate-700">{item.role}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.models.map((model) => (
                  <span key={model} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {model}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900">{item.nextStep}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              GEO-bench Prompt Suites
            </h2>
            <p className="mt-1 text-sm text-slate-500">Sample prompts from the GEO paper benchmark sources.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {benchmarkPromptCount} prompts
          </span>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {benchmarkPromptSuites.map((suite) => (
            <article key={suite.source} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-[family-name:var(--font-sora)] text-base font-semibold text-slate-900">
                    {suite.source}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{suite.focus}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${benchmarkStatusStyles[suite.status]}`}>
                  {suite.status}
                </span>
              </div>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-800">
                {suite.prompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              Benchmark Guardrail Agents
            </h2>
            <p className="mt-1 text-sm text-slate-500">Agents that challenge whether the benchmark set is the right one.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {benchmarkAuditAgents.length} agents
          </span>
        </div>
        <div className="grid gap-3 p-4 lg:grid-cols-5">
          {benchmarkAuditAgents.map((item) => (
            <article key={item.agent} className="flex min-h-96 flex-col rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-[family-name:var(--font-sora)] text-base font-semibold text-slate-900">
                  {item.agent}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${benchmarkAuditStatusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-end justify-between">
                  <span className="font-[family-name:var(--font-sora)] text-2xl font-semibold text-slate-900">
                    {item.score}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fit</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-teal-700"
                    style={{ width: `${item.score}%` }}
                    aria-label={`${item.agent} benchmark fit ${item.score}`}
                  />
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{item.remit}</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {item.signals.map((signal) => (
                  <li key={signal} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-700" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-rose-700">{item.risk}</p>
              <p className="mt-auto pt-4 text-sm font-medium text-slate-900">{item.nextStep}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              Engine Scores
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">7d</span>
          </div>
          <div className="h-64">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis
                    dataKey="engine"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#475569", fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip cursor={{ fill: "#f1f5f9" }} />
                  <Bar dataKey="score" fill="#0f766e" radius={[8, 8, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-lg bg-slate-100" />
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              Share of Voice
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Top 4</span>
          </div>
          <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto]">
            <div className="h-56">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shareData}
                      dataKey="share"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={86}
                      paddingAngle={3}
                    >
                      {shareData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-full bg-slate-100" />
              )}
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {shareData.map((item) => (
                <li key={item.name} className="flex items-center justify-between gap-6">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <strong className="font-semibold text-slate-900">{item.share}%</strong>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">Prompt Results</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Latest 6</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Prompt</th>
                  <th className="px-4 py-3 font-medium">Engine</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {livePromptResults.map((row) => {
                  const expanded = Boolean(expandedRows[row.id]);
                  return (
                    <Fragment key={row.id}>
                      <tr className="align-top">
                        <td className="max-w-xs truncate px-4 py-3 text-slate-800">{row.prompt}</td>
                        <td className="px-4 py-3 text-slate-700">{row.engine}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{row.score}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[row.status]}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
                            onClick={() => toggleRow(row.id)}
                          >
                            {expanded ? "Hide details" : "View details"}
                          </button>
                        </td>
                      </tr>
                      {expanded ? (
                        <tr>
                          <td colSpan={5} className="bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <span>{row.summary}</span>
                            {row.model || row.scannedAt ? (
                              <span className="mt-2 block text-xs font-semibold text-slate-500">
                                {[row.model, row.scannedAt ? new Date(row.scannedAt).toLocaleString() : null]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-sora)] text-lg font-semibold text-slate-900">
              Recommendations
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">3 items</span>
          </div>
          <ul className="space-y-3">
            {recommendations.map((item) => (
              <li key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{item.action}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
