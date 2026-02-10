import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role, org_id, organizations(id, name)")
    .eq("user_id", user.id)
    .maybeSingle();

  const org = membership?.organizations as { id: string; name: string } | null;

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
                      {membership?.role}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-no-org"
              >
                No organization found. Contact support if this is unexpected.
              </p>
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
        </div>
      </main>
    </div>
  );
}
