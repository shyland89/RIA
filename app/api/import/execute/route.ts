import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

const REQUIRED_FIELDS = ["name", "role", "industry", "source", "amount", "outcome"] as const;
const VALID_OUTCOMES = ["open", "won", "lost"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json(
      { error: "No organization found" },
      { status: 403 }
    );
  }

  const orgId = membership.org_id;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingJson = formData.get("mapping") as string | null;

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

  const { data: job, error: jobError } = await supabase
    .from("import_jobs")
    .insert({
      org_id: orgId,
      user_id: user.id,
      filename: file.name,
      inserted_count: 0,
      error_count: 0,
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
  let insertedCount = 0;
  const errors: { row_number: number; error_message: string; raw_row_json: any }[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNum = i + 2;
    const rowErrors: string[] = [];

    const name = row[mapping.name]?.trim() || "";
    const role = row[mapping.role]?.trim() || "";
    const industry = row[mapping.industry]?.trim() || "";
    const source = row[mapping.source]?.trim() || "";
    const amountStr = row[mapping.amount]?.trim() || "";
    const outcome = row[mapping.outcome]?.trim()?.toLowerCase() || "";
    const createdAtStr = mapping.created_at ? row[mapping.created_at]?.trim() : undefined;

    if (!name) rowErrors.push("name is required");
    if (!role) rowErrors.push("role is required");
    if (!industry) rowErrors.push("industry is required");
    if (!source) rowErrors.push("source is required");

    const amount = parseFloat(amountStr);
    if (!amountStr || isNaN(amount)) {
      rowErrors.push("amount must be a valid number");
    }

    if (!VALID_OUTCOMES.includes(outcome)) {
      rowErrors.push(`outcome must be one of: ${VALID_OUTCOMES.join(", ")} (got "${outcome}")`);
    }

    let createdAt: string | undefined;
    if (createdAtStr) {
      const d = new Date(createdAtStr);
      if (isNaN(d.getTime())) {
        rowErrors.push("created_at is not a valid date");
      } else {
        createdAt = d.toISOString();
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
      name,
      role,
      industry,
      source,
      amount,
      outcome,
    };
    if (createdAt) {
      insertData.created_at = createdAt;
    }

    const { error: insertError } = await supabase
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
    await supabase.from("import_errors").insert(errorInserts);
  }

  await supabase
    .from("import_jobs")
    .update({
      inserted_count: insertedCount,
      error_count: errors.length,
    })
    .eq("id", jobId);

  return NextResponse.json({
    jobId,
    insertedCount,
    errorCount: errors.length,
    totalRows: records.length,
    errors: errors.slice(0, 50),
  });
}
