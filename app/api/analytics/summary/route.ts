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
    const key = (rawVal === null || rawVal === undefined || rawVal === "") ? UNKNOWN_VALUE : String(rawVal);
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

  const admin = createAdminClient();

  const { count: totalWithDateCount } = await admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", result.membership.org_id);

  const { count: nullDateCount } = await admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", result.membership.org_id)
    .is(filter.dateField, null);

  let query = admin
    .from("opportunities")
    .select("name, role, industry, source, segment, country, amount, outcome, closed_date, pipeline_accepted_date, created_at")
    .eq("org_id", result.membership.org_id)
    .not(filter.dateField, "is", null)
    .gte(filter.dateField, filter.dateFrom)
    .lte(filter.dateField, filter.dateTo);

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

  return NextResponse.json({
    totals: {
      count: total,
      won: won.length,
      lost: lost.length,
      open: opps.filter((o) => o.outcome === "open").length,
      winRate,
      avgAmountWon,
    },
    byRole: buildBreakdown(opps, "role"),
    byIndustry: buildBreakdown(opps, "industry"),
    bySource: buildBreakdown(opps, "source"),
    bySegment: buildBreakdown(opps, "segment"),
    byCountry: buildBreakdown(opps, "country"),
    filter: {
      dateMode: filter.dateField,
      dateModeLabel: DATE_MODE_LABELS[filter.dateField],
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
      periodLabel: filter.periodLabel,
      includedCount: total,
      excludedNullCount: nullDateCount ?? 0,
      totalOrgCount: totalWithDateCount ?? 0,
      activeDimensionFilters: hasActiveDimensionFilters(dimFilters)
        ? describeDimensionFilters(dimFilters)
        : null,
    },
  });
}
