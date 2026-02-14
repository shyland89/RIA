import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type CheckResult = {
  id: string;
  label: string;
  category: string;
  passed: boolean;
  message: string;
  fixSql?: string;
};

const REQUIRED_SCHEMA: Record<string, string[]> = {
  organizations: ["id", "name", "created_at"],
  profiles: ["id", "email", "created_at"],
  memberships: ["id", "org_id", "user_id", "role", "created_at"],
  opportunities: [
    "id", "org_id", "import_job_id", "name", "role", "industry", "source",
    "amount", "outcome", "created_at", "closed_date", "pipeline_accepted_date",
    "segment", "country",
  ],
  import_jobs: [
    "id", "org_id", "user_id", "filename", "inserted_count", "error_count",
    "skipped_count", "row_count", "status", "is_active", "import_mode",
    "mapping_config", "started_at", "completed_at", "created_at",
  ],
  import_errors: ["id", "job_id", "row_number", "error_message", "raw_row_json", "created_at"],
};

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

  if (result.membership.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const admin = createAdminClient();
  const supabase = await createClient();
  const orgId = result.membership.org_id;
  const userId = result.user.id;
  const checks: CheckResult[] = [];

  for (const [table, columns] of Object.entries(REQUIRED_SCHEMA)) {
    const selectCols = columns.join(", ");
    const { error: selectError } = await admin
      .from(table)
      .select(selectCols)
      .limit(0);

    if (!selectError) {
      checks.push({
        id: `table-${table}`,
        label: `Table "${table}" with all columns`,
        category: "Schema",
        passed: true,
        message: `Table exists with all ${columns.length} required columns`,
      });
    } else {
      const errMsg = selectError.message || "";

      const relationMissing = errMsg.includes("relation") && errMsg.includes("does not exist");
      if (relationMissing) {
        checks.push({
          id: `table-${table}`,
          label: `Table "${table}" exists`,
          category: "Schema",
          passed: false,
          message: `Table "${table}" does not exist`,
          fixSql: `-- Run the appropriate migration SQL to create the "${table}" table.\n-- See supabase/migrations/ directory for the correct CREATE TABLE statement.`,
        });
        continue;
      }

      const colMatch = errMsg.match(/column (\w+)\.(\w+) does not exist/) ||
                        errMsg.match(/Could not find the .* column of '(\w+)' in the schema cache/) ||
                        errMsg.match(/column "?(\w+)"? does not exist/);

      if (colMatch) {
        checks.push({
          id: `table-${table}`,
          label: `Table "${table}" exists`,
          category: "Schema",
          passed: true,
          message: "Table exists",
        });

        for (const col of columns) {
          const { error: singleColErr } = await admin
            .from(table)
            .select(col)
            .limit(0);

          const colExists = !singleColErr;
          checks.push({
            id: `col-${table}-${col}`,
            label: `Column "${table}.${col}"`,
            category: "Schema",
            passed: colExists,
            message: colExists ? "Column found" : `Column "${col}" missing from "${table}"`,
            fixSql: colExists
              ? undefined
              : `ALTER TABLE public.${table} ADD COLUMN "${col}" text;\n-- Adjust the data type as needed. Check migration files for the correct type.`,
          });
        }
      } else {
        checks.push({
          id: `table-${table}`,
          label: `Table "${table}" schema check`,
          category: "Schema",
          passed: false,
          message: `Error checking "${table}": ${errMsg}`,
          fixSql: `-- Investigate the error:\n-- ${errMsg}\n-- Check supabase/migrations/ for the expected schema.`,
        });
      }
    }
  }

  try {
    const { data: memData, error: memError } = await supabase
      .from("memberships")
      .select("id, role")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (memError) {
      const isRecursion = memError.message?.includes("infinite recursion") || memError.code === "42P17";
      checks.push({
        id: "rls-memberships-read",
        label: "Read own memberships (via RLS)",
        category: "Access",
        passed: false,
        message: isRecursion
          ? `RLS infinite recursion detected: ${memError.message}`
          : `Failed to read memberships: ${memError.message}`,
        fixSql: isRecursion
          ? `-- The memberships RLS policy references itself, causing infinite recursion.\n-- Fix by simplifying the SELECT policy to use auth.uid() directly:\n\nDROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;\nCREATE POLICY "Users can view own memberships"\n  ON public.memberships FOR SELECT\n  USING (user_id = auth.uid());`
          : `-- Check your RLS policies on memberships:\nSELECT schemaname, tablename, policyname, permissive, roles, cmd, qual\nFROM pg_policies WHERE tablename = 'memberships';`,
      });
    } else {
      checks.push({
        id: "rls-memberships-read",
        label: "Read own memberships (via RLS)",
        category: "Access",
        passed: true,
        message: memData ? `OK (role: ${memData.role})` : "Query succeeded but no row found for current user",
      });
    }
  } catch (e: any) {
    checks.push({
      id: "rls-memberships-read",
      label: "Read own memberships (via RLS)",
      category: "Access",
      passed: false,
      message: `Unexpected error: ${e.message}`,
    });
  }

  try {
    const { data: oppData, error: oppError } = await admin
      .from("opportunities")
      .select("id")
      .eq("org_id", orgId)
      .limit(1);

    checks.push({
      id: "access-opportunities-read",
      label: "Read opportunities for org",
      category: "Access",
      passed: !oppError,
      message: oppError
        ? `Failed: ${oppError.message}`
        : `OK (${oppData?.length ?? 0} returned in sample)`,
      fixSql: oppError
        ? `-- Check RLS policies on opportunities:\nSELECT schemaname, tablename, policyname, permissive, roles, cmd, qual\nFROM pg_policies WHERE tablename = 'opportunities';`
        : undefined,
    });
  } catch (e: any) {
    checks.push({
      id: "access-opportunities-read",
      label: "Read opportunities for org",
      category: "Access",
      passed: false,
      message: `Unexpected error: ${e.message}`,
    });
  }

  try {
    const testJobData = {
      org_id: orgId,
      user_id: userId,
      filename: "__status_check_test__",
      inserted_count: 0,
      error_count: 0,
      skipped_count: 0,
      row_count: 0,
      status: "pending",
      is_active: false,
      import_mode: "append",
    };

    const { data: insertedJob, error: insertError } = await admin
      .from("import_jobs")
      .insert(testJobData)
      .select("id")
      .single();

    if (insertError) {
      checks.push({
        id: "access-import-jobs-create",
        label: "Create import_jobs record",
        category: "Access",
        passed: false,
        message: `Failed: ${insertError.message}`,
        fixSql: `-- Check the import_jobs table structure:\nSELECT column_name, data_type, is_nullable\nFROM information_schema.columns\nWHERE table_name = 'import_jobs' AND table_schema = 'public'\nORDER BY ordinal_position;`,
      });
    } else {
      await admin.from("import_jobs").delete().eq("id", insertedJob.id);
      checks.push({
        id: "access-import-jobs-create",
        label: "Create import_jobs record",
        category: "Access",
        passed: true,
        message: "Create and cleanup test record OK",
      });
    }
  } catch (e: any) {
    checks.push({
      id: "access-import-jobs-create",
      label: "Create import_jobs record",
      category: "Access",
      passed: false,
      message: `Unexpected error: ${e.message}`,
    });
  }

  try {
    const { error: rlsError } = await supabase
      .from("memberships")
      .select("id")
      .limit(1);

    const isRecursion = rlsError?.message?.includes("infinite recursion") || rlsError?.code === "42P17";

    checks.push({
      id: "rls-recursion-check",
      label: "Memberships RLS recursion test",
      category: "RLS",
      passed: !isRecursion,
      message: isRecursion
        ? `Infinite recursion detected: ${rlsError?.message}`
        : rlsError
          ? `Non-recursion error: ${rlsError.message}`
          : "No recursion detected — RLS policies are clean",
      fixSql: isRecursion
        ? `-- The memberships RLS policy references itself, causing infinite recursion.\n-- Fix by using auth.uid() directly:\n\nDROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;\nCREATE POLICY "Users can view own memberships"\n  ON public.memberships FOR SELECT\n  USING (user_id = auth.uid());\n\n-- If other tables (e.g. organizations) reference memberships in their policies,\n-- use a SECURITY DEFINER function to avoid the recursion:\n\nCREATE OR REPLACE FUNCTION public.get_user_org_id()\nRETURNS uuid\nLANGUAGE sql\nSECURITY DEFINER\nSTABLE\nAS $$\n  SELECT org_id FROM public.memberships\n  WHERE user_id = auth.uid()\n  LIMIT 1;\n$$;`
        : undefined,
    });
  } catch (e: any) {
    checks.push({
      id: "rls-recursion-check",
      label: "Memberships RLS recursion test",
      category: "RLS",
      passed: false,
      message: `Unexpected error: ${e.message}`,
    });
  }

  const envChecks = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL configured" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key configured" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Service Role Key configured" },
    { key: "OPENAI_API_KEY", label: "OpenAI API Key configured" },
  ];

  for (const env of envChecks) {
    const value = process.env[env.key];
    checks.push({
      id: `env-${env.key}`,
      label: env.label,
      category: "Environment",
      passed: !!value && value.length > 0,
      message: value ? "Set" : `Environment variable ${env.key} is not set`,
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const failedCount = checks.filter((c) => !c.passed).length;

  return NextResponse.json({
    checks,
    summary: {
      total: checks.length,
      passed: passedCount,
      failed: failedCount,
      healthy: failedCount === 0,
    },
    user: {
      id: userId,
      email: result.user.email,
      role: result.membership.role,
      orgId,
      orgName: result.org.name,
    },
  });
}
