import { redirect } from "next/navigation";
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
              <dd className="text-foreground" data-testid="text-user-email-detail">
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
      </main>
    </div>
  );
}
