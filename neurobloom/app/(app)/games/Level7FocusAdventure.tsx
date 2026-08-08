"use client";

/**
 * Level7FocusAdventure — Group-aware attention assessment
 *
 * Group A (age 4–7): 6 Go/No-Go rounds — simple cloud_patrol
 *   task_id: A-attention-cloud_patrol-1
 *   construct: sustained_attention
 *
 * Group B (age 7–12):
 *   - space_patrol_cpt: 18-trial extended CPT (≈6 min equivalent, paced)
 *     constructs: sustained_attention + impulsivity_inhibition
 *   - color_wizard_stroop: 10-trial Stroop-like selective attention
 *     construct: selective_attention
 *
 * Group C (age 12+): same as B but 24 CPT trials + 12 Stroop trials
 *
 * All responses written to screening_responses via /api/session/save
 * so Phase 2 AI scoring has real data.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Check, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface Level7Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
  questionnaireGroup?: "A" | "B" | "C";
}

// ── CPT stimulus config ────────────────────────────────────────────────
type CptStimulus = { letter: string; isTarget: boolean };

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "K", "L", "M", "N", "P", "R", "S", "T"];
const TARGET_LETTER = "X";

function generateCptTrials(n: number): CptStimulus[] {
  // ~30% targets, rest non-targets; no two targets in a row
  const trials: CptStimulus[] = [];
  let lastWasTarget = false;
  for (let i = 0; i < n; i++) {
    const wantTarget: boolean = !lastWasTarget && Math.random() < 0.3;
    trials.push({
      letter: wantTarget ? TARGET_LETTER : LETTERS[Math.floor(Math.random() * LETTERS.length)],
      isTarget: wantTarget,
    });
    lastWasTarget = wantTarget;
  }
  return trials;
}

// ── Stroop config ──────────────────────────────────────────────────────
type StroopTrial = { word: string; inkColor: string; correct: string; isCongruent: boolean };

const COLOR_WORDS = [
  { word: "RED",   hex: "#E52521" },
  { word: "BLUE",  hex: "#5C94FC" },
  { word: "GREEN", hex: "#43B047" },
  { word: "YELLOW",hex: "#FBD000" },
];

function generateStroopTrials(n: number): StroopTrial[] {
  return Array.from({ length: n }, () => {
    const wordEntry = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    const inkEntry  = COLOR_WORDS[Math.floor(Math.random() * COLOR_WORDS.length)];
    return {
      word: wordEntry.word,
      inkColor: inkEntry.hex,
      correct: inkEntry.word,    // answer = name of ink colour
      isCongruent: wordEntry.word === inkEntry.word,
    };
  });
}

// ── Record helper ──────────────────────────────────────────────────────
async function saveTaskResponse(opts: {
  sessionId: string | null;
  taskId: string;
  domain: string;
  construct: string;
  taskType: string;
  responseData: Record<string, unknown>;
  reactionTimeMs: number;
}) {
  if (!opts.sessionId) return;
  await fetch("/api/session/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: opts.sessionId,
      payload: {},
      screening_task: {
        task_id: opts.taskId,
        domain: opts.domain,
        construct: opts.construct,
        task_type: opts.taskType,
        response_data: opts.responseData,
        reaction_time_ms: opts.reactionTimeMs,
      },
    }),
  }).catch(() => {/* non-fatal */});
}

