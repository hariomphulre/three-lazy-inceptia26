﻿"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  FileText,
  Users,
  TrendingUp,
  Settings,
  HelpCircle,
  Compass,
  BookOpen,
  Calculator,
  PenTool,
  RefreshCw,
  XCircle,
  Play,
  CheckCircle,
  Search,
  SlidersHorizontal,
  Clock,
  BarChart2,
  Calendar,
  Zap,
  MessageSquare,
  Ear,
  Brain,
  ChevronRight,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useProgress, CardStatus } from "@/hooks/useProgress";
import { PathGameModal } from "@/components/PathGameModal";

interface Assessment {
  id: string;
  child_name: string;
  gender: string;
  age: number;
  report_url: string;
  disabilities: string[] | null;
  created_at?: string;
}

/* ─── Floating symbol element ──────────────────────────────────────────────── */
interface FloatingEl {
  symbol: string;
  x: string;
  y: string;
  size: string;
  delay: number;
  duration: number;
  rotate?: number;
}

function FloatingSymbol({ el, color }: { el: FloatingEl; color: string }) {
  const isRotating = el.rotate !== undefined;
  return (
    <motion.div
      className="absolute pointer-events-none select-none font-extrabold"
      style={{ left: el.x, top: el.y, fontSize: el.size, color, opacity: 0.45, zIndex: 1 }}
      animate={isRotating ? { y: [0, -8, 0], rotate: [0, el.rotate ?? 360] } : { y: [0, -7, 0] }}
      transition={{
        duration: el.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: el.delay,
        ...(isRotating ? { rotate: { duration: el.duration * 2, repeat: Infinity, ease: "linear" } } : {}),
      }}
    >
      {el.symbol}
    </motion.div>
  );
}

/* ─── Disability config ────────────────────────────────────────────────────── */
const DISABILITY_CONFIG: Record<
  string,
  {
    label: string;
    questName: string;
    description: string;
    duration: string;
    method: string;
    color: [string, string];
    floaters: FloatingEl[];
    icon: React.ReactNode;
    phases: { title: string; emoji: string; days: string; activities: string[]; difficulty?: string }[];
  }
