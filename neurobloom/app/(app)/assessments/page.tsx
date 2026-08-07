"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Activity, 
  LayoutDashboard, 
  FileText, 
  Users, 
  TrendingUp, 
  Settings, 
  HelpCircle, 
  FileDown,
  Search,
  ChevronRight,
  Compass,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

interface Assessment {
  child_id: string;
  child_name: string;
  gender: string;
  age: number;
  report_url: string;
  created_at?: string;
}

export default function AssessmentsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-black uppercase italic tracking-tighter">{t("assess_test_reports")}</h2>
            <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">{t("assess_review_manage")}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-black text-black uppercase tracking-tight">{t("assess_dr_sarah")}</p>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-widest">{t("assess_chief_neuro")}</p>
            </div>
            <div className="w-10 h-10 bg-accent border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">SC</div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">

            {/* Search Bar */}
            <div className="flex justify-end mb-8">
              <div className="relative group w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder={t("assess_search")} 
                  className="w-full bg-white border-4 border-black py-3 pl-12 pr-4 text-sm font-black uppercase outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20"
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted border-b-4 border-black">
                    <th className="px-6 py-6 text-xs font-black text-black uppercase tracking-widest">{t("assess_child_patient")}</th>
                    <th className="px-6 py-6 text-xs font-black text-black uppercase tracking-widest">{t("assess_gender")}</th>
                    <th className="px-6 py-6 text-xs font-black text-black uppercase tracking-widest">{t("assess_age")}</th>
                    <th className="px-6 py-6 text-xs font-black text-black uppercase tracking-widest text-right">{t("assess_report_status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm font-black text-black/40 uppercase tracking-widest">{t("assess_syncing")}</p>
                        </div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center">
                        <p className="text-sm font-black text-black/20 uppercase tracking-widest italic">{t("assess_no_records")}</p>
                      </td>
                    </tr>
                  ) : (
                    data.map((item, idx) => (
                      <motion.tr
                        // ✅ FIX: child_id can be undefined or duplicated (same child, multiple reports)
                        // Combining with idx guarantees a unique key every time
                        key={`${item.child_id ?? "row"}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-primary group-hover:text-white transition-all">
                              {item.child_name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-black text-black uppercase tracking-tight text-base italic">{item.child_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-[10px] font-black text-white uppercase bg-secondary border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {item.gender}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-black uppercase tracking-tight">{item.age}</span>
                          <span className="text-[10px] font-black text-black/40 ml-1 uppercase tracking-tighter">{t("assess_years")}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {item.report_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] h-auto py-2 px-4 uppercase tracking-widest"
                              asChild
                            >
                              <a href={item.report_url} download target="_blank" rel="noopener noreferrer">
                                <FileDown size={14} className="mr-2" />
                                {t("assess_download_pdf")}
                              </a>
                            </Button>
                          ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border-2 border-black text-[10px] font-black text-black/20 uppercase tracking-widest italic cursor-default">
                              <XCircle size={14} />
                              Pending
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Footer */}
        <footer className="h-12 bg-white border-t-4 border-black px-8 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#43B047] border border-black animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest">{t("assess_records_sync")}</span>
           </div>
           <span className="text-xs text-black/40 font-black uppercase tracking-widest">{t("assess_db_node")}</span>
        </footer>
      </main>
    </div>
  );
}