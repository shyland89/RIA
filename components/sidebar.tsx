"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [
  {
    label: "Import",
    href: "/app/import",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[16px] h-[16px]">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[16px] h-[16px]">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
];

const settingsNav = [
  {
    label: "System Status",
    href: "/app/status",
    adminOnly: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[16px] h-[16px]">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

  return (
    <nav
      className="fixed top-0 left-0 h-screen flex flex-col z-50"
      style={{
        width: "var(--sidebar-width, 232px)",
        background: "var(--zinc-900)",
      }}
    >
      {/* Logo */}
      <div className="px-4 h-14 flex items-center gap-2.5 shrink-0">
        <div
          className="w-7 h-7 flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--teal-500), var(--teal-700))",
            borderRadius: "6px",
          }}
        >
          R
        </div>
        <span
          className="text-[15px] font-semibold text-white"
          style={{ letterSpacing: "-0.2px" }}
        >
          RIA
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{
            color: "var(--teal-400)",
            background: "rgba(20, 184, 166, 0.12)",
            letterSpacing: "0.5px",
          }}
        >
          BETA
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-100"
              style={{
                borderRadius: "6px",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.45)",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.7)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)";
              }}
            >
              <span
                style={{
                  color: active ? "var(--teal-400)" : "rgba(255,255,255,0.3)",
                  transition: "color 100ms",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        {/* Spacer + Settings */}
        <div className="flex-1" />

        {settingsNav.map((item) => {
          if (item.adminOnly && role !== "admin") return null;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-all duration-100"
              style={{
                borderRadius: "6px",
                background: active ? "rgba(255,255,255,0.08)" : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.6)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                if (!active) (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.35)";
              }}
            >
              <span style={{ color: active ? "var(--teal-400)" : "rgba(255,255,255,0.25)" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 16px" }} />

      {/* Footer — org + user */}
      <div className="px-3 py-3">
        <Link
          href="/app"
          className="flex items-center gap-2.5 px-3 py-2.5 w-full transition-all duration-100"
          style={{ borderRadius: "6px" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          }}
        >
          <div
            className="w-7 h-7 flex items-center justify-center text-[11px] font-bold shrink-0"
            style={{
              background: "var(--teal-700)",
              color: "var(--teal-100)",
              borderRadius: "6px",
            }}
          >
            {(orgName || "O").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[12px] font-semibold truncate"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {orgName || "Organization"}
            </div>
            <div
              className="text-[11px] truncate"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              {userEmail || ""}
            </div>
          </div>
        </Link>
      </div>
    </nav>
  );
}