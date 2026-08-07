"use client";

import { useRef, useState } from "react";
import { getCameraStream, stopCameraStream } from "@/lib/cameraManager";
import { saveVideo } from "@/lib/offline/session";

export function useVideoRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const setSessionId = (id: string) => {
    sessionIdRef.current = id;
  };

  const startRecording = async () => {
    const stream = await getCameraStream();

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.start();
    setIsRecording(true);
    console.log("🎥 Recording started");
  };

  const stopAndUpload = async () => {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state !== "recording") {
      console.warn("⚠️ Recorder not active");
      setIsRecording(false);
      stopCameraStream();
      return;
    }

    recorder.onstop = async () => {
      console.log("🛑 Recorder stopped, preparing upload");

      setIsRecording(false);
      stopCameraStream(); // camera off AFTER blob ready

      if (!chunksRef.current.length) {
        console.error("❌ No video chunks");
        return;
      }

      if (!sessionIdRef.current) {
        console.error("❌ sessionId missing");
        return;
      }

      const blob = new Blob(chunksRef.current, { type: "video/webm" });

      // Stored locally then uploaded via /api/session/upload (immediately if
      // online, otherwise on the next sync). Works offline.
      await saveVideo(blob, sessionIdRef.current);
      console.log("🎞️ Video queued/uploaded for session", sessionIdRef.current);
    };

    recorder.stop();
  };

  return {
    startRecording,
    stopAndUpload,
    setSessionId,
    isRecording,
  };
}
