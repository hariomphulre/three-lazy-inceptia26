"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useProgress } from "@/hooks/useProgress";
import { Level1MathAdventure } from "@/app/(app)/games/Level1MathAdventure";
import { Level2ReadingRocket } from "@/app/(app)/games/Level2ReadingRocket";
import { Level3WritingWizard } from "@/app/(app)/games/Level3WritingWizard";
import { Level4FeelingFriends } from "@/app/(app)/games/Level4FeelingFriends";
import { Level5SuperEars } from "@/app/(app)/games/Level5SuperEars";
import { Level6EagleEyes } from "@/app/(app)/games/Level6EagleEyes";
import { Level7FocusAdventure } from "@/app/(app)/games/Level7FocusAdventure";
import { Level8ClarityQuest } from "@/app/(app)/games/Level8ClarityQuest";
import { Level9VisualDiscovery } from "@/app/(app)/games/Level9VisualDiscovery";
import { motion, AnimatePresence } from "framer-motion";

function QuestContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const assessmentId = searchParams.get("assessmentId") || "";
  const disability = searchParams.get("disability") || "";
  const activityStr = searchParams.get("activity") || "0";
  const phaseStr = searchParams.get("phase") || "0";
  const activityIdx = parseInt(activityStr, 10);
  const phaseIdx = parseInt(phaseStr, 10);
  
  // We assume 30 total activities for all quests right now.
  const { completeActivity, isLoaded, progress } = useProgress(assessmentId, 30);
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    completeActivity();
    setCompleted(true);
    setTimeout(() => {
      router.push(`/personalised-path?openModal=${encodeURIComponent(assessmentId)}`);
    }, 2500);
  };

  const handleProgress = (gameIndex: number) => {
    // Optional handling of internal progress
  };

  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-background"><span className="text-4xl animate-bounce">⭐</span></div>;

  let GameComponent;
  switch (disability.toLowerCase()) {
    case "dyscalculia":
      GameComponent = Level1MathAdventure;
      break;
    case "dyslexia":
      GameComponent = Level2ReadingRocket;
      break;
    case "dysgraphia":
      GameComponent = Level3WritingWizard;
      break;
    case "asd":
      GameComponent = Level4FeelingFriends;
      break;
    case "adhd":
      GameComponent = Level7FocusAdventure;
      break;
    case "speech":
      GameComponent = Level8ClarityQuest;
      break;
    case "hearing":
      GameComponent = Level9VisualDiscovery;
      break;
    default:
      GameComponent = Level6EagleEyes;
      break;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <button 
          onClick={() => router.push("/personalised-path")}
          className="px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-muted active:translate-y-1 active:translate-x-1 active:shadow-none transition-all"
        >
          Abandon Quest
        </button>
        <div className="px-4 py-2 bg-white border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          Mission {progress + 1}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {completed ? (
          <motion.div 
            key="success"
            initial={{ scale: 0.5, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1, rotate: [0, -10, 10, -10, 10, 0] }} 
            transition={{ type: "spring", bounce: 0.5 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-32 h-32 bg-accent border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rounded-full">
              <span className="text-6xl">⭐</span>
            </div>
            <h1 className="text-4xl font-black text-black uppercase italic tracking-tighter">Mission Cleared!</h1>
            <p className="font-bold text-black/50 uppercase text-sm tracking-widest">Returning to World Map...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="game"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="w-full max-w-4xl h-[80vh] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden relative"
          >
            {disability.toLowerCase() === "dysgraphia" ? (
              <Level3WritingWizard onComplete={handleComplete} onProgress={handleProgress} phase={phaseIdx} />
            ) : disability.toLowerCase() === "adhd" ? (
              <Level7FocusAdventure onComplete={handleComplete} onProgress={handleProgress} phase={phaseIdx} />
            ) : disability.toLowerCase() === "speech" ? (
              <Level8ClarityQuest onComplete={handleComplete} onProgress={handleProgress} phase={phaseIdx} />
            ) : disability.toLowerCase() === "hearing" ? (
              <Level9VisualDiscovery onComplete={handleComplete} onProgress={handleProgress} phase={phaseIdx} />
            ) : (
              <GameComponent onComplete={handleComplete} onProgress={handleProgress} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-background flex items-center justify-center"><span className="text-4xl animate-bounce">🍄</span></div>}>
      <QuestContent />
    </Suspense>
  );
}
