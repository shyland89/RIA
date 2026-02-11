import { createClient } from "@/lib/supabase/server";
import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";

export async function POST(request: Request) {
  const result = await getUserOrg();

  if (isUserOrgError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      { error: "File must be a CSV" },
      { status: 400 }
    );
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File size exceeds 10 MB limit" },
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

  if (records.length === 0) {
    return NextResponse.json(
      { error: "CSV file is empty or has no data rows" },
      { status: 400 }
    );
  }

  const headers = Object.keys(records[0]);
  const preview = records.slice(0, 20);
  const totalRows = records.length;

  return NextResponse.json({
    headers,
    preview,
    totalRows,
    filename: file.name,
  });
}
