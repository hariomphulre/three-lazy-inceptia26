"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileDown,
  Search,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";

interface DomainScore {
  composite_score: number;
  risk_level: "low" | "moderate" | "high" | "unknown";
}

interface Assessment {
  id: string;
  child_name: string;
  gender: string;
  age: number;
  report_url: string;
  school_grade?: string;
  created_at?: string;
  domain_scores?: Record<string, DomainScore> | null;
  flags_for_assessment?: string[] | null;
  evidence_status?: string;
  questionnaire_group?: string;
  screening_updated_at?: string;
}

const RISK_CONFIG = {
  low:     { label: "Low",       color: "bg-[#43B047] text-white",    icon: <CheckCircle size={12} /> },
  moderate:{ label: "Monitor",   color: "bg-[#FBD000] text-black",    icon: <AlertTriangle size={12} /> },
  high:    { label: "Follow Up", color: "bg-[#E52521] text-white",    icon: <AlertTriangle size={12} /> },
  unknown: { label: "Pending",   color: "bg-black/10 text-black/40",  icon: <Clock size={12} /> },
};

const DOMAIN_ICONS: Record<string, string> = {
  reading: "📖", math: "🧮", writing: "✏️", attention: "🧠",
};

export default function AssessmentsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/assessments")
      .then(res => res.json())
      .then(res => {
        setData(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(item =>
    item.child_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />

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
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border-4 border-black py-3 pl-12 pr-4 text-sm font-black uppercase outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4 py-24">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-black text-black/40 uppercase tracking-widest">{t("assess_syncing")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-24 text-center">
                <p className="text-sm font-black text-black/20 uppercase tracking-widest italic">{t("assess_no_records")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((item, idx) => {
                  const hasScreening = item.domain_scores && Object.keys(item.domain_scores).length > 0;
                  const domains = Object.entries(item.domain_scores ?? {});
                  const highRisk = domains.filter(([, d]) => d.risk_level === "high").length;
                  const modRisk = domains.filter(([, d]) => d.risk_level === "moderate").length;

                  return (
                    <motion.div
                      key={`${item.id ?? "row"}-${idx}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black/10">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 border-2 border-black flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${hasScreening ? "bg-primary text-white" : "bg-muted text-black"}`}>
                            {item.child_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-black uppercase tracking-tight text-base italic">{item.child_name}</p>
                            <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                              Age {item.age} · {item.gender} · {item.school_grade ?? "—"}
                              {item.questionnaire_group && ` · Group ${item.questionnaire_group}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasScreening && (
                            <div className="flex items-center gap-2">
                              {highRisk > 0 && (
                                <span className="bg-[#E52521] text-white text-[10px] font-black uppercase px-2 py-1 border border-black">
                                  {highRisk} Follow Up
                                </span>
                              )}
                              {modRisk > 0 && (
                                <span className="bg-[#FBD000] text-black text-[10px] font-black uppercase px-2 py-1 border border-black">
                                  {modRisk} Monitor
                                </span>
                              )}
                              {highRisk === 0 && modRisk === 0 && (
                                <span className="bg-[#43B047] text-white text-[10px] font-black uppercase px-2 py-1 border border-black">
                                  All Low Risk
                                </span>
                              )}
                            </div>
                          )}
                          {item.report_url ? (
                            <Button variant="outline" size="sm" className="text-[10px] h-auto py-2 px-4 uppercase tracking-widest" asChild>
                              <a href={item.report_url} download target="_blank" rel="noopener noreferrer">
                                <FileDown size={14} className="mr-2" />
                                {t("assess_download_pdf")}
                              </a>
                            </Button>
                          ) : !hasScreening ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted border-2 border-black text-[10px] font-black text-black/20 uppercase tracking-widest italic">
                              <XCircle size={14} />
                              Pending
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Domain scores grid */}
                      {hasScreening && (
                        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {domains.map(([domain, ds]) => {
                            const risk = (ds.risk_level && RISK_CONFIG[ds.risk_level as keyof typeof RISK_CONFIG]
                              ? ds.risk_level as keyof typeof RISK_CONFIG
                              : "unknown");
                            const cfg = RISK_CONFIG[risk] ?? RISK_CONFIG.unknown;
                            const pct = Math.round((ds.composite_score ?? 0) * 100);
                            return (
                              <div key={domain} className="border-2 border-black overflow-hidden">
                                <div className={`flex items-center justify-between px-3 py-1.5 ${cfg.color}`}>
                                  <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                    {DOMAIN_ICONS[domain] ?? "🎯"} {domain}
                                  </span>
                                  <span className="flex items-center gap-1 text-[9px] font-black uppercase">
                                    {cfg.icon} {cfg.label}
                                  </span>
                                </div>
                                <div className="px-3 py-2 bg-white">
                                  <div className="flex justify-between text-[9px] font-black uppercase text-black/40 mb-1">
                                    <span>Score</span><span>{pct}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted border border-black/20">
                                    <div
                                      className={`h-full ${cfg.color.split(" ")[0]}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Flags */}
                      {(item.flags_for_assessment ?? []).length > 0 && (
                        <div className="px-6 pb-4 flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase tracking-widest text-black/40">Flagged:</span>
                          {(item.flags_for_assessment ?? []).map(f => (
                            <span key={f} className="bg-[#E52521] text-white text-[9px] font-black uppercase px-2 py-0.5 border border-black">
                              {f.replace("_risk", "")}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

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