> = {
  dyslexia: {
    label: "Dyslexia",
    questName: "Reading Quest",
    description: "Reading & Phonological Support",
    duration: "30 Days",
    method: "Interactive",
    color: ["#7C6FF7", "#A389F4"],
    icon: <BookOpen size={20} />,
    floaters: [
      { symbol: "📖", x: "68%", y: "12%", size: "16px", delay: 0, duration: 3.2 },
      { symbol: "🔤", x: "80%", y: "38%", size: "14px", delay: 0.5, duration: 2.8 },
      { symbol: "abc", x: "62%", y: "58%", size: "10px", delay: 1, duration: 3.5 },
      { symbol: "🧩", x: "74%", y: "75%", size: "14px", delay: 0.3, duration: 2.6 },
      { symbol: "📚", x: "88%", y: "20%", size: "14px", delay: 0.8, duration: 3 },
    ],
    phases: [
      {
        title: "Sound Awareness",
        emoji: "🔊",
        days: "Days 1–5",
        activities: ["Sound Identification", "Ending Sounds", "Rhyming Awareness", "Sound Segmentation", "Sound Blending"],
      },
      {
        title: "Decoding Skills",
        emoji: "🧩",
        days: "Days 6–10",
        activities: ["CVC Words", "Short Vowels Mastery", "Consonant Blends", "Digraphs (sh, ch, th)", "Mixed Decoding"],
      },
      {
        title: "Automaticity",
        emoji: "⚡",
        days: "Days 11–15",
        activities: ["High Frequency Words", "Sight Word Sentences", "Speed Recognition", "Mixed Sight + Decoding", "Fluency Drills"],
      },
      {
        title: "Sentence Reading",
        emoji: "📖",
        days: "Days 16–20",
        activities: ["Simple Sentences", "WH Questions", "Sequencing", "Context Clues", "Sentence Fluency"],
      },
      {
        title: "Comprehension",
        emoji: "🧠",
        days: "Days 21–25",
        activities: ["Short Paragraphs", "Main Idea Identification", "Vocabulary in Context", "Inference Skills", "Comprehension Challenge"],
      },
      {
        title: "Real Application",
        emoji: "🎓",
        days: "Days 26–30",
        activities: ["Timed Story Reading", "Audio + Text Comparison", "Silent Reading", "Mixed Skill Challenge", "Final Assessment"],
      },
    ],
  },
  dyscalculia: {
    label: "Dyscalculia",
    questName: "Math Adventure",
    description: "Number Sense & Arithmetic",
    duration: "30 Days",
    method: "Visual",
    color: ["#2E7D32", "#66BB6A"],
    icon: <Calculator size={20} />,
    floaters: [
      { symbol: "🔢", x: "65%", y: "10%", size: "16px", delay: 0, duration: 3 },
      { symbol: "+−", x: "78%", y: "30%", size: "14px", delay: 0.5, duration: 2.8 },
      { symbol: "🧮", x: "68%", y: "55%", size: "16px", delay: 0.9, duration: 3.4 },
      { symbol: "123", x: "85%", y: "18%", size: "11px", delay: 0.2, duration: 3 },
      { symbol: "⚡", x: "72%", y: "75%", size: "14px", delay: 0.7, duration: 2.6 },
    ],
    phases: [
      {
        title: "Number Foundations",
        emoji: "🔢",
        days: "Days 1–5",
        activities: ["Compare Numbers", "Number Matching", "Count Objects", "Simple Addition (Visual)", "Missing Number Puzzles"],
        difficulty: "Single digit → Visual support → No timer",
      },
      {
        title: "Real World Math",
        emoji: "💰",
        days: "Days 6–10",
        activities: ["Coin Shop Game", "Number Line Jump", "Even/Odd Sorting", "Basic Subtraction Race", "Pattern Completion"],
        difficulty: "Introduce timer + reduce visual hints",
      },
      {
        title: "Time & Sequences",
        emoji: "⏰",
        days: "Days 11–15",
        activities: ["Clock Reading", "Skip Counting", "Multiplication Groups", "Simple Word Problems", "Sequence Builder"],
      },
      {
        title: "Operations",
        emoji: "⚔️",
        days: "Days 16–20",
        activities: ["Multiplication Battle", "Division Sharing", "Multi-step Addition", "Discount Shop Problems"],
      },
      {
        title: "Advanced Problems",
        emoji: "🧩",
        days: "Days 21–25",
        activities: ["Multi-step Shopping", "Budget Planner", "Train Timing Puzzle", "Large Number Addition", "Mental Math Challenge"],
      },
      {
        title: "Mastery + Speed",
        emoji: "🏆",
        days: "Days 26–30",
        activities: ["Mixed Challenges", "Adaptive Difficulty", "Real-world Simulation", "Timed Quiz Mode", "Final Boss Level"],
      },
    ],
  },
  dysgraphia: {
    label: "Dysgraphia",
    questName: "Writing Wizard",
    description: "Fine Motor & Writing",
    duration: "30 Days",
    method: "Hands-On",
    color: ["#7C6FF7", "#A389F4"],
    icon: <PenTool size={20} />,
    floaters: [
      { symbol: "✏️", x: "66%", y: "8%", size: "16px", delay: 0, duration: 2.5 },
      { symbol: "✋", x: "80%", y: "30%", size: "16px", delay: 0.4, duration: 3 },
      { symbol: "🌟", x: "68%", y: "55%", size: "14px", delay: 0.8, duration: 2.8 },
      { symbol: "📝", x: "86%", y: "18%", size: "14px", delay: 0.2, duration: 3.5 },
      { symbol: "✍️", x: "74%", y: "75%", size: "14px", delay: 1.1, duration: 2.6 },
    ],
    phases: [
      {
        title: "Motor Control",
        emoji: "✋",
        days: "Days 1–5",
        activities: ["Glowing Path Tracing", "Connect Dots", "Shape Tracing", "Air Writing Animation"],
      },
      {
        title: "Letter Formation",
        emoji: "✏️",
        days: "Days 6–10",
        activities: ["Copy the Letter", "Match Case", "Fix Broken Letter", "Speed Tracing Challenge"],
      },
      {
        title: "Word Writing",
        emoji: "📝",
        days: "Days 11–15",
        activities: ["Spell and Trace", "Fill Missing Letter", "Word Building Blocks", "Spacing Correction"],
      },
      {
        title: "Sentence Building",
        emoji: "🏗️",
        days: "Days 16–20",
        activities: ["Arrange Jumbled Words", "Write from Audio", "Fix Punctuation", "Story Builder"],
      },
      {
        title: "Structured Writing",
        emoji: "📐",
        days: "Days 21–25",
        activities: ["Describe Picture", "Guided Paragraphs", "Grammar Repair", "Timed Writing Games"],
      },
      {
        title: "Independence",
        emoji: "🌟",
        days: "Days 26–30",
        activities: ["Daily Journal", "Short Story Challenge", "Creative Writing", "Final Accuracy Test"],
      },
    ],
  },
  asd: {
    label: "Autism (ASD)",
    questName: "Social Quest",
    description: "Social Cues & Emotion Recognition",
    duration: "30 Days",
    method: "Social-Visual",
    color: ["#FF9800", "#FFB74D"],
    icon: <Users size={20} />,
    floaters: [
      { symbol: "😊", x: "66%", y: "8%", size: "16px", delay: 0, duration: 2.5 },
      { symbol: "🤝", x: "82%", y: "32%", size: "16px", delay: 0.4, duration: 3 },
      { symbol: "💬", x: "64%", y: "60%", size: "14px", delay: 0.8, duration: 2.8 },
      { symbol: "🎭", x: "88%", y: "20%", size: "14px", delay: 0.2, duration: 3.5 },
    ],
    phases: [
      {
        title: "Emotion Recognition",
        emoji: "🎭",
        days: "Days 1–5",
        activities: ["Match Expressions", "Situation-Emotion Link", "Tone Identification", "Calm Breathing", "Emotion Memory"],
      },
      {
        title: "Social Situations",
        emoji: "🤝",
        days: "Days 6–10",
        activities: ["What to Say?", "Turn-taking Game", "Conversation Builder", "Personal Space", "Greeting Sims"],
      },
      {
        title: "Flexibility",
        emoji: "🧩",
        days: "Days 11–15",
        activities: ["Unexpected Changes", "Problem-solving Story", "Reaction Choice", "Thinking Puzzles", "Multiple Solutions"],
      },
      {
        title: "Conversation",
        emoji: "💬",
        days: "Days 16–20",
        activities: ["Choose Reply", "Topic Maintenance", "Dialogue Match", "Role-play Sim", "Emotional Reasoning"],
      },
      {
        title: "Real-Life Simulation",
        emoji: "🏫",
        days: "Days 21–25",
        activities: ["School Day Sim", "Playground Interaction", "Shop Interaction", "Asking for Help", "Group Activity"],
      },
      {
        title: "Social Mastery",
        emoji: "👑",
        days: "Days 26–30",
        activities: ["Multi-character Story", "Emotional Inference", "Conflict Resolution", "Decision Consequences", "Adaptive Test"],
      },
    ],
  },
  adhd: {
    label: "ADHD",
    questName: "Focus Adventure",
    description: "Attention & Impulse Control",
    duration: "30 Days",
    method: "Cognitive",
    color: ["#F44336", "#EF5350"],
    icon: <Zap size={20} />,
    floaters: [
      { symbol: "⚡", x: "70%", y: "10%", size: "16px", delay: 0, duration: 2 },
      { symbol: "🎯", x: "85%", y: "35%", size: "14px", delay: 0.5, duration: 2.5 },
      { symbol: "🛑", x: "65%", y: "65%", size: "14px", delay: 1, duration: 3 },
    ],
    phases: [
      {
        title: "Attention Training",
        emoji: "🎯",
        days: "Days 1–5",
        activities: ["Spot Difference", "Hidden Objects", "Reaction Tap", "Color-Word Match", "Focus Timer"],
      },
      {
        title: "Working Memory",
        emoji: "🧠",
        days: "Days 6–10",
        activities: ["Memory Card Match", "Sequence Repeat", "Number Recall", "Pattern Copy", "Audio Recall"],
      },
      {
        title: "Impulse Control",
        emoji: "🛑",
        days: "Days 11–15",
        activities: ["Red Light Green Light", "Wait-before-tap", "Go/No-Go Game", "Delayed Reward", "Stop-signal"],
      },
      {
        title: "Task Organization",
        emoji: "📋",
        days: "Days 16–20",
        activities: ["Arrange Steps", "Desk Organization", "Timed Completion", "Routine Planner", "Task Breakdown"],
      },
      {
        title: "Executive Function",
        emoji: "🏗️",
        days: "Days 21–25",
        activities: ["Trip Planning", "Budget Game", "Maze Rules", "Strategy Choice", "Time Allocation"],
      },
      {
        title: "Focus Mastery",
        emoji: "🔥",
        days: "Days 26–30",
        activities: ["Mixed Attention", "Distraction Test", "Long Focus Mode", "Multi-step Mission", "Executive Assessment"],
      },
    ],
  },
  speech: {
    label: "Speech",
    questName: "Clarity Quest",
    description: "Articulation & Fluency",
    duration: "30 Days",
    method: "Audio-Verbal",
    color: ["#9C27B0", "#BA68C8"],
    icon: <MessageSquare size={20} />,
    floaters: [
      { symbol: "🗣️", x: "68%", y: "15%", size: "16px", delay: 0, duration: 3 },
      { symbol: "🎵", x: "82%", y: "40%", size: "14px", delay: 0.6, duration: 2.8 },
      { symbol: "✨", x: "65%", y: "70%", size: "12px", delay: 1.2, duration: 2.4 },
    ],
    phases: [
      {
        title: "Sound Awareness",
        emoji: "👂",
        days: "Days 1–5",
        activities: ["Repeat After Audio", "Mouth Animations", "Sound Discrimination", "Mirror Mimic", "Slow Articulation"],
      },
      {
        title: "Syllable Practice",
        emoji: "👏",
        days: "Days 6–10",
        activities: ["Clap Syllables", "Word Breakdown", "Syllable Builder", "Slow Speech Game", "Syllable Count"],
      },
      {
        title: "Pronunciation",
        emoji: "🗣️",
        days: "Days 11–15",
        activities: ["Record & Compare", "Target Sound List", "Scoring Game", "Tongue Placement", "Minimal Pairs"],
      },
      {
        title: "Sentence Fluency",
        emoji: "🌊",
        days: "Days 16–20",
        activities: ["Read Sentences", "Speed Control", "Breath Timing", "Story Repeat", "Rhythm Speaking"],
      },
      {
        title: "Conversation",
        emoji: "💬",
        days: "Days 21–25",
        activities: ["Role Play", "Question-Answer", "Story Narration", "Express Feelings", "Dialogue Builder"],
      },
      {
        title: "Fluency Mastery",
        emoji: "🌟",
        days: "Days 26–30",
        activities: ["Timed Speech", "Clarity Tracker", "Public Speaking", "Complex Narration", "Final Assessment"],
      },
    ],
  },
  hearing: {
    label: "Hearing",
    questName: "Visual Discovery",
    description: "Visual Cues & Sign Support",
    duration: "30 Days",
    method: "Visual-Sign",
    color: ["#00BCD4", "#4DD0E1"],
    icon: <Ear size={20} />,
    floaters: [
      { symbol: "👁️", x: "66%", y: "10%", size: "16px", delay: 0, duration: 3.5 },
      { symbol: "🤟", x: "84%", y: "35%", size: "14px", delay: 0.7, duration: 2.9 },
      { symbol: "📷", x: "62%", y: "65%", size: "12px", delay: 1.4, duration: 3.1 },
    ],
    phases: [
      {
        title: "Visual Attention",
        emoji: "👁️",
        days: "Days 1–5",
        activities: ["Lip Shape Matching", "Silent Video Guess", "Expression ID", "Gesture Recognition", "Visual Reaction"],
      },
      {
        title: "Sign Language",
        emoji: "🤟",
        days: "Days 6–10",
        activities: ["Sign-Letter Match", "Sign-Word Match", "Sign Memory", "Gesture Imitation", "Sign Spelling"],
      },
      {
        title: "Word Comprehension",
        emoji: "🖼️",
        days: "Days 11–15",
        activities: ["Caption Matching", "Image+Text Pairing", "Visual Meaning", "Rearrange Story", "Missing Word"],
      },
      {
        title: "Sentence Understanding",
        emoji: "📝",
        days: "Days 16–20",
        activities: ["Sign Sentence Builder", "Scenario Selection", "Gesture Emotions", "Image Story", "Dialogue Completion"],
      },
      {
        title: "Social Communication",
        emoji: "🤝",
        days: "Days 21–25",
        activities: ["Classroom Sim", "Family Conversation", "Asking for Help", "Expressing Need", "Conflict Resolution"],
      },
      {
        title: "Mastery",
        emoji: "🏆",
        days: "Days 26–30",
        activities: ["Multi-scene Sim", "Conversation Practice", "Mixed Skill Challenge", "Real-world Tasks", "Final Test"],
      },
    ],
  },
};

