"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type RiskLevel = "low" | "moderate" | "high" | "unknown";

export interface SubScoreData {
  construct: string;
  score_0_to_1: number;
  n_tasks: number;
  flags?: string[];
  evidence_status?: string;
  rubric_version?: string;
}

export interface ClinicianDomainScore {
  status?: "complete" | "insufficient_data";
  domain?: string;
  n_tasks?: number;
  composite_score?: number | null;
  risk_level?: RiskLevel | null;
  driving_construct?: string | null;
  driving_reason?: string | null;
  subscores?: Record<string, SubScoreData> | null;
  justification?: string;
  suggested_followup?: string;
}

export interface RawTaskResponse {
  task_id: string;
  domain: string;
  construct: string;
  task_type: string;
  response_json?: any;
  reaction_time_ms?: number | null;
  created_at?: string;
}

export interface ChildProfile {
  id?: string;
  name?: string;
  age?: number;
  gender?: string;
  school_grade?: string;
  language?: string;
}

export interface ClinicianReportData {
  session_id?: string;
  child_profile?: ChildProfile;
  questionnaire_group?: string;
  domain_scores?: Record<string, ClinicianDomainScore>;
  flags_for_formal_assessment?: string[];
  global_impression?: {
    overall_pattern?: string;
    notes_for_parent?: string;
    alignment_with_NIMHANS_style?: string;
  };
  evidence_status?: string;
  rubric_version?: string;
  scoring_provider?: string;
  raw_task_responses?: RawTaskResponse[];
  disclaimer?: string;
  created_at?: string;
}

const RISK_CONFIG: Record<string, { bg: string; text: string; badgeBg: string; label: string; icon: React.ReactNode }> = {
  low: { bg: "bg-[#43B047]", text: "text-white", badgeBg: "bg-[#43B047] text-white", label: "Low Risk", icon: <CheckCircle size={14} className="text-white" /> },
  moderate: { bg: "bg-[#FBD000]", text: "text-black", badgeBg: "bg-[#FBD000] text-black", label: "Monitor", icon: <AlertTriangle size={14} className="text-black" /> },
  high: { bg: "bg-[#E52521]", text: "text-white", badgeBg: "bg-[#E52521] text-white", label: "Follow Up", icon: <AlertTriangle size={14} className="text-white" /> },
  unknown: { bg: "bg-black/10", text: "text-black/60", badgeBg: "bg-black/10 text-black/60", label: "Pending", icon: <Clock size={14} className="text-black/50" /> },
};

const DOMAIN_ICONS: Record<string, string> = {
  reading: "📖", math: "🧮", writing: "✏️", attention: "🧠", socioemotional: "😊"
};

