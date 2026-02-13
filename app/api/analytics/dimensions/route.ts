import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { parseDateFilterFromSearchParams, resolveDateFilter } from "@/lib/date-filter";
import { DIMENSION_KEYS, UNKNOWN_VALUE } from "@/lib/dimension-filter";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
  const datasetId = request.nextUrl.searchParams.get("dataset") || null;
  const admin = createAdminClient();
  const orgId = result.membership.org_id;

  const dimensions: Record<string, string[]> = {};

  for (const key of DIMENSION_KEYS) {
    let query = admin
      .from("opportunities")
      .select(key)
      .eq("org_id", orgId)
      .not(filter.dateField, "is", null)
      .gte(filter.dateField, filter.dateFrom)
      .lte(filter.dateField, filter.dateTo);

    if (datasetId) query = query.eq("import_job_id", datasetId);

    const { data, error } = await query;

    if (error) {
      dimensions[key] = [];
      continue;
    }

    const uniqueValues = new Set<string>();
    let hasNull = false;

    for (const row of data || []) {
      const val = (row as Record<string, any>)[key];
      if (val === null || val === undefined || val === "") {
        hasNull = true;
      } else {
        uniqueValues.add(String(val));
      }
    }

    const sorted = Array.from(uniqueValues).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    if (hasNull) {
      sorted.push(UNKNOWN_VALUE);
    }

    dimensions[key] = sorted;
  }

  return NextResponse.json({ dimensions });
}
