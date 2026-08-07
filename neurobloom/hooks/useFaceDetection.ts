"use client";

import { useEffect, useRef, useState } from "react";

export type AlertType = "multiple-faces" | "no-face" | "distracted" | null;

interface FaceDetectionAlert {
  type: AlertType;
  message: string;
  severity: "warning" | "error" | "info";
}

export interface FaceEmotionScore {
  emotion: string;
  score: number;
}

export interface FaceLiveStats {
  faceCount: number;
  recognitionConfidence: number | null;
  recognized: boolean | null;
  gender: string | null;
  genderScore: number | null;
  emotions: FaceEmotionScore[];
}

interface HumanFaceResult {
  embedding?: number[] | Float32Array;
  gender?: string;
  genderScore?: number;
  emotion?: FaceEmotionScore[];
}

interface HumanDetectionResult {
  face?: HumanFaceResult[];
}

interface HumanConfig {
  backend: string;
  modelBasePath: string;
  face: {
    enabled: boolean;
    detector: { return: boolean; rotation: boolean };
    mesh: { enabled: boolean };
    description: { enabled: boolean };
    emotion: { enabled: boolean };
    iris: { enabled: boolean };
  };
  body: { enabled: boolean };
  hand: { enabled: boolean };
  gesture: { enabled: boolean };
}

interface HumanInstance {
  detect: (input: HTMLVideoElement) => Promise<HumanDetectionResult>;
  draw: {
    all: (canvas: HTMLCanvasElement, result: HumanDetectionResult) => void;
  };
  match: {
    similarity: (embedding1: number[], embedding2: number[]) => number;
  };
  load?: () => Promise<void>;
  warmup?: () => Promise<void>;
}

interface HumanGlobal {
  Human: new (config: HumanConfig) => HumanInstance;
}

declare global {
  interface Window {
    Human?: HumanGlobal;
  }
}

const HUMAN_SCRIPT = "https://cdn.jsdelivr.net/npm/@vladmandic/human/dist/human.js";
const RECOGNITION_THRESHOLD = 0.6;
const EMBEDDING_STORAGE_KEY = "faceRecognitionEmbedding";

/** Exact config from /index.html */
const HUMAN_CONFIG: HumanConfig = {
  backend: "webgl",
  modelBasePath: "https://vladmandic.github.io/human/models",
  face: {
    enabled: true,
    detector: { return: true, rotation: true },
    mesh: { enabled: true },
    description: { enabled: true },
    emotion: { enabled: true },
    iris: { enabled: true },
  },
  body: { enabled: false },
  hand: { enabled: false },
  gesture: { enabled: false },
};

/** Shared across FaceCapture + CameraPreview (recording starts before enrollment) */
let sharedRegisteredEmbedding: number[] | null = null;

let humanScriptPromise: Promise<void> | null = null;

function toNumberArray(embedding: number[] | Float32Array | unknown): number[] | null {
  if (!embedding) return null;

  if (Array.isArray(embedding)) {
    return embedding.every((value) => typeof value === "number") ? embedding : null;
  }

  if (ArrayBuffer.isView(embedding)) {
    return Array.from(embedding as unknown as ArrayLike<number>);
  }

  if (typeof embedding === "object") {
    const values = Object.values(embedding as Record<string, unknown>);
    if (values.length > 0 && values.every((value) => typeof value === "number")) {
      return values as number[];
    }
  }

  return null;
}

function readStoredEmbedding(): number[] | null {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(EMBEDDING_STORAGE_KEY);
  if (!stored) return null;

  try {
    return toNumberArray(JSON.parse(stored));
  } catch {
    return null;
  }
}

function getRegisteredEmbedding(): number[] | null {
  if (sharedRegisteredEmbedding && sharedRegisteredEmbedding.length > 0) {
    return sharedRegisteredEmbedding;
  }

  const stored = readStoredEmbedding();
  if (stored && stored.length > 0) {
    sharedRegisteredEmbedding = stored;
    return stored;
  }

  return null;
}

