"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
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
  competitorShare,
  engineScores,
  promptResults,
  recommendations,
  summaryMetrics,
} from "@/lib/dashboard-data";
import type { BadgeTone, PromptStatus, RecommendationPriority } from "@/types/dashboard";

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

export function GeoDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [urlValue, setUrlValue] = useState("https://example.com");
  const [activeUrl, setActiveUrl] = useState("https://example.com");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const chartData = useMemo(() => engineScores, []);
  const shareData = useMemo(() => competitorShare, []);

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
              setActiveUrl(nextUrl);
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
            className="h-10 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Apply
          </button>
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:inline-flex">
            {activeHost}
          </span>
        </form>
      </header>

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
                {promptResults.map((row) => {
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
                            {row.summary}
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