/* ─── Seeded disability helper (stable random per assessment ID) ────────────── */
const DISABILITY_LIST = ["dyslexia", "dyscalculia", "dysgraphia", "asd", "adhd", "speech", "hearing"] as const;

function seededDisability(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return DISABILITY_LIST[Math.abs(hash) % DISABILITY_LIST.length];
}

/* ─── Assessment Card ──────────────────────────────────────────────────────── */
function AssessmentCard({
  id,
  childName,
  age,
  gender,
  disability,
  isPending,
  reportUrl,
  createdAt,
  delay,
  onEndPath,
  onStart,
}: {
  id: string;
  childName: string;
  age: number;
  gender: string;
  disability: string;
  isPending: boolean;
  reportUrl: string;
  createdAt?: string;
  delay: number;
  onEndPath: () => void;
  onStart: (name: string) => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const disKey = disability.toLowerCase();
  const cfg = DISABILITY_CONFIG[disKey];
  const totalActivities = cfg?.phases.reduce((s, p) => s + p.activities.length, 0) ?? 15;
  const { progress, status, startDate, endDate, handleStart: hookHandleStart, handleComplete, completeActivity, isLoaded } = useProgress(id, totalActivities);

  const pct = totalActivities > 0 ? Math.round((progress / totalActivities) * 100) : 0;
  const gradColor0 = cfg?.color[0] ?? "#E52521";

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  const [showPathModal, setShowPathModal] = useState(false);

  // Auto-open modal when returning from a completed quest
  useEffect(() => {
    if (!isLoaded) return;
    if (searchParams.get("openModal") === id) {
      setShowPathModal(true);
      router.replace("/personalised-path");
    }
  }, [isLoaded, searchParams, id, router]);

  const handleStart = () => {
    hookHandleStart();
    onStart(childName);
  };

  const handleOpenPath = () => setShowPathModal(true);

  const statusStyles: Record<CardStatus, { label: string; variant: string; color: string }> = {
    idle:     { label: t("pp_status_ready"),    variant: "bg-accent",    color: "text-black" },
    running:  { label: t("pp_status_playing"),  variant: "bg-secondary", color: "text-white" },
    complete: { label: t("pp_status_finished"), variant: "bg-[#43B047]", color: "text-white" },
  };
  const ss = statusStyles[status];

  /* ── FIX: compute phase helpers once, used in both card & dialog ── */
  const getPhaseState = (idx: number) => {
    if (!cfg) return { isComplete: false, isCurrent: false, prevCount: 0 };
    const prevCount = cfg.phases.slice(0, idx).reduce((acc, p) => acc + p.activities.length, 0);
    const count = cfg.phases[idx].activities.length;
    return {
      isComplete: progress >= prevCount + count,
      isCurrent:  progress >= prevCount && progress < prevCount + count,
      prevCount,
    };
  };

  const currentPhaseIdx = cfg?.phases.findIndex((_, idx) => {
    const { isCurrent } = getPhaseState(idx);
    return isCurrent;
  }) ?? -1;

  return (
    // FIX: wrap Dialog around the whole card so DialogTrigger (world map) works correctly
    <Dialog>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: "spring", stiffness: 110 }}
        // FIX: removed `group` from here — it was bleeding into inner group/map hover
        className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative hover:translate-y-[-4px] transition-transform"
      >
        {/* Top accent bar — colored per disability */}
        <div className="h-2 w-full" style={{ backgroundColor: gradColor0 }} />

        {/* Floating symbols — clipped inside card, won't spill out */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {cfg?.floaters.slice(0, 3).map((el, i) => (
            <FloatingSymbol key={i} el={el} color={gradColor0} />
          ))}
        </div>

        <div className="p-6 relative z-10 space-y-5">

          {/* ── Status badge + delete ── */}
          <div className="flex items-center justify-between">
            <div className={`px-4 py-1 border-2 border-black ${ss.variant} ${ss.color} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              <span className="text-xs font-black uppercase tracking-widest">{ss.label}</span>
            </div>
            <button
              onClick={() => {
                if (confirm(`${t("pp_end_path_confirm")} ${childName}?`)) onEndPath();
              }}
              className="text-primary hover:scale-110 transition-transform p-1"
              title={t("pp_end_path")}
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* ── Child info ── */}
          <div>
            {/* FIX: long names were overflowing — added truncate + min-w-0 */}
            <h3 className="text-2xl font-black text-black uppercase italic tracking-tighter leading-none truncate">{childName}</h3>
            <p className="text-xs font-black text-black/40 mt-1 uppercase tracking-widest">
              {t("pp_age")} {age} &middot; {gender}
              {isPending && <span className="ml-2 text-primary">{t("pp_ai_pending")}</span>}
            </p>
          </div>

          {/* ── Disability type ── */}
          <div className="bg-muted border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
            <div className="bg-white border-2 border-black p-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
              {cfg?.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">{t("pp_condition")}</p>
              <p className="text-sm font-black text-black uppercase truncate">{cfg ? t(`pp_dis_${disKey}_label`) : disability}</p>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{t("pp_quest_progress")}</span>
              <span className="text-[10px] font-black text-black uppercase">
                {progress}/{totalActivities} &middot; {pct}%
              </span>
            </div>
            <div className="h-4 border-2 border-black bg-muted overflow-hidden shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <motion.div
                className="h-full border-r-2 border-black"
                style={{ backgroundColor: gradColor0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>

          {/* ── World Map (phases grid) — DialogTrigger ── */}
          <DialogTrigger asChild>
            <div className="space-y-3 cursor-pointer group/map">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest group-hover/map:text-primary transition-colors">
                  {t("pp_world_map")}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-black text-black/30 group-hover/map:text-primary transition-colors uppercase tracking-widest">
                  {t("pp_expand")} <ChevronRight size={10} className="group-hover/map:translate-x-0.5 transition-transform" />
                </div>
              </div>
              {/* FIX: bottom padding so W-N labels don't clip */}
              <div className="grid grid-cols-6 gap-2 pb-5">
                {cfg?.phases.map((phase, idx) => {
                  const { isComplete, isCurrent } = getPhaseState(idx);
                  return (
                    <div
                      key={idx}
                      className={`aspect-square border-2 border-black flex items-center justify-center relative shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover/map:scale-105 ${
                        isComplete ? "bg-chart-4" : isCurrent ? "bg-accent animate-pulse" : "bg-muted"
                      }`}
                      title={`${t(`pp_dis_${disKey}_p${idx}_title`)}: ${t(`pp_phase_days_${idx}`)}`}
                    >
                      <span className="text-sm">{phase.emoji}</span>
                      {isComplete && (
                        <div className="absolute -top-1 -right-1 bg-white border border-black rounded-full p-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                          <CheckCircle size={8} className="text-chart-4" />
                        </div>
                      )}
                      <span className="absolute -bottom-4 left-0 right-0 text-center text-[7px] font-black text-black/30 uppercase">W-{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogTrigger>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-black text-black/40 uppercase leading-none mb-1">{t("pp_started")}</p>
              <p className="text-[10px] font-black text-black uppercase">{fmtDate(startDate)}</p>
            </div>
            <div className="bg-muted border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[9px] font-black text-black/40 uppercase leading-none mb-1">{t("pp_target")}</p>
              <p className="text-[10px] font-black text-black uppercase">{fmtDate(endDate)}</p>
            </div>
          </div>

          {/* ── Footer actions ── */}
          <div className="pt-1 space-y-3">
            {reportUrl && (
              <Button variant="outline" className="w-full text-xs py-5 uppercase tracking-widest" asChild>
                <a href={reportUrl} target="_blank" rel="noopener noreferrer">
                  <FileText size={14} className="mr-2" />
                  {t("pp_view_scroll")}
                </a>
              </Button>
            )}

            {status === "idle" && (
              <Button onClick={handleOpenPath} className="w-full py-6 text-sm uppercase italic tracking-wider">
                <Play size={14} className="fill-current mr-2" />
                {t("pp_begin_quest")}
              </Button>
            )}

            {status === "running" && (
              <Button
                onClick={handleOpenPath}
                className="w-full py-6 text-sm bg-secondary text-white uppercase italic tracking-wider"
              >
                <RefreshCw size={14} className="mr-2" />
                {t("pp_continue_adventure")}
              </Button>
            )}

            {status === "complete" && (
              <div className="w-full py-3 bg-[#43B047] border-4 border-black text-white text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-sm font-black uppercase italic tracking-wider">{t("pp_quest_cleared")}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── PathGameModal (outside Dialog so z-index doesn't clash) ── */}
      <AnimatePresence>
        {showPathModal && (
          <PathGameModal
            open={showPathModal}
            onClose={() => setShowPathModal(false)}
            childName={childName}
            disability={disability}
            assessmentId={id}
            progress={progress}
            totalActivities={totalActivities}
            cfg={cfg}
            status={status}
            onFirstStart={handleStart}
          />
        )}
      </AnimatePresence>

      {/* ── World Map Dialog ── */}
      <DialogContent className="max-w-2xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-8 bg-primary border-b-4 border-black relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20 text-8xl pointer-events-none grayscale">
            {cfg?.icon}
          </div>
          <DialogTitle className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 relative z-10">
            {cfg && t(`pp_dis_${disKey}_quest`)}
          </DialogTitle>
          <DialogDescription className="text-white/80 font-black uppercase tracking-widest text-xs relative z-10">
            {t("pp_adventure_roadmap_for")} {childName} &middot; {cfg && t("pp_duration_30_days")}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left — Mission Log */}
            <div className="space-y-6">
              <h4 className="text-xl font-black text-black uppercase italic tracking-tight border-b-4 border-black pb-2">{t("pp_mission_log")}</h4>
              <div className="space-y-4">
                {cfg?.phases.map((phase, idx) => {
                  const { isComplete, isCurrent } = getPhaseState(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex gap-4 transition-all ${
                        isCurrent ? "bg-accent -translate-y-1" : isComplete ? "bg-chart-4 text-white opacity-80" : "bg-white"
                      }`}
                    >
                      <div className="text-3xl flex-shrink-0">{phase.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          {/* FIX: long phase titles were overflowing dialog */}
                          <p className={`text-sm font-black uppercase truncate ${isComplete ? "text-white" : "text-black"}`}>
                            W{idx + 1}: {t(`pp_dis_${disKey}_p${idx}_title`)}
                          </p>
                          {isComplete && <CheckCircle size={14} className="flex-shrink-0" />}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isComplete ? "text-white/70" : "text-black/40"}`}>
                          {t(`pp_phase_days_${idx}`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — Quest Activities */}
            <div className="space-y-6">
              <h4 className="text-xl font-black text-black uppercase italic tracking-tight border-b-4 border-black pb-2">{t("pp_quest_activities")}</h4>
              <div className="bg-muted border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[200px]">
                {currentPhaseIdx !== -1 && cfg ? (
                  (() => {
                    const phase = cfg.phases[currentPhaseIdx];
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary" className="border-2 border-black rounded-none uppercase font-black px-3 py-1">
                            {t("pp_current_world")}
                          </Badge>
                        </div>
                        <p className="text-lg font-black text-black uppercase leading-tight">{t(`pp_dis_${disKey}_p${currentPhaseIdx}_title`)}</p>
                        <ul className="space-y-3">
                          {phase.activities.map((_act, i) => {
                            // FIX: highlight already-done activities within current phase
                            const { prevCount } = getPhaseState(currentPhaseIdx);
                            const isDone = progress > prevCount + i;
                            return (
                              <li key={i} className="flex items-start gap-3 group">
                                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-colors ${
                                  isDone ? "bg-[#43B047] border-[#43B047]" : "bg-white group-hover:bg-primary group-hover:text-white"
                                }`}>
                                  {isDone
                                    ? <CheckCircle size={10} className="text-white" />
                                    : <span className="text-[10px] font-black">{i + 1}</span>
                                  }
                                </div>
                                <span className={`text-sm font-bold transition-colors ${isDone ? "text-black/40 line-through" : "text-black/70 group-hover:text-black"}`}>
                                  {t(`pp_dis_${disKey}_p${currentPhaseIdx}_a${i}`)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <Button
                          onClick={() =>
                            router.push(
                              `/quest?assessmentId=${id}&disability=${encodeURIComponent(disability.toLowerCase())}&phase=${currentPhaseIdx}&activity=${progress}`
                            )
                          }
                          className="w-full mt-6 py-6 text-sm uppercase italic tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
                        >
                          {t("pp_start_activity")}
                        </Button>
                      </div>
                    );
                  })()
                ) : (
                  // FIX: was using a complex .some() expression that was hard to read and could incorrectly show empty state
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="text-5xl">
                      {status === "complete" ? "🏆" : "🚩"}
                    </div>
                    <p className="text-sm font-black text-black uppercase italic">
                      {status === "complete"
                        ? t("pp_all_quests_cleared")
                        : t("pp_begin_journey")}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Filter pill tabs ─────────────────────────────────────────────────────── */
const FILTERS = ["All", "Dyslexia", "Dyscalculia", "Dysgraphia", "ASD", "ADHD", "Speech", "Hearing", "Pending"];

/* ─── Level Transition Overlay ───────────────────────────────────────────── */
function LevelTransition({ heroName, onComplete }: { heroName: string; onComplete: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center space-y-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-accent border-4 border-black rounded-lg flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce">
            <span className="text-5xl">⭐</span>
          </div>
          <h2 className="text-white text-2xl font-black uppercase tracking-widest italic">{t("pp_ready")}, {heroName}?</h2>
        </div>

        <div className="relative h-24 flex items-center justify-center overflow-hidden w-64">
          <motion.h1
            className="text-8xl font-black text-accent uppercase italic tracking-tighter absolute"
            initial={{ y: 100 }}
            animate={{ y: [100, 0, 0, -100] }}
            transition={{ times: [0, 0.4, 0.6, 1], duration: 2, ease: "anticipate" }}
            onAnimationComplete={onComplete}
          >
            {t("pp_go")}
          </motion.h1>
        </div>
      </motion.div>

      {/* Screen Flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ delay: 1.8, duration: 0.2 }}
      />
    </motion.div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function PersonalisedPathPage() {
  const { t } = useTranslation();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [startingHero, setStartingHero] = useState("");

  const handleBeginAdventure = (heroName: string) => {
    setStartingHero(heroName);
    setIsStarting(true);
  };

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data: Assessment[]) => {
        setAssessments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const allCards = assessments.flatMap((a) => {
    const hasDis = Array.isArray(a.disabilities) && a.disabilities.length > 0;
    if (hasDis) {
      return (a.disabilities as string[]).map((d) => ({
        ...a,
        disability: d,
        isPending: false,
      }));
    }
    return [{ ...a, disability: seededDisability(a.id), isPending: true }];
  });

  const filteredCards = (() => {
    let c = allCards;
    if (filter === "Pending") c = c.filter((x) => x.isPending);
    else if (filter !== "All")
      c = c.filter((x) => x.disability.toLowerCase() === filter.toLowerCase());
    if (search)
      c = c.filter(
        (x) =>
          x.child_name.toLowerCase().includes(search.toLowerCase()) ||
          x.disability.toLowerCase().includes(search.toLowerCase())
      );
    return c;
  })();

  const totalCards = allCards.length;

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`${t("pp_delete_failed")} ${body.error ?? res.statusText}`);
        return;
      }
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert(t("pp_delete_failed_network"));
    }
  };

  const visibleFilters = FILTERS.filter((f) => {
    if (f === "All") return true;
    if (f === "Pending") return allCards.some((x) => x.isPending);
    return allCards.some((x) => x.disability.toLowerCase() === f.toLowerCase());
  });

  return (
    <div className="h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      <Sidebar />

      <AnimatePresence>
        {isStarting && (
          <LevelTransition
            heroName={startingHero}
            onComplete={() => setIsStarting(false)}
          />
        )}
      </AnimatePresence>

      {/* ─ Main Content ─ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">

        {/* ─ Page Header ─ */}
        <div className="px-8 pt-10 pb-4 flex-shrink-0 bg-background border-b-4 border-black">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-black uppercase italic tracking-tighter">{t("pp_adventure_roadmap")}</h1>
              <p className="text-sm font-black text-black/40 mt-1 uppercase tracking-widest">
                {totalCards} {totalCards === 1 ? t("pp_hero") : t("pp_heroes")} {t("pp_on_a_mission")}
              </p>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Search + Filters */}
          <div className="flex items-start gap-4 flex-wrap mt-6">
            <div className="flex items-center gap-3 bg-white border-4 border-black px-5 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full sm:w-72 flex-shrink-0">
              <Search size={16} className="text-black/50 flex-shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("pp_search_placeholder")}
                className="w-full bg-transparent text-sm font-black uppercase outline-none placeholder:text-black/20"
              />
              {/* FIX: clear button when search has text */}
              {search && (
                <button onClick={() => setSearch("")} className="text-black/30 hover:text-primary transition-colors">
                  <XCircle size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {visibleFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2 border-4 border-black text-xs font-black uppercase tracking-widest transition-all ${
                    filter === f
                      ? "bg-accent text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5"
                      : "bg-white text-black hover:bg-muted active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  }`}
                >
                  {f === "All" ? t("pp_all_worlds") : t(`pp_filter_${f.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Card Grid ─ */}
        <div className="flex-1 overflow-y-auto px-8 pb-16 pt-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-6"
              >
                <div className="w-20 h-20 bg-accent border-4 border-black rounded-lg flex items-center justify-center animate-bounce shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-4xl font-black text-black">?</span>
                </div>
                <p className="text-xl font-black text-black uppercase italic tracking-widest">{t("pp_loading_world")}</p>
              </motion.div>

            ) : totalCards === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-6"
              >
                <div className="text-8xl animate-bounce">🏰</div>
                <h4 className="text-3xl font-black text-black uppercase italic text-center">{t("pp_empty_title")}</h4>
                <p className="text-sm font-bold text-black/40 max-w-sm text-center uppercase tracking-widest">
                  {t("pp_empty_desc")}
                </p>
              </motion.div>

            ) : filteredCards.length === 0 ? (
              // FIX: was missing a "no results for filter/search" empty state
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 gap-4"
              >
                <div className="text-6xl">🔍</div>
                <p className="text-lg font-black text-black uppercase italic">{t("pp_no_heroes_found")}</p>
                <button
                  onClick={() => { setSearch(""); setFilter("All"); }}
                  className="text-xs font-black uppercase tracking-widest text-primary underline hover:no-underline"
                >
                  {t("pp_clear_filters")}
                </button>
              </motion.div>

            ) : (
              <motion.div
                key="list"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl mx-auto"
              >
                {filteredCards.map((card, i) => (
                  <AssessmentCard
                    key={`${card.id}-${card.disability}`}
                    id={card.id}
                    childName={card.child_name}
                    age={card.age}
                    gender={card.gender}
                    disability={card.disability}
                    isPending={card.isPending}
                    reportUrl={card.report_url}
                    createdAt={card.created_at}
                    delay={i * 0.05}
                    onEndPath={() => handleDelete(card.id)}
                    onStart={handleBeginAdventure}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─ Footer ─ */}
        <footer className="h-12 bg-white border-t-4 border-black px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#43B047] border border-black animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">{t("pp_system_online")}</span>
          </div>
          <span className="text-xs text-black/40 font-black uppercase tracking-widest">NeuroBloom v4.0</span>
        </footer>
      </main>
    </div>
  );
}