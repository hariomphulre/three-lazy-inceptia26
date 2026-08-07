"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Shield,
  Clock,
  BarChart2,
  Zap,
  UserCircle
} from 'lucide-react';
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";

/* ─── Floating decorative symbol ─────────────────────────────────────────── */
interface FloatingEl {
  symbol: string;
  x: string;
  y: string;
  size: string;
  delay: number;
  duration: number;
  rotate?: number;
}

function FloatingSymbol({ el, className }: { el: FloatingEl; className?: string }) {
  const isRotating = el.rotate !== undefined;
  return (
    <motion.div
      className={`absolute pointer-events-none select-none font-extrabold ${className || ''}`}
      style={{ left: el.x, top: el.y, fontSize: el.size, opacity: 0.55, zIndex: 1 }}
      animate={isRotating ? { y: [0, -8, 0], rotate: [0, el.rotate ?? 360] } : { y: [0, -7, 0] }}
      transition={{
        duration: el.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: el.delay,
        ...(isRotating ? { rotate: { duration: el.duration * 2, repeat: Infinity, ease: "linear" } } : {}),
      }}
    >
      {el.symbol}
    </motion.div>
  );
}

const CARD_FLOATERS: FloatingEl[] = [
  { symbol: "🧠", x: "68%", y: "12%", size: "16px", delay: 0, duration: 3.2 },
  { symbol: "🎮", x: "80%", y: "38%", size: "14px", delay: 0.5, duration: 2.8 },
  { symbol: "✨", x: "62%", y: "58%", size: "14px", delay: 1, duration: 3.5 },
  { symbol: "📊", x: "74%", y: "75%", size: "12px", delay: 0.3, duration: 2.6 },
  { symbol: "🔬", x: "88%", y: "20%", size: "14px", delay: 0.8, duration: 3 },
];

interface DashboardProps {
  onStartTest: () => void;
}

export default function Dashboard({ onStartTest }: DashboardProps) {
  const { t } = useTranslation();
  const [userName, setUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("userName") || "Kartik Kumbhar";
    }
    return "Kartik Kumbhar";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem("userName", data.name);
        }
      })
      .catch(() => {});
  }, []);

  return (
    // FIX 1: Changed from `h-screen overflow-hidden` to `min-h-screen` so the
    // page can grow taller than the viewport on small screens.
    <div className="min-h-screen w-full bg-background text-foreground flex font-sans">
      <Sidebar />

      {/* Main Content Area */}
      {/* FIX 2: Removed `overflow-hidden` from main so content isn't clipped.
          Added `overflow-x-hidden` only to prevent unwanted horizontal scroll. */}
      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-background">
        {/* Header */}
        <div className="px-4 sm:px-8 pt-8 sm:pt-10 pb-4 flex-shrink-0 bg-background">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl font-black text-black uppercase italic tracking-tighter truncate"
              >
                Hello, <span className="text-primary" suppressHydrationWarning>{userName}</span>
              </motion.h1>
              <p className="text-xs sm:text-sm font-black text-black/40 mt-1 uppercase tracking-widest">
                Welcome back to your diagnostic terminal
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <LanguageSwitcher />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-black uppercase tracking-tight">{userName}</p>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">{t("dash_practitioner")}</p>
              </div>
              <div className="w-12 h-12 bg-accent border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative">
                <UserCircle className="w-8 h-8 text-black" />
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#43B047] border-2 border-black" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {/* FIX 3: Removed `flex-1` + `overflow-y-auto` — content now flows
            naturally in the document, enabling native page scroll on mobile. */}
        <div className="px-4 sm:px-8 py-6">
          <div className="max-w-6xl flex flex-col items-start">
            
            {/* Section Header */}
            <div className="mb-8">
              <h3 className="text-xl sm:text-2xl font-black text-black uppercase italic tracking-tighter">Active Modules</h3>
              <p className="text-xs sm:text-sm font-black text-black/40 mt-1 uppercase tracking-widest">
                Select an environment to begin patient screening.
              </p>
            </div>

            {/* Assessment Card */}
            <motion.div 
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 110 }}
              // FIX 4: `w-full` on mobile, capped at `max-w-md` on larger screens
              className="w-full sm:max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-all relative overflow-hidden"
            >
              {/* Top bar */}
              <div className="h-2 w-full bg-primary" />

              {/* Floating animated symbols */}
              {CARD_FLOATERS.map((el, i) => (
                <FloatingSymbol key={i} el={el} className="text-primary/40" />
              ))}

              {/* Card content */}
              <div className="p-6 sm:p-8 relative z-10">
                {/* Status Row */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 bg-accent border-2 border-black px-3 sm:px-4 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Zap size={14} className="fill-black text-black" />
                    <span className="text-xs font-black tracking-widest uppercase text-black">
                      {t("dash_system_ready")}
                    </span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    className="w-12 h-12 border-2 border-black flex items-center justify-center bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Shield size={24} />
                  </motion.div>
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-black text-black leading-tight mb-1 uppercase italic tracking-tighter">
                  {t("dash_cognitive_reading")}
                </h3>
                <p className="text-xs text-black/40 font-black mb-8 uppercase tracking-widest">{t("dash_ai_module")}</p>

                {/* Stat boxes */}
                <div className="flex gap-3 sm:gap-4 mb-8">
                  <div className="flex-1 border-2 border-black p-3 sm:p-4 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-black/40" />
                      <span className="text-[10px] font-black tracking-widest text-black/40 uppercase">
                        {t("dash_duration")}
                      </span>
                    </div>
                    <p className="text-sm font-black text-black uppercase">{t("dash_duration_val")}</p>
                  </div>
                  <div className="flex-1 border-2 border-black p-3 sm:p-4 bg-muted shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 size={14} className="text-black/40" />
                      <span className="text-[10px] font-black tracking-widest text-black/40 uppercase">
                        {t("dash_method")}
                      </span>
                    </div>
                    <p className="text-sm font-black text-black uppercase">{t("dash_method_val")}</p>
                  </div>
                </div>

                {/* Launch button */}
                <Button
                  size="lg"
                  onClick={onStartTest}
                  className="w-full text-lg sm:text-xl py-8 sm:py-10 uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Play size={20} className="fill-current" />
                  {t("dash_launch_env")}
                </Button>

                {/* Footer */}
                <p className="text-center text-[10px] font-black tracking-widest text-black/40 uppercase mt-6">
                  {t("dash_auth_clinical")}
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Status */}
        {/* FIX 5: Removed `h-12` fixed height — use padding instead so it
            doesn't get cut off or collapse on small screens. */}
        <footer className="mt-auto bg-white border-t-4 border-black px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#43B047] border border-black animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">{t("dash_system_conn")}</span>
          </div>
          <span className="text-xs text-black/40 font-black uppercase tracking-widest">{t("dash_terminal_id")}</span>
        </footer>
      </main>
    </div>
  );
}