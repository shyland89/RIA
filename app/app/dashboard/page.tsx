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
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--stone-50)" }}>
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-full"
            style={{ background: "var(--teal-50)" }}
          >
            <svg className="w-5 h-5 animate-spin" style={{ color: "var(--teal-600)" }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      }
    >
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

  const selectStyle = {
    border: "1px solid var(--stone-200)",
    borderRadius: "var(--radius-sm, 6px)",
    color: "var(--stone-700)",
    background: "var(--stone-50)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--stone-50)" }}>
      <main style={{ padding: "28px 40px 60px" }}>
        {/* Filter Bar */}
        <div
          className="bg-white p-4 mb-4"
          style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-lg, 14px)" }}
          data-testid="filter-bar"
        >
          <div className="flex flex-wrap items-center gap-3">
            {datasets.length > 0 && (
              <>
                <span className="text-xs font-semibold uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}>
                  Dataset
                </span>
                <select
                  id="dataset-select"
                  value={selectedDataset}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  className="px-3 py-[7px] text-[13px] font-medium appearance-none cursor-pointer focus:outline-none"
                  style={selectStyle}
                  data-testid="select-dataset"
                >
                  <option value="">All Data</option>
                  {datasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.filename} ({ds.inserted_count} rows)
                    </option>
                  ))}
                </select>
                <div className="w-px h-6" style={{ background: "var(--stone-200)" }} />
              </>
            )}

            <span className="text-xs font-semibold uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}>
              Date Mode
            </span>
            <select
              id="date-mode"
              value={dateMode}
              onChange={(e) => updateFilter({ date_mode: e.target.value })}
              className="px-3 py-[7px] text-[13px] font-medium appearance-none cursor-pointer focus:outline-none"
              style={selectStyle}
              data-testid="select-date-mode"
            >
              {DATE_MODES.map((m) => (
                <option key={m} value={m}>
                  {DATE_MODE_LABELS[m]}
                </option>
              ))}
            </select>

            <div className="w-px h-6" style={{ background: "var(--stone-200)" }} />

            <span className="text-xs font-semibold uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.4px" }}>
              Period
            </span>
            <select
              id="period"
              value={period}
              onChange={(e) => updateFilter({ period: e.target.value })}
              className="px-3 py-[7px] text-[13px] font-medium appearance-none cursor-pointer focus:outline-none"
              style={selectStyle}
              data-testid="select-period"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </option>
              ))}
            </select>

            {period === "custom" && (
              <>
                <input
                  type="date"
                  id="custom-from"
                  value={customFrom}
                  onChange={(e) => updateFilter({ from: e.target.value })}
                  className="px-3 py-[7px] text-[13px] font-medium focus:outline-none"
                  style={selectStyle}
                  data-testid="input-date-from"
                />
                <span className="text-[13px]" style={{ color: "var(--stone-400)" }}>&mdash;</span>
                <input
                  type="date"
                  id="custom-to"
                  value={customTo}
                  onChange={(e) => updateFilter({ to: e.target.value })}
                  className="px-3 py-[7px] text-[13px] font-medium focus:outline-none"
                  style={selectStyle}
                  data-testid="input-date-to"
                />
              </>
            )}

            <div className="flex-1" />

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-[7px] text-[13px] font-medium cursor-pointer transition-colors"
              style={{
                background: activeDimFilterCount > 0 ? "var(--teal-50)" : "#fff",
                color: activeDimFilterCount > 0 ? "var(--teal-700)" : "var(--stone-600)",
                border: activeDimFilterCount > 0 ? "1px solid var(--teal-200)" : "1px solid var(--stone-200)",
                borderRadius: "var(--radius-sm, 6px)",
              }}
              data-testid="button-toggle-filters"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
              {activeDimFilterCount > 0 && (
                <span
                  className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[10px] font-bold text-white"
                  style={{ background: "var(--teal-600)" }}
                >
                  {activeDimFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Dimension Filters */}
          {filtersOpen && (
            <div className="flex flex-wrap gap-6 pt-4 mt-4" style={{ borderTop: "1px solid var(--stone-100)" }} data-testid="dimension-filters-panel">
              {DIMENSION_KEYS.map((dim) => {
                const options = dimOptions[dim] || [];
                const selected = dimFilters[dim] || [];
                return (
                  <div key={dim} data-testid={`dim-filter-${dim}`}>
                    <p className="text-[11px] font-semibold uppercase mb-2" style={{ color: "var(--stone-500)", letterSpacing: "0.5px" }}>
                      {DIMENSION_LABELS[dim]}
                    </p>
                    {options.length === 0 ? (
                      <p className="text-xs" style={{ color: "var(--stone-400)" }}>No values</p>
                    ) : (
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {options.map((val) => {
                          const isChecked = selected.includes(val);
                          return (
                            <label
                              key={val}
                              className="flex items-center gap-1.5 cursor-pointer text-[13px] px-1 py-0.5 rounded"
                              style={{ color: "var(--stone-600)" }}
                              data-testid={`dim-option-${dim}-${val}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleDimValue(dim, val)}
                                className="h-3.5 w-3.5"
                                style={{ accentColor: "var(--teal-600)" }}
                              />
                              <span className={val === UNKNOWN_VALUE ? "italic" : ""} style={val === UNKNOWN_VALUE ? { color: "var(--stone-400)" } : undefined}>
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
              {activeDimFilterCount > 0 && (
                <div className="flex items-end">
                  <button
                    onClick={clearAllDimFilters}
                    className="text-xs font-medium"
                    style={{ color: "var(--teal-600)" }}
                    data-testid="button-clear-all-filters"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results bar */}
        {data?.filter && (
          <div
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] mb-5"
            style={{ color: "var(--stone-500)" }}
            data-testid="filter-meta"
          >
            <span>
              Showing <strong style={{ color: "var(--stone-800)" }}>{data.filter.includedCount}</strong> opportunities
            </span>
            <span>
              {data.filter.dateModeLabel}: {new Date(data.filter.dateFrom).toLocaleDateString()} &ndash; {new Date(data.filter.dateTo).toLocaleDateString()}
            </span>
            {data.filter.excludedNullCount > 0 && (
              <span>
                ({data.filter.excludedNullCount} excluded &mdash; missing {data.filter.dateModeLabel.toLowerCase()})
              </span>
            )}
            {selectedDataset && datasets.length > 0 && (
              <span data-testid="text-active-dataset">
                Dataset: {datasets.find((d) => d.id === selectedDataset)?.filename || "Selected"}
              </span>
            )}
            {data.filter.activeDimensionFilters && (
              <span data-testid="text-active-dim-filters">
                Filtered by: {data.filter.activeDimensionFilters}
              </span>
            )}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "var(--teal-50)" }}>
              <svg className="w-5 h-5 animate-spin" style={{ color: "var(--teal-600)" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        )}

        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{
              border: "1px solid #fca5a5",
              background: "var(--error-bg)",
              color: "var(--error)",
              borderRadius: "var(--radius-md, 10px)",
            }}
            data-testid="text-error"
          >
            {error}
          </div>
        )}

        {!loading && !error && data && data.totals.count === 0 && (
          <div className="text-center py-20" data-testid="empty-state">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ background: "var(--stone-100)" }}
            >
              <svg className="w-7 h-7" style={{ color: "var(--stone-400)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--stone-900)" }}>No opportunities found</h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: "var(--stone-500)" }}>
              No data matches the selected filters. Try adjusting the date mode, time period, or dimension filters, or import opportunities from CSV.
            </p>
            <Link
              href="/app/import"
              className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white"
              style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }}
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
          <div className="space-y-6">
            <div>
              <h1
                className="text-[22px] font-bold tracking-tight"
                style={{ color: "var(--stone-900)", letterSpacing: "-0.3px" }}
              >
                Analytics
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--stone-500)" }}>
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
                highlight
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
              const topRow = visible.slice(0, 3);
              const bottomRow = visible.slice(3);
              return (
                <>
                  {topRow.length > 0 && (
                    <div className={`grid gap-4 ${topRow.length === 1 ? "" : topRow.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
                      {topRow.map((b) => (
                        <BreakdownTable key={b.testId} title={b.title} rows={b.rows} testId={b.testId} />
                      ))}
                    </div>
                  )}
                  {bottomRow.length > 0 && (
                    <div className={`grid gap-4 ${bottomRow.length === 1 ? "" : "lg:grid-cols-2"}`}>
                      {bottomRow.map((b) => (
                        <BreakdownTable key={b.testId} title={b.title} rows={b.rows} testId={b.testId} />
                      ))}
                    </div>
                  )}
                  {hidden.length > 0 && (
                    <div
                      className="p-4"
                      style={{ background: "var(--stone-50)", border: "1px solid var(--stone-200)", borderRadius: "var(--radius-md, 10px)" }}
                      data-testid="hidden-breakdowns-note"
                    >
                      <p className="text-xs" style={{ color: "var(--stone-500)" }}>
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
              className="bg-white p-6"
              style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-lg, 14px)" }}
              data-testid="ai-analysis-section"
            >
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="inline-flex items-center justify-center w-8 h-8"
                    style={{ background: "var(--teal-50)", borderRadius: "var(--radius-sm, 6px)" }}
                  >
                    <svg className="w-4 h-4" style={{ color: "var(--teal-600)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>AI-Powered Analysis</h3>
                    <p className="text-xs" style={{ color: "var(--stone-500)" }}>
                      Analyzing with {DATE_MODE_LABELS[dateMode]} &middot; {PERIOD_LABELS[period]}
                      {activeDimFilterCount > 0 && ` \u00B7 ${activeDimFilterCount} filter${activeDimFilterCount > 1 ? "s" : ""} active`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={runAiAnalysis}
                  disabled={aiLoading}
                  className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }}
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
                <div
                  className="px-4 py-3 text-sm mb-4"
                  style={{ border: "1px solid #fca5a5", background: "var(--error-bg)", color: "var(--error)", borderRadius: "var(--radius-md, 10px)" }}
                  data-testid="text-ai-error"
                >
                  {aiError}
                </div>
              )}

              {!aiAnalysis && !aiLoading && !aiError && (
                <p className="text-sm" style={{ color: "var(--stone-500)" }} data-testid="text-ai-placeholder">
                  Click the button above to generate AI-powered insights for the current filters.
                </p>
              )}

              {aiAnalysis && (
                <div className="space-y-6" data-testid="ai-results">
                  <div data-testid="ai-summary">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--stone-700)" }}>{aiAnalysis.summary}</p>
                  </div>

                  <div>
                    <h4
                      className="text-[11px] font-semibold uppercase mb-3"
                      style={{ color: "var(--stone-400)", letterSpacing: "0.6px" }}
                    >
                      Key Insights
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {aiAnalysis.insights.map((insight, i) => (
                        <div
                          key={i}
                          className="bg-white"
                          style={{
                            border: "1px solid var(--stone-200)",
                            borderRadius: "var(--radius-md, 10px)",
                            padding: "20px 24px",
                            borderLeft: insight.type === "positive"
                              ? "3px solid var(--success)"
                              : insight.type === "negative"
                                ? "3px solid var(--error)"
                                : "3px solid var(--teal-500)",
                          }}
                          data-testid={`ai-insight-${i}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="text-[10px] font-bold uppercase"
                              style={{
                                letterSpacing: "0.5px",
                                color: insight.type === "positive"
                                  ? "var(--success)"
                                  : insight.type === "negative"
                                    ? "var(--error)"
                                    : "var(--teal-600)",
                              }}
                            >
                              {insight.type === "positive" ? "Strength" : insight.type === "negative" ? "Risk" : "Pattern"}
                            </span>
                          </div>
                          <p className="text-sm font-bold mb-1" style={{ color: "var(--stone-900)" }}>{insight.title}</p>
                          <p className="text-[13px] leading-relaxed" style={{ color: "var(--stone-500)" }}>{insight.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div data-testid="ai-recommendations">
                    <h4
                      className="text-[11px] font-semibold uppercase mb-3"
                      style={{ color: "var(--stone-400)", letterSpacing: "0.6px" }}
                    >
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {aiAnalysis.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="bg-white flex gap-4 items-start"
                          style={{
                            border: "1px solid var(--stone-200)",
                            borderRadius: "var(--radius-md, 10px)",
                            padding: "20px 24px",
                          }}
                          data-testid={`ai-rec-${i}`}
                        >
                          <div
                            className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shrink-0 mt-0.5"
                            style={{
                              background: "var(--teal-50)",
                              color: "var(--teal-700)",
                              border: "1px solid var(--teal-200)",
                            }}
                          >
                            {i + 1}
                          </div>
                          <p className="text-[13px] leading-relaxed" style={{ color: "var(--stone-700)" }}>{rec}</p>
                        </div>
                      ))}
                    </div>
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

function KpiCard({
  label,
  value,
  sub,
  testId,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  testId: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="bg-white"
      style={{
        border: highlight ? "1px solid var(--teal-200)" : "1px solid var(--stone-200)",
        borderRadius: "var(--radius-md, 10px)",
        padding: "20px 24px",
        background: highlight ? "linear-gradient(135deg, #fff 60%, var(--teal-50))" : "#fff",
      }}
      data-testid={testId}
    >
      <p
        className="text-xs font-semibold uppercase"
        style={{ color: "var(--stone-500)", letterSpacing: "0.4px", marginBottom: "8px" }}
      >
        {label}
      </p>
      <p
        className="text-[32px] font-bold leading-tight"
        style={{ color: highlight ? "var(--teal-700)" : "var(--stone-900)", letterSpacing: "-1px" }}
      >
        {value}
      </p>
      <p className="text-xs font-medium mt-1.5" style={{ color: "var(--stone-400)" }}>
        {sub}
      </p>
    </div>
  );
}

function BreakdownTable({ title, rows, testId }: { title: string; rows: BreakdownRow[]; testId: string }) {
  return (
    <div
      className="bg-white p-6"
      style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-lg, 14px)" }}
      data-testid={testId}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--stone-800)" }}>{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--stone-400)" }}>No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--stone-200)" }}>
                <th className="text-left py-2.5 pr-3 font-semibold text-[11px] uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.5px", background: "var(--stone-50)" }}>
                  {title.replace("By ", "")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[11px] uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.5px", background: "var(--stone-50)" }}>Count</th>
                <th className="text-right py-2.5 px-2 font-semibold text-[11px] uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.5px", background: "var(--stone-50)" }}>Win Rate</th>
                <th className="text-right py-2.5 pl-2 font-semibold text-[11px] uppercase" style={{ color: "var(--stone-500)", letterSpacing: "0.5px", background: "var(--stone-50)" }}>Avg Amt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} style={{ borderBottom: "1px solid var(--stone-100)" }}>
                  <td
                    className="py-2.5 pr-3 font-medium whitespace-nowrap"
                    style={{
                      color: row.label === UNKNOWN_VALUE ? "var(--stone-400)" : "var(--stone-700)",
                      fontStyle: row.label === UNKNOWN_VALUE ? "italic" : "normal",
                    }}
                  >
                    {row.label}
                  </td>
                  <td className="py-2.5 px-2 text-right" style={{ color: "var(--stone-700)" }}>{row.count}</td>
                  <td className="py-2.5 px-2 text-right" style={{ color: "var(--stone-700)" }}>{fmtPct(row.winRate)}</td>
                  <td className="py-2.5 pl-2 text-right" style={{ color: "var(--stone-700)" }}>{fmtCurrency(row.avgAmountWon)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
