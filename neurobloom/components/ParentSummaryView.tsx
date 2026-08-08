"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

export type RiskLevel = "low" | "moderate" | "high" | "unknown";

export interface DomainScore {
  status?: string;
  domain?: string;
  n_tasks?: number;
  composite_score?: number | null;
  risk_level?: RiskLevel | null;
  justification?: string;
  suggested_followup?: string;
}

export interface ParentSummaryReport {
  session_id?: string;
  questionnaire_group?: string;
  domain_scores?: Record<string, DomainScore>;
  flags_for_formal_assessment?: string[];
  global_impression?: {
    overall_pattern?: string;
    notes_for_parent?: string;
  };
  disclaimer?: string;
}

const RISK_CONFIG: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  low: { bg: "bg-[#43B047]", text: "text-white", label: "Low Risk", icon: <CheckCircle size={16} className="text-white" /> },
  moderate: { bg: "bg-[#FBD000]", text: "text-black", label: "Monitor", icon: <AlertTriangle size={16} className="text-black" /> },
  high: { bg: "bg-[#E52521]", text: "text-white", label: "Follow Up", icon: <AlertTriangle size={16} className="text-white" /> },
  unknown: { bg: "bg-black/10", text: "text-black/50", label: "Pending", icon: <Clock size={16} className="text-black/50" /> },
};

const DOMAIN_ICONS: Record<string, string> = {
  reading: "📖", math: "🧮", writing: "✏️", attention: "🧠", socioemotional: "😊"
};

export function ParentSummaryView({ report }: { report: ParentSummaryReport }) {
  const domains = Object.entries(report.domain_scores ?? {});
  const flagged = report.flags_for_formal_assessment ?? [];

  return (
    <div className="space-y-6">
      {/* Domain Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {domains.map(([domainKey, ds]) => {
          const isInsufficient = ds.status === "insufficient_data" || ds.composite_score === null;
          const riskKey = isInsufficient ? "unknown" : (ds.risk_level ?? "unknown");
          const cfg = RISK_CONFIG[riskKey] ?? RISK_CONFIG.unknown;
          const pct = ds.composite_score !== null && ds.composite_score !== undefined
            ? Math.round(ds.composite_score * 100)
            : null;

          if (isInsufficient) {
            return (
              <div key={domainKey} className="border-4 border-black bg-muted p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] opacity-70">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black uppercase text-sm tracking-widest text-black flex items-center gap-2">
                    <span>{DOMAIN_ICONS[domainKey] ?? "🎯"}</span> {domainKey}
                  </span>
                  <span className="bg-black/20 text-black text-[10px] font-black uppercase px-2 py-0.5 border border-black">
                    Incomplete
                  </span>
                </div>
                <p className="text-black/60 text-xs font-bold mt-2">
                  Not enough data — child did not complete enough tasks in this domain ({ds.n_tasks ?? 0} tasks recorded).
                </p>
              </div>
            );
          }

          return (
            <motion.div
              key={domainKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              {/* Header */}
              <div className={`flex items-center justify-between px-4 py-2 border-b-4 border-black ${cfg.bg}`}>
                <span className={`font-black uppercase text-sm tracking-widest ${cfg.text} flex items-center gap-2`}>
                  <span>{DOMAIN_ICONS[domainKey] ?? "🎯"}</span> {domainKey}
                </span>
                <span className={`flex items-center gap-1 text-[10px] font-black uppercase ${cfg.text} bg-black/20 px-2 py-0.5 border border-black/20`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                    <span>Overall Score</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-muted border-2 border-black">
                    <div className={`h-full ${cfg.bg}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {ds.justification && (
                  <p className="text-black text-xs font-bold leading-snug">{ds.justification}</p>
                )}
                {ds.suggested_followup && (
                  <p className="text-black/60 text-[10px] font-bold uppercase leading-snug border-t border-black/10 pt-2">
                    💡 {ds.suggested_followup}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Parent notes */}
      {report.global_impression?.notes_for_parent && (
        <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1">Parent Summary</p>
          <p className="text-black text-sm font-bold">{report.global_impression.notes_for_parent}</p>
        </div>
      )}

      {/* Flagged domains for formal assessment */}
      {flagged.length > 0 && (
        <div className="bg-[#E52521] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-white">
          <p className="text-xs font-black uppercase tracking-widest mb-2">
            ⚠ Recommended for Formal Assessment
          </p>
          <div className="flex flex-wrap gap-2">
            {flagged.map(f => (
              <span key={f} className="bg-white text-[#E52521] border-2 border-white px-3 py-1 text-xs font-black uppercase">
                {f.replace("_risk", "")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] font-black uppercase tracking-widest text-black/30 text-center leading-relaxed border-t-2 border-black/10 pt-4">
        ⚠️ {report.disclaimer ?? "Screening support tool only. Not a clinical diagnosis."}
      </p>
    </div>
  );
}
