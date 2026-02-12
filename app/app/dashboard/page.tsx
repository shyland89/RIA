"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  DATE_MODES,
  PERIODS,
  DATE_MODE_LABELS,
  PERIOD_LABELS,
  type DateMode,
  type Period,
} from "@/lib/date-filter";
import {
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  UNKNOWN_VALUE,
  type DimensionKey,
  type DimensionFilters,
} from "@/lib/dimension-filter";

type Totals = {
  count: number;
  won: number;
  lost: number;
  open: number;
  winRate: number | null;
  avgAmountWon: number | null;
};

type BreakdownRow = {
  label: string;
  count: number;
  won: number;
  lost: number;
  open: number;
  winRate: number | null;
  avgAmountWon: number | null;
};

type FilterMeta = {
  dateMode: string;
  dateModeLabel: string;
  dateFrom: string;
  dateTo: string;
  periodLabel: string;
  includedCount: number;
  excludedNullCount: number;
  totalOrgCount: number;
  activeDimensionFilters: string | null;
};

type SummaryData = {
  totals: Totals;
  byRole: BreakdownRow[];
  byIndustry: BreakdownRow[];
  bySource: BreakdownRow[];
  bySegment: BreakdownRow[];
  byCountry: BreakdownRow[];
  filter: FilterMeta;
};

type AiInsight = {
  title: string;
  description: string;
  type: "positive" | "negative" | "neutral";
};

type AiAnalysis = {
  summary: string;
  insights: AiInsight[];
  recommendations: string[];
};

