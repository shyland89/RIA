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

type CoverageInfo = {
  nonNullCount: number;
  percentage: number;
  sufficient: boolean;
};

type CoverageData = {
  role: CoverageInfo;
  industry: CoverageInfo;
  source: CoverageInfo;
  segment: CoverageInfo;
  country: CoverageInfo;
};

type SummaryData = {
  totals: Totals;
  byRole: BreakdownRow[];
  byIndustry: BreakdownRow[];
  bySource: BreakdownRow[];
  bySegment: BreakdownRow[];
  byCountry: BreakdownRow[];
  coverage?: CoverageData;
  filter: FilterMeta;
};

type AiInsight = {
  title: string;
  description: string;
  type: "strength" | "risk" | "pattern";
};

type AiStageSection = {
  headline: string;
  insights: AiInsight[];
};

type AiAnalysis = {
  summary: string;
  openPipeline: AiStageSection;
  closedWon: AiStageSection;
  closedLost: AiStageSection;
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

type DatasetOption = {
  id: string;
  filename: string;
  inserted_count: number;
  created_at: string;
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateMode = (searchParams.get("date_mode") as DateMode) || "created_at";
  const period = (searchParams.get("period") as Period) || "30d";
  const customFrom = searchParams.get("from") || "";
  const customTo = searchParams.get("to") || "";
  const datasetParam = searchParams.get("dataset") || "";

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
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [selectedDataset, setSelectedDataset] = useState(datasetParam);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await fetch("/api/import/jobs");
        if (res.ok) {
          const json = await res.json();
          const activeCompleted = (json.jobs || [])
            .filter((j: any) => j.is_active && j.status === "completed" && j.inserted_count > 0)
            .map((j: any) => ({
              id: j.id,
              filename: j.filename,
              inserted_count: j.inserted_count,
              created_at: j.created_at,
            }));
          setDatasets(activeCompleted);
        }
      } catch {}
    }
    loadDatasets();
  }, []);

  function handleDatasetChange(newDataset: string) {
    setSelectedDataset(newDataset);
    const params = new URLSearchParams(searchParams.toString());
    if (newDataset) {
      params.set("dataset", newDataset);
    } else {
      params.delete("dataset");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }

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
    if (selectedDataset) {
      params.set("dataset", selectedDataset);
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
      if (selectedDataset) params.set("dataset", selectedDataset);
      const res = await fetch(`/api/analytics/dimensions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setDimOptions(json.dimensions || {});
      }
    } catch {}
  }, [dateMode, period, customFrom, customTo, selectedDataset]);

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
      if (selectedDataset) params.set("dataset", selectedDataset);
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
  }, [dateMode, period, customFrom, customTo, dimFilters, selectedDataset]);

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
      if (selectedDataset) body.dataset = selectedDataset;
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
      {/* Page header — no inner nav links, sidebar handles navigation */}
      <header
        className="sticky top-0 z-10 border-b border-border bg-background/95"
        style={{ backdropFilter: "blur(8px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="inline-flex items-center justify-center w-7 h-7"
              style={{
                background: "var(--teal-50)",
                borderRadius: "6px",
                border: "1px solid var(--teal-200)",
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--teal-600)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-foreground" data-testid="text-dashboard-title">
              Analytics
            </span>
          </div>
          {data && (
            <span className="text-[12px] text-muted-foreground">
              {data.filter.includedCount} opportunities · {data.filter.dateFrom} – {data.filter.dateTo}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter Bar */}
        <div
          className="rounded-lg border border-border bg-card p-4 mb-6"
          style={{ boxShadow: "var(--shadow-xs)" }}
          data-testid="filter-bar"
        >
          <div className="flex flex-wrap items-end gap-3">
            {datasets.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide" htmlFor="dataset-select">
                  Dataset
                </label>
                <select
                  id="dataset-select"
                  value={selectedDataset}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 h-8"
                  data-testid="select-dataset"
                >
                  <option value="">All Data</option>
                  {datasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.filename} ({ds.inserted_count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Date Mode
              </label>
              <select
                value={dateMode}
                onChange={(e) => updateFilter({ date_mode: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 h-8"
                data-testid="select-date-mode"
              >
                {DATE_MODES.map((m) => (
                  <option key={m} value={m}>{DATE_MODE_LABELS[m]}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Time Period
              </label>
              <select
                value={period}
                onChange={(e) => updateFilter({ period: e.target.value })}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 h-8"
                data-testid="select-period"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
                ))}
              </select>
            </div>

            {period === "custom" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => updateFilter({ from: e.target.value })}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 h-8"
                    data-testid="input-from"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => updateFilter({ to: e.target.value })}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 h-8"
                    data-testid="input-to"
                  />
                </div>
              </>
            )}

            <div className="ml-auto flex items-end">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[13px] font-medium text-foreground h-8 transition-colors hover:bg-muted"
                data-testid="button-filters"
              >
                <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                Filters
                {activeDimFilterCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white"
                    style={{ background: "var(--teal-600)" }}
                  >
                    {activeDimFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Dimension Filters Panel */}
          {filtersOpen && (
            <div className="mt-4 pt-4 border-t border-border" data-testid="dim-filters">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Dimension Filters
                </span>
                {activeDimFilterCount > 0 && (
                  <button
                    onClick={clearAllDimFilters}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-clear-filters"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {DIMENSION_KEYS.map((dim) => {
                  const opts = dimOptions[dim] || [];
                  if (opts.length === 0) return null;
                  return (
                    <div key={dim}>
                      <div className="text-[11px] font-medium text-muted-foreground mb-1.5">
                        {DIMENSION_LABELS[dim]}
                      </div>
                      <div className="flex flex-col gap-1">
                        {opts.map((val) => {
                          const checked = dimFilters[dim]?.includes(val) ?? false;
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-2 cursor-pointer group"
                              data-testid={`filter-${dim}-${val}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDimValue(dim, val)}
                                className="w-3.5 h-3.5 rounded accent-primary"
                              />
                              <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                {val}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!filtersOpen && <div className="mb-2" />}

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
          <div
            className="rounded-md px-4 py-3 text-[13px] mb-4"
            style={{
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              color: "var(--error)",
            }}
            data-testid="text-error"
          >
            {error}
          </div>
        )}

        {!loading && !error && data && data.totals.count === 0 && (
          <div className="text-center py-20" data-testid="empty-state">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
              style={{ background: "var(--zinc-100)" }}
            >
              <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-[16px] font-semibold text-foreground mb-1">No opportunities found</h2>
            <p className="text-[13px] text-muted-foreground mb-6 max-w-md mx-auto">
              No data matches the selected filters. Try adjusting the date mode, time period, or dimension filters, or import opportunities from CSV.
            </p>
            <Link
              href="/app/import"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground"
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

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="kpi-cards">
              <KpiCard
                label="Total Opportunities"
                value={String(data.totals.count)}
                sub={`${data.totals.open} open · ${data.totals.won} won · ${data.totals.lost} lost`}
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
            {(() => {
              const c = data.coverage;
              const breakdowns = [
                { title: "By Champion Role", rows: data.byRole, testId: "breakdown-role", dim: "role" as const, label: "champion role" },
                { title: "By Industry", rows: data.byIndustry, testId: "breakdown-industry", dim: "industry" as const, label: "industry" },
                { title: "By Source", rows: data.bySource, testId: "breakdown-source", dim: "source" as const, label: "source" },
                { title: "By Segment", rows: data.bySegment, testId: "breakdown-segment", dim: "segment" as const, label: "segment" },
                { title: "By Country", rows: data.byCountry, testId: "breakdown-country", dim: "country" as const, label: "country" },
              ];
              const visible = breakdowns.filter((b) => !c || c[b.dim]?.sufficient !== false);
              const hidden = breakdowns.filter((b) => c && c[b.dim]?.sufficient === false);

              // Fixed layout: Role + Industry side by side, Source full width, Segment + Country side by side
              const role = visible.find((b) => b.dim === "role");
              const industry = visible.find((b) => b.dim === "industry");
              const source = visible.find((b) => b.dim === "source");
              const segment = visible.find((b) => b.dim === "segment");
              const country = visible.find((b) => b.dim === "country");

              return (
                <>
                  {/* Row 1: Role + Industry + Source - 3 columns */}
                  {(role || industry || source) && (
                    <div className="grid gap-5 lg:grid-cols-3">
                      {role && <BreakdownTable title={role.title} rows={role.rows} testId={role.testId} />}
                      {industry && <BreakdownTable title={industry.title} rows={industry.rows} testId={industry.testId} />}
                      {source && <BreakdownTable title={source.title} rows={source.rows} testId={source.testId} />}
                    </div>
                  )}

                  {/* Row 2: Segment + Country */}
                  {(segment || country) && (
                    <div className={`grid gap-5 ${segment && country ? "lg:grid-cols-2" : ""}`}>
                      {segment && <BreakdownTable title={segment.title} rows={segment.rows} testId={segment.testId} />}
                      {country && <BreakdownTable title={country.title} rows={country.rows} testId={country.testId} />}
                    </div>
                  )}

                  {hidden.length > 0 && (
                    <div
                      className="rounded-md px-4 py-3"
                      style={{ background: "var(--zinc-100)", border: "1px solid var(--zinc-200)" }}
                      data-testid="hidden-breakdowns-note"
                    >
                      <p className="text-[12px] text-muted-foreground">
                        {hidden.map((b) => b.title).join(", ")} breakdown{hidden.length > 1 ? "s" : ""} hidden:{" "}
                        {hidden.map((b) => `${b.label} not provided in this dataset`).join("; ")}.
                      </p>
                    </div>
                  )}
                </>
              );
            })()}

            {/* AI Analysis Section */}
            <div
              className="rounded-lg border border-border bg-card"
              style={{ boxShadow: "var(--shadow-sm)" }}
              data-testid="ai-analysis-section"
            >
              {/* AI Section Header */}
              <div
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex items-center justify-center w-7 h-7 shrink-0"
                    style={{
                      background: "var(--teal-50)",
                      borderRadius: "6px",
                      border: "1px solid var(--teal-200)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--teal-600)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-foreground">AI-Powered Analysis</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {DATE_MODE_LABELS[dateMode]} · {PERIOD_LABELS[period]}
                      {activeDimFilterCount > 0 && ` · ${activeDimFilterCount} filter${activeDimFilterCount > 1 ? "s" : ""} active`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: "var(--teal-600)" }}
                  data-testid="button-ai-analyze"
                >
                  {aiLoading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              {/* AI Content */}
              <div className="p-5">
                {aiError && (
                  <div
                    className="rounded-md px-4 py-3 text-[13px] mb-4"
                    style={{
                      background: "var(--error-bg)",
                      border: "1px solid var(--error-border)",
                      color: "var(--error)",
                    }}
                    data-testid="text-ai-error"
                  >
                    {aiError}
                  </div>
                )}

                {!aiAnalysis && !aiLoading && !aiError && (
                  <p className="text-[13px] text-muted-foreground" data-testid="text-ai-placeholder">
                    Click the button above to generate AI-powered insights for the current filters.
                  </p>
                )}

                {aiAnalysis && (
                  <div className="space-y-5" data-testid="ai-results">
                    {/* Summary */}
                    <div
                      className="rounded-md px-4 py-3"
                      style={{ background: "var(--zinc-50)", border: "1px solid var(--zinc-200)" }}
                      data-testid="ai-summary"
                    >
                      <p className="text-[13px] text-foreground leading-relaxed">{aiAnalysis.summary}</p>
                    </div>

                    {/* Stage Sections */}
                    <div className="space-y-4">
                      <AiStageCard
                        title="Open Pipeline"
                        section={aiAnalysis.openPipeline}
                        variant="blue"
                        icon={
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        testId="ai-stage-open"
                      />
                      <AiStageCard
                        title="Closed Won"
                        section={aiAnalysis.closedWon}
                        variant="green"
                        icon={
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        testId="ai-stage-won"
                      />
                      <AiStageCard
                        title="Closed Lost"
                        section={aiAnalysis.closedLost}
                        variant="red"
                        icon={
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        }
                        testId="ai-stage-lost"
                      />
                    </div>

                    {/* Recommendations */}
                    <div data-testid="ai-recommendations">
                      <h4
                        className="text-[11px] font-semibold uppercase tracking-wide mb-3"
                        style={{ color: "var(--zinc-500)" }}
                      >
                        Recommendations
                      </h4>
                      <div className="space-y-2 max-w-2xl mx-auto">
                        {aiAnalysis.recommendations.map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-md px-4 py-3"
                            style={{
                              background: "var(--zinc-50)",
                              border: "1px solid var(--zinc-200)",
                            }}
                            data-testid={`ai-rec-${i}`}
                          >
                            <span
                              className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold text-white shrink-0 mt-0.5"
                              style={{ background: "var(--teal-600)", lineHeight: "1" }}
                            >
                              {i + 1}
                            </span>
                            <p className="text-[13px] text-foreground leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Stage Section Card ─── */

const STAGE_VARIANTS = {
  blue: {
    headerBg: "#EFF6FF",
    headerBorder: "#BFDBFE",
    iconBg: "#DBEAFE",
    iconColor: "#2563EB",
    titleColor: "#1E3A8A",
    headlineColor: "#1D4ED8",
  },
  green: {
    headerBg: "var(--success-bg)",
    headerBorder: "var(--success-border)",
    iconBg: "#DCFCE7",
    iconColor: "#16A34A",
    titleColor: "#14532D",
    headlineColor: "#15803D",
  },
  red: {
    headerBg: "var(--error-bg)",
    headerBorder: "var(--error-border)",
    iconBg: "#FEE2E2",
    iconColor: "#DC2626",
    titleColor: "#7F1D1D",
    headlineColor: "#B91C1C",
  },
};

const INSIGHT_VARIANTS = {
  strength: {
    dot: "var(--insight-strength)",
    label: "STRENGTH",
    labelColor: "var(--insight-strength)",
    bg: "var(--insight-strength-bg)",
    border: "var(--insight-strength-border)",
  },
  risk: {
    dot: "var(--insight-risk)",
    label: "RISK",
    labelColor: "var(--insight-risk)",
    bg: "var(--insight-risk-bg)",
    border: "var(--insight-risk-border)",
  },
  pattern: {
    dot: "var(--insight-pattern)",
    label: "PATTERN",
    labelColor: "var(--insight-pattern)",
    bg: "var(--insight-pattern-bg)",
    border: "var(--insight-pattern-border)",
  },
};

function AiStageCard({
  title,
  section,
  variant,
  icon,
  testId,
}: {
  title: string;
  section: AiStageSection;
  variant: "blue" | "green" | "red";
  icon: React.ReactNode;
  testId: string;
}) {
  const v = STAGE_VARIANTS[variant];

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${v.headerBorder}` }}
      data-testid={testId}
    >
      {/* Section Header */}
      <div
        className="px-4 py-3"
        style={{ background: v.headerBg, borderBottom: `1px solid ${v.headerBorder}` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0"
            style={{ background: v.iconBg, color: v.iconColor }}
          >
            {icon}
          </div>
          <h4 className="text-[13px] font-semibold" style={{ color: v.titleColor }}>{title}</h4>
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: v.headlineColor }}>{section.headline}</p>
      </div>

      {/* Insights */}
      {section.insights.length > 0 ? (
        <div className="bg-card">
          {section.insights.map((insight, i) => {
            const s = INSIGHT_VARIANTS[insight.type] || INSIGHT_VARIANTS.pattern;
            return (
              <div
                key={i}
                className="px-4 py-3 flex gap-3"
                style={{
                  borderBottom: i < section.insights.length - 1 ? "1px solid var(--border)" : "none",
                }}
                data-testid={`${testId}-insight-${i}`}
              >
                {/* Type indicator dot */}
                <div className="pt-1 shrink-0">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ background: s.dot }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-bold tracking-wider"
                      style={{ color: s.labelColor }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-foreground leading-snug">{insight.title}</p>
                  <p className="text-[12px] text-muted-foreground leading-relaxed mt-0.5">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-3 bg-card">
          <p className="text-[12px] text-muted-foreground">No deals in this stage for the selected filters.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Shared Components ─── */

function KpiCard({
  label,
  value,
  sub,
  testId,
}: {
  label: string;
  value: string;
  sub: string;
  testId: string;
}) {
  return (
    <div
      className="rounded-lg bg-card p-5"
      style={{
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
      }}
      data-testid={testId}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--zinc-400)" }}
      >
        {label}
      </p>
      <p
        className="text-[28px] font-semibold tracking-tight mt-2 leading-none"
        style={{
          color: "var(--zinc-900)",
          letterSpacing: "-0.5px",
        }}
      >
        {value}
      </p>
      <p className="text-[12px] text-muted-foreground mt-2">{sub}</p>
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
                  <td className={`py-2 pr-3 font-medium ${row.label === UNKNOWN_VALUE ? "text-muted-foreground italic" : "text-foreground"}`}>
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