// ── Sub-game: Group-A cloud patrol (6 rounds Go/No-Go) ────────────────
function CloudPatrol({ onDone, sessionId }: { onDone: () => void; sessionId: string | null }) {
  const ROUNDS = 6;
  const [round, setRound]     = useState(0);
  const [light, setLight]     = useState<"red" | "yellow" | "green">("red");
  const [feedback, setFeedback] = useState<"correct" | "early" | null>(null);
  const [score, setScore]     = useState(0);
  const startMs               = useRef(0);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };

  const startRound = useCallback(() => {
    setFeedback(null);
    setLight("red");
    timerRef.current = setTimeout(() => {
      setLight("yellow");
      timerRef.current = setTimeout(() => {
        setLight("green");
        startMs.current = Date.now();
      }, Math.random() * 1700 + 800);
    }, 600);
  }, []);

  useEffect(() => { startRound(); return clear; }, [round, startRound]);

  const handleTap = () => {
    if (feedback !== null) return;
    clear();
    const rt = light === "green" ? Date.now() - startMs.current : 0;
    const correct = light === "green";
    if (correct) { setFeedback("correct"); setScore(s => s + 1); }
    else          { setFeedback("early"); }

    saveTaskResponse({
      sessionId,
      taskId: "A-attention-cloud_patrol-1",
      domain: "attention",
      construct: "sustained_attention",
      taskType: "cloud_patrol",
      responseData: { round: round + 1, light_state: light, tapped: true, correct },
      reactionTimeMs: rt,
    });

    setTimeout(() => {
      if (round < ROUNDS - 1) { setRound(r => r + 1); }
      else { onDone(); }
    }, 1100);
  };

  const bgMap    = { red: "bg-[#E52521]", yellow: "bg-[#FBD000]", green: "bg-[#43B047]" };
  const labelMap = { red: "Wait…", yellow: "Almost…", green: "TAP NOW!" };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6 relative">
      <div className="text-center">
        <p className="text-black/60 font-black uppercase tracking-widest text-sm">
          Watch for the GREEN cloud — tap as fast as you can!
        </p>
        <p className="text-black/30 text-xs font-black uppercase mt-1">Round {round + 1} / {ROUNDS} · Score {score}</p>
      </div>

      <div className="flex flex-col items-center gap-3 bg-black border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {(["red", "yellow", "green"] as const).map(c => (
          <div key={c} className={`w-20 h-20 rounded-full border-4 border-black transition-all duration-150 ${light === c ? bgMap[c] : "bg-black/30"}`} />
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.94, y: 2 }}
        onClick={handleTap}
        disabled={feedback !== null}
        className={`text-2xl font-black uppercase italic tracking-widest px-14 py-7 border-4 border-black transition-colors ${
          light === "green"
            ? "bg-[#43B047] text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            : "bg-white text-black/40 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] cursor-not-allowed"
        }`}
      >
        {labelMap[light]}
      </motion.button>

      <AnimatePresence>
        {feedback && (
          <motion.div
            key="fb"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className={`border-8 border-black p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-3 ${feedback === "correct" ? "bg-[#43B047] rotate-3" : "bg-[#E52521] -rotate-3"}`}>
              {feedback === "correct" ? <Check size={64} strokeWidth={4} className="text-white" /> : <X size={64} strokeWidth={4} className="text-white" />}
              <span className="text-white font-black uppercase italic text-xl">{feedback === "correct" ? "Nice Reflexes!" : "Too Early!"}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-game: Extended CPT (Groups B + C) ─────────────────────────────
const CPT_DISPLAY_MS  = 500;   // stimulus on-screen duration
const CPT_ISI_MS      = 1200;  // inter-stimulus interval (total trial ≈ 1.7s)

function SpacePatrolCPT({
  trials, sessionId, group, onDone,
}: { trials: CptStimulus[]; sessionId: string | null; group: string; onDone: () => void }) {
  const [idx, setIdx]           = useState(0);
  const [showing, setShowing]   = useState(true);
  const [feedback, setFeedback] = useState<"hit" | "false_alarm" | "miss" | null>(null);
  const [responded, setResponded] = useState(false);
  const [stats, setStats]       = useState({ hits: 0, misses: 0, falseAlarms: 0 });
  const startMs                 = useRef(Date.now());
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    if (idx < trials.length - 1) {
      setIdx(i => i + 1);
      setShowing(true);
      setFeedback(null);
      setResponded(false);
      startMs.current = Date.now();
      timerRef.current = setTimeout(() => setShowing(false), CPT_DISPLAY_MS);
    } else {
      onDone();
    }
  }, [idx, trials.length, onDone]);

  useEffect(() => {
    startMs.current = Date.now();
    timerRef.current = setTimeout(() => {
      setShowing(false);
      // Auto-advance after ISI (miss if target and not responded)
      timerRef.current = setTimeout(() => {
        if (!responded && trials[idx].isTarget) {
          setFeedback("miss");
          setStats(s => ({ ...s, misses: s.misses + 1 }));
          saveTaskResponse({
            sessionId,
            taskId: group === "C" ? "C-attention-full_cpt-1" : "B-attention-cpt-1",
            domain: "attention",
            construct: "sustained_attention",
            taskType: group === "C" ? "full_cpt_session" : "space_patrol_cpt",
            responseData: { trial: idx + 1, letter: trials[idx].letter, is_target: true, response: "miss", rt_ms: null },
            reactionTimeMs: 0,
          });
        }
        setTimeout(advance, 400);
      }, CPT_ISI_MS - CPT_DISPLAY_MS);
    }, CPT_DISPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx]);

  const handleTap = () => {
    if (responded) return;
    setResponded(true);
    const rt = Date.now() - startMs.current;
    const t  = trials[idx];

    let fb: "hit" | "false_alarm";
    let newStats = { ...stats };
    if (t.isTarget) {
      fb = "hit"; newStats.hits++;
    } else {
      fb = "false_alarm"; newStats.falseAlarms++;
    }
    setFeedback(fb);
    setStats(newStats);

    saveTaskResponse({
      sessionId,
      taskId: group === "C" ? "C-attention-full_cpt-1" : "B-attention-cpt-1",
      domain: "attention",
      construct: fb === "false_alarm" ? "impulsivity_inhibition" : "sustained_attention",
      taskType: group === "C" ? "full_cpt_session" : "space_patrol_cpt",
      responseData: { trial: idx + 1, letter: t.letter, is_target: t.isTarget, response: fb, rt_ms: rt },
      reactionTimeMs: rt,
    });
  };

  const pct = Math.round((idx / trials.length) * 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 relative select-none">
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs font-black uppercase tracking-widest text-black/40 mb-1">
          <span>Trial {idx + 1}/{trials.length}</span>
          <span>Hits {stats.hits} · FA {stats.falseAlarms} · Miss {stats.misses}</span>
        </div>
        <div className="h-3 bg-muted border-2 border-black">
          <div className="h-full bg-[#FBD000] border-r-2 border-black transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <p className="text-black/50 font-black uppercase tracking-widest text-xs text-center max-w-xs">
        Tap <strong>ONLY</strong> when you see the letter <span className="bg-primary text-white px-2 py-0.5 font-black">X</span>. Ignore all other letters.
      </p>

      {/* Stimulus box */}
      <div className="w-40 h-40 bg-white border-8 border-black flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <AnimatePresence mode="wait">
          {showing ? (
            <motion.span
              key={`stim-${idx}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.08 }}
              className={`text-8xl font-black ${trials[idx].letter === TARGET_LETTER ? "text-[#43B047]" : "text-black"}`}
            >
              {trials[idx].letter}
            </motion.span>
          ) : (
            <motion.span key="blank" className="text-8xl text-transparent">X</motion.span>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        whileTap={{ scale: 0.92, y: 3 }}
        onClick={handleTap}
        disabled={responded}
        className="text-3xl font-black uppercase italic tracking-widest px-16 py-8 border-4 border-black bg-primary text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none disabled:opacity-40"
      >
        {responded ? "✓" : "TAP!"}
      </motion.button>

      <AnimatePresence>
        {feedback && (
          <motion.div
            key="fb"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-sm font-black uppercase tracking-widest px-4 py-2 border-2 border-black ${
              feedback === "hit" ? "bg-[#43B047] text-white" : feedback === "false_alarm" ? "bg-[#E52521] text-white" : "bg-black/10 text-black/60"
            }`}
          >
            {feedback === "hit" ? "✓ Correct!" : feedback === "false_alarm" ? "✗ Wrong letter!" : "Missed!"}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-game: Color Wizard Stroop (Groups B + C) ──────────────────────
function ColorWizardStroop({
  trials, sessionId, group, onDone,
}: { trials: StroopTrial[]; sessionId: string | null; group: string; onDone: () => void }) {
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const startMs                 = useRef(Date.now());

  useEffect(() => { startMs.current = Date.now(); }, [idx]);

  const handleChoice = (choice: string) => {
    if (selected) return;
    const rt       = Date.now() - startMs.current;
    const correct  = choice === trials[idx].correct;
    setSelected(choice);

    saveTaskResponse({
      sessionId,
      taskId: group === "C" ? "C-attention-adv_stroop-1" : "B-attention-stroop-1",
      domain: "attention",
      construct: "selective_attention",
      taskType: group === "C" ? "advanced_stroop" : "color_wizard_stroop",
      responseData: {
        trial: idx + 1,
        word: trials[idx].word,
        ink_color: trials[idx].correct,
        response: choice,
        correct,
        congruent: trials[idx].isCongruent,
      },
      reactionTimeMs: rt,
    });

    setTimeout(() => {
      if (idx < trials.length - 1) setIdx(i => i + 1);
      else onDone();
      setSelected(null);
    }, 900);
  };

  const t = trials[idx];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center space-y-1">
        <p className="text-black/50 font-black uppercase tracking-widest text-xs">
          What <strong>COLOR</strong> is the ink? (Ignore what the word says!)
        </p>
        <p className="text-black/30 text-xs font-black uppercase">Trial {idx + 1}/{trials.length}</p>
      </div>

      {/* Stroop word */}
      <div className="bg-white border-8 border-black p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-w-[260px] text-center">
        <span className="text-6xl font-black uppercase" style={{ color: t.inkColor }}>
          {t.word}
        </span>
      </div>

      {/* Color choices */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
        {COLOR_WORDS.map(c => {
          const isCorrect  = c.word === t.correct;
          const isSelected = c.word === selected;
          return (
            <motion.button
              key={c.word}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleChoice(c.word)}
              disabled={!!selected}
              className={`py-4 border-4 border-black font-black uppercase text-sm tracking-widest transition-all ${
                isSelected && isCorrect  ? "bg-[#43B047] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" :
                isSelected && !isCorrect ? "bg-[#E52521] text-white" :
                "bg-white text-black hover:bg-muted shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              }`}
            >
              <span className="inline-block w-3 h-3 border-2 border-current mr-2" style={{ background: c.hex }} />
              {c.word}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────
export function Level7FocusAdventure({
  onComplete, onProgress, phase = 0, questionnaireGroup,
}: Level7Props) {
  // Resolve group — prop wins; fallback reads localStorage grade if available
  const resolveGroup = (): "A" | "B" | "C" => {
    if (questionnaireGroup) return questionnaireGroup;
    if (typeof window === "undefined") return "B";
    const grade = localStorage.getItem("student_grade") ?? "";
    const map: Record<string, "A" | "B" | "C"> = {
      preschool: "A", grade_1: "A",
      grade_2: "B", grade_3: "B", grade_4: "B", grade_5: "B", grade_6: "B",
      grade_7: "C", grade_8: "C",
    };
    return map[grade] ?? "B";
  };

  const group      = resolveGroup();
  const sessionId  = typeof window !== "undefined" ? localStorage.getItem("sessionId") : null;

  // Derive trial counts per group
  const cptTrialCount    = group === "C" ? 24 : 18;
  const stroopTrialCount = group === "C" ? 12 : 10;

  const [cptTrials]    = useState(() => generateCptTrials(cptTrialCount));
  const [stroopTrials] = useState(() => generateStroopTrials(stroopTrialCount));

  // Sub-game state machine: "cloud" | "cpt" | "stroop" | "done"
  type Stage = "cloud" | "cpt" | "stroop" | "done";
  const initialStage: Stage = group === "A" ? "cloud" : "cpt";
  const [stage, setStage]   = useState<Stage>(initialStage);

  const handleCloudDone = () => {
    onProgress(1);
    onComplete();
  };

  const handleCptDone = () => {
    onProgress(1);
    setStage("stroop");
  };

  const handleStroopDone = () => {
    onProgress(2);
    onComplete();
  };

  const groupLabel = { A: "Group A · Cloud Patrol", B: "Group B · Space Patrol CPT", C: "Group C · Full CPT" };
  const subLabel   = stage === "stroop" ? "Color Wizard" : groupLabel[group];
  const totalSteps = group === "A" ? 1 : 2;
  const stepNow    = stage === "stroop" ? 2 : 1;

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-[#E52521]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {stage === "stroop" ? <Brain size={18} className="text-[#5C94FC]" /> : <Zap size={18} className="text-[#E52521]" />}
          </div>
          <span className="text-white font-black uppercase italic tracking-tight text-xl">{subLabel}</span>
        </div>
        <div className="bg-black/20 border-2 border-white/40 px-3 py-1">
          <span className="text-white text-xs font-black uppercase tracking-widest">
            {group !== "A" ? `Part ${stepNow}/${totalSteps}` : "Go/No-Go"}
          </span>
        </div>
      </div>

      {/* Progress strip */}
      <div className="h-3 bg-white border-b-2 border-black">
        <div className="h-full bg-[#FBD000] border-r-2 border-black transition-all duration-700"
          style={{ width: group === "A" ? "50%" : stage === "cpt" ? "0%" : "55%" }} />
      </div>

      {stage === "cloud" && <CloudPatrol onDone={handleCloudDone} sessionId={sessionId} />}
      {stage === "cpt"   && <SpacePatrolCPT trials={cptTrials}   sessionId={sessionId} group={group} onDone={handleCptDone}   />}
      {stage === "stroop"&& <ColorWizardStroop trials={stroopTrials} sessionId={sessionId} group={group} onDone={handleStroopDone} />}
    </div>
  );
}