function fmtPct(v: number | null): string {
  if (v === null) return "\u2014";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtCurrency(v: number | null): string {
  if (v === null) return "\u2014";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateMode = (searchParams.get("date_mode") as DateMode) || "created_at";
  const period = (searchParams.get("period") as Period) || "30d";
  const customFrom = searchParams.get("from") || "";
  const customTo = searchParams.get("to") || "";

  const initialDimFilters: DimensionFilters = {};
  for (const key of DIMENSION_KEYS) {
    const vals = searchParams.getAll(key);
    if (vals.length > 0) initialDimFilters[key] = vals;
  }

  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const [dimFilters, setDimFilters] = useState<DimensionFilters>(initialDimFilters);
  const [dimOptions, setDimOptions] = useState<Record<string, string[]>>({});
  const [filtersOpen, setFiltersOpen] = useState(() => {
    return Object.values(initialDimFilters).some((v) => v && v.length > 0);
  });

  function updateFilter(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    }
    if (params.get("period") !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    for (const key of DIMENSION_KEYS) {
      params.delete(key);
      const vals = dimFilters[key];
      if (vals) {
        for (const v of vals) params.append(key, v);
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function syncDimFiltersToUrl(newFilters: DimensionFilters) {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of DIMENSION_KEYS) {
      params.delete(key);
      const vals = newFilters[key];
      if (vals && vals.length > 0) {
        for (const v of vals) params.append(key, v);
      }
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function toggleDimValue(dim: DimensionKey, value: string) {
    setDimFilters((prev) => {
      const current = prev[dim] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      const updated = { ...prev, [dim]: next.length > 0 ? next : undefined };
      if (next.length === 0) delete updated[dim];
      syncDimFiltersToUrl(updated);
      return updated;
    });
  }

  function clearAllDimFilters() {
    setDimFilters({});
    const params = new URLSearchParams(searchParams.toString());
    for (const key of DIMENSION_KEYS) params.delete(key);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const activeDimFilterCount = Object.values(dimFilters).reduce(
    (sum, vals) => sum + (vals?.length || 0),
    0
  );

  const fetchDimensions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("date_mode", dateMode);
      params.set("period", period);
      if (period === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      }
      const res = await fetch(`/api/analytics/dimensions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDimOptions(json.dimensions || {});
      }
    } catch {}
  }, [dateMode, period, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("date_mode", dateMode);
      params.set("period", period);
      if (period === "custom") {
        if (customFrom) params.set("from", customFrom);
        if (customTo) params.set("to", customTo);
      }
      for (const key of DIMENSION_KEYS) {
        const vals = dimFilters[key];
        if (vals && vals.length > 0) {
          for (const v of vals) params.append(key, v);
        }
      }
      const res = await fetch(`/api/analytics/summary?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Failed to load analytics");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [dateMode, period, customFrom, customTo, dimFilters]);

  useEffect(() => {
    fetchDimensions();
  }, [fetchDimensions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function runAiAnalysis() {
    setAiLoading(true);
    setAiError("");
    setAiAnalysis(null);
    try {
      const body: Record<string, any> = {
        date_mode: dateMode,
        period: period,
      };
      if (period === "custom") {
        if (customFrom) body.from = customFrom;
        if (customTo) body.to = customTo;
      }
      for (const key of DIMENSION_KEYS) {
        const vals = dimFilters[key];
        if (vals && vals.length > 0) {
          body[key] = vals;
        }
      }
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setAiError(json.error || "AI analysis failed");
        return;
      }
      const json = await res.json();
      setAiAnalysis(json.analysis);
    } catch {
      setAiError("AI analysis failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground" data-testid="text-dashboard-title">
              Analytics Dashboard
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/app/import"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-import"
            >
              Import
            </Link>
            <Link
              href="/app"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-home"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter Bar */}
        <div className="rounded-md border border-border bg-card p-4 mb-4" data-testid="filter-bar">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="date-mode">
                Date Mode
              </label>
              <select
                id="date-mode"
                value={dateMode}
                onChange={(e) => updateFilter({ date_mode: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="select-date-mode"
              >
                {DATE_MODES.map((m) => (
                  <option key={m} value={m}>
                    {DATE_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="period">
                Time Period
              </label>
              <select
                id="period"
                value={period}
                onChange={(e) => updateFilter({ period: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="select-period"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {PERIOD_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            {period === "custom" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="custom-from">
                    From
                  </label>
                  <input
                    type="date"
                    id="custom-from"
                    value={customFrom}
                    onChange={(e) => updateFilter({ from: e.target.value })}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-date-from"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="custom-to">
                    To
                  </label>
                  <input
                    type="date"
                    id="custom-to"
                    value={customTo}
                    onChange={(e) => updateFilter({ to: e.target.value })}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="input-date-to"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                activeDimFilterCount > 0
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground"
              }`}
              data-testid="button-toggle-filters"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeDimFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1">
                  {activeDimFilterCount}
                </span>
              )}
              <svg className={`w-3 h-3 transition-transform ${filtersOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {data?.filter && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" data-testid="filter-meta">
              <span>
                Showing <strong className="text-foreground">{data.filter.includedCount}</strong> opportunities
              </span>
              <span>
                {data.filter.dateModeLabel}: {new Date(data.filter.dateFrom).toLocaleDateString()} &ndash; {new Date(data.filter.dateTo).toLocaleDateString()}
              </span>
              {data.filter.excludedNullCount > 0 && (
                <span>
                  ({data.filter.excludedNullCount} excluded &mdash; missing {data.filter.dateModeLabel.toLowerCase()})
                </span>
              )}
              {data.filter.activeDimensionFilters && (
                <span data-testid="text-active-dim-filters">
                  Filtered by: {data.filter.activeDimensionFilters}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dimension Filters Panel */}
        {filtersOpen && (
          <div className="rounded-md border border-border bg-card p-4 mb-8" data-testid="dimension-filters-panel">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Dimension Filters
              </h3>
              {activeDimFilterCount > 0 && (
                <button
                  onClick={clearAllDimFilters}
                  className="text-xs text-primary hover:underline"
                  data-testid="button-clear-all-filters"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {DIMENSION_KEYS.map((dim) => {
                const options = dimOptions[dim] || [];
                const selected = dimFilters[dim] || [];
                return (
                  <div key={dim} data-testid={`dim-filter-${dim}`}>
                    <p className="text-xs font-medium text-foreground mb-2">{DIMENSION_LABELS[dim]}</p>
                    {options.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No values</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {options.map((val) => {
                          const isChecked = selected.includes(val);
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-2 cursor-pointer text-xs text-foreground hover:bg-muted/40 rounded px-1 py-0.5"
                              data-testid={`dim-option-${dim}-${val}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDimValue(dim, val)}
                                className="rounded border-border text-primary focus:ring-primary/30 h-3.5 w-3.5"
                              />
                              <span className={val === UNKNOWN_VALUE ? "italic text-muted-foreground" : ""}>
                                {val}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!filtersOpen && <div className="mb-8" />}

        {loading && (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400" data-testid="text-error">
            {error}
          </div>
        )}

        {!loading && !error && data && data.totals.count === 0 && (
          <div className="text-center py-20" data-testid="empty-state">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
              <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No opportunities found</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              No data matches the selected filters. Try adjusting the date mode, time period, or dimension filters, or import opportunities from CSV.
            </p>
            <Link
              href="/app/import"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              data-testid="link-import-cta"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Opportunities
            </Link>
          </div>
        )}

        {!loading && !error && data && data.totals.count > 0 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Performance overview of your opportunities pipeline.
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="kpi-cards">
              <KpiCard
                label="Total Opportunities"
                value={String(data.totals.count)}
                sub={`${data.totals.open} open \u00B7 ${data.totals.won} won \u00B7 ${data.totals.lost} lost`}
                testId="kpi-total"
              />
              <KpiCard
                label="Win Rate"
                value={fmtPct(data.totals.winRate)}
                sub={data.totals.winRate !== null ? `${data.totals.won} won of ${data.totals.won + data.totals.lost} decided` : "No decided deals yet"}
                testId="kpi-winrate"
              />
              <KpiCard
                label="Avg Amount (Won)"
                value={fmtCurrency(data.totals.avgAmountWon)}
                sub={data.totals.avgAmountWon !== null ? `From ${data.totals.won} won deals` : "No won deals yet"}
                testId="kpi-avgamount"
              />
              <KpiCard
                label="Open Pipeline"
                value={String(data.totals.open)}
                sub="Opportunities in progress"
                testId="kpi-open"
              />
            </div>

            {/* Breakdown Tables */}
            <div className="grid gap-6 lg:grid-cols-3">
              <BreakdownTable title="By Champion Role" rows={data.byRole} testId="breakdown-role" />
              <BreakdownTable title="By Industry" rows={data.byIndustry} testId="breakdown-industry" />
              <BreakdownTable title="By Source" rows={data.bySource} testId="breakdown-source" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownTable title="By Segment" rows={data.bySegment} testId="breakdown-segment" />
              <BreakdownTable title="By Country" rows={data.byCountry} testId="breakdown-country" />
            </div>

            {/* AI Analysis Section */}
            <div className="rounded-md border border-border bg-card p-6" data-testid="ai-analysis-section">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">AI-Powered Analysis</h3>
                    <p className="text-xs text-muted-foreground">
                      Analyzing with {DATE_MODE_LABELS[dateMode]} &middot; {PERIOD_LABELS[period]}
                      {activeDimFilterCount > 0 && ` \u00B7 ${activeDimFilterCount} filter${activeDimFilterCount > 1 ? "s" : ""} active`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-ai-analyze"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-4" data-testid="text-ai-error">
                  {aiError}
                </div>
              )}

              {!aiAnalysis && !aiLoading && !aiError && (
                <p className="text-sm text-muted-foreground" data-testid="text-ai-placeholder">
                  Click the button above to generate AI-powered insights for the current filters.
                </p>
              )}

              {aiAnalysis && (
                <div className="space-y-6" data-testid="ai-results">
                  <div data-testid="ai-summary">
                    <p className="text-sm text-foreground leading-relaxed">{aiAnalysis.summary}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Key Insights</h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {aiAnalysis.insights.map((insight, i) => (
                        <div
                          key={i}
                          className={`rounded-md border px-4 py-3 ${
                            insight.type === "positive"
                              ? "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                              : insight.type === "negative"
                                ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                                : "border-border bg-muted/30"
                          }`}
                          data-testid={`ai-insight-${i}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {insight.type === "positive" && (
                              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {insight.type === "negative" && (
                              <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            )}
                            {insight.type === "neutral" && (
                              <svg className="w-3.5 h-3.5 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            <p className="text-xs font-medium text-foreground">{insight.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div data-testid="ai-recommendations">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground" data-testid={`ai-rec-${i}`}>
                          <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KpiCard({ label, value, sub, testId }: { label: string; value: string; sub: string; testId: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5" data-testid={testId}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function BreakdownTable({ title, rows, testId }: { title: string; rows: BreakdownRow[]; testId: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5" data-testid={testId}>
      <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-muted-foreground">{title.replace("By ", "")}</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Count</th>
                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Win Rate</th>
                <th className="text-right py-2 pl-2 font-medium text-muted-foreground">Avg Amt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className={`py-2 pr-3 font-medium whitespace-nowrap ${row.label === UNKNOWN_VALUE ? "text-muted-foreground italic" : "text-foreground"}`}>
                    {row.label}
                  </td>
                  <td className="py-2 px-2 text-right text-foreground">{row.count}</td>
                  <td className="py-2 px-2 text-right text-foreground">{fmtPct(row.winRate)}</td>
                  <td className="py-2 pl-2 text-right text-foreground">{fmtCurrency(row.avgAmountWon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
