"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle, CheckCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { CardStatus } from "@/hooks/useProgress";

/* ─── Shared phase / disability-config types ──────────────────────────────── */
export interface DisabilityPhase {
  title: string;
  emoji: string;
  days: string;
  activities: string[];
  difficulty?: string;
}

export interface DisabilityConfig {
  label: string;
  questName: string;
  description: string;
  duration: string;
  method: string;
  color: [string, string];
  icon: React.ReactNode;
  phases: DisabilityPhase[];
}

/* ─── Props ───────────────────────────────────────────────────────────────── */
export interface PathGameModalProps {
  open: boolean;
  onClose: () => void;
  childName: string;
  disability: string;
  assessmentId: string;
  progress: number;
  totalActivities: number;
  cfg: DisabilityConfig | undefined;
  status: CardStatus;
  onFirstStart: () => void;
}

/* ─── Component ───────────────────────────────────────────────────────────── */
export function PathGameModal({
  open,
  onClose,
  childName,
  disability,
  assessmentId,
  progress,
  totalActivities,
  cfg,
  status,
  onFirstStart,
}: PathGameModalProps) {
  const router = useRouter();
  const { t } = useTranslation();

  if (!cfg || !open) return null;

  const pct = totalActivities > 0 ? Math.round((progress / totalActivities) * 100) : 0;

  let cum = 0;
  const phaseStatuses = cfg.phases.map((phase) => {
    const start = cum;
    const end = cum + phase.activities.length;
    cum = end;
    return {
      start,
      end,
      isComplete: progress >= end,
      isCurrent: progress >= start && progress < end,
      isLocked: progress < start,
    };
  });

  const handleStartActivity = (phaseIdx: number) => {
    if (status === "idle") onFirstStart();
    onClose();
    router.push(
      `/quest?assessmentId=${assessmentId}&disability=${encodeURIComponent(disability.toLowerCase())}&phase=${phaseIdx}&activity=${progress}`
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/80 overflow-y-auto py-8 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-4xl bg-background border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          >
            {/* ── Header ── */}
            <div className="bg-primary p-8 border-b-4 border-black relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 text-[140px] pointer-events-none leading-none select-none">
                {cfg.icon}
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors z-10"
              >
                <XCircle size={18} className="text-black" />
              </button>
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-1">{childName}</p>
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                {cfg.questName}
              </h2>
              <p className="text-white/80 text-xs font-black uppercase tracking-widest mt-2">
                {cfg.description} &middot; {cfg.duration} &middot; {cfg.method}
              </p>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                    {t("pgm_overall_progress")}
                  </span>
                  <span className="text-white text-[10px] font-black uppercase">
                    {progress}/{totalActivities} &middot; {pct}%
                  </span>
                </div>
                <div className="h-3 bg-white/20 border-2 border-white/40 overflow-hidden">
                  <div
                    className="h-full bg-accent border-r-2 border-black transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ── Phase list ── */}
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-black uppercase italic tracking-tight">{t("pgm_learning_path")}</h3>
                <span className="text-xs font-black text-black/40 uppercase tracking-widest">
                  {cfg.phases.length} {t("pgm_phases")} &middot; {totalActivities} {t("pgm_activities")}
                </span>
              </div>

              <div className="space-y-4">
                {cfg.phases.map((phase, idx) => {
                  const ps = phaseStatuses[idx];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className={`border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${
                        ps.isLocked ? "opacity-50" : ps.isComplete ? "opacity-75" : ""
                      }`}
                    >
                      {/* Phase header */}
                      <div
                        className={`flex items-center gap-4 p-4 border-b-4 border-black ${
                          ps.isCurrent ? "bg-accent" : ps.isComplete ? "bg-[#43B047]" : "bg-muted"
                        }`}
                      >
                        <div
                          className={`w-12 h-12 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                            ps.isLocked ? "bg-white/50" : "bg-white"
                          }`}
                        >
                          <span className="text-2xl">{ps.isLocked ? "🔒" : phase.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black ${
                                ps.isCurrent
                                  ? "bg-primary text-white"
                                  : ps.isComplete
                                  ? "bg-white text-[#43B047]"
                                  : "bg-white/60 text-black/40"
                              }`}
                            >
                              {ps.isCurrent ? t("pgm_current") : ps.isComplete ? t("pgm_complete") : `${t("pgm_phase")} ${idx + 1}`}
                            </span>
                            {phase.difficulty && (
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black bg-secondary text-white">
                                {phase.difficulty}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-lg font-black uppercase italic tracking-tight ${
                              ps.isComplete ? "text-white" : "text-black"
                            }`}
                          >
                            {t("pgm_phase")} {idx + 1}: {phase.title}
                          </p>
                          <p
                            className={`text-[10px] font-black uppercase tracking-widest ${
                              ps.isComplete ? "text-white/70" : "text-black/40"
                            }`}
                          >
                            {phase.days} &middot; {phase.activities.length} {t("pgm_games")}
                          </p>
                        </div>
                        {ps.isComplete && <CheckCircle size={22} className="text-white flex-shrink-0" />}
                      </div>

                      {/* Activities grid */}
                      <div className={`p-4 ${ps.isCurrent ? "bg-white" : "bg-muted/40"}`}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {phase.activities.map((act, i) => {
                            const globalIdx = ps.start + i;
                            const isDone = progress > globalIdx;
                            const isActive = progress === globalIdx && ps.isCurrent;
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-2 border-2 border-black transition-all ${
                                  isDone
                                    ? "bg-[#43B047]/15 border-[#43B047]"
                                    : isActive
                                    ? "bg-accent border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    : "bg-white"
                                }`}
                              >
                                <div
                                  className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 border-black text-[9px] font-black ${
                                    isDone
                                      ? "bg-[#43B047] text-white"
                                      : isActive
                                      ? "bg-primary text-white"
                                      : "bg-muted text-black"
                                  }`}
                                >
                                  {isDone ? "✓" : i + 1}
                                </div>
                                <span
                                  className={`text-[10px] font-bold uppercase leading-tight ${
                                    isDone
                                      ? "text-black/40 line-through"
                                      : isActive
                                      ? "text-black font-black"
                                      : "text-black/70"
                                  }`}
                                >
                                  {act}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {ps.isCurrent && (
                          <div className="mt-4">
                            <Button
                              onClick={() => handleStartActivity(idx)}
                              className="w-full py-5 text-sm uppercase italic tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                            >
                              <Play size={14} className="fill-current mr-2" />
                              {status === "idle" ? t("pgm_start_adventure") : t("pgm_continue_adventure")}
                            </Button>
                          </div>
                        )}

                        {status === "complete" && idx === cfg.phases.length - 1 && (
                          <div className="mt-4 w-full py-3 bg-[#43B047] border-4 border-black text-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-sm font-black uppercase italic tracking-wider">
                              {t("pgm_quest_cleared")} &#127942;
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="p-6 bg-muted border-t-4 border-black flex items-center justify-between">
              <p className="text-xs font-black text-black/40 uppercase tracking-widest">
                {childName} &middot; {cfg.label} &middot; {cfg.duration}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white border-4 border-black text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                {t("pgm_close")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
