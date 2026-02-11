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
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", user.id)
    .limit(1)
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
    .limit(1)
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
