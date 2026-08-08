"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, X, Loader2, Sparkles, Wand2, Feather, ScrollText, Shuffle, RefreshCw, Trash2 } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";

interface Level3Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  phase?: number;
  sessionId?: string | null;
  questionnaireGroup?: "A" | "B" | "C";
}

// CSS-only spinner — no framer-motion on every frame
function ButtonSpinner() {
  return (
    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
  );
}

export function Level3WritingWizard({ onComplete, onProgress, phase = 0, sessionId, questionnaireGroup = "A" }: Level3Props) {
  if (questionnaireGroup === "B") {
    return <GroupBWritingAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
  }

  if (questionnaireGroup === "C") {
    return <GroupCWritingAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
  }

  const { t } = useTranslation();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.url) throw new Error(data.error || "Upload failed");

      const sessionId = localStorage.getItem("sessionId");
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          payload: { test3_image: data.url },
          screening_task: {
            task_id: "A-writing-shape_copy-1",
            domain: "writing",
            construct: "visuomotor_integration",
            task_type: "shape_copy",
            response_data: { image_url: data.url, image_submitted: true, correct: true },
            reaction_time_ms: 3000
          }
        })
      });

    } catch (error) {
      console.error("Error saving image:", error);
      alert(t('game_w1_error'));
      setUploadedImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    window.scrollTo({ top: 0, behavior: 'smooth' });
    onProgress(1);

    setTimeout(() => {
      onComplete();
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="text-center max-w-2xl mx-auto px-4 py-8 h-full overflow-y-auto flex flex-col items-center">
      <h2 className="text-4xl font-black text-black mb-4 uppercase tracking-tight">
        {t('game_w1_title')}
      </h2>

      {/* Static emoji — infinite framer-motion loops cause layout jank */}
      <div className="text-8xl mb-6 drop-shadow-lg select-none animate-bounce">
        🍄
      </div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <div className="bg-muted border-2 border-black p-6 mb-6 shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <p className="text-2xl text-black leading-tight font-black italic whitespace-pre-line text-left">
            {t('game_w1_text')}
          </p>
        </div>
        <p className="text-xl text-primary font-black uppercase tracking-widest">
          {t('game_w1_instr')}
        </p>
      </div>

      {!uploadedImage ? (
        <div className="relative">
          <label
            htmlFor="file-upload"
            className={`cursor-pointer inline-block ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95, y: 0 }}
              className="bg-accent border-4 border-black text-black px-12 py-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              <div className="flex items-center gap-4">
                {isUploading ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <Upload className="w-10 h-10" />
                )}
                <span className="text-2xl font-black uppercase">
                  {isUploading ? t('game_w1_btn_uploading') : t('game_w1_btn_upload')}
                </span>
              </div>
            </motion.div>
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <p className="text-black/40 mt-6 text-sm font-black uppercase tracking-tighter">
            {t('game_w1_upload_hint')}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Check className="w-8 h-8 text-secondary" />
              <p className="text-xl font-black text-black uppercase">{t('game_w1_ready')}</p>
            </div>
            <div className="border-4 border-black inline-block shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img
                src={uploadedImage}
                alt="Uploaded preview"
                className="max-h-60 mx-auto"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center">
            <motion.button
              whileHover={!isSubmitting ? { scale: 1.05, y: -4 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95, y: 0 } : {}}
              onClick={handleSubmit}
              disabled={isUploading || isSubmitting}
              className={`relative bg-primary border-4 border-black text-white text-3xl font-black px-16 py-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:shadow-none uppercase transition-opacity ${
                isSubmitting ? 'opacity-80 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {isSubmitting ? <ButtonSpinner /> : <span>{t('game_w1_btn_submit')}</span>}
              </div>
            </motion.button>

            {!isSubmitting && (
              <>
                <label htmlFor="file-upload-replace" className="cursor-pointer">
                  <span className="text-black/40 text-sm font-black uppercase underline hover:text-black transition-colors">
                    {t('game_w1_try_again')}
                  </span>
                </label>
                <input
                  id="file-upload-replace"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Guaranteed Shuffle Function that NEVER returns target order
function getGuaranteedShuffledWords(targetWords: string[]): string[] {
  if (targetWords.length <= 1) return [...targetWords];
  let shuffled = [...targetWords];
  let attempts = 0;
  
  while (attempts < 20) {
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const isSameOrder = shuffled.every((val, index) => val === targetWords[index]);
    if (!isSameOrder) {
      break;
    }
    attempts++;
  }

  // Hard fallback to ensure order is different
  if (shuffled.every((val, index) => val === targetWords[index])) {
    shuffled = [targetWords[targetWords.length - 1], ...targetWords.slice(0, targetWords.length - 1)];
  }
  return shuffled;
}

// ── Gamified Group B Writing Adventure ─────────────────────────────────────
function GroupBWritingAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [arrangedCards, setArrangedCards] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const startMs = useRef(Date.now());

  const B_TRIALS = [
    {
      id: "B-writing-copy_scroll-1",
      construct: "written_expression_mechanics",
      type: "copy_scroll",
      text: "Copy this sentence exactly: The quick brown fox jumps over the lazy dog.",
      targetText: "The quick brown fox jumps over the lazy dog.",
      words: ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog."],
      answer: "The quick brown fox jumps over the lazy dog.",
      isWordForm: false,
    },
    {
      id: "B-writing-word_form-1",
      construct: "legibility",
      type: "word_form_practice",
      text: "Type these words with spaces: cat dog bird fish",
      targetText: "cat dog bird fish",
      words: ["cat", "dog", "bird", "fish"],
      answer: "cat dog bird fish",
      isWordForm: true,
    },
  ];

  const trial = B_TRIALS[idx];

  // Guaranteed shuffled available cards (different from target order)
  const availableShuffledCards = useMemo(() => {
    return getGuaranteedShuffledWords(trial.words);
  }, [idx, trial.words, shuffleSeed]);

  useEffect(() => {
    startMs.current = Date.now();
    setInputVal("");
    setArrangedCards([]);
    setFeedback(null);
  }, [idx]);

  // Synchronize text area with arranged card sequence
  useEffect(() => {
    if (arrangedCards.length > 0) {
      setInputVal(arrangedCards.join(" "));
    }
  }, [arrangedCards]);

  const handleCardTap = (word: string, cardIndex: number) => {
    // Check if card is already placed
    const countInArranged = arrangedCards.filter((w) => w === word).length;
    const countInOriginal = trial.words.filter((w) => w === word).length;

    if (countInArranged < countInOriginal) {
      setArrangedCards((prev) => [...prev, word]);
    }
  };

  const handleRemoveArrangedCard = (removeIndex: number) => {
    setArrangedCards((prev) => {
      const next = prev.filter((_, i) => i !== removeIndex);
      setInputVal(next.join(" "));
      return next;
    });
  };

  const handleClearSequence = () => {
    setArrangedCards([]);
    setInputVal("");
  };

  const handleReshufflePool = () => {
    setShuffleSeed((s) => s + 1);
    setArrangedCards([]);
    setInputVal("");
  };

  const handleSubmit = async () => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    const isCorrect = inputVal.trim() === trial.answer;
    setFeedback(isCorrect ? "correct" : "incorrect");

    const wordCount = inputVal.trim().split(/\s+/).filter(Boolean).length;
    const wpm = (wordCount / (rt / 1000)) * 60;

    const sId = sessionId || (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null);

    if (sId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          payload: {},
          screening_task: {
            task_id: trial.id,
            domain: "writing",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: inputVal.trim(), wpm: Math.round(wpm), correct: isCorrect },
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60 flex items-center gap-2">
          <Wand2 size={16} className="text-primary" />
          Writing Wizard · Group B
        </span>
        <div className="flex items-center gap-2">
          {B_TRIALS.map((_, step) => (
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center"
        >
          {/* Scroll Card */}
          <div className="bg-[#FFFDF0] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 text-left">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4 mb-4">
              <span className="text-xs font-black text-black/50 uppercase tracking-widest flex items-center gap-1">
                <ScrollText size={14} /> Wizard Quill Scroll
              </span>
              <span className="text-3xl">🧙‍♂️</span>
            </div>

            <p className="text-sm font-bold text-black/60 uppercase mb-3">{trial.text}</p>

            {/* Target Display Box */}
            <div className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
              <span className="text-xs font-black uppercase text-black/40 block mb-1">Target Answer:</span>
              <p className="text-2xl font-black text-black leading-snug">{trial.targetText}</p>
            </div>

            {/* Shuffled Available Word Cards Pool */}
            <div className="mb-6 bg-accent/20 border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase text-black/80 flex items-center gap-1">
                  <Shuffle size={14} className="text-primary" />
                  Shuffled Word Pool (Tap cards to place in order):
                </span>
                <button
                  type="button"
                  onClick={handleReshufflePool}
                  className="text-xs font-black uppercase text-primary hover:underline flex items-center gap-1 bg-white border border-black px-2 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw size={12} /> Reshuffle Pool 🔀
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {availableShuffledCards.map((w, i) => {
                  const timesPlaced = arrangedCards.filter((item) => item === w).length;
                  const timesInOriginal = trial.words.filter((item) => item === w).length;
                  const isUsed = timesPlaced >= timesInOriginal;

                  return (
                    <motion.button
                      key={`pool-${i}-${w}`}
                      whileHover={!isUsed ? { scale: 1.08, y: -3 } : {}}
                      whileTap={!isUsed ? { scale: 0.94 } : {}}
                      type="button"
                      disabled={isUsed}
                      onClick={() => handleCardTap(w, i)}
                      className={`px-5 py-3 border-4 border-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                        isUsed
                          ? "bg-black/10 text-black/30 border-black/30 cursor-not-allowed shadow-none"
                          : "bg-[#FBD000] text-black hover:bg-primary hover:text-white"
                      }`}
                    >
                      {w}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Child's Arranged Sequence Drop Area */}
            <div className="mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase text-black/60">
                  Your Arranged Sequence (Tap card to remove):
                </span>
                {arrangedCards.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSequence}
                    className="text-xs font-black uppercase text-[#E52521] hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Clear All
                  </button>
                )}
              </div>

              <div className="min-h-[64px] p-3 bg-muted border-2 border-dashed border-black/40 flex flex-wrap items-center gap-2">
                {arrangedCards.length === 0 ? (
                  <span className="text-sm font-black text-black/30 uppercase tracking-wider italic">
                    Tap the shuffled cards above to arrange them here...
                  </span>
                ) : (
                  arrangedCards.map((w, idx) => (
                    <motion.button
                      key={`arranged-${idx}-${w}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handleRemoveArrangedCard(idx)}
                      className="px-4 py-2 bg-primary text-white border-3 border-black font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2"
                    >
                      <span>{w}</span>
                      <span className="text-xs text-white/70">✕</span>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Text Input Sync Field */}
            <div className="relative">
              <textarea
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setArrangedCards(e.target.value.trim().split(/\s+/).filter(Boolean));
                }}
                disabled={feedback !== null}
                rows={2}
                className="w-full p-4 border-4 border-black bg-white font-mono text-xl font-bold focus:outline-none focus:border-primary shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] resize-none"
                placeholder="Arranged sequence string will appear here..."
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-black uppercase text-black/40">
                  Target string: "{trial.answer}"
                </span>
                <span className="text-xs font-black uppercase text-black/40">
                  Status: {inputVal.trim() === trial.answer ? "MATCHES TARGET 🎯" : "In Progress..."}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            disabled={feedback !== null || !inputVal.trim()}
            onClick={handleSubmit}
            className="text-2xl font-black py-6 px-12 bg-primary text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#348dbb] transition-all uppercase tracking-widest flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            <Feather size={28} />
            <span>CAST SPELL / SUBMIT 🖋️</span>
          </motion.button>
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

// ── Gamified Group C Writing Adventure ─────────────────────────────────────
function GroupCWritingAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [arrangedCards, setArrangedCards] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const startMs = useRef(Date.now());

  const C_TRIALS = [
    {
      id: "C-writing-timed_copy-1",
      construct: "graphomotor_speed",
      type: "timed_copy_paragraph",
      text: "Copy exactly: In the middle of the night, a loud noise woke everyone up.",
      targetText: "In the middle of the night, a loud noise woke everyone up.",
      words: ["In", "the", "middle", "of", "the", "night,", "a", "loud", "noise", "woke", "everyone", "up."],
      answer: "In the middle of the night, a loud noise woke everyone up.",
    },
    {
      id: "C-writing-essay-1",
      construct: "written_expression_mechanics",
      type: "essay_starter",
      text: "Write 3 words about your favorite animal.",
      targetText: "Example: Friendly loyal dog",
      words: ["Friendly", "Playful", "Fast", "Strong", "Cute"],
      answer: "any",
    },
  ];

  const trial = C_TRIALS[idx];

  const availableShuffledCards = useMemo(() => {
    return getGuaranteedShuffledWords(trial.words);
  }, [idx, trial.words, shuffleSeed]);

  useEffect(() => {
    startMs.current = Date.now();
    setInputVal("");
    setArrangedCards([]);
    setFeedback(null);
  }, [idx]);

  useEffect(() => {
    if (arrangedCards.length > 0) {
      setInputVal(arrangedCards.join(" "));
    }
  }, [arrangedCards]);

  const handleCardTap = (word: string) => {
    const countInArranged = arrangedCards.filter((w) => w === word).length;
    const countInOriginal = trial.words.filter((w) => w === word).length;

    if (countInArranged < countInOriginal) {
      setArrangedCards((prev) => [...prev, word]);
    }
  };

  const handleRemoveArrangedCard = (removeIndex: number) => {
    setArrangedCards((prev) => {
      const next = prev.filter((_, i) => i !== removeIndex);
      setInputVal(next.join(" "));
      return next;
    });
  };

  const handleSubmit = async () => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    const isCorrect = trial.answer === "any" ? inputVal.trim().length > 0 : inputVal.trim() === trial.answer;
    setFeedback(isCorrect ? "correct" : "incorrect");

    const wordCount = inputVal.trim().split(/\s+/).filter(Boolean).length;
    const wpm = (wordCount / (rt / 1000)) * 60;

    const sId = sessionId || (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null);

    if (sId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sId,
          payload: {},
          screening_task: {
            task_id: trial.id,
            domain: "writing",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: inputVal.trim(), wpm: Math.round(wpm), correct: isCorrect },
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
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60 flex items-center gap-2">
          <Wand2 size={16} className="text-primary" />
          Writing Wizard · Group C
        </span>
        <div className="flex items-center gap-2">
          {C_TRIALS.map((_, step) => (
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center"
        >
          {/* Scroll Card */}
          <div className="bg-[#FFFDF0] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 text-left">
            <div className="flex items-center justify-between border-b-2 border-black/10 pb-4 mb-4">
              <span className="text-xs font-black text-black/50 uppercase tracking-widest flex items-center gap-1">
                <ScrollText size={14} /> Master Writing Scroll
              </span>
              <span className="text-3xl">📜</span>
            </div>

            <p className="text-sm font-bold text-black/60 uppercase mb-3">{trial.text}</p>

            {/* Target Display Box */}
            <div className="bg-white border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
              <p className="text-2xl font-black text-black leading-snug">{trial.targetText}</p>
            </div>

            {/* Shuffled Word Cards */}
            <div className="mb-6 bg-accent/20 border-3 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase text-black/70 flex items-center gap-1">
                  <Shuffle size={14} /> Shuffled Word Pool:
                </span>
                <button
                  type="button"
                  onClick={() => setShuffleSeed((s) => s + 1)}
                  className="text-xs font-black uppercase text-primary hover:underline flex items-center gap-1 bg-white border border-black px-2 py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                >
                  <RefreshCw size={12} /> Reshuffle 🔀
                </button>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                {availableShuffledCards.map((w, i) => (
                  <motion.button
                    key={`${i}-${w}`}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => handleCardTap(w)}
                    className="px-4 py-2.5 bg-white border-3 border-black font-black text-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FBD000] transition-all text-black"
                  >
                    + {w}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Child's Arranged Sequence */}
            {arrangedCards.length > 0 && (
              <div className="mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-xs font-black uppercase text-black/60 block mb-2">Arranged Sequence:</span>
                <div className="flex flex-wrap gap-2">
                  {arrangedCards.map((w, i) => (
                    <button
                      key={`arr-${i}`}
                      type="button"
                      onClick={() => handleRemoveArrangedCard(i)}
                      className="px-3 py-1 bg-primary text-white font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {w} ✕
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setArrangedCards(e.target.value.trim().split(/\s+/).filter(Boolean));
                }}
                disabled={feedback !== null}
                rows={3}
                className="w-full p-4 border-4 border-black bg-white font-mono text-xl font-bold focus:outline-none focus:border-primary shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)] resize-none"
                placeholder="Tap words above or type here..."
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-black uppercase text-black/40">
                  Chars: {inputVal.length}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            disabled={feedback !== null || !inputVal.trim()}
            onClick={handleSubmit}
            className="text-2xl font-black py-6 px-12 bg-primary text-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#348dbb] transition-all uppercase tracking-widest flex items-center gap-3 mx-auto disabled:opacity-50"
          >
            <Feather size={28} />
            <span>CAST SPELL / SUBMIT 🖋️</span>
          </motion.button>
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