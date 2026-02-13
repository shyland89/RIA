import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { resolveDateFilter, DATE_MODE_LABELS, type DateFilterParams, type DateMode, type Period, DATE_MODES, PERIODS } from "@/lib/date-filter";
import {
  parseDimensionFiltersFromBody,
  applyDimensionFiltersInMemory,
  hasActiveDimensionFilters,
  describeDimensionFilters,
  UNKNOWN_VALUE,
} from "@/lib/dimension-filter";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

type Opportunity = {
  name: string;
  role: string;
  industry: string;
  source: string;
  segment: string | null;
  country: string | null;
  amount: number;
  outcome: string;
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

function buildBreakdown(
  opps: Opportunity[],
  field: keyof Opportunity
): BreakdownRow[] {
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

export async function POST(request: Request) {
  const result = await getUserOrg();

  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const filterParams: DateFilterParams = {
    dateMode: (DATE_MODES.includes(body.date_mode) ? body.date_mode : "created_at") as DateMode,
    period: (PERIODS.includes(body.period) ? body.period : "30d") as Period,
    from: body.from,
    to: body.to,
  };

  const filter = resolveDateFilter(filterParams);
  const dimFilters = parseDimensionFiltersFromBody(body);
  const datasetId = body.dataset || null;
  const admin = createAdminClient();

  let query = admin
    .from("opportunities")
    .select("name, role, industry, source, segment, country, amount, outcome")
    .eq("org_id", result.membership.org_id)
    .not(filter.dateField, "is", null)
    .gte(filter.dateField, filter.dateFrom)
    .lte(filter.dateField, filter.dateTo);

  if (datasetId) query = query.eq("import_job_id", datasetId);

  const { data: opportunities, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let opps = (opportunities || []) as Opportunity[];

  let nullQuery = admin
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("org_id", result.membership.org_id)
    .is(filter.dateField, null);
  if (datasetId) nullQuery = nullQuery.eq("import_job_id", datasetId);

  const { count: nullDateCount } = await nullQuery;

  const hasDimFilters = hasActiveDimensionFilters(dimFilters);
  if (hasDimFilters) {
    opps = applyDimensionFiltersInMemory(opps, dimFilters);
  }

  if (opps.length === 0) {
    return NextResponse.json(
      { error: "No opportunities found for the selected filters. Try adjusting the date range or dimension filters, or import data first." },
      { status: 400 }
    );
  }

  const total = opps.length;
  const won = opps.filter((o) => o.outcome === "won");
  const lost = opps.filter((o) => o.outcome === "lost");
  const openCount = opps.filter((o) => o.outcome === "open").length;
  const decided = won.length + lost.length;
  const winRate = decided > 0 ? won.length / decided : null;
  const avgAmountWon =
    won.length > 0
      ? won.reduce((sum, o) => sum + Number(o.amount), 0) / won.length
      : null;

  const analyticsPayload = {
    totals: {
      count: total,
      won: won.length,
      lost: lost.length,
      open: openCount,
      winRate,
      avgAmountWon,
    },
    byRole: buildBreakdown(opps, "role"),
    byIndustry: buildBreakdown(opps, "industry"),
    bySource: buildBreakdown(opps, "source"),
    bySegment: buildBreakdown(opps, "segment"),
    byCountry: buildBreakdown(opps, "country"),
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const dateModeLabel = DATE_MODE_LABELS[filter.dateField];
  const dimFilterDesc = hasDimFilters ? describeDimensionFilters(dimFilters) : null;

  let dateContext = `Date Mode: ${dateModeLabel}\nTime Window: ${filter.periodLabel} (${new Date(filter.dateFrom).toLocaleDateString()} to ${new Date(filter.dateTo).toLocaleDateString()})\nOpportunities analyzed: ${total}\nExcluded (missing ${dateModeLabel}): ${nullDateCount ?? 0}`;

  if (datasetId) {
    dateContext += `\nDataset: Import job ${datasetId}`;
  }

  if (dimFilterDesc) {
    dateContext += `\nActive Dimension Filters: ${dimFilterDesc}`;
  }

  const filterMentionRule = dimFilterDesc
    ? `- Your summary MUST mention: the date mode (${dateModeLabel}), the time window (${filter.periodLabel}), the number of opportunities (${total}), and the active dimension filters (${dimFilterDesc})`
    : `- Your summary MUST mention: the date mode (${dateModeLabel}), the time window (${filter.periodLabel}), and the number of opportunities (${total})`;

  const systemPrompt = `You are a senior sales analytics consultant. You receive JSON data about a company's sales opportunities pipeline and provide actionable insights.

The data has been filtered by a specific date mode and time window.${hasDimFilters ? " Additionally, dimension filters have been applied to narrow the dataset." : ""}${datasetId ? " The data comes from a specific imported dataset." : ""} Always state which date mode and time window you are analyzing in your summary.${hasDimFilters ? " Also mention the active dimension filters." : ""}

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summary": "A 2-3 sentence executive summary of the overall pipeline health. Must mention the date mode, time window, and number of opportunities analyzed.${hasDimFilters ? " Must also mention the active dimension filters." : ""}",
  "insights": [
    {
      "title": "Short insight title",
      "description": "1-2 sentence explanation with specific numbers from the data.",
      "type": "positive | negative | neutral"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation based on the data."
  ]
}

Rules:
- Provide exactly 3-5 insights
- Provide exactly 2-4 recommendations
- Reference specific numbers, percentages, and labels from the data
- Keep language professional and concise
${filterMentionRule}
- Do NOT include any text outside the JSON object`;

  const userPrompt = `${dateContext}\n\nAnalyze this sales pipeline data and provide insights:\n\n${JSON.stringify(analyticsPayload)}`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5.2",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
    });

    const rawText = response.output_text;
    const parsed = JSON.parse(rawText);

    if (
      !parsed.summary ||
      !Array.isArray(parsed.insights) ||
      !Array.isArray(parsed.recommendations)
    ) {
      return NextResponse.json(
        { error: "AI returned an unexpected response format" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      analysis: parsed,
      filter: {
        dateMode: filter.dateField,
        dateModeLabel,
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
        periodLabel: filter.periodLabel,
        analyzedCount: total,
        excludedNullCount: nullDateCount ?? 0,
        datasetId,
        activeDimensionFilters: dimFilterDesc,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "AI analysis failed";
    console.error("OpenAI API error:", message);
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
