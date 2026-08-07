"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Home, Sparkles, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { StudentData } from './StudentForm';
import { useEffect, useState, useRef } from "react";
import { useVideo } from "@/context/VideoContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";

interface TestCompleteProps {
  studentData: StudentData;
  onReturnHome: () => void;
}

type RiskLevel = "low" | "moderate" | "high" | "unknown";

interface DomainResult {
  domain: string;
  composite_score: number;
  risk_level: RiskLevel;
  justification?: string;
  suggested_followup?: string;
}

interface ScreeningReport {
  questionnaire_group: string;
  domain_scores: Record<string, DomainResult>;
  flags_for_formal_assessment: string[];
  global_impression?: {
    overall_pattern?: string;
    flags_for_formal_assessment?: string[];
    notes_for_parent?: string;
    alignment_with_NIMHANS_style?: string;
  };
  disclaimer?: string;
  rubric_version?: string;
  evidence_status?: string;
}

const RISK_STYLES: Record<RiskLevel, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
  low:     { bg: "bg-[#43B047]", border: "border-[#43B047]", icon: <CheckCircle size={20} className="text-white" />, label: "Low Risk" },
  moderate:{ bg: "bg-[#FBD000]", border: "border-[#FBD000]", icon: <AlertTriangle size={20} className="text-black" />, label: "Monitor" },
  high:    { bg: "bg-[#E52521]", border: "border-[#E52521]", icon: <AlertTriangle size={20} className="text-white" />, label: "Follow Up" },
  unknown: { bg: "bg-black/20",  border: "border-black/20",  icon: <Clock size={20} className="text-black/50" />, label: "Pending" },
};

const DOMAIN_ICONS: Record<string, string> = {
  reading: "📖", math: "🧮", writing: "✏️", attention: "🧠",
};

/** Poll GET /api/clinical_ai?sessionId=xxx every 4 s for up to 3 minutes */
function useScreeningReport(sessionId: string | null) {
  const [report, setReport]   = useState<ScreeningReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const attempts              = useRef(0);
  const MAX_ATTEMPTS          = 45;  // 45 × 4 s = 3 min

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    const poll = async () => {
      if (attempts.current >= MAX_ATTEMPTS) {
        setError("Screening analysis is taking longer than expected. Check back later.");
        setLoading(false);
        return;
      }
      attempts.current++;

      try {
        const res = await fetch(`/api/clinical_ai?sessionId=${sessionId}`);
        if (res.ok) {
          const data: ScreeningReport = await res.json();
          // Only accept if Phase 3 has run (has domain_scores with risk levels)
          const hasRealScores = Object.values(data.domain_scores ?? {}).some(
            (d) => d.risk_level && d.risk_level !== "unknown"
          );
          if (hasRealScores) {
            setReport(data);
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore — keep polling */ }

      setTimeout(poll, 4000);
    };

    // Small initial delay — screening fires fire-and-forget from AssessmentFlow
    setTimeout(poll, 3000);
  }, [sessionId]);

  return { report, loading, error };
}

