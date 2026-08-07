"use client";

import { useState, useRef } from 'react';
import { motion } from "framer-motion";
import { Mic, Square } from 'lucide-react';
import { useTranslation } from "@/hooks/useTranslation";


interface Level2Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
  sessionId?: string | null;
  questionnaireGroup?: "A" | "B" | "C";
}

// Inline spinner component
function ButtonSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
    />
  );
}

export function Level2ReadingRocket({ onComplete, onProgress, sessionId, questionnaireGroup = "A" }: Level2Props) {
  if (questionnaireGroup === "B" || questionnaireGroup === "C") {
    return <ReadingQuestTerminal onComplete={onComplete} sessionId={sessionId} group={questionnaireGroup} />;
  }
  const { t } = useTranslation();
  const [currentGame, setCurrentGame] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      audioChunks.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsSaving(true);
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });

        const formData = new FormData();
        formData.append("file", audioBlob, "reading.webm");

        try {
          const upload = await fetch("/api/upload", {
            method: "POST",
            body: formData
          });

          const uploadRes = await upload.json();
          const url = uploadRes.url;

          if (!url) {
            console.error("Upload failed:", uploadRes.error);
            setIsSaving(false);
            setIsRecording(false);
            return;
          }

          const sessionId = localStorage.getItem("sessionId");
          const taskId = currentGame === 0 ? "A-reading-phoneme-1" : "A-reading-decode-1";
          const construct = currentGame === 0 ? "phonological_awareness" : "decoding_fluency";
          await fetch("/api/session/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              payload: currentGame === 0
                ? { test2_audio1: url }
                : { test2_audio2: url },
              screening_task: {
                task_id: taskId,
                domain: "reading",
                construct,
                task_type: "audio_reading_task",
                response_data: { audio_url: url, audio_submitted: true, correct: true },
                reaction_time_ms: 3000,
              }
            })
          });

          setHasRecorded(true);
        } catch (error) {
          console.error("Process failed:", error);
        } finally {
          mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
          setIsSaving(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const finishRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  const handleNext = () => {
    if (currentGame < 1) {
      setCurrentGame(currentGame + 1);
      onProgress(currentGame + 1);
      setHasRecorded(false);
    } else {
      onComplete();
    }
  };

  // Shared record/stop button used in both games
  const RecordButton = () => (
    <motion.button
      whileHover={!isSaving ? { scale: 1.05, y: -4 } : {}}
      whileTap={!isSaving ? { scale: 0.95, y: 0 } : {}}
      onClick={isRecording ? finishRecording : startRecording}
      disabled={isSaving}
      className={`relative ${
        isSaving
          ? 'bg-secondary opacity-80 cursor-not-allowed'
          : isRecording
          ? 'bg-primary'
          : 'bg-secondary'
      } text-white px-12 py-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all`}
    >
      {isSaving ? (
        // Saving / uploading state — show spinner inside button
        <div className="flex items-center gap-4">
          <ButtonSpinner />
          <span className="text-2xl font-black uppercase tracking-wide">Saving...</span>
        </div>
      ) : isRecording ? (
        <div className="flex items-center gap-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Square className="w-10 h-10 fill-white" />
          </motion.div>
          <span className="text-2xl font-black uppercase tracking-wide">{t('game_r1_btn_stop')}</span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Mic className="w-10 h-10" />
          <span className="text-2xl font-black uppercase tracking-wide">{t('game_r1_btn_start')}</span>
        </div>
      )}

      {isRecording && !isSaving && (
        <motion.div
          className="absolute inset-0 border-4 border-white"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  );

  const games = [
    // Reading 1
    <div key="reading1" className="text-center max-w-2xl mx-auto px-4">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_r1_title1')}
      </h2>

      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-8xl mb-8 drop-shadow-lg"
      >
        🚀
      </motion.div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <p className="text-3xl font-black leading-tight text-black text-left">
          {t('game_r1_text1')}
        </p>
      </div>

      <p className="text-xl font-black text-primary mb-8 uppercase tracking-widest">
        {!hasRecorded ? t('game_r1_instr1') : t('game_r1_success1')}
      </p>

      {!hasRecorded ? (
        <RecordButton />
      ) : (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={handleNext}
          className="bg-accent border-4 border-black text-black text-2xl font-black px-12 py-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase"
        >
          {t('game_r1_btn_next')}
        </motion.button>
      )}
    </div>,

    // Reading 2
    <div key="reading2" className="text-center max-w-2xl mx-auto px-4">
      <h2 className="text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {t('game_r1_title2')}
      </h2>

      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="text-8xl mb-8 drop-shadow-lg"
      >
        🌍
      </motion.div>

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        <p className="text-3xl font-black leading-tight text-black">
          {t('game_r1_text2')}
        </p>
      </div>

      <p className="text-xl font-black text-primary mb-8 uppercase tracking-widest">
        {!hasRecorded ? t('game_r1_instr2') : t('game_r1_success2')}
      </p>

      {!hasRecorded ? (
        <RecordButton />
      ) : (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.95, y: 0 }}
          onClick={handleNext}
          className="bg-accent border-4 border-black text-black text-2xl font-black px-12 py-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase"
        >
          {t('game_r1_btn_complete')}
        </motion.button>
      )}
    </div>,
  ];

// ── Reading Quest Terminal for Groups B and C ────────────────────────────────
function ReadingQuestTerminal({ onComplete, sessionId, group }: { onComplete: () => void, sessionId?: string | null, group: "B" | "C" }) {
  const [idx, setIdx] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const startMs = useRef(Date.now());
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const B_TRIALS = [
    { id: "B-reading-phoneme_switch-1", construct: "phonological_awareness", type: "phoneme_switch_lab", text: "Say 'cat' without the 'k' sound. What word is left?", answer: "at" },
    { id: "B-reading-nonword-1", construct: "decoding_fluency", type: "nonword_conveyor", text: "Read this made-up word: 'Blish'. Does it rhyme with 'fish' or 'cash'?", answer: "fish" },
    { id: "B-reading-ran-1", construct: "rapid_naming", type: "rapid_naming_race", text: "Name these colors fast: Red, Blue, Green. (Type 'done' when finished aloud)", answer: "done" },
    { id: "B-reading-sentence-1", construct: "comprehension", type: "sentence_comprehension", text: "The dog chased the ball into the yard. What did the dog chase?", answer: "ball" },
  ];
  
  const C_TRIALS = [
    { id: "C-reading-adv_phoneme-1", construct: "phonological_awareness", type: "advanced_phoneme_lab", text: "Say 'split'. Now switch the 'p' and 'l' sounds. What is the new word?", answer: "silt" },
    { id: "C-reading-paragraph-1", construct: "comprehension", type: "paragraph_summary", text: "Read the paragraph. What is the main idea? A) Weather, B) Dogs, C) History", answer: "A" },
    { id: "C-reading-ran_mixed-1", construct: "rapid_naming", type: "ran_mixed_category", text: "Name quickly: 2, Red, Square, 7, Blue. (Type 'done' when finished aloud)", answer: "done" },
  ];

  const trials = group === "C" ? C_TRIALS : B_TRIALS;
  const trial = trials[idx];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    
    // Loose grading for demo
    const isCorrect = inputVal.toLowerCase().trim() === trial.answer.toLowerCase();
    setFeedback(isCorrect ? "correct" : "incorrect");

    if (sessionId) {
      await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          payload: {},
          screening_task: {
            task_id: trial.id,
            domain: "reading",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: inputVal.trim(), correct: isCorrect },
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
        <span className="uppercase tracking-widest text-sm">READING PROTOCOL: {group}</span>
        <span className="text-sm">TRIAL {idx + 1} / {trials.length}</span>
      </div>
      
      <div className="min-h-[120px] flex items-center justify-center text-center w-full mb-8">
        <p className="text-2xl leading-relaxed">{trial.text}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-sm">
        <input 
          type="text" 
          autoFocus 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={feedback !== null}
          className="bg-zinc-800 border-2 border-zinc-600 rounded p-4 text-2xl text-center focus:outline-none focus:border-emerald-500 transition-colors"
          placeholder="Answer..."
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
          {feedback === "correct" ? "CORRECT" : feedback === "incorrect" ? "INCORRECT" : "SUBMIT"}
        </button>
      </form>
    </div>
  );
}

  return (
    <div className="relative">
      <motion.div
        key={currentGame}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {games[currentGame]}
      </motion.div>
    </div>
  );
}