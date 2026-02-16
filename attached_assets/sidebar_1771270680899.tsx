"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [
  {
    label: "Import",
    href: "/app/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: "Analytics",
    href: "/app/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px]">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

export function Sidebar({
  orgName,
  userEmail,
  role,
}: {
  orgName?: string;
  userEmail?: string;
  role?: string;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const navLinkStyle = (href: string) => ({
    background: isActive(href) ? "var(--teal-50)" : "transparent",
    color: isActive(href) ? "var(--teal-700)" : "var(--stone-600)",
  });

  const navIconStyle = (href: string) => ({
    color: isActive(href) ? "var(--teal-600)" : "var(--stone-400)",
  });

  return (
    <nav
      className="fixed top-0 left-0 h-screen bg-white flex flex-col z-50"
      style={{
        width: "var(--sidebar-width, 240px)",
        borderRight: "1px solid var(--stone-200)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 pt-6 pb-5 flex items-center gap-2.5"
        style={{ borderBottom: "1px solid var(--stone-100)" }}
      >
        <div
          className="w-8 h-8 flex items-center justify-center text-white text-sm font-bold"
          style={{
            background: "linear-gradient(135deg, var(--teal-500), var(--teal-700))",
            borderRadius: "var(--radius-sm, 6px)",
          }}
        >
          R
        </div>
        <span
          className="text-[17px] font-bold"
          style={{ color: "var(--stone-900)", letterSpacing: "-0.3px" }}
        >
          RIA
        </span>
        <span
          className="text-[10px] font-semibold px-1.5 py-px rounded-full"
          style={{
            color: "var(--teal-700)",
            background: "var(--teal-50)",
            border: "1px solid var(--teal-200)",
            letterSpacing: "0.3px",
          }}
        >
          BETA
        </span>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <span
          className="text-[11px] font-semibold uppercase px-3 pt-3 pb-1.5"
          style={{ color: "var(--stone-400)", letterSpacing: "0.6px" }}
        >
          Main
        </span>

        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-[9px] text-sm font-medium transition-colors"
            style={{
              ...navLinkStyle(item.href),
              borderRadius: "var(--radius-sm, 6px)",
            }}
          >
            <span style={navIconStyle(item.href)}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <span
          className="text-[11px] font-semibold uppercase px-3 pt-5 pb-1.5"
          style={{ color: "var(--stone-400)", letterSpacing: "0.6px" }}
        >
          Settings
        </span>

        {role === "admin" && (
          <Link
            href="/app/status"
            className="flex items-center gap-2.5 px-3 py-[9px] text-sm font-medium transition-colors"
            style={{
              ...navLinkStyle("/app/status"),
              borderRadius: "var(--radius-sm, 6px)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-[18px] h-[18px]"
              style={navIconStyle("/app/status")}
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            System Status
          </Link>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--stone-100)" }}>
        <div className="flex items-center gap-2.5 px-2">
          <div
            className="w-8 h-8 flex items-center justify-center text-[13px] font-semibold shrink-0"
            style={{
              background: "var(--stone-200)",
              color: "var(--stone-600)",
              borderRadius: "var(--radius-sm, 6px)",
            }}
          >
            {(orgName || "O").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div
              className="text-[13px] font-semibold truncate"
              style={{ color: "var(--stone-800)" }}
            >
              {orgName || "Organization"}
            </div>
            <div className="text-[11px] truncate" style={{ color: "var(--stone-400)" }}>
              {userEmail || ""}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
