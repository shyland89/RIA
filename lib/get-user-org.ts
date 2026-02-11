import { createClient } from "@/lib/supabase/server";

export type UserOrg = {
  user: { id: string; email: string };
  membership: { org_id: string; role: string };
  org: { id: string; name: string };
};

export type UserOrgError = {
  error: string;
  status: number;
};

export async function getUserOrg(): Promise<UserOrg | UserOrgError> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("[getUserOrg] auth user:", user?.id ?? "null", authError?.message ?? "ok");

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: membership, error: memError } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log(
    "[getUserOrg] membership lookup for user_id =",
    user.id,
    "=> result:",
    membership ? JSON.stringify(membership) : "null",
    memError ? `error: ${memError.message}` : "ok"
  );

  if (!membership) {
    return {
      error: "No membership found. You may need to create an organization or contact support.",
      status: 403,
    };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", membership.org_id)
    .maybeSingle();

  console.log(
    "[getUserOrg] org lookup for id =",
    membership.org_id,
    "=> result:",
    org ? JSON.stringify(org) : "null",
    orgError ? `error: ${orgError.message}` : "ok"
  );

  if (!org) {
    return {
      error: "Organization record not found. Please contact support.",
      status: 500,
    };
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    membership: { org_id: membership.org_id, role: membership.role },
    org: { id: org.id, name: org.name },
  };
}

export function isUserOrgError(result: UserOrg | UserOrgError): result is UserOrgError {
  return "error" in result;
}
