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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <svg
                className="w-4 h-4 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span
              className="text-sm font-semibold text-foreground"
              data-testid="text-app-title"
            >
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              className="text-sm text-muted-foreground"
              data-testid="text-user-email"
            >
              {user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold tracking-tight text-foreground"
            data-testid="text-welcome"
          >
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are signed in as{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">
              Account details
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 flex-wrap">
                <dt className="text-muted-foreground">User ID</dt>
                <dd
                  className="font-mono text-foreground text-xs"
                  data-testid="text-user-id"
                >
                  {user.id}
                </dd>
              </div>
              <div className="flex justify-between gap-4 flex-wrap">
                <dt className="text-muted-foreground">Email</dt>
                <dd
                  className="text-foreground"
                  data-testid="text-user-email-detail"
                >
                  {user.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4 flex-wrap">
                <dt className="text-muted-foreground">Last sign in</dt>
                <dd className="text-foreground" data-testid="text-last-signin">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">
              Organization
            </h2>
            {org ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-foreground" data-testid="text-org-name">
                    {org.name}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt className="text-muted-foreground">Org ID</dt>
                  <dd
                    className="font-mono text-foreground text-xs"
                    data-testid="text-org-id"
                  >
                    {org.id}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 flex-wrap">
                  <dt className="text-muted-foreground">Your role</dt>
                  <dd className="text-foreground" data-testid="text-user-role">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {role}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <div data-testid="text-no-org">
                <p className="text-sm text-muted-foreground mb-3">
                  {isUserOrgError(result) ? result.error : "No organization found."}
                </p>
                <Link
                  href="/app"
                  className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  data-testid="link-retry-org"
                >
                  Retry
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 flex-wrap">
          <Link
            href="/app/dashboard"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            data-testid="link-dashboard"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Analytics Dashboard
          </Link>
          <Link
            href="/app/import"
            className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
            data-testid="link-import"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Opportunities
          </Link>
          {role === "admin" && (
            <Link
              href="/app/status"
              className="inline-flex items-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground"
              data-testid="link-status"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              System Status
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
