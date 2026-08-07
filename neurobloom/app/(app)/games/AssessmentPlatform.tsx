"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { Level1MathAdventure } from '../games/Level1MathAdventure';
import { Level2ReadingRocket } from '../games/Level2ReadingRocket';
import { Level3WritingWizard } from '../games/Level3WritingWizard';
import { Level4FeelingFriends } from '../games/Level4FeelingFriends';
import { Level5SuperEars } from '../games/Level5SuperEars';
import { Level6EagleEyes } from '../games/Level6EagleEyes';
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface AssessmentPlatformProps {
  onExit?: () => void;
}

type LevelId = 1 | 2 | 3 | 4 | 5 | 6;

interface Level {
  id: LevelId;
  name: string;
  theme: string;
  icon: string;
  color: string;
  totalGames: number;
  completed: boolean;
  unlocked: boolean;
}

export function AssessmentPlatform({ onExit }: AssessmentPlatformProps) {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState<LevelId | null>(null);
  const [currentGame, setCurrentGame] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<LevelId[]>([]);

  const levels: Level[] = [
    {
      id: 1,
      name: t('ap_math_adv'),
      theme: t('ap_math_theme'),
      icon: '🧱',
      color: 'from-orange-400 to-red-500',
      totalGames: 6,
      completed: false,
      unlocked: true,
    },
    {
      id: 2,
      name: t('ap_read_rock'),
      theme: t('ap_read_theme'),
      icon: '❓',
      color: 'from-yellow-400 to-orange-500',
      totalGames: 2,
      completed: false,
      unlocked: true,
    },
    {
      id: 3,
      name: t('ap_writ_wiz'),
      theme: t('ap_writ_theme'),
      icon: '🍄',
      color: 'from-red-400 to-rose-500',
      totalGames: 1,
      completed: false,
      unlocked: true,
    },
    {
      id: 4,
      name: t('ap_feel_fri'),
      theme: t('ap_feel_theme'),
      icon: '⭐',
      color: 'from-blue-400 to-indigo-500',
      totalGames: 4,
      completed: false,
      unlocked: true,
    },
    {
      id: 5,
      name: t('ap_sup_ears'),
      theme: t('ap_sup_theme'),
      icon: '🎺',
      color: 'from-green-400 to-emerald-500',
      totalGames: 3,
      completed: false,
      unlocked: true,
    },
    {
      id: 6,
      name: t('ap_eag_eyes'),
      theme: t('ap_eag_theme'),
      icon: '🏰',
      color: 'from-purple-400 to-pink-500',
      totalGames: 4,
      completed: false,
      unlocked: true,
    },
  ];

  const celebrateLevelComplete = () => {
    setShowCelebration(true);
    setStars(stars + 1);
    if (currentLevel) {
      setCompletedLevels([...completedLevels, currentLevel]);
    }
    setTimeout(() => {
      setShowCelebration(false);
      setCurrentLevel(null);
      setCurrentGame(0);
    }, 3000);
  };

  if (showCelebration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400 flex items-center justify-center overflow-hidden">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block mb-6"
          >
            <Trophy className="w-32 h-32 text-yellow-400" />
          </motion.div>
          <h1 className="text-6xl font-black text-white mb-4">
            {t('ap_amazing_work')}
          </h1>
          <div className="flex gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Star className="w-12 h-12 fill-yellow-300 text-yellow-400" />
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Floating sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '100vh', x: Math.random() * window.innerWidth, opacity: 1 }}
            animate={{ y: '-100vh', opacity: 0 }}
            transition={{ duration: 3, delay: Math.random() * 2, repeat: Infinity }}
            className="absolute"
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        ))}
      </div>
    );
  }

  if (!currentLevel) {
    return (
      <div className="min-h-screen bg-[#5C94FC] p-8 relative overflow-hidden">
        {/* Background Clouds */}
        <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
        <div className="absolute bottom-40 left-1/4 w-24 h-8 bg-white rounded-full opacity-50 blur-sm" />
        
        {/* Grass floor */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black shadow-[inset_0_8px_0_0_rgba(0,0,0,0.1)]" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block text-8xl mb-4 drop-shadow-xl"
            >
              ⭐
            </motion.div>
            <h1 className="text-6xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {t('ap_welcome')}
            </h1>
            <p className="text-2xl text-white font-bold bg-black/20 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
              {t('ap_choose_level')}
            </p>
          </div>

          {/* Stars collected */}
          <div className="flex justify-center items-center gap-4 mb-12">
            <LanguageSwitcher />
            <div className="bg-accent border-4 border-black px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
              <Star className="w-8 h-8 fill-white text-black" />
              <span className="text-3xl font-black text-black">{stars} {t('ap_stars')}</span>
            </div>
          </div>

          {/* Level path */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative" style={{ zIndex: 1 }}>
              {levels.map((level, index) => (
                <motion.div
                  key={level.id}
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: 'spring' }}
                  whileHover={{ scale: level.unlocked ? 1.05 : 1, y: -10 }}
                  whileTap={{ scale: level.unlocked ? 0.95 : 1 }}
                  className={`cursor-pointer ${!level.unlocked && 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => level.unlocked && setCurrentLevel(level.id)}
                >
                  <div className={`bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group`}>
                    {/* Level Number Badge */}
                    <div className={`absolute top-0 right-0 px-4 py-2 bg-black text-white font-black text-xl`}>
                      #{level.id}
                    </div>

                    <div className="relative text-center">
                      <div className="text-7xl mb-6 group-hover:scale-110 transition-transform">{level.icon}</div>
                      <h3 className="text-3xl font-black text-black mb-1 uppercase tracking-tight">
                        {level.name}
                      </h3>
                      <p className="text-black/60 font-bold text-sm mb-6">{level.theme}</p>
                      
                      <div className="bg-primary border-2 border-black px-4 py-2 inline-block shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="text-white font-black uppercase text-xs tracking-widest">
                          {level.totalGames} {t('ap_games_count')}
                        </span>
                      </div>

                      {level.completed && (
                        <div className="absolute top-2 left-2 rotate-[-12deg]">
                          <Star className="w-10 h-10 fill-accent text-black" />
                        </div>
                      )}

                      {!level.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <div className="text-6xl">🔒</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Level is selected - render game content
  const selectedLevel = levels.find(l => l.id === currentLevel)!;
  
  const renderLevelContent = () => {
    switch (currentLevel) {
      case 1:
        return (
          <Level1MathAdventure
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      case 2:
        return (
          <Level2ReadingRocket
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      case 3:
        return (
          <Level3WritingWizard
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      case 4:
        return (
          <Level4FeelingFriends
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      case 5:
        return (
          <Level5SuperEars
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      case 6:
        return (
          <Level6EagleEyes
            onComplete={celebrateLevelComplete}
            onProgress={(gameIndex) => setCurrentGame(gameIndex)}
          />
        );
      default:
        return (
          <div className="text-center">
            <h2 className="text-4xl font-black text-purple-600 mb-4">
              {selectedLevel.name}
            </h2>
            <p className="text-2xl text-gray-600 mb-8">{t('ap_coming_soon')}</p>
            <button
              onClick={() => {
                setCurrentLevel(null);
                setCurrentGame(0);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl font-bold px-12 py-6 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              {t('ap_back_levels')}
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className={`min-h-screen bg-[#5C94FC] p-8 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Progress bar */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
          <div className="flex items-center gap-6">
            <div className="flex-1 bg-muted border-2 border-black h-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentGame / selectedLevel.totalGames) * 100}%` }}
                className="bg-primary h-full border-r-2 border-black"
              />
            </div>
            <div className="bg-accent border-2 border-black px-4 py-1">
              <span className="text-xl font-black text-black">
                {currentGame}/{selectedLevel.totalGames}
              </span>
            </div>
            <button
              onClick={() => {
                setCurrentLevel(null);
                setCurrentGame(0);
              }}
              className="text-sm font-black text-black hover:text-primary uppercase underline"
            >
              {t('ap_exit')}
            </button>
          </div>
        </div>

        {/* Game content */}
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 min-h-[500px]">
          <div className="mb-8 flex items-center justify-between border-b-4 border-black pb-6">
            <div>
              <h2 className="text-4xl font-black text-black uppercase tracking-tight">
                {selectedLevel.name}
              </h2>
              <p className="text-black/60 font-bold uppercase text-sm tracking-widest">{selectedLevel.theme}</p>
            </div>
            <div className="text-6xl">{selectedLevel.icon}</div>
          </div>
          {renderLevelContent()}
        </div>
      </div>
    </div>
  );
}
  