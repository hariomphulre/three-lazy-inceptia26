"use client";

import { useState, useRef } from 'react';
import { motion } from "framer-motion";
import { Upload, Check, Loader2 } from 'lucide-react';
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
  if (questionnaireGroup === "B" || questionnaireGroup === "C") {
    return <WritingQuestTerminal onComplete={onComplete} sessionId={sessionId} group={questionnaireGroup} />;
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
          payload: { test3_image: data.url }
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

// ── Writing Quest Terminal for Groups B and C ────────────────────────────────
function WritingQuestTerminal({ onComplete, sessionId, group }: { onComplete: () => void, sessionId?: string | null, group: "B" | "C" }) {
  const [idx, setIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const startMs = useRef(Date.now());
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const B_TRIALS = [
    { id: "B-writing-copy_scroll-1", construct: "written_expression_mechanics", type: "copy_scroll", text: "Copy this sentence exactly: The quick brown fox jumps over the lazy dog.", answer: "The quick brown fox jumps over the lazy dog." },
    { id: "B-writing-word_form-1", construct: "legibility", type: "word_form_practice", text: "Type these words with spaces: cat dog bird fish", answer: "cat dog bird fish" },
  ];
  
  const C_TRIALS = [
    { id: "C-writing-timed_copy-1", construct: "graphomotor_speed", type: "timed_copy_paragraph", text: "Copy exactly: In the middle of the night, a loud noise woke everyone up.", answer: "In the middle of the night, a loud noise woke everyone up." },
    { id: "C-writing-essay-1", construct: "written_expression_mechanics", type: "essay_starter", text: "Write 3 words about your favorite animal.", answer: "any" },
  ];

  const trials = group === "C" ? C_TRIALS : B_TRIALS;
  const trial = trials[idx];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    
    // Loose grading for demo
    const isCorrect = trial.answer === "any" ? inputVal.trim().length > 0 : inputVal.trim() === trial.answer;
    setFeedback(isCorrect ? "correct" : "incorrect");

    // WPM calculation surrogate
    const wordCount = inputVal.trim().split(/\s+/).length;
    const wpm = (wordCount / (rt / 1000)) * 60;

    if (sessionId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          payload: {},
          screening_task: {
            task_id: trial.id,
            domain: "writing",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: inputVal.trim(), wpm: Math.round(wpm), correct: isCorrect },
            reaction_time_ms: rt
          }
        })
      }).catch(() => {});
    }

    setTimeout(() => {
      setFeedback(null);
      setInputVal("");
      if (idx < trials.length - 1) {
        setIdx(i => i + 1);
        startMs.current = Date.now();
      } else {
        onComplete();
      }
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-xl border-4 border-zinc-700 shadow-2xl max-w-2xl mx-auto w-full text-zinc-100 font-mono">
      <div className="w-full flex justify-between items-center border-b-2 border-zinc-700 pb-4 mb-8 text-zinc-400">
        <span className="uppercase tracking-widest text-sm">WRITING PROTOCOL: {group}</span>
        <span className="text-sm">TRIAL {idx + 1} / {trials.length}</span>
      </div>
      
      <div className="min-h-[120px] flex items-center justify-center text-center w-full mb-8">
        <p className="text-2xl leading-relaxed">{trial.text}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <textarea 
          autoFocus 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={feedback !== null}
          className="bg-zinc-800 border-2 border-zinc-600 rounded p-4 text-xl focus:outline-none focus:border-emerald-500 transition-colors min-h-[150px]"
          placeholder="Type here..."
        />
        <button 
          type="submit" 
          disabled={feedback !== null || !inputVal.trim()}
          className={`py-6 text-xl font-bold tracking-widest uppercase transition-colors rounded ${
            feedback === "correct" ? "bg-emerald-500 text-white" : 
            feedback === "incorrect" ? "bg-rose-500 text-white" : 
            "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {feedback === "correct" ? "LOGGED" : feedback === "incorrect" ? "INCORRECT" : "SUBMIT"}
        </button>
      </form>
    </div>
  );
}