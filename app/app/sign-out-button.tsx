"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="px-3 py-1.5 text-sm font-medium transition-colors"
      style={{
        background: "#fff",
        color: "var(--stone-700)",
        border: "1px solid var(--stone-200)",
        borderRadius: "var(--radius-sm, 6px)",
      }}
      data-testid="button-signout"
    >
      Sign out
    </button>
  );
}
