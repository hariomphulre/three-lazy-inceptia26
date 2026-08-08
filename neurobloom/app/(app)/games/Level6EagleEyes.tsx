"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Check, X } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";

interface Level6Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
}

export function Level6EagleEyes({ onComplete, onProgress }: Level6Props) {
  const { t } = useTranslation();
  const [currentGame, setCurrentGame] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showMemoryItems, setShowMemoryItems] = useState(true);
  const [memoryTimer, setMemoryTimer] = useState(5);
  const questionStartTime = useRef<number>(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    questionStartTime.current = Date.now();
    // Scroll to top on game change
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentGame]);

  const handleAnswer = async (isCorrect: boolean, answerIndex?: number) => {
    const score = isCorrect ? 1 : 0;
    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const sessionId = localStorage.getItem("sessionId");

    setSelectedAnswer(answerIndex ?? null);

    const payloadMap: any = {
      0: { test6_q1_score: score, test6_q1_time: timeTaken },
      1: { test6_q2_score: score, test6_q2_time: timeTaken },
      2: { test6_q3_score: score, test6_q3_time: timeTaken },
      3: { test6_q4_score: score, test6_q4_time: timeTaken },
    };

    await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        payload: payloadMap[currentGame],
        screening_task: {
          task_id: `eagle-eyes-${currentGame + 1}`,
          domain: "attention",
          construct: "selective_attention",
          task_type: "eagle_eyes",
          response_data: { score, correct: isCorrect },
          reaction_time_ms: timeTaken * 1000
        }
      })
    });

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      if (currentGame < 3) {
        setCurrentGame(currentGame + 1);
        onProgress(currentGame + 1);
      } else {
        onComplete();
      }
    }, 1000);
  };

  useEffect(() => {
    if (currentGame === 1 && showMemoryItems && memoryTimer > 0) {
      const timer = setTimeout(() => {
        setMemoryTimer(memoryTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (memoryTimer === 0) {
      setShowMemoryItems(false);
    }
  }, [currentGame, memoryTimer, showMemoryItems]);

  const originalMemoryItems = [0, 2, 4, 6, 8, 9];
  const allMemoryItems = ['🍎', '🚗', '⚽', '🌟', '🎨', '📚', '🍕', '🎮', '🌈', '🦋'];

  const games = [
    // Game 1: Odd One Out
    <div key="odd-one-out" className="text-center w-full">
      <h2 className="text-2xl sm:text-4xl font-black text-black mb-4 uppercase tracking-tight">
        {t('game_ee1_title')}
      </h2>

      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-6xl sm:text-8xl mb-6 drop-shadow-lg"
      >
        🦅
      </motion.div>

      <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6">
        <p className="text-lg sm:text-2xl font-black text-black mb-6 uppercase tracking-widest">
          {t('game_ee1_instr')}
        </p>
        {/* Shapes — smaller on mobile, side-scrollable if needed */}
        <div className="flex justify-center items-center gap-3 sm:gap-6 overflow-x-auto pb-2">
          {['●', '●', '■', '●'].map((shape, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1, y: -4 }}
              whileTap={{ scale: 0.9, y: 0 }}
              onClick={() => handleAnswer(index === 2, index)}
              className={`text-4xl sm:text-6xl p-6 sm:p-10 border-4 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none flex-shrink-0 ${
                selectedAnswer === index
                  ? feedback === 'correct' ? 'bg-secondary text-white' : 'bg-primary text-white'
                  : 'bg-white text-black hover:bg-accent'
              }`}
            >
              {shape}
            </motion.button>
          ))}
        </div>
      </div>
    </div>,

    // Game 2: Memory
    <div key="memory" className="text-center w-full">
      <h2 className="text-2xl sm:text-4xl font-black text-black mb-4 uppercase tracking-tight">
        {t('game_ee2_title')}
      </h2>

      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="text-6xl sm:text-8xl mb-6 drop-shadow-lg"
      >
        🎯
      </motion.div>

      {showMemoryItems ? (
        <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-accent border-4 border-black text-black text-base sm:text-xl font-black px-6 py-3 inline-block mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase">
            {t('game_ee2_remember')} {t('game_ee2_time')} {memoryTimer}s
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-xs sm:max-w-md mx-auto">
            {originalMemoryItems.map((itemIndex) => (
              <motion.div
                key={itemIndex}
                className="bg-muted border-4 border-black p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-4xl sm:text-6xl"
              >
                {allMemoryItems[itemIndex]}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-lg sm:text-2xl font-black text-black mb-6 uppercase tracking-widest">
            {t('game_ee2_select')} <span className="text-primary">({selectedItems.length}/6)</span>
          </p>
          {/* 5-column grid on sm+, 2-column on mobile */}
          <div className="grid grid-cols-5 gap-3 max-w-xs sm:max-w-2xl mx-auto mb-8">
            {allMemoryItems.map((item, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (selectedItems.includes(index)) {
                    setSelectedItems(selectedItems.filter(i => i !== index));
                  } else if (selectedItems.length < 6) {
                    setSelectedItems([...selectedItems, index]);
                  }
                }}
                className={`p-3 sm:p-6 border-4 border-black transition-all text-3xl sm:text-5xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
                  selectedItems.includes(index) ? 'bg-secondary' : 'bg-white hover:bg-muted'
                }`}
              >
                {item}
              </motion.button>
            ))}
          </div>
          <Button
            size="lg"
            onClick={() => {
              const correct = selectedItems.length === 6 && selectedItems.every(i => originalMemoryItems.includes(i));
              handleAnswer(correct);
            }}
            disabled={selectedItems.length !== 6}
            className="text-xl sm:text-2xl py-6 sm:py-8 px-10 sm:px-12"
          >
            {t('game_ee2_btn_check')}
          </Button>
        </div>
      )}
    </div>,

    // Game 3: Mirror Letters
    <div key="mirror-letters" className="text-center w-full">
      <h2 className="text-2xl sm:text-4xl font-black text-black mb-4 tracking-tight">
        {t('game_ee3_title')}
      </h2>

      <motion.div
        animate={{ scaleX: [-1, 1, -1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-6xl sm:text-8xl mb-6 drop-shadow-lg"
      >
        🦋
      </motion.div>

      <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-lg sm:text-2xl font-black text-black mb-8 uppercase tracking-widest">
          {t('game_ee3_instr')}
        </p>
        {/* 2×2 on mobile, 4-col on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-sm sm:max-w-2xl mx-auto">
          {['b', 'd', 'p', 'q'].map((letter, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95, y: 0 }}
              onClick={() => handleAnswer(index === 1, index)}
              className={`text-5xl sm:text-7xl font-black p-6 sm:p-10 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
                selectedAnswer === index
                  ? feedback === 'correct' ? 'bg-secondary text-white' : 'bg-primary text-white'
                  : 'bg-white text-black hover:bg-accent'
              }`}
            >
              {letter}
            </motion.button>
          ))}
        </div>
      </div>
    </div>,

    // Game 4: Visual Puzzle
    <div key="visual-puzzle" className="text-center w-full">
      <h2 className="text-2xl sm:text-4xl font-black text-black mb-4 uppercase tracking-tight">
        {t('game_ee4_title')}
      </h2>

      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="text-6xl sm:text-8xl mb-6 drop-shadow-lg"
      >
        🎨
      </motion.div>

      <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Pattern row — shrinks gracefully on small screens */}
        <div className="flex justify-center items-center gap-2 sm:gap-4 mb-8 bg-muted border-4 border-black p-4 sm:p-8 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          {['🔴', '🔵', '🔴', '🔵', '❓'].map((emoji, i) => (
            <span
              key={i}
              className={`text-4xl sm:text-6xl ${i === 4 ? 'animate-bounce' : ''}`}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-xs sm:max-w-lg mx-auto">
          {[
            { emoji: '🔴', label: t('game_ee4_red'), correct: true },
            { emoji: '🔵', label: t('game_ee4_blue'), correct: false },
            { emoji: '🟢', label: t('game_ee4_green'), correct: false },
          ].map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95, y: 0 }}
              onClick={() => handleAnswer(option.correct, index)}
              className={`p-4 sm:p-8 border-4 border-black transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none ${
                selectedAnswer === index
                  ? feedback === 'correct' ? 'bg-secondary text-white' : 'bg-primary text-white'
                  : 'bg-white text-black hover:bg-accent'
              }`}
            >
              <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{option.emoji}</div>
              <p className="text-sm sm:text-xl font-black uppercase">{option.label}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>,
  ];

  return (
    <div
      ref={containerRef}
      className="relative max-w-4xl mx-auto px-4 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <motion.div
        key={currentGame}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="pb-8"
      >
        {games[currentGame]}
      </motion.div>

      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 bg-black/20 backdrop-blur-sm"
        >
          <div className={`p-10 sm:p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
            feedback === 'correct' ? 'bg-secondary text-white' : 'bg-primary text-white'
          }`}>
            {feedback === 'correct' ? (
              <Check className="w-24 h-24 sm:w-32 sm:h-32 stroke-[4]" />
            ) : (
              <X className="w-24 h-24 sm:w-32 sm:h-32 stroke-[4]" />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}