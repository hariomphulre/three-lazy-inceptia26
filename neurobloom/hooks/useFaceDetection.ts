"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type AlertType = "multiple-faces" | "no-face" | "distracted" | null;

interface FaceDetectionAlert {
  type: AlertType;
  message: string;
  severity: "warning" | "error" | "info";
}

/**
 * Lightweight face detection using canvas pixel analysis
 * Detects face-like regions through skin tone pixel matching
 */
const detectFacesSimple = (
  canvas: OffscreenCanvas | HTMLCanvasElement,
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D
): number => {
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Detect skin-tone pixels using multiple criteria
    let facePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Skin tone detection (works across different skin tones)
      const isSkinTone =
        r > 60 &&        // Relaxed red minimum
        g > 20 &&        // Relaxed green minimum  
        b > 10 &&        // Relaxed blue minimum
        r > g &&         // Red > Green
        r > b &&         // Red > Blue
        Math.abs(r - g) > 10; // Relaxed R-G difference

      if (isSkinTone) {
        facePixels++;
      }
    }

    // Estimate face count based on skin pixel density
    const totalPixels = canvas.width * canvas.height;
    const skinRatio = facePixels / totalPixels;
    const skinPercentage = (skinRatio * 100).toFixed(2);

    // Log every 60 frames
    if (Math.random() < 0.02) {
      console.log(
        `📊 Canvas: ${canvas.width}x${canvas.height} | Skin pixels: ${facePixels}/${totalPixels} | Density: ${skinPercentage}%`
      );
    }

    // Adjusted thresholds for better detection
    if (skinRatio > 0.25) {
      console.log(`👥 MULTIPLE FACES DETECTED (${skinPercentage}%)`);
      return 2;
    }
    if (skinRatio > 0.01) {
      return 1; // Single face detected
    }
    return 0; // No face detected
  } catch (error) {
    console.error("Face detection error:", error);
    return 0;
  }
};

export function useFaceDetection(
  videoElement: HTMLVideoElement | null,
  enabled: boolean = true
) {
  const [alert, setAlert] = useState<FaceDetectionAlert | null>(null);
  const [faceCount, setFaceCount] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const detectionLoopRef = useRef<number | null>(null);
  const previousFaceCountRef = useRef(0);
  const noFaceCounterRef = useRef(0);
  const multipleWarningTimeRef = useRef<number>(0);
  const distractedCounterRef = useRef(0);
  const frameCountRef = useRef(0);

  // Initialize canvas on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (ctx) {
        canvasRef.current = canvas;
        ctxRef.current = ctx;
        console.log("✅ Face detection canvas initialized");
      }
    } catch (error) {
      console.error("❌ Failed to initialize canvas:", error);
    }
  }, [enabled]);

  const detectFaces = useCallback(() => {
    if (!videoElement || !canvasRef.current || !ctxRef.current) {
      console.log("⏳ Waiting for video element and canvas...");
      detectionLoopRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    // Log video status periodically
    frameCountRef.current++;
    if (frameCountRef.current % 30 === 0) {
      console.log(`📹 Video status: readyState=${videoElement.readyState}, currentTime=${videoElement.currentTime}, srcObject=${!!videoElement.srcObject}`);
    }

    if (videoElement.readyState !== 2 && videoElement.readyState !== 4) {
      if (frameCountRef.current % 60 === 0) {
        console.log(`⏳ Video not ready: readyState=${videoElement.readyState} (need 2 or 4)`);
      }
      detectionLoopRef.current = requestAnimationFrame(detectFaces);
      return;
    }

    try {
      // Draw video frame to canvas
      ctxRef.current.drawImage(
        videoElement,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Analyze frame for faces
      const currentFaceCount = detectFacesSimple(
        canvasRef.current,
        ctxRef.current
      );

      if (frameCountRef.current % 30 === 0) {
        console.log(`👤 Face count: ${currentFaceCount}`);
      }

      setFaceCount(currentFaceCount);

      // Check for no face
      if (currentFaceCount === 0) {
        noFaceCounterRef.current++;
        if (noFaceCounterRef.current === 10) {
          console.warn("🔴 NO FACE ALERT TRIGGERED");
          setAlert({
            type: "no-face",
            message: "No face detected! Please position yourself in the camera.",
            severity: "error",
          });
        }
      } else {
        if (noFaceCounterRef.current > 0) {
          noFaceCounterRef.current = 0;
        }
        if (alert?.type === "no-face") {
          setAlert(null);
        }
      }

      // Check for multiple faces
      if (currentFaceCount > 1) {
        const now = Date.now();
        if (now - multipleWarningTimeRef.current > 2000) {
          console.warn("🟠 MULTIPLE FACES ALERT TRIGGERED");
          setAlert({
            type: "multiple-faces",
            message: `Multiple people detected! Only one person should be in the frame.`,
            severity: "error",
          });
          multipleWarningTimeRef.current = now;
        }
      } else {
        multipleWarningTimeRef.current = 0;
      }

      // Check for distraction
      if (previousFaceCountRef.current === 1 && currentFaceCount === 0) {
        distractedCounterRef.current++;
        if (distractedCounterRef.current === 8) {
          console.warn("🟡 DISTRACTED ALERT TRIGGERED");
          setAlert({
            type: "distracted",
            message: "You seem distracted! Please keep your face in the frame.",
            severity: "warning",
          });
        }
      } else if (currentFaceCount === 1) {
        distractedCounterRef.current = Math.max(0, distractedCounterRef.current - 1);
        if (distractedCounterRef.current === 0 && alert?.type === "distracted") {
          setAlert(null);
        }
      }

      previousFaceCountRef.current = currentFaceCount;
    } catch (error) {
      console.error("❌ Face detection error:", error);
    }

    detectionLoopRef.current = requestAnimationFrame(detectFaces);
  }, [videoElement, alert]);

  // Start detection loop when video element becomes available
  useEffect(() => {
    if (!enabled || !videoElement || !canvasRef.current) {
      console.log("⚠️ Detection not starting:", {
        enabled,
        hasVideo: !!videoElement,
        hasCanvas: !!canvasRef.current,
      });
      return;
    }

    console.log("🚀 Starting face detection loop");
    detectionLoopRef.current = requestAnimationFrame(detectFaces);

    return () => {
      if (detectionLoopRef.current) {
        cancelAnimationFrame(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
    };
  }, [detectFaces, enabled, videoElement]);

  return {
    alert,
    faceCount,
    clearAlert: () => setAlert(null),
  };
}
