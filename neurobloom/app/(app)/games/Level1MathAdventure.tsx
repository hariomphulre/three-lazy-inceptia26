"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Star, Coins } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from '@/components/ui/button';
import { saveSession } from "@/lib/offline/session";


interface Level1Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  sessionId?: string | null;
  questionnaireGroup?: "A" | "B" | "C";
}

export function Level1MathAdventure({ onComplete, onProgress, sessionId, questionnaireGroup = "A" }: Level1Props) {
  if (questionnaireGroup === "B") {
    return <GroupBMathAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
  }

  if (questionnaireGroup === "C") {
    return <GroupCMathAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
  }

  const { t } = useTranslation();
  const [currentGame, setCurrentGame] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedCoins, setSelectedCoins] = useState<number[]>([]);

  const questionStartTime = useRef<number>(Date.now());
  // Ref to scroll back to top when game changes
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    questionStartTime.current = Date.now();
    // Scroll to top of the game container on each new game
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentGame]);


  const GAME_TASK_IDS = [
    { id: "A-math-counting-1",   construct: "number_sense",        type: "count_apples" },
    { id: "A-math-compare-1",    construct: "number_sense",        type: "which_has_more" },
    { id: "A-math-compare-2",    construct: "number_sense",        type: "compare_numbers" },
    { id: "A-math-add-1",        construct: "arithmetic_fluency",  type: "add_numbers" },
    { id: "A-math-money-1",      construct: "arithmetic_fluency",  type: "coin_game" },
    { id: "A-math-subtract-1",   construct: "arithmetic_fluency",  type: "candy_subtraction" },
  ];

  const handleAnswer = async (isCorrect: boolean) => {
    const reactionTimeMs = Date.now() - questionStartTime.current;
    const sessionId = localStorage.getItem("sessionId");
    const scoreValue = isCorrect ? 1 : 0;
    const taskMeta = GAME_TASK_IDS[currentGame];

    const legacyPayload: any = {
      0: { test1_q1: scoreValue, test1_q1_time: Math.floor(reactionTimeMs / 1000) },
      1: { test1_q2: scoreValue, test1_q2_time: Math.floor(reactionTimeMs / 1000) },
      2: { test1_q3: scoreValue, test1_q3_time: Math.floor(reactionTimeMs / 1000) },
      3: { test1_q4: scoreValue, test1_q4_time: Math.floor(reactionTimeMs / 1000) },
      4: { test1_q5: scoreValue, test1_q5_time: Math.floor(reactionTimeMs / 1000) },
      5: { test1_q6: scoreValue, test1_q6_time: Math.floor(reactionTimeMs / 1000) },
    };

    await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        payload: legacyPayload[currentGame],
        screening_task: {
          task_id: taskMeta.id,
          domain: "math",
          construct: taskMeta.construct,
          task_type: taskMeta.type,
          response_data: { correct: isCorrect, raw_score: scoreValue },
          reaction_time_ms: reactionTimeMs,
        }
      })
    });

    if (currentGame < 5) {
      setCurrentGame(currentGame + 1);
      onProgress(currentGame + 1);
    } else {
      onComplete();
    }
  };


  const games = [
    // Game 1: Count the Apples
    <div key="game1" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title1')}
      </h2>
      <div className="flex flex-wrap justify-center gap-4 mb-8 bg-accent/20 border-4 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1 }}
            className="text-6xl drop-shadow-md"
          >
            🍎
          </motion.div>
        ))}
      </div>
      <p className="text-2xl text-black font-bold mb-8 uppercase">{t('game_m1_q1')}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        {[5, 6, 7, 8].map((num, idx) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95, y: 0 }}
            onClick={() => handleAnswer(num === 7)}
            className="text-4xl font-black py-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors"
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>,

    // Game 2: Which Has More Stars?
    <div key="game2" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title2')}
      </h2>
      <p className="text-2xl text-black font-bold mb-8 uppercase">{t('game_m1_q2')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onClick={() => handleAnswer(false)}
          className="bg-white border-4 border-black p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary/10 transition-colors"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-6xl drop-shadow-md">⭐</div>
            ))}
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onClick={() => handleAnswer(true)}
          className="bg-white border-4 border-black p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/10 transition-colors"
        >
          <div className="flex flex-wrap justify-center gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-6xl drop-shadow-md">⭐</div>
            ))}
          </div>
        </motion.button>
      </div>
    </div>,

    // Game 3: Compare Numbers
    <div key="game3" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title3')}
      </h2>
      <div className="flex justify-center items-center gap-8 mb-12">
        <div className="bg-primary border-4 border-black text-white text-8xl font-black w-40 h-40 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          7
        </div>
        <div className="text-4xl font-black text-black/20 italic">{t('game_m1_vs')}</div>
        <div className="bg-secondary border-4 border-black text-white text-8xl font-black w-40 h-40 flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          4
        </div>
      </div>
      <p className="text-2xl text-black font-bold mb-8 uppercase">{t('game_m1_q3')}</p>
      <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={() => handleAnswer(true)}
          className="text-2xl font-black px-10 py-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary hover:text-white transition-all"
        >
          {t('game_m1_q3_opt1')}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={() => handleAnswer(false)}
          className="text-2xl font-black px-10 py-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-secondary hover:text-white transition-all"
        >
          {t('game_m1_q3_opt2')}
        </motion.button>
      </div>
    </div>,

    // Game 4: Add the Numbers
    <div key="game4" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title4')}
      </h2>
      <div className="bg-accent border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-12 max-w-lg mx-auto">
        <div className="flex items-center justify-center gap-6 text-7xl font-black text-black">
          <span>3</span>
          <span className="text-5xl text-black/50">+</span>
          <span>2</span>
          <span className="text-5xl text-black/50">=</span>
          <span className="text-primary animate-bounce">?</span>
        </div>
      </div>
      <p className="text-2xl text-black font-bold mb-8 uppercase">{t('game_m1_q4')}</p>
      <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
        {[4, 5, 6].map((num, idx) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95, y: 0 }}
            onClick={() => handleAnswer(num === 5)}
            className="text-5xl font-black py-10 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors"
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>,

    // Game 5: Coin Game
    <div key="game5" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title5')}
      </h2>
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-8 max-w-xs mx-auto">
        <div className="text-7xl mb-4 drop-shadow-md">🧸</div>
        <p className="text-2xl font-black text-primary uppercase">{t('game_m1_q5_item')}</p>
      </div>
      
      <p className="text-2xl text-black font-black mb-4 uppercase">
        {t('game_m1_q5_total')} <span className="text-primary">{selectedCoins.reduce((sum, coin) => sum + coin, 0)}</span>
      </p>

      {/* Selected coins tray */}
      <div className="bg-muted border-4 border-black p-6 mb-8 min-h-[100px] max-w-lg mx-auto flex flex-wrap gap-3 justify-center items-center shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
        {selectedCoins.map((coin, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-accent border-2 border-black px-4 py-2 text-black font-black text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            ₹{coin}
          </motion.div>
        ))}
        {selectedCoins.length === 0 && <span className="text-black/20 font-black uppercase tracking-widest">Empty Wallet</span>}
      </div>

      {/* Coin buttons */}
      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto mb-10">
        {[1, 2, 5, 10].map((coin) => (
          <motion.button
            key={coin}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSelectedCoins([...selectedCoins, coin])}
            className="bg-accent border-4 border-black w-20 h-20 flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-2xl font-black active:translate-y-1 active:shadow-none mx-auto"
          >
            ₹{coin}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pb-4">
        <Button
          size="lg"
          onClick={() => {
            const total = selectedCoins.reduce((s,c)=>s+c,0)
            handleAnswer(total === 12)
          }}
          disabled={selectedCoins.length === 0}
          className="text-2xl py-8 px-12"
        >
          {t('game_m1_btn_check')}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setSelectedCoins([])}
          className="text-2xl py-8 px-12"
        >
          {t('game_m1_btn_clear')}
        </Button>
      </div>
    </div>,

    // Game 6: Final Math Round
    <div key="game6" className="text-center">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_m1_title6')}
      </h2>
      <div className="bg-white border-4 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10 max-w-lg mx-auto">
        <p className="text-2xl font-black text-black mb-8 uppercase leading-relaxed">
          {t('game_m1_q6')}
        </p>
        <div className="flex justify-center flex-wrap gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`text-4xl drop-shadow-md transition-opacity duration-500 ${i < 3 ? 'opacity-20 scale-75 grayscale' : 'opacity-100 scale-100'}`}>
              🍬
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
        {[4, 5, 6].map((num, idx) => (
          <motion.button
            key={num}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95, y: 0 }}
            onClick={() => handleAnswer(num === 5)}
            className="text-5xl font-black py-10 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-primary hover:text-white transition-all"
          >
            {num}
          </motion.button>
        ))}
      </div>
    </div>,
  ];


  return (
    <div ref={containerRef} className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentGame}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
          className="w-full"
        >
          {games[currentGame]}
        </motion.div>
      </AnimatePresence>

      {/* Feedback animation */}
      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
        >
          <div
            className={`text-8xl ${
              feedback === 'correct' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {feedback === 'correct' ? <Check className="w-32 h-32" /> : <X className="w-32 h-32" />}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Gamified Interactive Adventure for Group B ──────────────────────────────
function GroupBMathAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [numberLinePos, setNumberLinePos] = useState<number>(50);

  const startMs = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startMs.current = Date.now();
    setFeedback(null);
    setNumberLinePos(50);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [idx]);

  const B_TRIALS = [
    {
      id: "B-math-number_line-1",
      construct: "number_line_representation",
      type: "number_line_bridge",
      text: "Where does 67 go on a 0-100 number line?",
      answer: "67",
    },
    {
      id: "B-math-arithmetic-1",
      construct: "arithmetic_fluency",
      type: "arithmetic_quest",
      text: "15 + 28 = ?",
      answer: "43",
    },
    {
      id: "B-math-story-1",
      construct: "math_reasoning",
      type: "story_problem_islands",
      text: "Sara has 3 boxes. Each box has 12 apples. She gives 5 away. How many are left?",
      answer: "31",
    },
  ];

  const currentTrial = B_TRIALS[idx];

  const handleGroupBSubmit = async (userInputValue: string, isCorrect: boolean) => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    setFeedback(isCorrect ? "correct" : "incorrect");

    const sId = sessionId || (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null);

    if (sId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          payload: {},
          screening_task: {
            task_id: currentTrial.id,
            domain: "math",
            construct: currentTrial.construct,
            task_type: currentTrial.type,
            response_data: { input: userInputValue, correct: isCorrect },
            reaction_time_ms: rt,
          },
        }),
      }).catch(() => {});
    }

    setTimeout(() => {
      if (idx < B_TRIALS.length - 1) {
        const nextIdx = idx + 1;
        setIdx(nextIdx);
        if (onProgress) onProgress(nextIdx);
      } else {
        onComplete();
      }
    }, 1200);
  };

  return (
    <div ref={containerRef} className="w-full relative min-h-[500px]">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60">
          Math Quest · Group B
        </span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-xs ${
                step === idx
                  ? "bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : step < idx
                  ? "bg-[#43B047] text-white"
                  : "bg-muted text-black/40"
              }`}
            >
              {step + 1}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Question 1: Number Line */}
          {idx === 0 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
                Where does <span className="text-primary underline decoration-black underline-offset-4">67</span> go on a 0-100 number line?
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                {/* Header Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase text-black/50 tracking-wider">0 to 100 Track</span>
                  <div className="bg-primary text-white border-2 border-black px-4 py-2 text-xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                    <span>Position:</span>
                    <span className="text-[#FBD000] text-2xl">{numberLinePos}</span>
                  </div>
                </div>

                {/* Track Bar */}
                <div className="relative py-8 px-2 sm:px-4">
                  <div
                    className="h-8 bg-muted border-4 border-black rounded-full relative cursor-pointer shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = Math.round((clickX / rect.width) * 100);
                      const clamped = Math.max(0, Math.min(100, percentage));
                      setNumberLinePos(clamped);
                    }}
                  >
                    <div
                      className="h-full bg-accent rounded-full border-r-2 border-black"
                      style={{ width: `${numberLinePos}%` }}
                    />

                    {/* Draggable Marker Pin */}
                    <motion.div
                      className="absolute -top-10 -ml-6 w-12 h-16 flex flex-col items-center pointer-events-none"
                      style={{ left: `${numberLinePos}%` }}
                    >
                      <div className="bg-primary border-2 border-black text-white text-xs font-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                        {numberLinePos}
                      </div>
                      <div className="text-3xl drop-shadow-md">📍</div>
                    </motion.div>
                  </div>

                  {/* Range Slider for Touch/Mouse Drag */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={numberLinePos}
                    onChange={(e) => setNumberLinePos(parseInt(e.target.value, 10))}
                    className="w-full mt-8 accent-primary cursor-pointer h-4"
                  />

                  {/* Ticks and Numbers */}
                  <div className="flex justify-between items-center mt-4 text-xs font-black text-black">
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((num) => (
                      <div key={num} className="flex flex-col items-center">
                        <div className={`w-0.5 ${num % 50 === 0 ? "h-4 bg-black w-1" : "h-2.5 bg-black/50"}`} />
                        <span className={`mt-1 ${num === 67 ? "text-primary text-sm font-black" : "text-black/60"}`}>
                          {num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fine-Tuning Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t-2 border-black/10">
                  <span className="w-full text-xs font-black uppercase text-black/50 tracking-wider mb-1">Adjust Marker:</span>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.max(0, p - 5))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.max(0, p - 1))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.min(100, p + 1))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.min(100, p + 5))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95, y: 0 }}
                disabled={feedback !== null}
                onClick={() => handleGroupBSubmit(String(numberLinePos), numberLinePos === 67)}
                className="text-2xl font-black py-6 px-12 bg-primary text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#348dbb] transition-all uppercase tracking-widest"
              >
                Place Marker at {numberLinePos} 📍
              </motion.button>
            </div>
          )}

          {/* Question 2: Visual Addition */}
          {idx === 1 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
                15 + 28 = ?
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  
                  {/* Group 1: 15 Apples */}
                  <div className="flex-1 bg-accent/20 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                    <p className="text-xs font-black uppercase text-black/60 mb-3">15 Apples</p>
                    <div className="flex justify-center items-center gap-3 mb-2">
                      <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span className="text-3xl">🧺</span>
                        <p className="text-[10px] font-black uppercase">10 Apples</p>
                      </div>
                      <div className="text-2xl font-black">+</div>
                      <div className="flex flex-wrap justify-center gap-1 max-w-[100px]">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-2xl">🍎</span>
                        ))}
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-primary text-white border-2 border-black text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      15
                    </span>
                  </div>

                  {/* Plus Symbol */}
                  <div className="text-5xl font-black text-black bg-[#FBD000] border-4 border-black w-14 h-14 flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                    +
                  </div>

                  {/* Group 2: 28 Apples */}
                  <div className="flex-1 bg-primary/10 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full">
                    <p className="text-xs font-black uppercase text-black/60 mb-3">28 Apples</p>
                    <div className="flex justify-center items-center gap-2 mb-2">
                      <div className="bg-white border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-center">
                        <span className="text-3xl">🧺🧺</span>
                        <p className="text-[10px] font-black uppercase">20 Apples</p>
                      </div>
                      <div className="text-2xl font-black">+</div>
                      <div className="flex flex-wrap justify-center gap-1 max-w-[120px]">
                        {[...Array(8)].map((_, i) => (
                          <span key={i} className="text-2xl">🍎</span>
                        ))}
                      </div>
                    </div>
                    <span className="inline-block px-3 py-1 bg-accent border-2 border-black text-base font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      28
                    </span>
                  </div>

                </div>

                <p className="text-xl font-bold text-black uppercase mt-6">Choose the correct sum:</p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[33, 41, 43, 45].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    disabled={feedback !== null}
                    onClick={() => handleGroupBSubmit(String(option), option === 43)}
                    className="text-4xl font-black py-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FBD000] transition-colors"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Question 3: 3-Box Apple Story Game */}
          {idx === 2 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-black mb-6 uppercase tracking-tight leading-snug">
                Sara has 3 boxes. Each box has 12 apples. She gives 5 away. How many are left?
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                {/* 3 Boxes Grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {[1, 2, 3].map((boxNum) => (
                    <div
                      key={boxNum}
                      className="bg-accent/30 border-4 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center"
                    >
                      <span className="text-4xl mb-1">📦</span>
                      <span className="text-xs font-black uppercase tracking-wider mb-2 text-black/70">
                        Box {boxNum}
                      </span>
                      <div className="bg-white border-2 border-black px-3 py-1 font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        12 🍎
                      </div>
                    </div>
                  ))}
                </div>

                {/* Math Callout Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted border-4 border-black p-4 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                  <div className="text-left">
                    <p className="text-xs font-black uppercase text-black/50">Total in 3 Boxes:</p>
                    <p className="text-xl font-black text-black">3 × 12 = 36 Apples 🍎</p>
                  </div>

                  <div className="flex items-center gap-2 bg-[#E52521] text-white border-2 border-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-lg">💨</span>
                    <span className="text-sm font-black uppercase">Gives away 5 apples (-5 🍎)</span>
                  </div>
                </div>

                <p className="text-xl font-bold text-black uppercase mt-6">How many apples are left?</p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[25, 29, 31, 36].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    disabled={feedback !== null}
                    onClick={() => handleGroupBSubmit(String(option), option === 31)}
                    className="text-4xl font-black py-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#43B047] hover:text-white transition-colors"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay */}
      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-4"
        >
          <div
            className={`p-8 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-4xl sm:text-6xl font-black uppercase flex items-center gap-4 ${
              feedback === "correct" ? "bg-[#43B047] text-white" : "bg-[#E52521] text-white"
            }`}
          >
            {feedback === "correct" ? (
              <Check className="w-16 h-16 stroke-[3]" />
            ) : (
              <X className="w-16 h-16 stroke-[3]" />
            )}
            <span>{feedback === "correct" ? "GREAT JOB!" : "TRY AGAIN!"}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Gamified Interactive Adventure for Group C ──────────────────────────────
function GroupCMathAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [numberLinePos, setNumberLinePos] = useState<number>(500);

  const startMs = useRef(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startMs.current = Date.now();
    setFeedback(null);
    setNumberLinePos(500);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [idx]);

  const C_TRIALS = [
    {
      id: "C-math-number_line-1",
      construct: "number_line_representation",
      type: "number_line_1000",
      text: "Where does 450 go on a 0-1000 number line? (Enter 0-1000)",
      answer: "450",
    },
    {
      id: "C-math-multistep-1",
      construct: "math_reasoning",
      type: "multistep_quest",
      text: "(45 / 5) * 3 - 7 = ?",
      answer: "20",
    },
    {
      id: "C-math-patterns-1",
      construct: "math_reasoning",
      type: "pattern_logic_puzzles",
      text: "2, 6, 12, 20, 30, ? (What is the next number?)",
      answer: "42",
    },
  ];

  const currentTrial = C_TRIALS[idx];

  const handleGroupCSubmit = async (userInputValue: string, isCorrect: boolean) => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    setFeedback(isCorrect ? "correct" : "incorrect");

    const sId = sessionId || (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null);

    if (sId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          payload: {},
          screening_task: {
            task_id: currentTrial.id,
            domain: "math",
            construct: currentTrial.construct,
            task_type: currentTrial.type,
            response_data: { input: userInputValue, correct: isCorrect },
            reaction_time_ms: rt,
          },
        }),
      }).catch(() => {});
    }

    setTimeout(() => {
      if (idx < C_TRIALS.length - 1) {
        const nextIdx = idx + 1;
        setIdx(nextIdx);
        if (onProgress) onProgress(nextIdx);
      } else {
        onComplete();
      }
    }, 1200);
  };

  return (
    <div ref={containerRef} className="w-full relative min-h-[500px]">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60">
          Math Quest · Group C
        </span>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((step) => (
            <div
              key={step}
              className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center font-black text-xs ${
                step === idx
                  ? "bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  : step < idx
                  ? "bg-[#43B047] text-white"
                  : "bg-muted text-black/40"
              }`}
            >
              {step + 1}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Trial 1: Number Line 0-1000 */}
          {idx === 0 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
                Where does <span className="text-primary underline decoration-black underline-offset-4">450</span> go on a 0-1000 number line?
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                {/* Header Badge */}
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-black uppercase text-black/50 tracking-wider">0 to 1000 Track</span>
                  <div className="bg-primary text-white border-2 border-black px-4 py-2 text-xl font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2">
                    <span>Position:</span>
                    <span className="text-[#FBD000] text-2xl">{numberLinePos}</span>
                  </div>
                </div>

                {/* Track Bar */}
                <div className="relative py-8 px-2 sm:px-4">
                  <div
                    className="h-8 bg-muted border-4 border-black rounded-full relative cursor-pointer shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = Math.round((clickX / rect.width) * 1000);
                      const clamped = Math.max(0, Math.min(1000, percentage));
                      setNumberLinePos(clamped);
                    }}
                  >
                    <div
                      className="h-full bg-accent rounded-full border-r-2 border-black"
                      style={{ width: `${(numberLinePos / 1000) * 100}%` }}
                    />

                    {/* Draggable Marker Pin */}
                    <motion.div
                      className="absolute -top-10 -ml-6 w-12 h-16 flex flex-col items-center pointer-events-none"
                      style={{ left: `${(numberLinePos / 1000) * 100}%` }}
                    >
                      <div className="bg-primary border-2 border-black text-white text-xs font-black px-2 py-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                        {numberLinePos}
                      </div>
                      <div className="text-3xl drop-shadow-md">📍</div>
                    </motion.div>
                  </div>

                  {/* Range Slider for Touch/Mouse Drag */}
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="5"
                    value={numberLinePos}
                    onChange={(e) => setNumberLinePos(parseInt(e.target.value, 10))}
                    className="w-full mt-8 accent-primary cursor-pointer h-4"
                  />

                  {/* Ticks and Numbers */}
                  <div className="flex justify-between items-center mt-4 text-xs font-black text-black">
                    {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((num) => (
                      <div key={num} className="flex flex-col items-center">
                        <div className={`w-0.5 ${num % 500 === 0 ? "h-4 bg-black w-1" : "h-2.5 bg-black/50"}`} />
                        <span className={`mt-1 ${num === 450 ? "text-primary text-sm font-black" : "text-black/60"}`}>
                          {num}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fine-Tuning Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t-2 border-black/10">
                  <span className="w-full text-xs font-black uppercase text-black/50 tracking-wider mb-1">Adjust Marker:</span>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.max(0, p - 50))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.max(0, p - 10))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.min(1000, p + 10))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => setNumberLinePos((p) => Math.min(1000, p + 50))}
                    className="px-4 py-2 bg-muted border-2 border-black font-black text-sm uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-black/10 active:translate-y-0.5"
                  >
                    +50
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95, y: 0 }}
                disabled={feedback !== null}
                onClick={() => handleGroupCSubmit(String(numberLinePos), numberLinePos === 450)}
                className="text-2xl font-black py-6 px-12 bg-primary text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#348dbb] transition-all uppercase tracking-widest"
              >
                Place Marker at {numberLinePos} 📍
              </motion.button>
            </div>
          )}

          {/* Trial 2: Multi-Step Calculation */}
          {idx === 1 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
                (45 / 5) * 3 - 7 = ?
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-accent/20 border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-xs font-black uppercase text-black/50 block mb-1">Step 1</span>
                    <span className="text-2xl font-black text-black">45 ÷ 5 = 9 🧩</span>
                  </div>
                  <div className="bg-primary/20 border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-xs font-black uppercase text-black/50 block mb-1">Step 2</span>
                    <span className="text-2xl font-black text-black">9 × 3 = 27 ⚡</span>
                  </div>
                  <div className="bg-[#FBD000]/30 border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="text-xs font-black uppercase text-black/50 block mb-1">Step 3</span>
                    <span className="text-2xl font-black text-primary animate-pulse">27 - 7 = ? 🎯</span>
                  </div>
                </div>

                <p className="text-xl font-bold text-black uppercase">Choose the final answer:</p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[16, 20, 24, 28].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    disabled={feedback !== null}
                    onClick={() => handleGroupCSubmit(String(option), option === 20)}
                    className="text-4xl font-black py-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FBD000] transition-colors"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Trial 3: Pattern Logic Puzzle */}
          {idx === 2 && (
            <div className="text-center w-full max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-black mb-6 uppercase tracking-tight">
                2, 6, 12, 20, 30, ? (What is the next number?)
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                {/* Number Train */}
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-6">
                  {[
                    { num: 2, diff: "+4" },
                    { num: 6, diff: "+6" },
                    { num: 12, diff: "+8" },
                    { num: 20, diff: "+10" },
                    { num: 30, diff: "+12" },
                    { num: "?", diff: "" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`border-4 border-black px-4 py-3 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${item.num === "?" ? "bg-primary text-white animate-bounce" : "bg-accent text-black"}`}>
                        {item.num}
                      </div>
                      {item.diff && (
                        <span className="text-xs font-black bg-muted border border-black px-1.5 py-0.5">
                          {item.diff}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xl font-bold text-black uppercase">What comes next in the sequence?</p>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[36, 40, 42, 44].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95, y: 0 }}
                    disabled={feedback !== null}
                    onClick={() => handleGroupCSubmit(String(option), option === 42)}
                    className="text-4xl font-black py-8 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#43B047] hover:text-white transition-colors"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay */}
      {feedback && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 p-4"
        >
          <div
            className={`p-8 border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-4xl sm:text-6xl font-black uppercase flex items-center gap-4 ${
              feedback === "correct" ? "bg-[#43B047] text-white" : "bg-[#E52521] text-white"
            }`}
          >
            {feedback === "correct" ? (
              <Check className="w-16 h-16 stroke-[3]" />
            ) : (
              <X className="w-16 h-16 stroke-[3]" />
            )}
            <span>{feedback === "correct" ? "GREAT JOB!" : "TRY AGAIN!"}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}