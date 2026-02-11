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

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("get_user_org");

  if (rpcError) {
    return await getUserOrgFallback(supabase, user);
  }

  const rpcResult = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;

  if (!rpcResult || rpcResult.error) {
    if (rpcResult?.error === "No membership found") {
      return {
        error: "No membership found. You may need to create an organization or contact support.",
        status: 403,
      };
    }
    return { error: rpcResult?.error ?? "Unknown error", status: 500 };
  }

  const orgId = rpcResult.org_id ?? "";
  const orgName = rpcResult.org_name ?? "";
  const role = rpcResult.role ?? "";

  if (!orgId || !orgName) {
    return { error: "Incomplete organization data returned", status: 500 };
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    membership: { org_id: orgId, role },
    org: { id: orgId, name: orgName },
  };
}

async function getUserOrgFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string }
): Promise<UserOrg | UserOrgError> {
  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return {
      error: "No membership found. You may need to create an organization or contact support.",
      status: 403,
    };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", membership.org_id)
    .maybeSingle();

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
