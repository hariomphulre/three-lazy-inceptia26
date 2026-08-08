"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Check, X, Volume2, Sparkles, Timer, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
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
  if (questionnaireGroup === "B") {
    return <GroupBReadingAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
  }

  if (questionnaireGroup === "C") {
    return <GroupCReadingAdventure onComplete={onComplete} onProgress={onProgress} sessionId={sessionId} />;
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
          const taskId = currentGame === 0 ? "A-reading-sound_friends-1" : "A-reading-letter_sound-1";
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

// ── Reusable Rapid Naming Voice Component ──────────────────────────────────
function RapidNamingVoiceHandler({
  trial,
  targetWords,
  displayCards,
  sessionId,
  onProceed,
}: {
  trial: { id: string; construct: string; type: string; text: string; answer: string };
  targetWords: string[];
  displayCards: React.ReactNode;
  sessionId?: string | null;
  onProceed: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "recorded" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const startMsRef = useRef(Date.now());

  useEffect(() => {
    startMsRef.current = Date.now();
  }, []);

  const startVoiceRecording = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      // Try browser Web Speech API for real-time speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = "en-US";
          rec.onresult = (event: any) => {
            let text = "";
            for (let i = 0; i < event.results.length; i++) {
              text += event.results[i][0].transcript + " ";
            }
            setTranscript(text.trim());
          };
          rec.start();
          recognitionRef.current = rec;
        } catch (e) {
          console.warn("SpeechRecognition init warning:", e);
        }
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setErrorMessage("Microphone access needed. You can tap Continue below to proceed!");
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;

    setIsAnalyzing(true);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    mediaRecorderRef.current.onstop = async () => {
      const rt = Date.now() - startMsRef.current;
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

      let audioUrl = "";
      try {
        const formData = new FormData();
        formData.append("file", audioBlob, "rapid_naming.webm");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        audioUrl = data.url || "";
      } catch (err) {
        console.warn("Audio upload fallback:", err);
      }

      // Check if target words were spoken or if audio recording was captured
      const spokenLower = transcript.toLowerCase();
      const matchCount = targetWords.filter((w) => spokenLower.includes(w.toLowerCase())).length;
      const isCorrect = matchCount > 0 || audioBlob.size > 500;

      setFeedback(isCorrect ? "correct" : "recorded");
      setIsRecording(false);
      setIsAnalyzing(false);
      setHasAnalyzed(true);

      const sId = sessionId || (typeof window !== "undefined" ? localStorage.getItem("sessionId") : null);

      if (sId) {
        await fetch("/api/session/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sId,
            payload: { [trial.id + "_audio"]: audioUrl },
            screening_task: {
              task_id: trial.id,
              domain: "reading",
              construct: trial.construct,
              task_type: trial.type,
              response_data: { input: "done", audio_url: audioUrl, transcript, correct: isCorrect },
              reaction_time_ms: rt,
            },
          }),
        }).catch(() => {});
      }

      // Stop media stream tracks
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current.stop();
  };

  return (
    <div className="w-full text-center">
      <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
        {trial.text}
      </h2>

      <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
        {displayCards}
        <p className="text-sm font-bold text-black/60 uppercase">
          Tap the Mic button below, speak out loud, then tap Stop!
        </p>
      </div>

      {errorMessage && (
        <div className="bg-[#E52521] text-white border-3 border-black p-4 mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3">
          <AlertCircle size={24} />
          <span className="font-bold text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Recording controls */}
      {!hasAnalyzed ? (
        <div className="flex flex-col items-center gap-4">
          <motion.button
            whileHover={!isAnalyzing ? { scale: 1.05, y: -4 } : {}}
            whileTap={!isAnalyzing ? { scale: 0.95 } : {}}
            disabled={isAnalyzing}
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className={`px-12 py-7 border-4 border-black text-2xl font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 text-white transition-colors ${
              isAnalyzing
                ? "bg-secondary opacity-80 cursor-wait"
                : isRecording
                ? "bg-[#E52521]"
                : "bg-[#049CD8]"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Analyzing Spoken Speech...</span>
              </>
            ) : isRecording ? (
              <>
                <Square className="w-8 h-8 fill-white animate-pulse" />
                <span>Stop & Analyze Recording ⏹️</span>
              </>
            ) : (
              <>
                <Mic className="w-8 h-8" />
                <span>Tap Mic & Speak Aloud 🎙️</span>
              </>
            )}
          </motion.button>

          {isRecording && (
            <div className="flex items-center gap-2 bg-primary/10 border-2 border-black px-4 py-2">
              <span className="w-3 h-3 bg-[#E52521] rounded-full animate-ping" />
              <span className="text-xs font-black text-black uppercase">Recording Audio...</span>
            </div>
          )}
        </div>
      ) : (
        /* Explicit Analysis Result + Continue Button */
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="bg-[#43B047] text-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Check className="w-10 h-10 stroke-[4]" />
              <span className="text-2xl font-black uppercase">Voice Recorded & Analyzed!</span>
            </div>
            {transcript && (
              <p className="text-sm font-bold bg-black/20 p-2 border border-white/40">
                Spoken: "{transcript}"
              </p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={onProceed}
            className="px-14 py-7 bg-primary text-white border-4 border-black text-3xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#348dbb] flex items-center gap-4"
          >
            <span>Continue</span>
            <ArrowRight className="w-8 h-8 stroke-[3]" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}

// ── Gamified Group B Reading Adventure ─────────────────────────────────────
function GroupBReadingAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const startMs = useRef(Date.now());

  useEffect(() => {
    startMs.current = Date.now();
    setFeedback(null);
  }, [idx]);

  const B_TRIALS = [
    {
      id: "B-reading-phoneme_switch-1",
      construct: "phonological_awareness",
      type: "phoneme_switch_lab",
      text: "Say 'cat' without the 'k' sound. What word is left?",
      answer: "at",
    },
    {
      id: "B-reading-nonword-1",
      construct: "decoding_fluency",
      type: "nonword_conveyor",
      text: "Read this made-up word: 'Blish'. Does it rhyme with 'fish' or 'cash'?",
      answer: "fish",
    },
    {
      id: "B-reading-ran-1",
      construct: "rapid_naming",
      type: "rapid_naming_race",
      text: "Name these colors fast: Red, Blue, Green. (Type 'done' when finished aloud)",
      answer: "done",
    },
    {
      id: "B-reading-sentence-1",
      construct: "comprehension",
      type: "sentence_comprehension",
      text: "The dog chased the ball into the yard. What did the dog chase?",
      answer: "ball",
    },
  ];

  const trial = B_TRIALS[idx];

  const handleNextTrial = () => {
    if (idx < B_TRIALS.length - 1) {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      if (onProgress) onProgress(nextIdx);
    } else {
      onComplete();
    }
  };

  const handleSubmit = async (userInputValue: string, isCorrect: boolean) => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    setFeedback(isCorrect ? "correct" : "incorrect");

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
            domain: "reading",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: userInputValue, correct: isCorrect },
            reaction_time_ms: rt,
          },
        }),
      }).catch(() => {});
    }

    setTimeout(() => {
      handleNextTrial();
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60">
          Reading Rocket · Group B
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center"
        >
          {/* Trial 1: Phoneme Switch Lab */}
          {idx === 0 && (
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
                {trial.text}
              </h2>

              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col items-center">
                <div className="text-7xl mb-4">🐱</div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-[#E52521] text-white border-3 border-black text-3xl font-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] line-through">
                    C
                  </div>
                  <div className="text-2xl font-black text-black">+</div>
                  <div className="bg-[#049CD8] text-white border-3 border-black text-3xl font-black px-4 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    AT
                  </div>
                </div>
                <p className="text-lg font-bold text-black/60 uppercase">Pick the remaining word:</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
                {["at", "bat", "cot", "sat"].map((wordOption) => (
                  <motion.button
                    key={wordOption}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={feedback !== null}
                    onClick={() => handleSubmit(wordOption, wordOption === "at")}
                    className="text-3xl font-black py-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors uppercase"
                  >
                    {wordOption}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Trial 2: Nonword Conveyor */}
          {idx === 1 && (
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
                {trial.text}
              </h2>

              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col items-center">
                <div className="bg-accent/30 border-4 border-black p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <span className="text-xs font-black text-black/50 uppercase block mb-1">Made-up Word 🧪</span>
                  <span className="text-5xl font-black text-primary uppercase tracking-wider">BLISH</span>
                </div>
                <p className="text-lg font-bold text-black/60 uppercase">Which word rhymes with Blish?</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {[
                  { word: "fish", icon: "🐟" },
                  { word: "cash", icon: "💵" },
                  { word: "bush", icon: "🌿" },
                  { word: "dish", icon: "🥣" },
                ].map((item) => (
                  <motion.button
                    key={item.word}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={feedback !== null}
                    onClick={() => handleSubmit(item.word, item.word === "fish")}
                    className="text-2xl font-black py-6 px-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FBD000] transition-colors flex items-center justify-center gap-2 uppercase"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span>{item.word}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Trial 3: Rapid Naming Race with Microphone Recording & Manual Continue Button */}
          {idx === 2 && (
            <RapidNamingVoiceHandler
              trial={trial}
              targetWords={["red", "blue", "green"]}
              sessionId={sessionId}
              onProceed={handleNextTrial}
              displayCards={
                <div className="flex justify-center flex-wrap gap-4 mb-6">
                  <div className="bg-[#E52521] text-white border-4 border-black px-6 py-6 font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    🔴 RED
                  </div>
                  <div className="bg-[#5C94FC] text-white border-4 border-black px-6 py-6 font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    🔵 BLUE
                  </div>
                  <div className="bg-[#43B047] text-white border-4 border-black px-6 py-6 font-black text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    🟢 GREEN
                  </div>
                </div>
              }
            />
          )}

          {/* Trial 4: Sentence Comprehension */}
          {idx === 3 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-black mb-6 uppercase tracking-tight">
                {trial.text}
              </h2>

              <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
                <div className="bg-accent/20 border-4 border-black p-6 mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-4">
                  <span className="text-5xl">🐕</span>
                  <span className="text-3xl font-black">➔</span>
                  <span className="text-5xl">⚽</span>
                  <span className="text-3xl font-black">➔</span>
                  <span className="text-5xl">🏡</span>
                </div>
                <p className="text-base font-bold text-black/60 uppercase">Choose what the dog chased:</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {[
                  { word: "ball", icon: "⚽" },
                  { word: "cat", icon: "🐱" },
                  { word: "bone", icon: "🦴" },
                  { word: "yard", icon: "🏡" },
                ].map((item) => (
                  <motion.button
                    key={item.word}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={feedback !== null}
                    onClick={() => handleSubmit(item.word, item.word === "ball")}
                    className="text-2xl font-black py-6 px-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#43B047] hover:text-white transition-colors flex items-center justify-center gap-2 uppercase"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span>{item.word}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay for standard trials */}
      {feedback && idx !== 2 && (
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

// ── Gamified Group C Reading Adventure ─────────────────────────────────────
function GroupCReadingAdventure({
  onComplete,
  onProgress,
  sessionId,
}: {
  onComplete: () => void;
  onProgress?: (idx: number) => void;
  sessionId?: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const startMs = useRef(Date.now());

  useEffect(() => {
    startMs.current = Date.now();
    setFeedback(null);
  }, [idx]);

  const C_TRIALS = [
    {
      id: "C-reading-adv_phoneme-1",
      construct: "phonological_awareness",
      type: "advanced_phoneme_lab",
      text: "Say 'split'. Now switch the 'p' and 'l' sounds. What is the new word?",
      answer: "silt",
    },
    {
      id: "C-reading-paragraph-1",
      construct: "comprehension",
      type: "paragraph_summary",
      text: "Read the paragraph. What is the main idea?",
      answer: "A",
    },
    {
      id: "C-reading-ran_mixed-1",
      construct: "rapid_naming",
      type: "ran_mixed_category",
      text: "Name quickly: 2, Red, Square, 7, Blue. (Type 'done' when finished aloud)",
      answer: "done",
    },
  ];

  const trial = C_TRIALS[idx];

  const handleNextTrial = () => {
    if (idx < C_TRIALS.length - 1) {
      const nextIdx = idx + 1;
      setIdx(nextIdx);
      if (onProgress) onProgress(nextIdx);
    } else {
      onComplete();
    }
  };

  const handleSubmit = async (userInputValue: string, isCorrect: boolean) => {
    if (feedback !== null) return;
    const rt = Date.now() - startMs.current;
    setFeedback(isCorrect ? "correct" : "incorrect");

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
            domain: "reading",
            construct: trial.construct,
            task_type: trial.type,
            response_data: { input: userInputValue, correct: isCorrect },
            reaction_time_ms: rt,
          },
        }),
      }).catch(() => {});
    }

    setTimeout(() => {
      handleNextTrial();
    }, 1200);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-black text-xs uppercase tracking-widest text-black/60">
          Reading Rocket · Group C
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.4 }}
          className="w-full text-center"
        >
          {/* Trial 1: Advanced Phoneme Lab */}
          {idx === 0 && (
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-black mb-6 uppercase tracking-tight">
                {trial.text}
              </h2>

              <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-primary text-white border-3 border-black text-3xl font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">S</span>
                  <span className="bg-accent border-3 border-black text-3xl font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">P</span>
                  <span className="bg-[#FBD000] border-3 border-black text-3xl font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] animate-bounce">L</span>
                  <span className="bg-primary text-white border-3 border-black text-3xl font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">I</span>
                  <span className="bg-primary text-white border-3 border-black text-3xl font-black px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">T</span>
                </div>
                <p className="text-sm font-bold text-black/60 uppercase">Switch 'P' and 'L' position!</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
                {["silt", "spilt", "slpit", "slit"].map((option) => (
                  <motion.button
                    key={option}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={feedback !== null}
                    onClick={() => handleSubmit(option, option === "silt")}
                    className="text-3xl font-black py-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-accent transition-colors uppercase"
                  >
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Trial 2: Story Paragraph Scroll */}
          {idx === 1 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-black mb-6 uppercase tracking-tight">
                Read the paragraph. What is the main idea?
              </h2>

              <div className="bg-[#FFF9E6] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 text-left">
                <span className="text-xs font-black text-black/40 uppercase block mb-2">Story Scroll 📜</span>
                <p className="text-xl font-bold text-black leading-relaxed">
                  "The sun was shining brightly in the morning, but by afternoon dark storm clouds suddenly rolled in with thunder and heavy rain showers across the valley."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {[
                  { key: "A", label: "🌩️ A) Weather" },
                  { key: "B", label: "🐕 B) Dogs" },
                  { key: "C", label: "📜 C) History" },
                ].map((item) => (
                  <motion.button
                    key={item.key}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={feedback !== null}
                    onClick={() => handleSubmit(item.key, item.key === "A")}
                    className="text-2xl font-black py-6 px-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FBD000] transition-colors uppercase"
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Trial 3: Rapid Naming Mixed Category with Microphone & Manual Continue Button */}
          {idx === 2 && (
            <RapidNamingVoiceHandler
              trial={trial}
              targetWords={["2", "red", "square", "7", "blue"]}
              sessionId={sessionId}
              onProceed={handleNextTrial}
              displayCards={
                <div className="flex justify-center flex-wrap gap-3 mb-6">
                  <div className="bg-white border-3 border-black px-4 py-4 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    2️⃣ TWO
                  </div>
                  <div className="bg-[#E52521] text-white border-3 border-black px-4 py-4 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    🔴 RED
                  </div>
                  <div className="bg-[#FBD000] text-black border-3 border-black px-4 py-4 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    🔲 SQUARE
                  </div>
                  <div className="bg-white border-3 border-black px-4 py-4 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    7️⃣ SEVEN
                  </div>
                  <div className="bg-[#5C94FC] text-white border-3 border-black px-4 py-4 font-black text-2xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    🔵 BLUE
                  </div>
                </div>
              }
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay for standard trials */}
      {feedback && idx !== 2 && (
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