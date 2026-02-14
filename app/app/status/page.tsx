"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type CheckResult = {
  id: string;
  label: string;
  category: string;
  passed: boolean;
  message: string;
  fixSql?: string;
};

type StatusResponse = {
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    healthy: boolean;
  };
  user: {
    id: string;
    email: string;
    role: string;
    orgId: string;
    orgName: string;
  };
};

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/status");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || `Status check failed (${res.status})`);
        return;
      }
      setData(json);
    } catch {
      setError("Failed to connect to status API");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  const categories = data
    ? [...new Set(data.checks.map((c) => c.category))]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground" data-testid="text-status-title">
              System Status
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/app/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-dashboard"
            >
              Analytics
            </Link>
            <Link
              href="/app"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-home"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              System Status
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Validates database schema, RLS policies, and environment configuration.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            data-testid="button-refresh"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-run Checks
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400 mb-6" data-testid="text-error">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className={`rounded-md border px-5 py-4 ${
              data.summary.healthy
                ? "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                : "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
            }`} data-testid="summary-banner">
              <div className="flex items-center gap-3">
                {data.summary.healthy ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <p className={`text-sm font-medium ${data.summary.healthy ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`} data-testid="text-summary">
                    {data.summary.healthy
                      ? "All systems operational"
                      : `${data.summary.failed} issue${data.summary.failed > 1 ? "s" : ""} detected`}
                  </p>
                  <p className={`text-xs mt-0.5 ${data.summary.healthy ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                    {data.summary.passed} of {data.summary.total} checks passed
                    {data.user && ` · ${data.user.email} · ${data.user.orgName} · ${data.user.role}`}
                  </p>
                </div>
              </div>
            </div>

            {categories.map((category) => {
              const categoryChecks = data.checks.filter((c) => c.category === category);
              const allPassed = categoryChecks.every((c) => c.passed);
              const failedCount = categoryChecks.filter((c) => !c.passed).length;

              return (
                <div key={category} className="rounded-md border border-border bg-card" data-testid={`category-${category.toLowerCase()}`}>
                  <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {allPassed ? (
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                      )}
                      <h2 className="text-sm font-medium text-foreground">{category}</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {allPassed
                        ? `${categoryChecks.length} passed`
                        : `${failedCount} failed`}
                    </span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {categoryChecks.map((check) => (
                      <div key={check.id} className="px-5 py-3" data-testid={`check-${check.id}`}>
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0 text-base" data-testid={`status-${check.id}`}>
                            {check.passed ? "\u2705" : "\u274C"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${check.passed ? "text-foreground" : "text-red-700 dark:text-red-400"}`}>
                              {check.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{check.message}</p>
                            {check.fixSql && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs font-medium text-muted-foreground">Fix SQL:</span>
                                  <button
                                    onClick={() => copyToClipboard(check.id, check.fixSql!)}
                                    className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                    data-testid={`button-copy-${check.id}`}
                                  >
                                    {copiedId === check.id ? (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Copied
                                      </>
                                    ) : (
                                      <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="text-xs bg-muted/50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono text-foreground" data-testid={`sql-${check.id}`}>
                                  {check.fixSql}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
