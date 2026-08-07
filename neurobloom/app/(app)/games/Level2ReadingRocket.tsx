"use client";

import { useState } from 'react';
import { motion } from "framer-motion";
import { Mic, Square } from 'lucide-react';
import { useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";


interface Level2Props {
  onComplete: () => void;
  onProgress: (gameIndex: number) => void;
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

export function Level2ReadingRocket({ onComplete, onProgress }: Level2Props) {
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
          await fetch("/api/session/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              payload: currentGame === 0
                ? { test2_audio1: url }
                : { test2_audio2: url }
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