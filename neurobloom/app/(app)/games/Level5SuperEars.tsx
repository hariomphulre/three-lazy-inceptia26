"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Check, X, Headphones, Play } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from '@/components/ui/button';

interface Level5Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
}

export function Level5SuperEars({ onComplete, onProgress }: Level5Props) {
  const { t } = useTranslation();
  const [currentGame, setCurrentGame] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [beepActive, setBeepActive] = useState(false);
  const [beepCount, setBeepCount] = useState(0);
  const [soundPlaying, setSoundPlaying] = useState(false);

  const beepStartTime = useRef(0);
  const reactions = useRef<number[]>([]);
  const questionStartTime = useRef(0);
  const beepAudio = useRef<HTMLAudioElement | null>(null);
  const backgroundNoiseAudio = useRef<HTMLAudioElement | null>(null);
  const playingAudio = useRef<HTMLAudioElement | null>(null);
  const gaaaAudio = useRef<HTMLAudioElement | null>(null);
  const kaaaAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    beepAudio.current = new Audio("/sounds/beep.mp3");
    beepAudio.current.preload = "auto";
    backgroundNoiseAudio.current = new Audio("/sounds/background_noise.mp3");
    backgroundNoiseAudio.current.preload = "auto";
    playingAudio.current = new Audio("/sounds/playing.mp3");
    playingAudio.current.preload = "auto";
    gaaaAudio.current = new Audio("/sounds/gaaa.mp3");
    gaaaAudio.current.preload = "auto";
    kaaaAudio.current = new Audio("/sounds/kaaa.mp3");
    kaaaAudio.current.preload = "auto";
  }, []);

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentGame]);

  const unlockAudio = async () => {
    const sounds = [beepAudio.current, backgroundNoiseAudio.current, playingAudio.current, gaaaAudio.current, kaaaAudio.current];
    for (let sound of sounds) {
      if (!sound) continue;
      try {
        await sound.play();
        sound.pause();
        sound.currentTime = 0;
      } catch {}
    }
  };

  const handleAnswer = async (isCorrect: boolean, answerIndex?: number) => {
    setSelectedAnswer(answerIndex ?? null);

    const score = isCorrect ? 1 : 0;
    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);
    const sessionId = localStorage.getItem("sessionId");

    const payload = currentGame === 1
        ? { test5_q2_score: score, test5_q2_time: timeTaken }
        : { test5_q3_score: score, test5_q3_time: timeTaken };

    await fetch("/api/session/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, payload })
    });

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      if (currentGame < 2) {
        setCurrentGame(currentGame + 1);
        onProgress(currentGame + 1);
      } else {
        onComplete();
      }
    }, 1500);
  };

  const startBeepTest = () => {
    setBeepActive(true);
    reactions.current = [];
    let count = 0;

    // Start background noise looping immediately
    if (backgroundNoiseAudio.current) {
      backgroundNoiseAudio.current.loop = true;
      backgroundNoiseAudio.current.currentTime = 0;
      backgroundNoiseAudio.current.play();
    }

    const interval = setInterval(() => {
      count++;
      setBeepCount(count);
      beepStartTime.current = Date.now();

      // Play beep on top of the already-playing background noise
      if (beepAudio.current) {
        beepAudio.current.currentTime = 0;
        beepAudio.current.play();
      }

      if (count >= 5) {
        clearInterval(interval);
        setTimeout(async () => {
          // Stop background noise after the 5th beep
          if (backgroundNoiseAudio.current) {
            backgroundNoiseAudio.current.pause();
            backgroundNoiseAudio.current.loop = false;
            backgroundNoiseAudio.current.currentTime = 0;
          }

          const sessionId = localStorage.getItem("sessionId");
          await fetch("/api/session/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              payload: {
                test5_q1_r1: reactions.current[0] || null,
                test5_q1_r2: reactions.current[1] || null,
                test5_q1_r3: reactions.current[2] || null,
                test5_q1_r4: reactions.current[3] || null,
                test5_q1_r5: reactions.current[4] || null,
              }
            })
          });
          setBeepActive(false);
          setBeepCount(0);
          setCurrentGame(1);
          onProgress(1);
        }, 1500);
      }
    }, 1500);
  };

  const playSound = (type: "playing" | "gaaaKaaa") => {
    if (type === "playing") {
      setSoundPlaying(true);
      if (!playingAudio.current) return;
      playingAudio.current.currentTime = 0;
      playingAudio.current.play();
      playingAudio.current.onended = () => setSoundPlaying(false);
    } else {
      // Play gaaa then kaaa sequentially
      setSoundPlaying(true);
      if (!gaaaAudio.current || !kaaaAudio.current) return;
      gaaaAudio.current.currentTime = 0;
      gaaaAudio.current.play();
      gaaaAudio.current.onended = () => {
        if (!kaaaAudio.current) return;
        kaaaAudio.current.currentTime = 0;
        kaaaAudio.current.play();
        kaaaAudio.current.onended = () => setSoundPlaying(false);
      };
    }
  };

  const games = [
    // Game 1: Beep Test
    <div key="beep-test" className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-black text-black mb-1 uppercase tracking-tight">
          {t('game_se1_title')}
        </h2>
        <p className="text-sm text-primary font-black tracking-widest uppercase">{t('game_se1_level')}</p>
      </div>
      
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full text-center">
        {!beepActive ? (
          <div className="py-4">
            <div className="bg-secondary border-4 border-black w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-black text-black mb-4 uppercase">{t('game_se1_ready')}</h3>
            <p className="text-black/60 font-bold mb-8">{t('game_se1_instr')}</p>
            <Button
              size="lg"
              onClick={async () => { await unlockAudio(); startBeepTest(); }}
              className="text-xl py-8 px-10"
            >
              <Play size={24} fill="currentColor" /> {t('game_se1_btn_start')}
            </Button>
          </div>
        ) : (
          <div className="py-4">
              <motion.div
                onClick={() => {
                  const rt = Date.now() - beepStartTime.current;
                  reactions.current.push(rt);
                }}
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-48 h-48 mx-auto bg-primary border-4 border-black rounded-full flex items-center justify-center cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1"
              >
                <span className="text-7xl select-none drop-shadow-md">👂</span>
              </motion.div>
              <div className="mt-12 space-y-4">
                <p className="text-2xl font-black text-black uppercase tracking-widest">{t('game_se1_listen')}</p>
                <div className="flex justify-center gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-6 h-6 border-2 border-black transition-colors duration-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${i < beepCount ? 'bg-accent' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
          </div>
        )}
      </div>
    </div>,

    // Game 2: Word & Picture
    <div key="word-picture" className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-black text-black mb-1 uppercase tracking-tight">
          {t('game_se2_title')}
        </h2>
        <p className="text-sm text-secondary font-black tracking-widest uppercase">{t('game_se2_instr')}</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.05, y: -4 }}
        whileTap={{ scale: 0.95, y: 0 }}
        onClick={() => playSound('playing')}
        className={`bg-white border-4 border-black px-8 py-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-10 flex items-center gap-4 transition-all ${soundPlaying ? 'bg-accent' : ''}`}
      >
        <div className="bg-secondary border-2 border-black p-2 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Volume2 className={`w-8 h-8 ${soundPlaying ? 'animate-bounce' : ''}`} />
        </div>
        <span className="text-2xl font-black text-black uppercase">{t('game_se2_btn_play')}</span>
      </motion.button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl w-full">
        {[
          { image: '/playing.jpg', label: t('game_se2_playing'), correct: true },
          { image: '/studying.jpg', label: t('game_se2_studying'), correct: false },
          { image: '/sleeping.jpg', label: t('game_se2_sleeping'), correct: false },
          { image: '/eating.jpg', label: t('game_se2_eating'), correct: false },
        ].map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswer(item.correct, index)}
            disabled={feedback !== null}
            className={`group relative overflow-hidden bg-white border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all ${
              selectedAnswer === index
                ? feedback === 'correct'
                  ? 'border-secondary'
                  : 'border-primary'
                : 'border-black hover:border-accent'
            }`}
          >
            <div className="aspect-video w-full overflow-hidden relative border-b-4 border-black">
              <img 
                src={item.image} 
                alt={item.label} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.label}&background=random&size=128`;
                }}
              />
            </div>
            <div className="p-4 bg-white text-center">
              <p className="text-xl font-black text-black uppercase tracking-tight">{item.label}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>,

    // Game 3: Sound Discrimination
    <div key="sound-discrimination" className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-black text-black mb-1 uppercase tracking-tight">
          {t('game_se3_title')}
        </h2>
        <p className="text-sm text-primary font-black tracking-widest uppercase">{t('game_se3_level')}</p>
      </div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full text-center relative">
        <p className="text-xl font-black text-black mb-8 uppercase tracking-widest">{t('game_se3_compare')}</p>

        {/* Single play button that plays gaaa then kaaa sequentially */}
        <div className="flex justify-center mb-10">
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => playSound('gaaaKaaa')}
            disabled={soundPlaying}
            className={`bg-muted border-4 border-black px-10 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all flex items-center gap-4 ${soundPlaying ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="bg-primary border-2 border-black w-12 h-12 flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Volume2 className={`w-6 h-6 ${soundPlaying ? 'animate-bounce' : ''}`} size={24} />
            </div>
            <span className="text-2xl font-black text-black uppercase tracking-tighter">
              {soundPlaying ? t('game_se2_btn_play') + '...' : t('game_se2_btn_play')}
            </span>
          </motion.button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {[
            { label: t('game_se3_same'), val: false, variant: 'outline' },
            { label: t('game_se3_different'), val: true, variant: 'default' }
          ].map((btn, idx) => (
            <Button
              key={btn.label}
              variant={btn.variant as any}
              size="lg"
              onClick={() => handleAnswer(btn.val, idx)}
              className="text-xl py-8 px-10 uppercase"
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    ];
  
    return (
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentGame}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10"
          >
            {games[currentGame]}
          </motion.div>
        </AnimatePresence>
  
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100] bg-black/20 backdrop-blur-sm"
            >
              <div 
                className={`p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] ${
                  feedback === 'correct' ? 'bg-secondary text-white' : 'bg-primary text-white'
                }`}
              >
                {feedback === 'correct' ? (
                  <div className="flex flex-col items-center">
                    <Check className="w-24 h-24 stroke-[4]" />
                    <span className="text-4xl font-black mt-4 uppercase tracking-widest">{t('game_se_great')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <X className="w-24 h-24 stroke-[4]" />
                    <span className="text-4xl font-black mt-4 uppercase tracking-widest">{t('game_se_try_again')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }