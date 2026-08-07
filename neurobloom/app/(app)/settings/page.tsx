"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Shield, Globe, LogOut, Info, Settings as SettingsIcon } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  parent: "Parent / Guardian",
  teacher: "Teacher",
  doctor: "Doctor / Psychologist",
  psychologist: "Doctor / Psychologist",
  educator: "Educator",
  researcher: "Researcher",
};

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";
  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : "··";

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background flex items-center justify-between border-b-4 border-black">
          <div>
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">Settings</h2>
            <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">Account &amp; Preferences</p>
          </div>
          <div className="w-10 h-10 bg-accent border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <SettingsIcon size={18} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Profile */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="h-2 bg-primary" />
              <div className="p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2">
                  <User size={14} /> Profile
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary border-2 border-black flex items-center justify-center text-white font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    {initials}
                  </div>
                  <div>
                    <p className="font-black text-black text-xl uppercase tracking-tight">{user?.name ?? "—"}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary/10 border-2 border-primary text-primary text-[10px] font-black uppercase tracking-widest">
                      <Shield size={11} /> {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Preferences */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="h-2 bg-[#049CD8]" />
              <div className="p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4 flex items-center gap-2">
                  <Globe size={14} /> Preferences
                </h3>
                <div className="flex items-center justify-between border-2 border-black bg-muted p-4">
                  <div>
                    <p className="text-sm font-black text-black uppercase">Language</p>
                    <p className="text-[11px] font-bold text-black/50">Choose the language for the app &amp; assessment.</p>
                  </div>
                  <LanguageSwitcher />
                </div>
              </div>
            </motion.section>

            {/* Account */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="h-2 bg-[#E52521]" />
              <div className="p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-1">Account</h3>
                  <p className="text-[11px] font-bold text-black/50">Sign out of your account on this device.</p>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-5 py-3 bg-[#E52521] text-white border-4 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </motion.section>

            {/* About */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="border-4 border-dashed border-black/20 p-5 flex items-center gap-3"
            >
              <Info size={16} className="text-black/40 flex-shrink-0" />
              <p className="text-[11px] font-bold text-black/50 uppercase tracking-widest">
                NeuroBloom · v2.0 · Cognitive assessment &amp; early learning-disability screening.
              </p>
            </motion.section>

          </div>
        </div>
      </main>
    </div>
  );
}
