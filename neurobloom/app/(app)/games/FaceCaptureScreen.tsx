"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Camera, Eye, EyeOff, UserRound, ShieldCheck } from "lucide-react";
import { getCameraStream } from "@/lib/cameraManager";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { Button } from "@/components/ui/button";

interface FaceCaptureScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function FaceCaptureScreen({ onComplete, onBack }: FaceCaptureScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const { faceCount, status, registerCurrentFace } = useFaceDetection(
    videoReady ? videoRef.current : null,
    true,
    showResults,
    overlayCanvasRef.current,
    false
  );
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let active = true;
    let hasSetReady = false;

    const setupCamera = async () => {
      try {
        const stream = await getCameraStream();

        if (!active || !videoRef.current) return;

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (active && !hasSetReady) {
            videoRef.current?.play();
            hasSetReady = true;
            setVideoReady(true);
          }
        };

        window.setTimeout(() => {
          if (active && !hasSetReady) {
            hasSetReady = true;
            setVideoReady(true);
          }
        }, 1500);
      } catch (error) {
        console.error("❌ Face capture camera setup failed:", error);
      }
    };

    setupCamera();

    return () => {
      active = false;
      setVideoReady(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !snapshotCanvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setCaptureError(null);

    try {
      // Same enrollment path as index.html Register: fresh detect → store embedding
      const registration = await registerCurrentFace();
      if (!registration.ok) {
        setCaptureError(registration.reason);
        return;
      }

      const video = videoRef.current;
      const snapshotCanvas = snapshotCanvasRef.current;
      const snapshotCtx = snapshotCanvas.getContext("2d");
      if (!snapshotCtx) return;

      snapshotCanvas.width = video.videoWidth || 640;
      snapshotCanvas.height = video.videoHeight || 480;
      snapshotCtx.drawImage(video, 0, 0, snapshotCanvas.width, snapshotCanvas.height);

      const photoData = snapshotCanvas.toDataURL("image/jpeg", 0.92);
      localStorage.setItem("faceRecognitionPhoto", photoData);
      localStorage.setItem("faceRecognitionPhotoAt", new Date().toISOString());
      setCapturedPhoto(photoData);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleContinue = () => {
    if (!capturedPhoto) return;
    onComplete();
  };

  const statusLabel =
    status === "loading"
      ? "Loading Face API.js"
      : status === "ready"
      ? "Face API ready"
      : status === "error"
      ? "Detection unavailable"
      : "Waiting";

  return (
    <div className="h-screen w-full bg-[#5C94FC] p-3 sm:p-4 overflow-hidden font-sans relative">
      <div className="absolute top-20 left-10 w-32 h-10 bg-white rounded-full opacity-60 blur-sm pointer-events-none" />
      <div className="absolute top-40 right-20 w-40 h-12 bg-white rounded-full opacity-40 blur-md pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-[#43B047] border-t-8 border-black pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto relative z-10 h-full"
      >
        <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden h-full flex flex-col">
          <div className="bg-foreground px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-4 border-black flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent border-2 border-white rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex-shrink-0">
                <UserRound className="text-black" size={28} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tighter">Face Enrollment</h1>
                <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] font-black mt-1">
                  Capture a reference photo before the question test starts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setShowResults((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
              >
                {showResults ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {showResults ? "Results On" : "Results Off"}
              </button>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-primary border-2 border-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
                <ShieldCheck size={18} className="text-white" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">Secure face check</span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 flex-1 min-h-0 overflow-hidden">
            <div className="grid grid-cols-1 xl:grid-cols-[1.18fr_0.82fr] gap-4 h-full min-h-0 items-stretch">
              <div className="space-y-4 min-h-0 flex flex-col">
                <div className="border-4 border-black bg-[#f8fafc] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 flex-shrink-0">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Human API Results</p>
                      <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-black">Live Detection Status</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-accent border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <Camera size={14} className="text-black" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-black">{statusLabel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ResultChip label="Faces" value={faceCount.toString()} tone="secondary" />
                    <ResultChip label="Overlay" value={showResults ? "Shown" : "Hidden"} tone={showResults ? "success" : "neutral"} />
                    <ResultChip label="Photo" value={capturedPhoto ? "Saved" : "Pending"} tone={capturedPhoto ? "success" : "neutral"} />
                    <ResultChip label="Status" value={status.toUpperCase()} tone={status === "ready" ? "success" : status === "error" ? "danger" : "neutral"} />
                  </div>

                  {captureError && (
                    <div className="mt-4 bg-primary/10 border-2 border-primary p-3 text-sm font-bold text-black">
                      {captureError}
                    </div>
                  )}
                </div>

                <div className="relative border-4 border-black bg-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden rounded-none flex-1 min-h-0">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    width={640}
                    height={480}
                    className={`absolute inset-0 w-full h-full ${showResults ? "opacity-100" : "opacity-0"}`}
                  />
                </div>
              </div>

              <div className="space-y-4 min-h-0 flex flex-col">
                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 flex-shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-2">Reference Photo</p>
                  <div className="bg-muted border-2 border-black aspect-[4/3] flex items-center justify-center overflow-hidden">
                    {capturedPhoto ? (
                      <img src={capturedPhoto} alt="Captured face reference" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center px-6">
                        <UserRound className="mx-auto w-12 h-12 text-black/30 mb-3" />
                        <p className="text-sm font-black uppercase italic tracking-tighter text-black">No photo captured yet</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <Button
                      type="button"
                      onClick={handleCapture}
                      disabled={!videoReady || isCapturing || status !== "ready"}
                      className="w-full py-5 uppercase italic shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Camera size={18} className="mr-2" />
                      {isCapturing ? "Scanning Face..." : "Capture My Face"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleContinue}
                      disabled={!capturedPhoto}
                      className="w-full py-5 uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Enter Question Test
                      <ArrowRight size={18} className="ml-2" />
                    </Button>
                    {onBack && (
                      <button
                        type="button"
                        onClick={onBack}
                        className="w-full py-3 border-2 border-black bg-white text-[10px] font-black uppercase tracking-widest hover:bg-muted active:translate-y-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Back
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-5 flex-1 min-h-0 flex flex-col justify-between">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-black mb-2">Why this step exists</h3>
                  <p className="text-sm font-semibold text-black/70 leading-relaxed">
                    The system stores one reference photo before the assessment starts, so the question flow can be tied to the same person without interrupting the test experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <canvas ref={snapshotCanvasRef} className="hidden" />
    </div>
  );
}

function ResultChip({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" | "neutral" | "secondary" }) {
  const toneClass = {
    success: "bg-[#43B047] text-white",
    danger: "bg-primary text-white",
    neutral: "bg-muted text-black",
    secondary: "bg-accent text-black",
  }[tone];

  return (
    <div className={`border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
      <p className="text-sm font-black uppercase tracking-tight mt-1">{value}</p>
    </div>
  );
}