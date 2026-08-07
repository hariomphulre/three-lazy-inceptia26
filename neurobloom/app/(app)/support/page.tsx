"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  HelpCircle, Mail, ChevronDown, Shield, Wifi,
  LayoutDashboard, FileText, Stethoscope,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { useTranslation } from "@/hooks/useTranslation";

const SUPPORT_EMAIL = "support@neurobloom.in";

const FAQS = [
  { qKey: "sup_faq1_q", aKey: "sup_faq1_a" },
  { qKey: "sup_faq2_q", aKey: "sup_faq2_a" },
  { qKey: "sup_faq3_q", aKey: "sup_faq3_a" },
  { qKey: "sup_faq4_q", aKey: "sup_faq4_a" },
  { qKey: "sup_faq5_q", aKey: "sup_faq5_a" },
];

const QUICK_LINKS = [
  { icon: <LayoutDashboard size={16} />, labelKey: "sup_link_dashboard", href: "/dashboard" },
  { icon: <FileText size={16} />, labelKey: "sup_link_reports", href: "/assessments" },
  { icon: <Stethoscope size={16} />, labelKey: "sup_link_psychologists", href: "/psychologists" },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);
  const { t } = useTranslation();

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background flex items-center justify-between border-b-4 border-black">
          <div>
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">{t("sup_title")}</h2>
            <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">{t("sup_subtitle")}</p>
          </div>
          <div className="w-10 h-10 bg-accent border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <HelpCircle size={18} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Contact */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="h-2 bg-primary" />
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary border-2 border-black flex items-center justify-center text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Mail size={22} />
                  </div>
                  <div>
                    <p className="font-black text-black text-lg uppercase tracking-tight">{t("sup_contact")}</p>
                    <p className="text-[11px] font-bold text-black/50">{t("sup_contact_desc")}</p>
                  </div>
                </div>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="flex items-center gap-2 px-5 py-3 bg-black text-white border-4 border-black font-black text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <Mail size={14} /> {SUPPORT_EMAIL}
                </a>
              </div>
            </motion.section>

            {/* FAQ */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="h-2 bg-[#43B047]" />
              <div className="p-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-black/40 mb-4">{t("sup_faq_heading")}</h3>
                <div className="space-y-3">
                  {FAQS.map((f, i) => {
                    const isOpen = open === i;
                    return (
                      <div key={i} className="border-2 border-black bg-muted">
                        <button
                          onClick={() => setOpen(isOpen ? null : i)}
                          className="w-full flex items-center justify-between gap-3 p-4 text-left"
                        >
                          <span className="text-sm font-black text-black uppercase tracking-tight">{t(f.qKey)}</span>
                          <ChevronDown
                            size={18}
                            className={`flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 -mt-1">
                            <p className="text-sm font-medium text-black/70 leading-relaxed">{t(f.aKey)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* Quick links */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {QUICK_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 p-4 bg-card border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
                >
                  <span className="text-primary">{l.icon}</span>
                  <span className="text-xs font-black text-black uppercase tracking-widest">{t(l.labelKey)}</span>
                </Link>
              ))}
            </motion.section>

            {/* Notes */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="border-4 border-dashed border-black/20 p-5 flex items-start gap-3">
                <Shield size={16} className="text-black/40 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-black/50 leading-relaxed">
                  {t("sup_note_privacy")}
                </p>
              </div>
              <div className="border-4 border-dashed border-black/20 p-5 flex items-start gap-3">
                <Wifi size={16} className="text-black/40 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-black/50 leading-relaxed">
                  {t("sup_note_offline")}
                </p>
              </div>
            </motion.section>

          </div>
        </div>
      </main>
    </div>
  );
}
