"use client";

import { useState, useEffect } from "react";

export type CardStatus = "idle" | "running" | "complete";

export interface ProgressState {
  progress: number;
  status: CardStatus;
  startDate: string | null;
  endDate: string | null;
}

export function useProgress(assessmentId: string, totalActivities: number) {
  const [state, setState] = useState<ProgressState>({
    progress: 0,
    status: "idle",
    startDate: null,
    endDate: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load progress from local storage on mount
    const storedProgress = localStorage.getItem(`neurobloom_progress_${assessmentId}`);
    if (storedProgress) {
      try {
        const parsed = JSON.parse(storedProgress);
        setState((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        // Fallback for older simpler number storage
        setState((prev) => ({ ...prev, progress: parseInt(storedProgress, 10) || 0 }));
      }
    }
    setIsLoaded(true);
  }, [assessmentId]);

  const saveState = (newState: Partial<ProgressState>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState };
      localStorage.setItem(`neurobloom_progress_${assessmentId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleStart = () => {
    saveState({
      status: "running",
      startDate: new Date().toISOString(),
    });
  };

  const handleComplete = () => {
    saveState({
      status: "complete",
      endDate: new Date().toISOString(),
      progress: totalActivities,
    });
  };

  const completeActivity = () => {
    setState((prev) => {
      const nextProgress = prev.progress + 1;
      const updated: ProgressState = { ...prev, progress: nextProgress };
      
      if (nextProgress >= totalActivities) {
        updated.status = "complete";
        if (!updated.endDate) updated.endDate = new Date().toISOString();
      }
      
      localStorage.setItem(`neurobloom_progress_${assessmentId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const resetProgress = () => {
    const initialState: ProgressState = {
      progress: 0,
      status: "idle",
      startDate: null,
      endDate: null,
    };
    setState(initialState);
    localStorage.removeItem(`neurobloom_progress_${assessmentId}`);
  };

  return { 
    ...state, 
    isLoaded, 
    handleStart, 
    handleComplete, 
    completeActivity, 
    resetProgress 
  };
}
