import { createClient } from "@/lib/supabase/server";
import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

const REQUIRED_FIELDS = ["name", "amount", "outcome"] as const;
const OPTIONAL_DIMENSION_FIELDS = ["role", "industry", "source", "segment", "country"] as const;
const DATE_FIELDS = ["created_at", "closed_date", "pipeline_accepted_date"] as const;
const VALID_OUTCOMES = ["open", "won", "lost"];
const NULL_TOKENS = ["", "na", "n/a", "null", "none", "-"];

function isNullish(val: string | undefined): boolean {
  if (!val) return true;
  return NULL_TOKENS.includes(val.trim().toLowerCase());
}

function normalizeDimension(val: string | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (NULL_TOKENS.includes(trimmed.toLowerCase())) return null;
  return trimmed;
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

  const supabase = await createClient();
  const admin = createAdminClient();
  const user = result.user;
  const orgId = result.membership.org_id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingJson = formData.get("mapping") as string | null;
  const importMode = (formData.get("mode") as string) || "append";

  if (!file || !mappingJson) {
    return NextResponse.json(
      { error: "File and column mapping are required" },
      { status: 400 }
    );
  }

  let mapping: Record<string, string>;
  try {
    mapping = JSON.parse(mappingJson);
  } catch {
    return NextResponse.json(
      { error: "Invalid mapping format" },
      { status: 400 }
    );
  }

  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field]) {
      return NextResponse.json(
        { error: `Missing mapping for required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const hasAtLeastOneDate = DATE_FIELDS.some((df) => !!mapping[df]);
  if (!hasAtLeastOneDate) {
    return NextResponse.json(
      { error: "At least one date field must be mapped (created_at, closed_date, or pipeline_accepted_date)" },
      { status: 400 }
    );
  }

  const text = await file.text();
  let records: Record<string, string>[];
  try {
    records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `CSV parse error: ${e.message}` },
      { status: 400 }
    );
  }

  const { data: job, error: jobError } = await admin
    .from("import_jobs")
    .insert({
      org_id: orgId,
      user_id: user.id,
      filename: file.name,
      inserted_count: 0,
      error_count: 0,
      skipped_count: 0,
      row_count: records.length,
      status: "running",
      is_active: true,
      import_mode: importMode === "replace" ? "replace" : "append",
      mapping_config: mapping,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: `Failed to create import job: ${jobError?.message}` },
      { status: 500 }
    );
  }

  const jobId = job.id;

  if (importMode === "replace") {
    await admin
      .from("import_jobs")
      .update({ is_active: false })
      .eq("org_id", orgId)
      .neq("id", jobId);

    const { error: deleteError } = await admin
      .from("opportunities")
      .delete()
      .eq("org_id", orgId)
      .is("import_job_id", null);

    if (deleteError) {
      console.error("Failed to delete unlinked opportunities:", deleteError.message);
    }

    const { data: priorJobs } = await admin
      .from("import_jobs")
      .select("id")
      .eq("org_id", orgId)
      .eq("is_active", false);

    if (priorJobs && priorJobs.length > 0) {
      for (const pj of priorJobs) {
        await admin
          .from("opportunities")
          .delete()
          .eq("org_id", orgId)
          .eq("import_job_id", pj.id);
      }
    }
  }

  let insertedCount = 0;
  let skippedCount = 0;
  const errors: { row_number: number; error_message: string; raw_row_json: any }[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;
    const rowErrors: string[] = [];

    const name = row[mapping.name]?.trim() || "";
    const amountStr = row[mapping.amount]?.trim() || "";
    const outcome = row[mapping.outcome]?.trim()?.toLowerCase() || "";
    const roleStr = mapping.role ? row[mapping.role]?.trim() : undefined;
    const industryStr = mapping.industry ? row[mapping.industry]?.trim() : undefined;
    const sourceStr = mapping.source ? row[mapping.source]?.trim() : undefined;
    const createdAtStr = mapping.created_at ? row[mapping.created_at]?.trim() : undefined;
    const closedDateStr = mapping.closed_date ? row[mapping.closed_date]?.trim() : undefined;
    const pipelineDateStr = mapping.pipeline_accepted_date ? row[mapping.pipeline_accepted_date]?.trim() : undefined;
    const segmentStr = mapping.segment ? row[mapping.segment]?.trim() : undefined;
    const countryStr = mapping.country ? row[mapping.country]?.trim() : undefined;

    if (!name) rowErrors.push("name is required");

    const amount = parseFloat(amountStr);
    if (!amountStr || isNaN(amount)) {
      rowErrors.push("amount must be a valid number");
    }

    if (!VALID_OUTCOMES.includes(outcome)) {
      rowErrors.push(`outcome must be one of: ${VALID_OUTCOMES.join(", ")} (got "${outcome}")`);
    }

    let createdAt: string | undefined;
    if (createdAtStr && !isNullish(createdAtStr)) {
      const d = new Date(createdAtStr);
      if (isNaN(d.getTime())) {
        rowErrors.push("created_at is not a valid date");
      } else {
        createdAt = d.toISOString();
      }
    }

    let closedDate: string | undefined;
    if (closedDateStr && !isNullish(closedDateStr)) {
      const d = new Date(closedDateStr);
      if (isNaN(d.getTime())) {
        rowErrors.push("closed_date is not a valid date");
      } else {
        closedDate = d.toISOString();
      }
    }

    let pipelineAcceptedDate: string | undefined;
    if (pipelineDateStr && !isNullish(pipelineDateStr)) {
      const d = new Date(pipelineDateStr);
      if (isNaN(d.getTime())) {
        rowErrors.push("pipeline_accepted_date is not a valid date");
      } else {
        pipelineAcceptedDate = d.toISOString();
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        row_number: rowNum,
        error_message: rowErrors.join("; "),
        raw_row_json: row,
      });
      continue;
    }

    const insertData: any = {
      org_id: orgId,
      import_job_id: jobId,
      name: name || null,
      role: normalizeDimension(roleStr),
      industry: normalizeDimension(industryStr),
      source: normalizeDimension(sourceStr),
      amount,
      outcome,
      segment: normalizeDimension(segmentStr),
      country: normalizeDimension(countryStr),
    };
    if (createdAt) insertData.created_at = createdAt;
    if (closedDate) insertData.closed_date = closedDate;
    if (pipelineAcceptedDate) insertData.pipeline_accepted_date = pipelineAcceptedDate;

    const { error: insertError } = await admin
      .from("opportunities")
      .insert(insertData);

    if (insertError) {
      errors.push({
        row_number: rowNum,
        error_message: insertError.message,
        raw_row_json: row,
      });
    } else {
      insertedCount++;
    }
  }

  if (errors.length > 0) {
    const errorInserts = errors.map((e) => ({
      job_id: jobId,
      row_number: e.row_number,
      error_message: e.error_message,
      raw_row_json: e.raw_row_json,
    }));
    await admin.from("import_errors").insert(errorInserts);
  }

  const finalStatus = insertedCount > 0 ? "completed" : (errors.length > 0 ? "failed" : "completed");

  await admin
    .from("import_jobs")
    .update({
      inserted_count: insertedCount,
      error_count: errors.length,
      skipped_count: skippedCount,
      status: finalStatus,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({
    jobId,
    insertedCount,
    errorCount: errors.length,
    skippedCount,
    totalRows: records.length,
    errors: errors.slice(0, 50),
  });
}
