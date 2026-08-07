"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Stethoscope,
  Settings,
  HelpCircle,
  Compass,
  Users,
  ClipboardList,
  LogOut,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/context/AuthContext";

// ─── Role-based nav config ──────────────────────────────────────────────────
function useNavItems(role: string) {
  const { t } = useTranslation();

  const teacherMain = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Users size={20} />, label: "My Class", href: "/dashboard" },
    { icon: <ClipboardList size={20} />, label: "Assessments", href: "/assessments" },
  ];

  const doctorMain = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <ClipboardList size={20} />, label: "Cases", href: "/dashboard" },
    { icon: <FileText size={20} />, label: "Reports", href: "/assessments" },
    { icon: <Stethoscope size={20} />, label: "Psychologists", href: "/psychologists" },
  ];

  const parentMain = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/dashboard" },
    { icon: <ClipboardList size={20} />, label: "Take Test", href: "/assessment" },
    { icon: <FileText size={20} />, label: "Reports", href: "/assessments" },
    { icon: <Stethoscope size={20} />, label: "Psychologists", href: "/psychologists" },
    { icon: <Compass size={20} />, label: t("nav_personalist") || "Paths", href: "/personalised-path" },
  ];

  const defaultMain = [
    { icon: <LayoutDashboard size={20} />, label: t("nav_overview") || "Overview", href: "/dashboard" },
    { icon: <FileText size={20} />, label: t("nav_reports") || "Reports", href: "/assessments" },
    { icon: <Stethoscope size={20} />, label: "Psychologists", href: "/psychologists" },
    { icon: <Compass size={20} />, label: t("nav_personalist") || "Paths", href: "/personalised-path" },
  ];

  const bottom = [
    { icon: <Settings size={20} />, label: "Settings", href: "/settings" },
    { icon: <HelpCircle size={20} />, label: "Support", href: "/support" },
  ];

  const main =
    role === "teacher" ? teacherMain :
    role === "doctor" || role === "psychologist" ? doctorMain :
    role === "parent" ? parentMain :
    defaultMain;

  return { main, bottom };
}

// ─── Desktop NavItem ──────────────────────────────────────────────────────────
function DesktopNavItem({ icon, label, href, active = false }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean;
}) {
  return (
    <Link href={href}>
      <div className={`
        flex items-center gap-4 px-4 py-3 border-2 border-black transition-all group cursor-pointer
        ${active
          ? "bg-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          : "text-black hover:bg-accent shadow-none hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]"
        }
      `}>
        <span className={active ? "text-white" : "text-black group-hover:scale-110 transition-transform"}>
          {icon}
        </span>
        <span className={`hidden lg:block text-sm uppercase tracking-widest ${active ? "font-black" : "font-bold"}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}

// ─── Mobile NavItem ───────────────────────────────────────────────────────────
function MobileNavItem({ icon, label, href, active = false }: {
  icon: React.ReactNode; label: string; href: string; active?: boolean;
}) {
  return (
    <Link href={href} className="flex-1">
      <div className={`
        flex flex-col items-center justify-center gap-1 py-2 px-1 transition-all
        ${active ? "text-primary" : "text-black/40 hover:text-black"}
      `}>
        <div className={`
          p-1.5 transition-all
          ${active
            ? "bg-primary text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : ""}
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

// ─── Main Sidebar Export ──────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user?.role || "parent";
  const { main, bottom } = useNavItems(role);
  const allItems = [...main, ...bottom];

  return (
    <>
      {/* ── DESKTOP ── */}
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

        {/* Role badge */}
        {role && (
          <div className="px-3 mb-4 hidden lg:block">
            <div className="px-3 py-1.5 bg-primary/10 border-2 border-primary text-primary text-[9px] font-black uppercase tracking-widest text-center">
              {role === "doctor" || role === "psychologist" ? "Doctor" :
               role === "teacher" ? "Teacher" :
               role === "parent" ? "Parent" : role}
            </div>
          </div>
        )}

        {/* Main nav */}
        <nav className="flex-1 px-3 space-y-2">
          {main.map(item => (
            <DesktopNavItem
              key={item.href + item.label}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
        </nav>

        {/* Bottom nav + logout */}
        <div className="p-3 border-t-4 border-black space-y-2">
          {bottom.map(item => (
            <DesktopNavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={pathname === item.href}
            />
          ))}
          <button
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3 border-2 border-black text-black hover:bg-red-50 hover:border-[#E52521] hover:text-[#E52521] transition-all group cursor-pointer"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="hidden lg:block text-sm font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-4 border-black flex items-stretch shadow-[0px_-4px_0px_0px_rgba(0,0,0,1)]">
        {allItems.map(item => (
          <MobileNavItem
            key={item.href + item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={pathname === item.href}
          />
        ))}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-black/40 hover:text-[#E52521] transition-all"
        >
          <LogOut size={18} />
          <span className="text-[9px] font-black uppercase tracking-widest">Logout</span>
        </button>
      </nav>

      {/* mobile spacer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[72px] pointer-events-none" aria-hidden />
    </>
  );
}