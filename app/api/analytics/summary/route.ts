import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { parseDateFilterFromSearchParams, resolveDateFilter, DATE_MODE_LABELS } from "@/lib/date-filter";
import {
  parseDimensionFiltersFromSearchParams,
  applyDimensionFiltersInMemory,
  hasActiveDimensionFilters,
  describeDimensionFilters,
  UNKNOWN_VALUE,
  type DimensionFilters,
} from "@/lib/dimension-filter";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type Opportunity = {
  name: string;
  role: string;
  industry: string;
  source: string;
  segment: string | null;
  country: string | null;
  amount: number;
  outcome: string;
  closed_date: string | null;
  pipeline_accepted_date: string | null;
  created_at: string;
  industry_cluster: string | null;
  source_group: string | null;
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

function buildBreakdown(opps: Opportunity[], field: keyof Opportunity): BreakdownRow[] {
  const groups = new Map<string, Opportunity[]>();
  for (const opp of opps) {
    const rawVal = opp[field];
    const key =
      rawVal === null || rawVal === undefined || rawVal === "" ? UNKNOWN_VALUE : String(rawVal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(opp);
  }

  const rows: BreakdownRow[] = [];
  for (const [label, items] of groups) {
    const won = items.filter((o) => o.outcome === "won");
    const lost = items.filter((o) => o.outcome === "lost");
    const open = items.filter((o) => o.outcome === "open");
    const decided = won.length + lost.length;
    const winRate = decided > 0 ? won.length / decided : null;
    const avgAmountWon =
      won.length > 0
        ? won.reduce((sum, o) => sum + Number(o.amount), 0) / won.length
        : null;

    rows.push({
      label,
      count: items.length,
      won: won.length,
      lost: lost.length,
      open: open.length,
      winRate,
      avgAmountWon,
    });
  }

  return rows.sort((a, b) => b.count - a.count);
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const result = await getUserOrg();

  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const filterParams = parseDateFilterFromSearchParams(request.nextUrl.searchParams);
  const filter = resolveDateFilter(filterParams);
  const dimFilters = parseDimensionFiltersFromSearchParams(request.nextUrl.searchParams);
  const datasetId = request.nextUrl.searchParams.get("dataset") || null;

  const admin = createAdminClient();
  const orgId = result.membership.org_id;

  let baseQuery = admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);
  if (datasetId) baseQuery = baseQuery.eq("import_job_id", datasetId);

  const { count: totalWithDateCount } = await baseQuery;

  let nullQuery = admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .is(filter.dateField, null);
  if (datasetId) nullQuery = nullQuery.eq("import_job_id", datasetId);

  const { count: nullDateCount } = await nullQuery;

  let query = admin
    .from("opportunities")
    .select(
      "name, role, industry, source, segment, country, amount, outcome, closed_date, pipeline_accepted_date, created_at, industry_cluster, source_group"
    )
    .eq("org_id", orgId)
    .not(filter.dateField, "is", null)
    .gte(filter.dateField, filter.dateFrom)
    .lte(filter.dateField, filter.dateTo);

  if (datasetId) query = query.eq("import_job_id", datasetId);

  const { data: opportunities, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let opps = (opportunities || []) as Opportunity[];

  if (hasActiveDimensionFilters(dimFilters)) {
    opps = applyDimensionFiltersInMemory(opps, dimFilters);
  }

  const total = opps.length;
  const won = opps.filter((o) => o.outcome === "won");
  const lost = opps.filter((o) => o.outcome === "lost");
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? won.length / decided : null;
  const avgAmountWon =
    won.length > 0
      ? won.reduce((sum, o) => sum + Number(o.amount), 0) / won.length
      : null;

  const COVERAGE_MIN_COUNT = 5;
  const COVERAGE_MIN_PCT = 0.2;

  function computeCoverage(field: keyof Opportunity) {
    const nonNull = opps.filter(
      (o) => o[field] !== null && o[field] !== undefined && o[field] !== ""
    ).length;
    const pct = total > 0 ? nonNull / total : 0;
    return {
      nonNullCount: nonNull,
      percentage: pct,
      sufficient: nonNull >= COVERAGE_MIN_COUNT && pct >= COVERAGE_MIN_PCT,
    };
  }

  const coverage = {
    role: computeCoverage("role"),
    industry: computeCoverage("industry"),
    source: computeCoverage("source"),
    segment: computeCoverage("segment"),
    country: computeCoverage("country"),
    industry_cluster: computeCoverage("industry_cluster"),
    source_group: computeCoverage("source_group"),
  };

  return NextResponse.json({
    totals: {
      count: total,
      won: won.length,
      lost: lost.length,
      open: opps.filter((o) => o.outcome === "open").length,
      winRate,
      avgAmountWon,
    },
    // Raw dimensions
    byRole: buildBreakdown(opps, "role"),
    byIndustry: buildBreakdown(opps, "industry"),
    bySource: buildBreakdown(opps, "source"),
    bySegment: buildBreakdown(opps, "segment"),
    byCountry: buildBreakdown(opps, "country"),
    // Enriched dimensions
    byIndustryCluster: buildBreakdown(opps, "industry_cluster"),
    bySourceGroup: buildBreakdown(opps, "source_group"),
    coverage,
    filter: {
      dateMode: filter.dateField,
      dateModeLabel: DATE_MODE_LABELS[filter.dateField],
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      periodLabel: filter.periodLabel,
      includedCount: total,
      excludedNullCount: nullDateCount ?? 0,
      totalOrgCount: totalWithDateCount ?? 0,
      datasetId,
      activeDimensionFilters: hasActiveDimensionFilters(dimFilters)
        ? describeDimensionFilters(dimFilters)
        : null,
    },
  });
}