function persistRegisteredEmbedding(embedding: number[] | Float32Array): number[] {
  const normalized = toNumberArray(embedding);
  if (!normalized || normalized.length === 0) {
    throw new Error("Invalid face embedding");
  }

  sharedRegisteredEmbedding = normalized;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(EMBEDDING_STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

async function loadHumanLibrary() {
  if (typeof window === "undefined") {
    throw new Error("JS Face API can only run in the browser");
  }

  if (window.Human?.Human) {
    return window.Human;
  }

  if (!humanScriptPromise) {
    humanScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${HUMAN_SCRIPT}"]`);

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () => reject(new Error("Failed to load JS Face API")));
        return;
      }

      const script = document.createElement("script");
      script.src = HUMAN_SCRIPT;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load JS Face API"));
      document.head.appendChild(script);
    });
  }

  await humanScriptPromise;

  if (!window.Human?.Human) {
    throw new Error("JS Face API loaded but global Human was not found");
  }

  return window.Human;
}

function emptyLiveStats(): FaceLiveStats {
  return {
    faceCount: 0,
    recognitionConfidence: null,
    recognized: null,
    gender: null,
    genderScore: null,
    emotions: [],
  };
}

export function useFaceDetection(
  videoElement: HTMLVideoElement | null,
  enabled: boolean = true,
  showResults: boolean = true,
  outputCanvas: HTMLCanvasElement | null = null,
  enableAlerts: boolean = false
) {
  const [alert, setAlert] = useState<FaceDetectionAlert | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [latestResult, setLatestResult] = useState<HumanDetectionResult | null>(null);
  const [recognitionConfidence, setRecognitionConfidence] = useState<number | null>(null);
  const [liveStats, setLiveStats] = useState<FaceLiveStats>(emptyLiveStats);
  const humanRef = useRef<HumanInstance | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const detectionInFlightRef = useRef(false);
  const previousFaceCountRef = useRef(0);
  const noFaceCounterRef = useRef(0);
  const multipleWarningTimeRef = useRef<number>(0);
  const distractedCounterRef = useRef(0);
  const alertRef = useRef<FaceDetectionAlert | null>(null);
  const showResultsRef = useRef(showResults);
  const canvasRef = useRef<HTMLCanvasElement | null>(outputCanvas);
  const enableAlertsRef = useRef(enableAlerts);
  const videoElementRef = useRef<HTMLVideoElement | null>(videoElement);

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    showResultsRef.current = showResults;
    canvasRef.current = outputCanvas;
    enableAlertsRef.current = enableAlerts;
    videoElementRef.current = videoElement;

    if (!showResults && outputCanvas) {
      const ctx = outputCanvas.getContext("2d");
      ctx?.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    }
  }, [outputCanvas, showResults, enableAlerts, videoElement]);

  useEffect(() => {
    // Hydrate shared embedding once recording/detection turns on
    getRegisteredEmbedding();
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;

    const initializeHuman = async () => {
      if (!enabled) {
        setStatus("idle");
        return;
      }

      try {
        setStatus("loading");
        const Human = await loadHumanLibrary();

        if (cancelled) return;

        if (!humanRef.current) {
          humanRef.current = new Human.Human(HUMAN_CONFIG);
        }

        // index.html warms models with the first detect(); load/warmup covers that before video is ready
        await humanRef.current.load?.();
        await humanRef.current.warmup?.();

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (error) {
        console.error("❌ Failed to initialize JS Face API:", error);
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    void initializeHuman();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !videoElement || status !== "ready" || !humanRef.current) {
      return;
    }

    let cancelled = false;
    let isMatchingLoopRunning = true;

    const clearOverlay = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const syncCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !videoElement) return;

      const width = videoElement.videoWidth || 640;
      const height = videoElement.videoHeight || 480;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    // Same continuous loop pattern as index.html detectLoop()
    const detectLoop = async () => {
      if (cancelled || !isMatchingLoopRunning) return;

      if (!videoElement || !humanRef.current || videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        detectionLoopRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      if (detectionInFlightRef.current) {
        detectionLoopRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      detectionInFlightRef.current = true;

      try {
        const result = await humanRef.current.detect(videoElement);
        if (cancelled) return;

        const faces = result.face ?? [];
        const currentFaceCount = faces.length;
        const primaryFace = faces[0] ?? null;

        setFaceCount(currentFaceCount);
        setLatestResult(result);

        const currentEmbedding = toNumberArray(primaryFace?.embedding);
        const referenceEmbedding = getRegisteredEmbedding();
        let similarity: number | null = null;
        let recognized: boolean | null = null;

        // index.html: similarity only when face + embedding exist
        if (currentFaceCount > 0 && currentEmbedding && referenceEmbedding && humanRef.current.match) {
          similarity = humanRef.current.match.similarity(referenceEmbedding, currentEmbedding);
          recognized = similarity > RECOGNITION_THRESHOLD;
        }

        setRecognitionConfidence(similarity);
        setLiveStats({
          faceCount: currentFaceCount,
          recognitionConfidence: similarity,
          recognized,
          gender: primaryFace?.gender ?? null,
          genderScore: primaryFace?.genderScore ?? null,
          emotions: (primaryFace?.emotion ?? [])
            .slice()
            .sort((a, b) => b.score - a.score),
        });

        if (enableAlertsRef.current) {
          if (currentFaceCount === 0) {
            noFaceCounterRef.current += 1;
            if (noFaceCounterRef.current === 10 && alertRef.current?.type !== "no-face") {
              setAlert({
                type: "no-face",
                message: "No face detected. Please position yourself in the camera.",
                severity: "error",
              });
            }
          } else {
            noFaceCounterRef.current = 0;
            if (alertRef.current?.type === "no-face") {
              setAlert(null);
            }
          }

          if (currentFaceCount > 1) {
            const now = Date.now();
            if (now - multipleWarningTimeRef.current > 2000 && alertRef.current?.type !== "multiple-faces") {
              setAlert({
                type: "multiple-faces",
                message: "Multiple people detected. Only one person should be in the frame.",
                severity: "error",
              });
              multipleWarningTimeRef.current = now;
            }
          } else {
            multipleWarningTimeRef.current = 0;
          }

          if (previousFaceCountRef.current === 1 && currentFaceCount === 0) {
            distractedCounterRef.current += 1;
            if (distractedCounterRef.current === 8 && alertRef.current?.type !== "distracted") {
              setAlert({
                type: "distracted",
                message: "You seem distracted. Please keep your face in the frame.",
                severity: "warning",
              });
            }
          } else if (currentFaceCount === 1) {
            distractedCounterRef.current = Math.max(0, distractedCounterRef.current - 1);
            if (distractedCounterRef.current === 0 && alertRef.current?.type === "distracted") {
              setAlert(null);
            }
          }
        }

        previousFaceCountRef.current = currentFaceCount;

        if (canvasRef.current) {
          syncCanvasSize();
          clearOverlay();
          if (showResultsRef.current) {
            humanRef.current.draw.all(canvasRef.current, result);
          }
        }
      } catch (error) {
        console.error("❌ JS Face API detection error:", error);
      } finally {
        detectionInFlightRef.current = false;
      }

      detectionLoopRef.current = requestAnimationFrame(detectLoop);
    };

    detectionLoopRef.current = requestAnimationFrame(detectLoop);

    return () => {
      cancelled = true;
      isMatchingLoopRunning = false;
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
      detectionInFlightRef.current = false;
    };
  }, [enabled, status, videoElement]);

  /**
   * Same enrollment path as index.html Register button:
   * fresh human.detect(video) → require one face → store embedding
   */
  const registerCurrentFace = async (): Promise<{ ok: true } | { ok: false; reason: string }> => {
    const video = videoElementRef.current;
    const human = humanRef.current;

    if (!video || !human) {
      return { ok: false, reason: "Camera or Face API is not ready yet." };
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return { ok: false, reason: "Video is not ready. Please wait a moment." };
    }

    try {
      const result = await human.detect(video);
      const faces = result.face ?? [];

      if (faces.length === 0) {
        return { ok: false, reason: "No face detected. Try again." };
      }

      if (faces.length > 1) {
        return { ok: false, reason: "Multiple faces detected. Please test with one person." };
      }

      const embedding = toNumberArray(faces[0]?.embedding);
      if (!embedding || embedding.length === 0) {
        return { ok: false, reason: "Face embedding not ready yet. Hold still and try again." };
      }

      persistRegisteredEmbedding(embedding);
      return { ok: true };
    } catch (error) {
      console.error("❌ Face registration failed:", error);
      return { ok: false, reason: "Face registration failed. Please try again." };
    }
  };

  return {
    alert,
    faceCount,
    clearAlert: () => setAlert(null),
    status,
    latestResult,
    recognitionConfidence,
    liveStats,
    registerCurrentFace,
    recognitionThreshold: RECOGNITION_THRESHOLD,
  };
}
