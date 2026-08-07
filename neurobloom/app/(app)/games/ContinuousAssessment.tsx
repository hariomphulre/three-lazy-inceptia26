"use client";

import { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Star, Sparkles, Trophy } from 'lucide-react';
import { Level1MathAdventure } from '../games/Level1MathAdventure';
import { Level2ReadingRocket } from '../games/Level2ReadingRocket';
import { Level3WritingWizard } from '../games/Level3WritingWizard';
import { Level4FeelingFriends } from '../games/Level4FeelingFriends';
import { Level5SuperEars } from '../games/Level5SuperEars';
import { Level6EagleEyes } from '../games/Level6EagleEyes';
import { Level7FocusAdventure } from '../games/Level7FocusAdventure';
import { StudentData } from './StudentForm';
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface ContinuousAssessmentProps {
  studentData: StudentData;
  onComplete: () => void;
}

type LevelId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Level {
  id: LevelId;
  name: string;
  theme: string;
  icon: string;
  color: string;
  totalGames: number;
}

export function ContinuousAssessment({ studentData, onComplete }: ContinuousAssessmentProps) {
  const { t } = useTranslation();
  const [currentLevel, setCurrentLevel] = useState<LevelId>(1);
  const [currentGame, setCurrentGame] = useState<number>(0);
  const [showTransition, setShowTransition] = useState(false);
  const [completedLevels, setCompletedLevels] = useState<LevelId[]>([]);

  const gradeGroupMap: Record<string, "A" | "B" | "C"> = {
    preschool: "A", grade_1: "A",
    grade_2: "B", grade_3: "B", grade_4: "B", grade_5: "B", grade_6: "B",
    grade_7: "C", grade_8: "C"
  };
  const grade = studentData?.school_grade || "";
  const questionnaireGroup = gradeGroupMap[grade] || ((studentData?.age || 8) <= 7 ? "A" : (studentData?.age || 8) <= 12 ? "B" : "C");
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem("sessionId") || "" : "";

  const baseLevels: Level[] = [
    {
      id: 1,
      name: t('ap_math_adv'),
      theme: t('ap_math_theme'),
      icon: '🧱',
      color: 'from-orange-400 to-red-500',
      totalGames: questionnaireGroup === "A" ? 5 : 3,
    },
    {
      id: 2,
      name: t('ap_read_rock'),
      theme: t('ap_read_theme'),
      icon: '❓',
      color: 'from-yellow-400 to-orange-500',
      totalGames: 2,
    },
    {
      id: 3,
      name: t('ap_writ_wiz'),
      theme: t('ap_writ_theme'),
      icon: '🍄',
      color: 'from-red-400 to-rose-500',
      totalGames: 1,
    },
    {
      id: 4,
      name: t('ap_feel_fri'),
      theme: t('ap_feel_theme'),
      icon: '⭐',
      color: 'from-blue-400 to-indigo-500',
      totalGames: 4,
    }
  ];

  if (questionnaireGroup === "A") {
    baseLevels.push(
      { id: 5, name: t('ap_sup_ears'), theme: t('ap_sup_theme'), icon: '🎺', color: 'from-green-400 to-emerald-500', totalGames: 3 },
      { id: 6, name: t('ap_eag_eyes'), theme: t('ap_eag_theme'), icon: '🏰', color: 'from-purple-400 to-pink-500', totalGames: 4 }
    );
  } else {
    baseLevels.push(
      { id: 7, name: "Focus Terminal", theme: "Clinical Attention", icon: '🧠', color: 'from-blue-600 to-purple-600', totalGames: 2 }
    );
  }

  const levels = baseLevels;

  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen not supported or denied');
      }
    };
    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, []);

  const handleLevelComplete = () => {
    setCompletedLevels([...completedLevels, currentLevel]);
    const currentIdx = levels.findIndex(l => l.id === currentLevel);
    const nextLevel  = levels[currentIdx + 1];
    if (nextLevel) {
      setShowTransition(true);
      setTimeout(() => {
        setCurrentLevel(nextLevel.id as LevelId);
        setCurrentGame(0);
        setShowTransition(false);
      }, 3000);
    } else {
      onComplete();
    }
  };

  const selectedLevel = levels.find(l => l.id === currentLevel)!;
  const totalGames = levels.reduce((sum, level) => sum + level.totalGames, 0);
  const completedGames = levels
    .slice(0, currentLevel - 1)
    .reduce((sum, level) => sum + level.totalGames, 0) + currentGame;
  const overallProgress = (completedGames / totalGames) * 100;

    if (showTransition) {
      const currentIdx = levels.findIndex(l => l.id === currentLevel);
      const nextLevel  = levels[currentIdx + 1] ?? levels[levels.length - 1];
      return (
        <div className={`min-h-screen bg-[#5C94FC] flex items-center justify-center overflow-hidden p-4 relative`}>
          {/* Background Clouds */}
          <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
          <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
          
          {/* Grass floor */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black" />
  
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="text-center relative z-10"
          >
            <motion.div
              animate={{ rotate: 360, y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <Trophy className="w-32 h-32 text-accent stroke-[3] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
            </motion.div>
            <h1 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              {t('ca_level_complete')}
            </h1>
            <div className="flex gap-2 justify-center mb-10">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Star className="w-12 h-12 fill-accent text-black" />
                </motion.div>
              ))}
            </div>
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm mx-auto">
              <p className="text-xs font-black text-black/40 uppercase tracking-widest mb-4">{t('ca_get_ready')}</p>
              <div className="text-7xl mb-4 drop-shadow-md">{nextLevel.icon}</div>
              <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter mb-1">{nextLevel.name}</h2>
              <p className="text-sm font-black text-primary uppercase tracking-widest">{nextLevel.theme}</p>
            </div>
          </motion.div>
          
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: '100vh', x: Math.random() * 100 + 'vw', opacity: 1 }}
              animate={{ y: '-100vh', opacity: 0 }}
              transition={{ duration: 3, delay: Math.random() * 2, repeat: Infinity }}
              className="absolute pointer-events-none"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          ))}
        </div>
      );
    }
  
    const renderLevelContent = () => {
      const props = {
        sessionId,
        questionnaireGroup,
        onComplete: handleLevelComplete,
        onProgress: (gameIndex: number) => setCurrentGame(gameIndex)
      };

      switch (currentLevel) {
        case 1: return <Level1MathAdventure {...props} />;
        case 2: return <Level2ReadingRocket {...props} />;
        case 3: return <Level3WritingWizard {...props} />;
        case 4: return <Level4FeelingFriends {...props} />;
        case 5: return <Level5SuperEars {...props} />;
        case 6: return <Level6EagleEyes {...props} />;
        case 7: return <Level7FocusAdventure {...props} />;
      }
    };
  
    return (
      <div className={`min-h-screen bg-[#5C94FC] p-4 md:p-8 relative overflow-hidden font-sans`}>
        {/* Background Clouds */}
        <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm" />
        <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md" />
  
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Top Header */}
          <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary border-2 border-black w-12 h-12 flex items-center justify-center text-white text-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {studentData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-black uppercase italic tracking-tighter leading-none">{studentData.name}</h3>
                  <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">{t('ca_age')} {studentData.age} • {t('ca_assessment')}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <LanguageSwitcher />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{t('ca_level')} {currentLevel} / 6</p>
                  <p className="text-xl font-black text-primary uppercase italic tracking-tighter">
                    {selectedLevel.name}
                  </p>
                </div>
              </div>
            </div>
  
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-black uppercase tracking-widest">{t('ca_progress')}</span>
                <span className="text-[10px] font-black text-black uppercase tracking-widest">{Math.round(overallProgress)}%</span>
              </div>
              <div className="h-4 border-2 border-black bg-muted overflow-hidden shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-secondary border-r-2 border-black"
                />
              </div>
            </div>
          </div>
  
          {/* Current Level Progress */}
          <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-3xl drop-shadow-sm">{selectedLevel.icon}</div>
                <span className="text-xs font-black text-black uppercase tracking-widest whitespace-nowrap">
                  {t('ca_game')} {currentGame + 1}/{selectedLevel.totalGames}
                </span>
              </div>
              <div className="flex-1 h-3 border-2 border-black bg-muted overflow-hidden shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentGame) / selectedLevel.totalGames) * 100}%` }}
                  className="h-full bg-accent border-r-2 border-black"
                />
              </div>
            </div>
          </div>
  
          {/* Game Content */}
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 min-h-[40vh]">
            {renderLevelContent()}
          </div>
  
          {/* Level indicators */}
          <div className="mt-8 flex justify-center gap-4">
            {levels.map((level) => (
              <div
                key={level.id}
                className={`transition-all ${
                  level.id === currentLevel ? 'translate-y-[-4px]' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-12 h-12 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                    completedLevels.includes(level.id)
                      ? 'bg-[#43B047] text-white'
                      : level.id === currentLevel
                      ? `bg-accent text-black`
                      : 'bg-white'
                  }`}
                >
                  {completedLevels.includes(level.id) ? '✓' : level.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  