"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Check, Volume2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Level8Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
}

const WORDS = [
  { dispKey: "game_l8_word1", syllables: 3, emoji: "🍌" },
  { dispKey: "game_l8_word2", syllables: 3, emoji: "🐘" },
  { dispKey: "game_l8_word3", syllables: 3, emoji: "☂️" },
  { dispKey: "game_l8_word4", syllables: 4, emoji: "🍉" },
  { dispKey: "game_l8_word5", syllables: 3, emoji: "🦋" },
  { dispKey: "game_l8_word6", syllables: 5, emoji: "🦛" },
];

export function Level8ClarityQuest({ onComplete, onProgress, phase = 0 }: Level8Props) {
  const { t } = useTranslation();
  const [idx, setIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const word = WORDS[idx];

  const handleSpeak = () => {
    if (recording || showFeedback) return;
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setShowFeedback(true);
      const sessionId = typeof window !== 'undefined' ? localStorage.getItem("sessionId") : null;
      if (sessionId) {
        fetch("/api/session/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            screening_task: {
              task_id: `clarity-quest-${idx + 1}`,
              domain: "reading",
              construct: "phonological_awareness",
              task_type: "clarity_quest",
              response_data: { word: word.dispKey, syllables: word.syllables, spoken: true },
              reaction_time_ms: 2000
            }
          })
        }).catch((e) => console.warn("Failed to save Level8 progress:", e));
      }
      setTimeout(() => {
        setShowFeedback(false);
        if (idx < WORDS.length - 1) {
          onProgress(idx + 1);
          setIdx((i) => i + 1);
        } else {
          onComplete();
        }
      }, 1400);
    }, 2000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-[#9C27B0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Volume2 size={18} className="text-[#9C27B0]" />
          </div>
          <span className="text-white font-black uppercase italic tracking-tight text-xl">{t("game_l8_title")}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase tracking-widest">{t("game_l8_word")}{" "}</span>
            <span className="text-lg font-black">{idx + 1}/{WORDS.length}</span>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-3 bg-white border-b-2 border-black">
        <div
          className="h-full bg-[#FBD000] border-r-2 border-black transition-all duration-500"
          style={{ width: `${(idx / WORDS.length) * 100}%` }}
        />
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 relative">
        <p className="text-center text-black/60 font-black uppercase tracking-widest text-sm">
          {t("game_l8_instr")}
        </p>

        {/* Word card */}
        <motion.div
          key={idx}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] px-10 py-8 flex flex-col items-center gap-4"
        >
          <span className="text-7xl">{word.emoji}</span>
          <div className="bg-[#9C27B0] border-2 border-black px-6 py-3">
            <span className="text-white font-black uppercase tracking-widest text-3xl">
              {t(word.dispKey)}
            </span>
          </div>
          <div className="flex gap-2 mt-1">
            {Array.from({ length: word.syllables }).map((_, i) => (
              <div key={i} className="w-8 h-8 border-2 border-black bg-[#FBD000] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="font-black text-black text-sm">{i + 1}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mic button */}
        <button
          onClick={handleSpeak}
          disabled={recording || showFeedback}
          className={`flex items-center gap-4 text-xl font-black uppercase italic tracking-widest px-12 py-6 border-4 border-black transition-all ${
            recording
              ? "bg-[#E52521] text-white shadow-none translate-y-1 translate-x-1"
              : "bg-[#049CD8] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#0380B5] active:shadow-none active:translate-x-1 active:translate-y-1"
          }`}
        >
          <Mic size={28} className={recording ? "animate-bounce" : ""} />
          {recording ? t("game_l8_listening") : t("game_l8_btn_say")}
        </button>

        {/* Feedback overlay */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              key="fb"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-[#43B047] border-8 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 rotate-3">
                <Check size={72} strokeWidth={4} className="text-white" />
                <span className="text-white font-black uppercase italic text-2xl tracking-tight">
                  {t("game_l8_great")}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
