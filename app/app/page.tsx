import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { SignOutButton } from "./sign-out-button";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let result = await getUserOrg();

  if (isUserOrgError(result) && result.status === 403) {
    const { error: bootstrapError } = await supabase.rpc("bootstrap_org", {
      org_name: `${user.email}'s Organization`,
    });

    if (!bootstrapError) {
      result = await getUserOrg();
    }
  }

  const hasOrg = !isUserOrgError(result);
  const org = hasOrg ? result.org : null;
  const role = hasOrg ? result.membership.role : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--stone-50)" }}>
      <main style={{ padding: "28px 40px 60px" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1
              className="text-[22px] font-bold tracking-tight"
              style={{ color: "var(--stone-900)", letterSpacing: "-0.3px" }}
              data-testid="text-welcome"
            >
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--stone-500)" }}>
              You are signed in as{" "}
              <span className="font-medium" style={{ color: "var(--stone-900)" }}>
                {user.email}
              </span>
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div
            className="bg-white p-6"
            style={{
              border: "1px solid var(--stone-200)",
              borderRadius: "var(--radius-lg, 14px)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--stone-900)" }}
            >
              Account details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 flex-wrap">
                <dt style={{ color: "var(--stone-500)" }}>User ID</dt>
                <dd
                  className="font-mono text-xs"
                  style={{ color: "var(--stone-900)" }}
                  data-testid="text-user-id"
                >
                  {user.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4 flex-wrap">
                <dt style={{ color: "var(--stone-500)" }}>Email</dt>
                <dd
                  style={{ color: "var(--stone-900)" }}
                  data-testid="text-user-email-detail"
                >
                  {user.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4 flex-wrap">
                <dt style={{ color: "var(--stone-500)" }}>Last sign in</dt>
                <dd style={{ color: "var(--stone-900)" }} data-testid="text-last-signin">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>

          <div
            className="bg-white p-6"
            style={{
              border: "1px solid var(--stone-200)",
              borderRadius: "var(--radius-lg, 14px)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--stone-900)" }}
            >
              Organization
            </h2>
            {org ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt style={{ color: "var(--stone-500)" }}>Name</dt>
                  <dd
                    style={{ color: "var(--stone-900)" }}
                    data-testid="text-org-name"
                  >
                    {org.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt style={{ color: "var(--stone-500)" }}>Org ID</dt>
                  <dd
                    className="font-mono text-xs"
                    style={{ color: "var(--stone-900)" }}
                    data-testid="text-org-id"
                  >
                    {org.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt style={{ color: "var(--stone-500)" }}>Your role</dt>
                  <dd data-testid="text-user-role">
                    <span
                      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md"
                      style={{
                        background: "var(--teal-50)",
                        color: "var(--teal-700)",
                      }}
                    >
                      {role}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <div data-testid="text-no-org">
                <p className="text-sm mb-3" style={{ color: "var(--stone-500)" }}>
                  {isUserOrgError(result) ? result.error : "No organization found."}
                </p>
                <Link
                  href="/app"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white"
                  style={{
                    background: "var(--teal-600)",
                    borderRadius: "var(--radius-sm, 6px)",
                  }}
                  data-testid="link-retry-org"
                >
                  Retry
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
