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

  const { data: rpcResult, error: rpcError } = await supabase.rpc("get_user_org");

  console.log(
    "[getUserOrg] RPC get_user_org =>",
    rpcResult ? JSON.stringify(rpcResult) : "null",
    rpcError ? `error: ${rpcError.message}` : "ok"
  );

  if (rpcError) {
    console.error("[getUserOrg] RPC error, falling back to direct queries:", rpcError.message);
    return await getUserOrgFallback(supabase, user);
  }

  if (rpcResult?.error) {
    if (rpcResult.error === "No membership found") {
      return {
        error: "No membership found. You may need to create an organization or contact support.",
        status: 403,
      };
    }
    return { error: rpcResult.error, status: 500 };
  }

  return {
    user: { id: user.id, email: user.email ?? "" },
    membership: { org_id: rpcResult.org_id, role: rpcResult.role },
    org: { id: rpcResult.org_id, name: rpcResult.org_name },
  };
}

async function getUserOrgFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string }
): Promise<UserOrg | UserOrgError> {
  const { data: membership, error: memError } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  console.log(
    "[getUserOrg fallback] membership lookup =>",
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
    "[getUserOrg fallback] org lookup =>",
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
