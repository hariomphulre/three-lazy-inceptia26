"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Check, X, Star, Coins } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from '@/components/ui/button';
import { saveSession } from "@/lib/offline/session";


interface Level1Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
}

export function Level1MathAdventure({ onComplete, onProgress }: Level1Props) {
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


  const handleAnswer = async (isCorrect: boolean) => {
    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);

    const scoreValue = isCorrect ? 1 : 0;

    const payloadMap: any = {
      0: { test1_q1: scoreValue, test1_q1_time: timeTaken },
      1: { test1_q2: scoreValue, test1_q2_time: timeTaken },
      2: { test1_q3: scoreValue, test1_q3_time: timeTaken },
      3: { test1_q4: scoreValue, test1_q4_time: timeTaken },
      4: { test1_q5: scoreValue, test1_q5_time: timeTaken },
      5: { test1_q6: scoreValue, test1_q6_time: timeTaken },
    };

    // Offline-first: queues to IndexedDB, then flushes to the backend when online.
    // Drop-in replacement for the old fetch("/api/session/save", ...) call;
    // saveSession reads the sessionId internally.
    await saveSession(payloadMap[currentGame]);

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
    // Key change: make the outer wrapper scrollable on mobile
    <div
      ref={containerRef}
      className="relative max-w-4xl mx-auto px-4 overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <motion.div
        key={currentGame}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
        // Add bottom padding so content isn't clipped behind nav bars on mobile
        className="pb-8"
      >
        {games[currentGame]}
      </motion.div>

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