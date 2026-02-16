"use client";

import { useState, useEffect } from "react";

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
  summary: { total: number; passed: number; failed: number; healthy: boolean };
  user: { id: string; email: string; role: string; orgId: string; orgName: string };
};

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { fetchStatus(); }, []);

  async function fetchStatus() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/status");
      const json = await res.json();
      if (!res.ok) { setError(json.error || `Status check failed (${res.status})`); return; }
      setData(json);
    } catch { setError("Failed to connect to status API"); }
    finally { setLoading(false); }
  }

  async function copyToClipboard(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea"); ta.value = text;
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  }

  const categories = data ? [...new Set(data.checks.map((c) => c.category))] : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--stone-50)" }}>
      <main style={{ padding: "28px 40px 60px" }}>
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: "var(--stone-900)", letterSpacing: "-0.3px" }}>System Status</h1>
            <p className="text-sm mt-1" style={{ color: "var(--stone-500)" }}>Validates database schema, RLS policies, and environment configuration.</p>
          </div>
          <button onClick={fetchStatus} disabled={loading} className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 transition-colors" style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }} data-testid="button-refresh">
            {loading ? (
              <><svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Checking...</>
            ) : (
              <><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Re-run Checks</>
            )}
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm mb-6" style={{ border: "1px solid #fca5a5", background: "var(--error-bg)", color: "var(--error)", borderRadius: "var(--radius-md, 10px)" }} data-testid="text-error">{error}</div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20" data-testid="loading-state">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "var(--teal-50)" }}>
              <svg className="w-5 h-5 animate-spin" style={{ color: "var(--teal-600)" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="px-5 py-4" style={{ border: data.summary.healthy ? "1px solid var(--teal-200)" : "1px solid #fca5a5", background: data.summary.healthy ? "var(--teal-50)" : "var(--error-bg)", borderRadius: "var(--radius-lg, 14px)" }} data-testid="summary-banner">
              <div className="flex items-center gap-3">
                {data.summary.healthy ? (
                  <svg className="w-6 h-6 shrink-0" style={{ color: "var(--teal-600)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-6 h-6 shrink-0" style={{ color: "var(--error)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: data.summary.healthy ? "var(--teal-800)" : "var(--error)" }} data-testid="text-summary">
                    {data.summary.healthy ? "All systems operational" : `${data.summary.failed} issue${data.summary.failed > 1 ? "s" : ""} detected`}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: data.summary.healthy ? "var(--teal-700)" : "#b91c1c" }}>
                    {data.summary.passed} of {data.summary.total} checks passed
                    {data.user && ` · ${data.user.email} · ${data.user.orgName} · ${data.user.role}`}
                  </p>
                </div>
              </div>
            </div>

            {categories.map((category) => {
              const checks = data.checks.filter((c) => c.category === category);
              const allPassed = checks.every((c) => c.passed);
              const failedCount = checks.filter((c) => !c.passed).length;
              return (
                <div key={category} className="bg-white overflow-hidden" style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-lg, 14px)" }} data-testid={`category-${category.toLowerCase()}`}>
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--stone-200)" }}>
                    <div className="flex items-center gap-2">
                      {allPassed ? (
                        <svg className="w-4 h-4 shrink-0" style={{ color: "var(--success)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" style={{ color: "var(--error)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                      )}
                      <h2 className="text-sm font-semibold" style={{ color: "var(--stone-900)" }}>{category}</h2>
                    </div>
                    <span className="text-xs" style={{ color: "var(--stone-500)" }}>{allPassed ? `${checks.length} passed` : `${failedCount} failed`}</span>
                  </div>
                  <div>
                    {checks.map((check, i) => (
                      <div key={check.id} className="px-5 py-3" style={{ borderBottom: i < checks.length - 1 ? "1px solid var(--stone-100)" : "none" }} data-testid={`check-${check.id}`}>
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 shrink-0 text-base" data-testid={`status-${check.id}`}>{check.passed ? "\u2705" : "\u274C"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: check.passed ? "var(--stone-900)" : "var(--error)" }}>{check.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--stone-500)" }}>{check.message}</p>
                            {check.fixSql && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-xs font-semibold" style={{ color: "var(--stone-500)" }}>Fix SQL:</span>
                                  <button onClick={() => copyToClipboard(check.id, check.fixSql!)} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors" style={{ background: "var(--stone-100)", color: "var(--stone-500)" }} data-testid={`button-copy-${check.id}`}>
                                    {copiedId === check.id ? (
                                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copied</>
                                    ) : (
                                      <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                                    )}
                                  </button>
                                </div>
                                <pre className="text-xs p-3 overflow-x-auto whitespace-pre-wrap font-mono" style={{ background: "var(--stone-50)", border: "1px solid var(--stone-200)", borderRadius: "var(--radius-sm, 6px)", color: "var(--stone-700)" }} data-testid={`sql-${check.id}`}>{check.fixSql}</pre>
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
