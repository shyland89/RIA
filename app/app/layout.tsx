import { createClient } from "@/lib/supabase/server";
import { getUserOrg, isUserOrgError } from "@/lib/get-user-org";
import { Sidebar } from "@/components/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getUserOrg();
  const orgName = !isUserOrgError(result) ? result.org.name : undefined;
  const role = !isUserOrgError(result) ? result.membership.role : undefined;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--stone-50, #FAFAF9)" }}>
      <Sidebar orgName={orgName} userEmail={user?.email} role={role} />
      <div className="flex-1 min-h-screen" style={{ marginLeft: "var(--sidebar-width, 240px)" }}>
        {children}
      </div>
    </div>
  );
}
