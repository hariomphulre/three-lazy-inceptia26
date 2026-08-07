"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Eye } from "lucide-react";

interface Level9Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
}

const ROUNDS = [
  { target: "HAPPY",    correct: "😊", options: ["😊", "😢", "😠"] },
  { target: "APPLE",    correct: "🍎", options: ["🚗", "🍎", "🐶"] },
  { target: "HOUSE",    correct: "🏠", options: ["🌳", "🌟", "🏠"] },
  { target: "SUN",      correct: "☀️", options: ["🌙", "☀️", "⭐"] },
  { target: "FISH",     correct: "🐟", options: ["🐟", "🐸", "🦋"] },
  { target: "ROCKET",   correct: "🚀", options: ["🚂", "⛵", "🚀"] },
];

export function Level9VisualDiscovery({ onComplete, onProgress, phase = 0 }: Level9Props) {
  const [round, setRound] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);

  const current = ROUNDS[round];

  const handlePick = (opt: string) => {
    if (feedback !== null) return;
    const isCorrect = opt === current.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) setScore((s) => s + 1);
    setTimeout(() => {
      setFeedback(null);
      if (round < ROUNDS.length - 1) {
        onProgress(round + 1);
        setRound((r) => r + 1);
      } else {
        onComplete();
      }
    }, isCorrect ? 1100 : 1400);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-[#00BCD4]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Eye size={18} className="text-[#00BCD4]" />
          </div>
          <span className="text-white font-black uppercase italic tracking-tight text-xl">Visual Discovery</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black uppercase tracking-widest">Score </span>
            <span className="text-lg font-black">{score}</span>
          </div>
          <div className="bg-black/20 border-2 border-white/40 px-3 py-1">
            <span className="text-white text-xs font-black uppercase tracking-widest">
              Scene {round + 1}/{ROUNDS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-3 bg-white border-b-2 border-black">
        <div
          className="h-full bg-[#FBD000] border-r-2 border-black transition-all duration-500"
          style={{ width: `${(round / ROUNDS.length) * 100}%` }}
        />
      </div>

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10 p-8 relative">
        <p className="text-center text-black/60 font-black uppercase tracking-widest text-sm">
          Match the word to the correct picture!
        </p>

        {/* Word card */}
        <motion.div
          key={round}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#00BCD4] border-4 border-black px-10 py-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-1"
        >
          <span className="text-white font-black uppercase tracking-widest text-5xl">
            {current.target}
          </span>
        </motion.div>

        {/* Options */}
        <div className="flex gap-6">
          {current.options.map((opt, i) => (
            <motion.button
              key={`${round}-${i}`}
              whileHover={{ scale: 1.08, y: -4 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handlePick(opt)}
              disabled={feedback !== null}
              className="w-28 h-28 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-6xl hover:bg-[#FBD000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-colors"
            >
              {opt}
            </motion.button>
          ))}
        </div>

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
                  {feedback === "correct" ? "Perfect Match!" : "Try Again!"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
