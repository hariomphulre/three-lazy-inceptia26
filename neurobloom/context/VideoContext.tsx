"use client";

import { createContext, useContext } from "react";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";

const VideoContext = createContext<any>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const recorder = useVideoRecorder();

  return (
    <VideoContext.Provider value={recorder}>
      {children}
    </VideoContext.Provider>
  );
}

export const useVideo = () => {
  const ctx = useContext(VideoContext);
  if (!ctx) {
    throw new Error("useVideo must be used inside VideoProvider");
  }
  return ctx;
};
