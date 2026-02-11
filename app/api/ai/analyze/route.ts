import { createClient } from "@/lib/supabase/server";
import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { NextResponse } from "next/server";
import OpenAI from "openai";

type Opportunity = {
  name: string;
  role: string;
  industry: string;
  source: string;
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
    const key = (opp[field] as string) || "(empty)";
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

export async function POST() {
  const result = await getUserOrg();

  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const supabase = await createClient();

  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("name, role, industry, source, amount, outcome")
    .eq("org_id", result.membership.org_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const opps = (opportunities || []) as Opportunity[];

  if (opps.length === 0) {
    return NextResponse.json(
      { error: "No opportunities to analyze. Import data first." },
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
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `You are a senior sales analytics consultant. You receive JSON data about a company's sales opportunities pipeline and provide actionable insights.

Respond ONLY with a valid JSON object matching this exact structure:
{
  "summary": "A 2-3 sentence executive summary of the overall pipeline health.",
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
- Do NOT include any text outside the JSON object`;

  const userPrompt = `Analyze this sales pipeline data and provide insights:\n\n${JSON.stringify(analyticsPayload)}`;

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

    return NextResponse.json({ analysis: parsed });
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