export function ClinicianDetailView({
  report,
  childInfo
}: {
  report: ClinicianReportData;
  childInfo?: { name?: string; age?: number; gender?: string; grade?: string };
}) {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  const toggleDomain = (domain: string) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const profile = report.child_profile ?? {
    name: childInfo?.name ?? "Child",
    age: childInfo?.age ?? 8,
    gender: childInfo?.gender ?? "unknown",
    school_grade: childInfo?.grade ?? "unknown",
    language: "english"
  };

  const domains = Object.entries(report.domain_scores ?? {});
  const flagged = report.flags_for_formal_assessment ?? [];
  const rawTasks = report.raw_task_responses ?? [];

  return (
    <div className="space-y-6 print:space-y-4 print:text-black">
      {/* Printable Header & Action Strip */}
      <div className="flex items-center justify-between bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] print:border-b-2 print:shadow-none">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-primary text-white text-xs font-black px-2 py-1 uppercase border border-black">
              Clinical Report
            </span>
            <h2 className="text-2xl font-black text-black uppercase italic tracking-tight">
              {profile.name}
            </h2>
          </div>
          <p className="text-xs font-black text-black/60 uppercase tracking-widest mt-1">
            Age {profile.age} · {profile.gender} · Grade {profile.school_grade} · Language: {profile.language}
            {report.questionnaire_group && ` · Group ${report.questionnaire_group}`}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <Button onClick={handlePrint} size="sm" className="font-black uppercase tracking-wider gap-2">
            <Printer size={16} />
            Print Clinical Report
          </Button>
        </div>
      </div>

      {/* Top Summary Strip */}
      <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black text-black uppercase tracking-wider flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Overall Clinical Impression
            </h3>
            {report.global_impression?.overall_pattern && (
              <p className="text-sm font-bold text-black mt-2 leading-relaxed">
                {report.global_impression.overall_pattern}
              </p>
            )}
          </div>
          {report.rubric_version && (
            <span className="bg-muted border border-black/20 text-[10px] font-black text-black/60 px-2.5 py-1 uppercase tracking-widest whitespace-nowrap">
              {report.rubric_version}
            </span>
          )}
        </div>

        {/* Flagged Domains */}
        {flagged.length > 0 ? (
          <div className="bg-[#E52521] border-2 border-black p-3 text-white">
            <p className="text-xs font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <ShieldAlert size={16} /> Recommended for Formal Diagnostic Assessment:
            </p>
            <div className="flex flex-wrap gap-2">
              {flagged.map(f => (
                <span key={f} className="bg-white text-[#E52521] border border-white px-2.5 py-0.5 text-xs font-black uppercase">
                  {f.replace("_risk", "")}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#43B047]/10 border-2 border-[#43B047] p-3 text-[#43B047]">
            <p className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle size={16} /> No domains flagged for formal diagnostic assessment.
            </p>
          </div>
        )}

        {/* NIMHANS alignment note */}
        {report.global_impression?.alignment_with_NIMHANS_style && (
          <div className="text-xs text-black/70 font-medium italic border-t border-black/10 pt-2">
            <strong>NIMHANS SLD Battery Alignment:</strong> {report.global_impression.alignment_with_NIMHANS_style}
          </div>
        )}

        {/* Mandatory Disclaimer */}
        <div className="bg-black/5 border border-black/20 p-2.5 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-black/60">
            ⚠️ Research-aligned screening support tool — not a clinical diagnosis. Formal diagnostic assessment required for any flagged domain.
          </p>
        </div>
      </div>

      {/* Domain Cards Grid */}
      <div className="space-y-4">
        {domains.map(([domainKey, ds]) => {
          const isInsufficient = ds.status === "insufficient_data" || ds.composite_score === null;
          const riskKey = isInsufficient ? "unknown" : (ds.risk_level ?? "unknown");
          const cfg = RISK_CONFIG[riskKey] ?? RISK_CONFIG.unknown;
          const isExpanded = expandedDomains[domainKey] ?? false;
          const pct = ds.composite_score !== null && ds.composite_score !== undefined
            ? Math.round(ds.composite_score * 100)
            : null;

          const domainTasks = rawTasks.filter(t => t.domain === domainKey);

          return (
            <div
              key={domainKey}
              className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden print:shadow-none print:break-inside-avoid"
            >
              {/* Header (Summary Bar) */}
              <div
                onClick={() => !isInsufficient && toggleDomain(domainKey)}
                className={`p-4 flex items-center justify-between cursor-pointer select-none transition-colors border-b-4 border-black ${isInsufficient ? "bg-muted opacity-75 cursor-default" : "hover:bg-black/5"}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{DOMAIN_ICONS[domainKey] ?? "🎯"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black text-base uppercase tracking-tight italic">
                        {domainKey}
                      </span>
                      {!isInsufficient && (
                        <span className="text-sm font-black text-black/60">
                          — {pct}% Overall
                        </span>
                      )}
                    </div>
                    {/* Backend driving_reason transparency line */}
                    <p className="text-xs font-bold text-black/70 mt-0.5">
                      {ds.driving_reason ?? (isInsufficient ? "Insufficient task responses recorded." : "Screening complete.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase border border-black ${cfg.badgeBg}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  {!isInsufficient && (
                    <button type="button" className="p-1 text-black print:hidden">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Insufficient Data State */}
              {isInsufficient && (
                <div className="p-4 bg-muted text-black/60 text-xs font-bold italic">
                  Not enough data — child completed {ds.n_tasks ?? 0} task(s) in this domain. Minimum required tasks were not submitted.
                </div>
              )}

              {/* Expandable Clinician Detail Section (Always visible in Print mode) */}
              {(!isInsufficient && (isExpanded || true)) && (
                <div className={`${isExpanded ? "block" : "hidden print:block"} p-6 bg-white space-y-6 border-t-2 border-black/10`}>
                  
                  {/* a) Subscores Table */}
                  {ds.subscores && Object.keys(ds.subscores).length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-black/60 mb-2 flex items-center gap-2">
                        <FileText size={14} /> Construct Subscore Breakdown
                      </h4>
                      <div className="overflow-x-auto border-2 border-black">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-black/5 border-b-2 border-black font-black uppercase tracking-wider text-black">
                            <tr>
                              <th className="p-2 border-r border-black">Construct</th>
                              <th className="p-2 border-r border-black">Raw Score (0–1)</th>
                              <th className="p-2 border-r border-black">Normalized (0–100)</th>
                              <th className="p-2 border-r border-black">Band</th>
                              <th className="p-2">Flags</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 font-bold text-black">
                            {Object.entries(ds.subscores).map(([cName, ss]) => {
                              const raw = ss.score_0_to_1;
                              const norm = Math.round(raw * 100);
                              const isWeak = cName === ds.driving_construct;
                              return (
                                <tr key={cName} className={isWeak ? "bg-[#FBD000]/20 font-black" : ""}>
                                  <td className="p-2 border-r border-black uppercase">{cName.replace(/_/g, " ")}</td>
                                  <td className="p-2 border-r border-black">{raw.toFixed(2)}</td>
                                  <td className="p-2 border-r border-black">{norm}%</td>
                                  <td className="p-2 border-r border-black">
                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${norm >= 75 ? "bg-[#43B047] text-white" : norm >= 50 ? "bg-[#FBD000] text-black" : "bg-[#E52521] text-white"}`}>
                                      {norm >= 75 ? "Pass" : norm >= 50 ? "Monitor" : "Deficit"}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    {(ss.flags ?? []).length > 0 ? (
                                      <span className="text-[10px] font-bold text-[#E52521]">{ss.flags?.join(", ")}</span>
                                    ) : (
                                      <span className="text-[10px] text-black/30 italic">None</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* b) Justification & Clinical Interpretation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/5 p-4 border-2 border-black">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-1">Parent Explanation</p>
                      <p className="text-xs font-bold text-black">{ds.justification || "No justification recorded."}</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-2 border-black">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Clinical Impression</p>
                      <p className="text-xs font-bold text-black">
                        {ds.driving_reason} {ds.driving_construct ? `Specific deficit detected in construct '${ds.driving_construct}'.` : "Construct scores align with expected developmental ranges."}
                      </p>
                    </div>
                  </div>

                  {/* c) Actionable Checklist */}
                  {ds.suggested_followup && (
                    <div className="bg-accent/20 border-2 border-black p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black mb-2">💡 Recommended Actions</p>
                      <p className="text-xs font-bold text-black">{ds.suggested_followup}</p>
                    </div>
                  )}

                  {/* d) Task-Level Raw Evidence Table */}
                  {domainTasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-black/60 mb-2 flex items-center gap-2">
                        <Activity size={14} /> Raw Gameplay Evidence (Tasks Submitted)
                      </h4>
                      <div className="overflow-x-auto border-2 border-black">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-black/5 border-b-2 border-black font-black uppercase tracking-wider text-black">
                            <tr>
                              <th className="p-2 border-r border-black">Task ID</th>
                              <th className="p-2 border-r border-black">Task Type</th>
                              <th className="p-2 border-r border-black">Construct</th>
                              <th className="p-2 border-r border-black">Reaction Time</th>
                              <th className="p-2">Response Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 font-bold text-black">
                            {domainTasks.map((t, idx) => (
                              <tr key={`${t.task_id}-${idx}`}>
                                <td className="p-2 border-r border-black font-mono text-[11px]">{t.task_id}</td>
                                <td className="p-2 border-r border-black uppercase">{t.task_type}</td>
                                <td className="p-2 border-r border-black uppercase text-[11px]">{t.construct}</td>
                                <td className="p-2 border-r border-black">{t.reaction_time_ms ? `${t.reaction_time_ms} ms` : "—"}</td>
                                <td className="p-2 font-mono text-[10px] text-black/70">
                                  {JSON.stringify(t.response_json ?? {})}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* e) Heuristic Transparency Badge */}
                  <div className="flex items-center justify-between text-[10px] text-black/40 font-black uppercase tracking-widest border-t border-black/10 pt-3">
                    <span>Evidence Status: {report.evidence_status ?? "prototype_heuristic"}</span>
                    <span>Rubric: {report.rubric_version ?? "prototype-heuristic-v1"} — Prototype heuristic, not a validated diagnostic norm</span>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
