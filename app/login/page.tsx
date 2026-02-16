"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--stone-50)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 mb-4 text-white text-lg font-bold"
            style={{ background: "linear-gradient(135deg, var(--teal-500, #14B8A6), var(--teal-700, #0F766E))", borderRadius: "var(--radius-md, 10px)" }}
          >
            R
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--stone-900)" }} data-testid="text-login-title">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--stone-500)" }}>Sign in to your account to continue</p>
        </div>

        <div className="bg-white p-6" style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-lg, 14px)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 text-sm" style={{ background: "var(--error-bg)", border: "1px solid #fca5a5", color: "var(--error)", borderRadius: "var(--radius-sm, 6px)" }} data-testid="text-login-error">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: "var(--stone-700)" }}>Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full px-3 py-2 text-sm focus:outline-none" style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-sm, 6px)", color: "var(--stone-900)", background: "#fff" }} data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--stone-700)" }}>Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-3 py-2 text-sm focus:outline-none" style={{ border: "1px solid var(--stone-200)", borderRadius: "var(--radius-sm, 6px)", color: "var(--stone-900)", background: "#fff" }} data-testid="input-password" />
            </div>
            <button type="submit" disabled={loading} className="w-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ background: "var(--teal-600)", borderRadius: "var(--radius-sm, 6px)" }} data-testid="button-login">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: "var(--stone-500)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold" style={{ color: "var(--teal-600)" }} data-testid="link-signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
