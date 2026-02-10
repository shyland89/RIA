import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let orgName: string;
  try {
    const body = await request.json();
    orgName = body.orgName || `${user.email}'s Organization`;
  } catch {
    orgName = `${user.email}'s Organization`;
  }

  const { data, error } = await supabase.rpc("bootstrap_org", {
    org_name: orgName,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
