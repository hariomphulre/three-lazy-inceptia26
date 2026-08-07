"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";
import { saveSession } from "@/lib/offline/session";

interface Level4Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
}

type Emotion = 'happy' | 'sad' | 'angry' | 'crying';

export function Level4FeelingFriends({ onComplete, onProgress }: Level4Props) {
  const { t } = useTranslation();
  const [currentGame, setCurrentGame] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedFace, setSelectedFace] = useState<number | null>(null);

  const questionStartTime = useRef<number>(Date.now());

  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentGame]);

  const emotions: { emotion: Emotion; label: string; correctIndex: number }[] = [
    { emotion: 'happy', label: t('game_f1_happy'), correctIndex: 1 },
    { emotion: 'sad', label: t('game_f1_sad'), correctIndex: 0 },
    { emotion: 'angry', label: t('game_f1_angry'), correctIndex: 2 },
    { emotion: 'crying', label: t('game_f1_crying'), correctIndex: 1 },
  ];

  const faces = {
    happy: [
      { src: '/sad.jpg', emotion: 'sad' },
      { src: '/happy.jpg', emotion: 'happy' },
      { src: '/angry.jpg', emotion: 'angry' },
    ],
    sad: [
      { src: '/sad.jpg', emotion: 'sad' },
      { src: '/happy.jpg', emotion: 'happy' },
      { src: '/crying.jpg', emotion: 'crying' },
    ],
    angry: [
      { src: '/happy.jpg', emotion: 'happy' },
      { src: '/sad.jpg', emotion: 'sad' },
      { src: '/angry.jpg', emotion: 'angry' },
    ],
    crying: [
      { src: '/angry.jpg', emotion: 'angry' },
      { src: '/crying.jpg', emotion: 'crying' },
      { src: '/happy.jpg', emotion: 'happy' },
    ],
  };

  const currentEmotion = emotions[currentGame];

  const handleAnswer = async (faceIndex: number) => {
    if (feedback !== null) return;

    const isCorrect = faceIndex === currentEmotion.correctIndex;
    const score = isCorrect ? 1 : 0;
    const timeTaken = Math.floor((Date.now() - questionStartTime.current) / 1000);

    setSelectedFace(faceIndex);
    

    const payloadMap: any = {
      0: { test4_q1: score, test4_q1_time: timeTaken },
      1: { test4_q2: score, test4_q2_time: timeTaken },
      2: { test4_q3: score, test4_q3_time: timeTaken },
      3: { test4_q4: score, test4_q4_time: timeTaken },
    };

    try {
      await saveSession(payloadMap[currentGame]);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedFace(null);

      if (currentGame < 3) {
        setCurrentGame(currentGame + 1);
        onProgress(currentGame + 1);
      } else {
        onComplete();
      }
    }, 1200);
  };

    return (
      <div className="text-center max-w-2xl mx-auto px-4 py-2">
        <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
          {t('game_f1_title')}
        </h2>
  
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-10">
          <p className="text-2xl font-black text-black uppercase">
            {t('game_f1_instr')} <span className="text-primary underline decoration-4 decoration-black">{currentEmotion.label}</span> {t('game_f1_instr_face')}
          </p>
        </div>
  
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {faces[currentEmotion.emotion].map((face, index) => (
            <motion.button
              key={`${currentGame}-${index}`}
              whileHover={{ scale: feedback === null ? 1.05 : 1, y: -4 }}
              whileTap={{ scale: feedback === null ? 0.95 : 1, y: 0 }}
              onClick={() => handleAnswer(index)}
              disabled={feedback !== null}
              className={`relative overflow-hidden bg-white border-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all ${
                selectedFace === index
                  ? feedback === 'correct'
                    ? 'border-secondary'
                    : 'border-primary'
                  : 'border-black hover:border-accent'
              }`}
            >
              <img 
                src={face.src} 
                alt={face.emotion} 
                className="w-full h-44 md:h-48 object-cover"
              />
              
              <AnimatePresence>
                {selectedFace === index && feedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
                  >
                    {feedback === 'correct' ? (
                      <div className="bg-secondary border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <Check className="w-12 h-12 text-white" strokeWidth={5} />
                      </div>
                    ) : (
                      <div className="bg-primary border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <X className="w-12 h-12 text-white" strokeWidth={5} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
  
        {/* Progress indicator */}
        <div className="mt-12 flex justify-center gap-4">
          {emotions.map((_, index) => (
            <div
              key={index}
              className={`w-6 h-6 border-2 border-black transition-all duration-300 ${
                index < currentGame
                  ? 'bg-secondary'
                  : index === currentGame
                  ? 'bg-accent'
                  : 'bg-muted'
              } shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            />
          ))}
        </div>
      </div>
    );
  }
  