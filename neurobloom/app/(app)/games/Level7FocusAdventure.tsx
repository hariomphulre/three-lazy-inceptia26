"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Check, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Level7Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
}

const TOTAL_ROUNDS = 6;

export function Level7FocusAdventure({ onComplete, onProgress, phase = 0 }: Level7Props) {
  const { t } = useTranslation();
  const [round, setRound] = useState(0);
  const [light, setLight] = useState<"red" | "yellow" | "green">("red");
  const [feedback, setFeedback] = useState<"correct" | "early" | null>(null);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const startRound = () => {
    setFeedback(null);
    setLight("red");
    timerRef.current = setTimeout(() => {
      setLight("yellow");
      timerRef.current = setTimeout(() => {
        setLight("green");
      }, Math.random() * 1700 + 800);
    }, 600);
  };

  useEffect(() => { startRound(); return clear; }, [round]);

  const handleTap = () => {
    if (feedback !== null) return;
    clear();
    if (light === "green") {
      setFeedback("correct");
      setScore((s) => s + 1);
    } else {
      setFeedback("early");
    }
    setTimeout(() => {
      if (round < TOTAL_ROUNDS - 1) {
        onProgress(round + 1);
        setRound((r) => r + 1);
      } else {
        onComplete();
      }
    }, 1200);
  };

  const bgMap = { red: "bg-[#E52521]", yellow: "bg-[#FBD000]", green: "bg-[#43B047]" };
  const labelMap = { red: t("game_l7_light_red"), yellow: t("game_l7_light_yellow"), green: t("game_l7_light_green") };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-[#E52521]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Zap size={18} className="text-[#E52521]" />
          </div>
          <span className="text-white font-black uppercase italic tracking-tight text-xl">{t("game_l7_title")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase tracking-widest">{t("game_l7_score")}{" "}</span>
            <span className="text-lg font-black">{score}</span>
          </div>
          <div className="bg-black/20 border-2 border-white/40 px-3 py-1">
            <span className="text-white text-xs font-black uppercase tracking-widest">
              {t("game_l7_round")} {round + 1}/{TOTAL_ROUNDS}
            </span>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-3 bg-white border-b-2 border-black">
        <div
          className="h-full bg-[#FBD000] border-r-2 border-black transition-all duration-500"
          style={{ width: `${(round / TOTAL_ROUNDS) * 100}%` }}
        />
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 p-8 relative">
        <p className="text-center text-black/60 font-black uppercase tracking-widest text-sm max-w-sm">
          {t("game_l7_instr")}
        </p>

        {/* Traffic light */}
        <div className="flex flex-col items-center gap-3 bg-black border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {(["red", "yellow", "green"] as const).map((c) => (
            <div
              key={c}
              className={`w-20 h-20 rounded-full border-4 border-black transition-all duration-150 ${
                light === c ? bgMap[c] : "bg-black/30"
              }`}
            />
          ))}
        </div>

        {/* Tap button */}
        <motion.button
          whileTap={{ scale: 0.94, y: 2 }}
          onClick={handleTap}
          disabled={feedback !== null}
          className={`text-2xl font-black uppercase italic tracking-widest px-14 py-7 border-4 border-black transition-colors ${
            light === "green"
              ? "bg-[#43B047] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
              : "bg-white text-black/40 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-not-allowed"
          }`}
        >
          {labelMap[light]}
        </motion.button>

        {/* Feedback overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key="fb"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                className={`border-8 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 ${
                  feedback === "correct" ? "bg-[#43B047] rotate-3" : "bg-[#E52521] -rotate-3"
                }`}
              >
                {feedback === "correct" ? (
                  <Check size={72} strokeWidth={4} className="text-white" />
                ) : (
                  <X size={72} strokeWidth={4} className="text-white" />
                )}
                <span className="text-white font-black uppercase italic text-xl tracking-tight">
                  {feedback === "correct" ? t("game_l7_correct") : t("game_l7_early")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
