"use client";

import { motion } from "framer-motion";
import { Trophy, Star, Home, Sparkles } from 'lucide-react';
import { StudentData } from './StudentForm';
import { useEffect, useState } from "react";
import { useVideo } from "@/context/VideoContext";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { Button } from "@/components/ui/button";

interface TestCompleteProps {
  studentData: StudentData;
  onReturnHome: () => void;
}

export function TestComplete({ studentData, onReturnHome }: TestCompleteProps) {
  const { t } = useTranslation();
  const { stopAndUpload } = useVideo();
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const stop = async () => {
      await stopAndUpload();
    };
    stop();

    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stopAndUpload]);

  return (
    <div className="min-h-screen bg-[#5C94FC] flex items-center justify-center overflow-hidden p-4 relative">
      <div className="absolute top-4 right-4 z-50"><LanguageSwitcher /></div>
      
      {/* Background Clouds */}
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
      
      {/* Grass floor */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />

      <div className="max-w-3xl w-full py-4 relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <Trophy className="w-32 h-32 text-accent stroke-[3] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4"
              >
                <Star className="w-16 h-16 fill-accent text-black" />
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]"
          >
            {t('tcomp_amazing')}{studentData.name}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-white font-bold mb-10 bg-black/20 px-8 py-3 rounded-full inline-block backdrop-blur-sm"
          >
            {t('tcomp_adventure_complete')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-6 mb-10"
          >
            {[
              { icon: '🎯', stat: '6/6', label: t('tcomp_levels') },
              { icon: '⭐', stat: '20+', label: t('tcomp_games') },
              { icon: '🏆', stat: '100%', label: t('tcomp_done') },
            ].map((item, i) => (
              <div key={i} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="text-3xl font-black text-black tracking-tighter">{item.stat}</h3>
                <p className="text-black/60 font-black uppercase text-xs">{item.label}</p>
              </div>
            ))}
          </motion.div>

          {/* Achievement Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white border-4 border-black p-8 mb-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-black text-black mb-6 uppercase tracking-widest border-b-4 border-black pb-4">{t('tcomp_achievements')}</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { icon: '🧱', name: t('tcomp_math') },
                { icon: '❓', name: t('tcomp_reading') },
                { icon: '🍄', name: t('tcomp_writing') },
                { icon: '⭐', name: t('tcomp_emotion') },
                { icon: '🎺', name: t('tcomp_sound') },
                { icon: '🏰', name: t('tcomp_vision') },
              ].map((badge, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-muted border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="text-black font-black text-[10px] uppercase tracking-tighter truncate">{badge.name}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="bg-accent border-4 border-black p-6 mb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          >
            <p className="text-black font-black text-lg uppercase leading-tight">
              {t('tcomp_results_processing')}
            </p>
          </motion.div>

          <motion.div className="flex justify-center">
            <Button
              size="lg"
              onClick={onReturnHome}
              className="text-xl py-8 px-10 h-auto"
            >
              <Home className="w-6 h-6" />
              {t('tcomp_return_home')}
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Sparkles */}
      {[...Array(20)].map((_, i) => (
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