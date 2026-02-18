import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import {
  classifyEnrichmentValues,
  INDUSTRY_CLUSTERS,
  SOURCE_GROUPS,
  SOURCE_GROUP_LABELS,
} from "@/lib/enrichment";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const result = await getUserOrg();
  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  let body: { industries?: string[]; sources?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const industries = Array.isArray(body.industries) ? body.industries.filter(Boolean) : [];
  const sources = Array.isArray(body.sources) ? body.sources.filter(Boolean) : [];

  if (industries.length === 0 && sources.length === 0) {
    return NextResponse.json({
      enrichmentMapping: { industry: {}, source: {} },
      industryClusters: INDUSTRY_CLUSTERS,
      sourceGroups: SOURCE_GROUPS,
      sourceGroupLabels: SOURCE_GROUP_LABELS,
    });
  }

  try {
    const enrichmentMapping = await classifyEnrichmentValues(industries, sources, apiKey);
    return NextResponse.json({
      enrichmentMapping,
      industryClusters: INDUSTRY_CLUSTERS,
      sourceGroups: SOURCE_GROUPS,
      sourceGroupLabels: SOURCE_GROUP_LABELS,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Classification failed: ${err.message}` },
      { status: 500 }
    );
  }
}