export function TestComplete({ studentData, onReturnHome }: TestCompleteProps) {
  const { t } = useTranslation();
  const { stopAndUpload } = useVideo();
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });
  const sessionId = typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;

  const { report, loading, error } = useScreeningReport(sessionId);

  useEffect(() => {
    const stop = async () => { await stopAndUpload(); };
    stop();
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stopAndUpload]);

  const flaggedDomains = report?.flags_for_formal_assessment ?? [];

  return (
    <div className="min-h-screen bg-[#5C94FC] flex items-start justify-center overflow-auto p-4 relative">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>

      {/* Background */}
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />

      <div className="max-w-3xl w-full py-6 relative z-10 space-y-6">

        {/* ── Trophy header ── */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 10, 0], y: [0, -20, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <Trophy className="w-24 h-24 text-accent stroke-[3] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-3 -right-3"
              >
                <Star className="w-12 h-12 fill-accent text-black" />
              </motion.div>
            </div>
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            {t('tcomp_amazing')}{studentData.name}!
          </h1>
          <p className="text-xl text-white font-bold mb-4 bg-black/20 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
            {t('tcomp_adventure_complete')}
          </p>
        </motion.div>

        {/* ── Screening Results Panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          {/* Panel header */}
          <div className="bg-foreground px-6 py-4 border-b-4 border-black flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-widest">
                Screening Results
              </h2>
              {report && (
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                  Group {report.questionnaire_group} · {report.rubric_version} · {report.evidence_status}
                </p>
              )}
            </div>
            {loading && !report && (
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest">Analysing…</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">

              {/* Loading state */}
              {loading && !report && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-10 flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 border-4 border-black border-t-primary rounded-full animate-spin" />
                  <p className="text-black/60 font-black uppercase tracking-widest text-sm text-center max-w-xs">
                    Our research-aligned engine is analysing the responses…
                    <br /><span className="text-black/30 text-xs">This can take up to 60 seconds</span>
                  </p>
                </motion.div>
              )}

              {/* Error state */}
              {error && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center">
                  <AlertTriangle size={32} className="text-primary mx-auto mb-3" />
                  <p className="text-black/60 font-black uppercase tracking-widest text-sm">{error}</p>
                </motion.div>
              )}

              {/* Results */}
              {report && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  {/* Domain cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(report.domain_scores ?? {}).map(([domain, ds]) => {
                      const risk   = (RISK_STYLES[ds.risk_level as RiskLevel] ? ds.risk_level as RiskLevel : "unknown");
                      const styles = RISK_STYLES[risk] ?? RISK_STYLES["unknown"];
                      const pct    = Math.round((ds.composite_score ?? 0.5) * 100);
                      return (
                        <motion.div
                          key={domain}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          {/* Domain header */}
                          <div className={`flex items-center justify-between px-4 py-2 border-b-4 border-black ${styles.bg}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{DOMAIN_ICONS[domain] ?? "🎯"}</span>
                              <span className={`font-black uppercase text-sm tracking-widest ${risk === "moderate" ? "text-black" : "text-white"}`}>
                                {domain}
                              </span>
                            </div>
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-black/20 border border-black/20`}>
                              {styles.icon}
                              <span className={`text-[10px] font-black uppercase ${risk === "moderate" ? "text-black" : "text-white"}`}>
                                {styles.label}
                              </span>
                            </div>
                          </div>

                          {/* Score bar */}
                          <div className="p-4 bg-white space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                                <span>Composite score</span><span>{pct}%</span>
                              </div>
                              <div className="h-2 bg-muted border-2 border-black">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: 0.3, duration: 0.6 }}
                                  className={`h-full ${styles.bg}`}
                                />
                              </div>
                            </div>

                            {ds.justification && (
                              <p className="text-black text-xs font-bold leading-snug">{ds.justification}</p>
                            )}
                            {ds.suggested_followup && (
                              <p className="text-black/50 text-[10px] font-bold uppercase leading-snug border-t border-black/10 pt-2">
                                💡 {ds.suggested_followup}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Global pattern */}
                  {report.global_impression?.overall_pattern && (
                    <div className="bg-muted border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Overall pattern</p>
                      <p className="text-black text-sm font-bold">{report.global_impression.overall_pattern}</p>
                    </div>
                  )}

                  {/* Parent notes */}
                  {report.global_impression?.notes_for_parent && (
                    <div className="bg-accent border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black mb-1">For Parents</p>
                      <p className="text-black text-sm font-bold">{report.global_impression.notes_for_parent}</p>
                    </div>
                  )}

                  {/* Formal assessment flags */}
                  {flaggedDomains.length > 0 && (
                    <div className="bg-[#E52521] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-white text-xs font-black uppercase tracking-widest mb-2">
                        ⚠ Recommended for formal assessment
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {flaggedDomains.map(f => (
                          <span key={f} className="bg-white text-[#E52521] border-2 border-white px-3 py-1 text-xs font-black uppercase">
                            {f.replace("_risk", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 text-center leading-relaxed border-t-2 border-black/10 pt-4">
                    ⚠️ {report.disclaimer ?? "Screening aid only. Not a clinical diagnosis. Consult a qualified psychologist or special educator."}
                  </p>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Return home ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center pb-16"
        >
          <Button size="lg" onClick={onReturnHome} className="text-xl py-8 px-10 h-auto">
            <Home className="w-6 h-6" />
            {t('tcomp_return_home')}
          </Button>
        </motion.div>
      </div>

      {/* Floating Sparkles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: '110vh', x: Math.random() * windowSize.width }}
          animate={{ y: '-10vh' }}
          transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 5 }}
          className="absolute pointer-events-none"
        >
          <Sparkles className="text-accent w-6 h-6" />
        </motion.div>
      ))}
    </div>
  );
}