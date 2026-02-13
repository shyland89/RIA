import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const result = await getUserOrg();

  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const admin = createAdminClient();
  const orgId = result.membership.org_id;

  const { data: jobs, error } = await admin
    .from("import_jobs")
    .select("id, filename, status, row_count, inserted_count, error_count, skipped_count, is_active, import_mode, created_at, started_at, completed_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs || [] });
}
