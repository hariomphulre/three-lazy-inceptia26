"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Stethoscope,
  Settings,
  HelpCircle,
  Compass,
  LogOut
} from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";

// ─── Nav items config ────────────────────────────────────────────────────────
// Separated so both desktop sidebar & mobile bottom bar use the same source
function useNavItems() {
  const { t } = useTranslation();
  return {
    main: [
      { icon: <LayoutDashboard size={20} />, label: t("nav_overview") || "Overview",      href: "/dashboard" },
      { icon: <FileText size={20} />,        label: t("nav_reports") || "Reports",         href: "/assessments" },
      { icon: <Stethoscope size={20} />,     label: "Psychologists",                        href: "/psychologists" },
      { icon: <Compass size={20} />,         label: t("nav_personalist") || "Paths",       href: "/personalised-path" },
    ],
    bottom: [
      { icon: <Settings size={20} />,        label: "Settings",                             href: "/settings" },
      { icon: <HelpCircle size={20} />,      label: "Support",                              href: "/support" },
    ],
  };
}

// ─── Desktop NavItem ─────────────────────────────────────────────────────────
function DesktopNavItem({ icon, label, href, active = false }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`
        flex items-center gap-4 px-4 py-3 border-2 border-black transition-all group cursor-pointer
        ${active
          ? 'bg-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
          : 'text-black hover:bg-accent shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]'
        }
      `}>
        <span className={active ? 'text-white' : 'text-black group-hover:scale-110 transition-transform'}>
          {icon}
        </span>
        <span className={`hidden lg:block text-sm uppercase tracking-widest ${active ? 'font-black' : 'font-bold'}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}

// ─── Mobile Bottom NavItem ───────────────────────────────────────────────────
function MobileNavItem({ icon, label, href, active = false }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean;
}) {
  return (
    <Link href={href} className="flex-1">
      <div className={`
        flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all
        ${active ? 'text-primary' : 'text-black/40 hover:text-black'}
      `}>
        <div className={`
          p-1.5 transition-all
          ${active
            ? 'bg-primary text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
            : ''}
        `}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest leading-none truncate max-w-[56px] text-center">
          {label}
        </span>
      </div>
    </Link>
  );
}

// ─── Desktop Logout Button ───────────────────────────────────────────────────
// Same look as DesktopNavItem, but it's an action button (not a link).
function DesktopLogoutButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full">
      <div className="
        flex items-center gap-4 px-4 py-3 border-2 border-black transition-all group cursor-pointer
        text-black hover:bg-red-500 hover:text-white shadow-none
        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]
      ">
        <span className="text-black group-hover:text-white group-hover:scale-110 transition-transform">
          <LogOut size={20} />
        </span>
        <span className="hidden lg:block text-sm uppercase tracking-widest font-bold">
          {label}
        </span>
      </div>
    </button>
  );
}

// ─── Mobile Logout Button ────────────────────────────────────────────────────
function MobileLogoutButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1">
      <div className="flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all text-black/40 hover:text-red-500">
        <div className="p-1.5 transition-all">
          <LogOut size={20} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest leading-none truncate max-w-[56px] text-center">
          {label}
        </span>
      </div>
    </button>
  );
}

// ─── Main Sidebar Export ─────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { main, bottom } = useNavItems();
  const allItems = [...main, ...bottom];
  const logoutLabel = t("nav_logout") || "Logout";

  const handleLogout = async () => {
    try {
      // Clears the httpOnly auth cookie on the server.
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, still clear local state and redirect.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    // Return to the base URL.
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* ── DESKTOP: Left sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-20 lg:w-64 bg-card border-r-4 border-black flex-col h-screen shrink-0">
        {/* Logo */}
        <div className="p-6 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="hidden lg:block font-black text-xl tracking-tight text-foreground uppercase">
            NeuroBloom
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 space-y-2">
          {main.map((item) => (
            <DesktopNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="p-3 border-t-4 border-black space-y-2">
          {bottom.map((item) => (
            <DesktopNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
          <DesktopLogoutButton label={logoutLabel} onClick={handleLogout} />
        </div>
      </aside>

      {/* ── MOBILE: Bottom navigation bar (hidden on md+) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black flex items-stretch shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
        {allItems.map((item) => (
          <MobileNavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href}
          />
        ))}
        <MobileLogoutButton label={logoutLabel} onClick={handleLogout} />
      </nav>

      {/* ── MOBILE: Bottom padding spacer so page content isn't hidden behind nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] pointer-events-none" aria-hidden />
    </>
  );
}