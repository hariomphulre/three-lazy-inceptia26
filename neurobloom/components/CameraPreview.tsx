"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { Eye, EyeOff, Video, VideoOff } from "lucide-react";
import { useVideo } from "@/context/VideoContext";
import { getCameraStream } from "@/lib/cameraManager";
import { useFaceDetection } from "@/hooks/useFaceDetection";

// Helper function to render custom vector-filled SVG emojis
const getEmotionEmoji = (emotion: string) => {
  const lower = emotion.toLowerCase();
  switch (lower) {
    case "happy":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="8.5" cy="9.5" r="1.5" fill="#713F12" />
          <circle cx="15.5" cy="9.5" r="1.5" fill="#713F12" />
          <path d="M7.5 13.5C7.5 13.5 9 17 12 17C15 17 16.5 13.5 16.5 13.5" stroke="#713F12" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "sad":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#60A5FA" stroke="#2563EB" strokeWidth="1.5" />
          <circle cx="8.5" cy="9.5" r="1.5" fill="#1E3A8A" />
          <circle cx="15.5" cy="9.5" r="1.5" fill="#1E3A8A" />
          <path d="M16.5 16.5C16.5 16.5 15 13.5 12 13.5C9 13.5 7.5 16.5 7.5 16.5" stroke="#1E3A8A" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "neutral":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="8.5" cy="9.5" r="1.5" fill="#334155" />
          <circle cx="15.5" cy="9.5" r="1.5" fill="#334155" />
          <line x1="8" y1="15" x2="16" y2="15" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "angry":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#F87171" stroke="#DC2626" strokeWidth="1.5" />
          <circle cx="8.5" cy="10.5" r="1.2" fill="#7F1D1D" />
          <circle cx="15.5" cy="10.5" r="1.2" fill="#7F1D1D" />
          <path d="M6.5 7.5L10 9" stroke="#7F1D1D" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17.5 7.5L14 9" stroke="#7F1D1D" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 16C16 16 14.5 13.5 12 13.5C9.5 13.5 8 16 8 16" stroke="#7F1D1D" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "surprise":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#78350F" />
          <circle cx="15.5" cy="8.5" r="1.5" fill="#78350F" />
          <ellipse cx="12" cy="15" rx="2.5" ry="3.5" fill="#78350F" />
        </svg>
      );
    case "fear":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#C084FC" stroke="#7E22CE" strokeWidth="1.5" />
          <circle cx="8.5" cy="9" r="2" fill="#581C87" />
          <circle cx="15.5" cy="9" r="2" fill="#581C87" />
          <circle cx="8.5" cy="9" r="0.8" fill="#FFF" />
          <circle cx="15.5" cy="9" r="0.8" fill="#FFF" />
          <path d="M8 15.5C10 14.5 14 16.5 16 15.5" stroke="#581C87" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "disgust":
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#A3E635" stroke="#4D7C0F" strokeWidth="1.5" />
          <path d="M7 9.5L10 8.5" stroke="#365314" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 9.5L14 8.5" stroke="#365314" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 15.5C10 14.5 11 16.5 13 14.5C14 13.5 16 15.5 16 15.5" stroke="#365314" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#334155">?</text>
        </svg>
      );
  }
};

export function CameraPreview() {
  const { t } = useTranslation();
  const { isRecording } = useVideo();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  // State for toggles
  const [showResults, setShowResults] = useState(true);
  const [showFeed, setShowFeed] = useState(true);

  const { faceCount, status, liveStats, recognitionThreshold } = useFaceDetection(
    videoReady ? videoRef.current : null,
    isRecording,
    showResults,
    canvasRef.current,
    false // no alerts while the test is ongoing
  );

  const recognitionLabel = (() => {
    if (liveStats.faceCount === 0) return <span className="text-black/60 font-semibold">No face in frame</span>;
    if (liveStats.recognitionConfidence == null) return <span className="text-black/60 font-semibold">No enrolled face</span>;
    
    const pct = Math.round(liveStats.recognitionConfidence * 100);
    return liveStats.recognized ? (
      <span className="text-green-600 font-extrabold">ACCESS GRANTED ({pct}% Match)</span>
    ) : (
      <span className="text-red-600 font-extrabold">ACCESS DENIED ({pct}% Match)</span>
    );
  })();

  const genderLabel = (() => {
    if (!liveStats.gender) return "—";
    const label = liveStats.gender.charAt(0).toUpperCase() + liveStats.gender.slice(1);
    const score =
      liveStats.genderScore != null ? ` (${Math.round(liveStats.genderScore * 100)}%)` : "";
    return `${label}${score}`;
  })();

  const statusLabel =
    status === "loading"
      ? "Model Loading"
      : status === "ready"
      ? "Model Running"
      : status === "error"
      ? "Detection unavailable"
      : "Waiting";

  useEffect(() => {
    if (!isRecording) {
      setVideoReady(false);
      return;
    }

    let active = true;
    let hasSetReady = false;

    const setupCamera = async () => {
      try {
        const stream = await getCameraStream();

        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.onloadedmetadata = () => {
            if (active && !hasSetReady) {
              videoRef.current?.play();
              hasSetReady = true;
              setVideoReady(true);
            }
          };

          setTimeout(() => {
            if (active && !hasSetReady) {
              hasSetReady = true;
              setVideoReady(true);
            }
          }, 1500);
        }
      } catch (error) {
        console.error("❌ Camera setup failed:", error);
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
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <div className="hidden sm:flex fixed bottom-3 right-3 z-[9999] flex-col items-end gap-1.5">
      
      {/* Controls Container */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFeed((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-black/80 px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg backdrop-blur focus:outline-none focus:ring-0"
        >
          {showFeed ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          {showFeed ? "Camera Feed On" : "Camera Feed Off"}
        </button>

        <button
          type="button"
          onClick={() => setShowResults((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-full border border-transparent bg-black/80 px-3 py-1.5 text-[12px] font-semibold text-white shadow-lg backdrop-blur focus:outline-none focus:ring-0"
        >
          {showResults ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showResults ? "Results On" : "Results Off"}
        </button>
      </div>

      {showResults && (
        <div className="w-90 max-h-150 border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-3 overflow-hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-shrink-0">
            <div>
              <p className="text-sm font-black uppercase italic tracking-tighter text-black">Live Results</p>
            </div>
            <div className="bg-accent border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-[9px] font-black uppercase tracking-widest text-black">{statusLabel}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto space-y-3 pr-1">
            <ResultSection
              title="Detection"
              items={[["Face Detection count", String(liveStats.faceCount)]]}
            />

            <ResultSection
              title="Recognition"
              items={[
                ["Face Recognition", recognitionLabel],
                ["Threshold", `${Math.round(recognitionThreshold * 100)}%`],
              ]}
            />

            <ResultSection
              title=""
              items={[["Gender", genderLabel]]}
            />

            <div className="border-2 border-black bg-muted p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">Emotions</p>
              {liveStats.emotions.length === 0 ? (
                <p className="text-[11px] font-semibold text-black/50">No emotions detected</p>
              ) : (
                <div className="space-y-1.5">
                  {liveStats.emotions.map(({ emotion, score }) => (
                    <div
                      key={emotion}
                      className="flex items-center justify-between gap-3 text-[11px] font-semibold text-black"
                    >
                      <div className="flex items-center gap-1.5">
                        {getEmotionEmoji(emotion)}
                        <span className="uppercase tracking-wide text-black/60">{emotion}</span>
                      </div>
                      <span className="text-right font-black">{Math.round(score * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Feed Container (Hidden safely when showFeed is false so API still runs) */}
      <div 
        className={`relative rounded-lg overflow-hidden border-0 shadow-2xl bg-black transition-all ${
          showFeed ? "w-90 h-65 opacity-100" : "w-0 h-0 opacity-0 pointer-events-none"
        }`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full ${showResults ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      {showFeed && showResults && status === "loading" && (
        <div className="bg-black/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          Loading JS Face API...
        </div>
      )}

      {showFeed && showResults && videoReady && faceCount > 0 && (
        <div className="bg-green-500/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {faceCount === 1 ? "✓ 1 face detected" : `${faceCount} faces`}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, items }: { title?: string; items: Array<[string, ReactNode]> }) {
  return (
    <div className="border-2 border-black bg-muted p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      {title && <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">{title}</p>}
      <div className="space-y-1.5">
        {items.map(([label, value], idx) => (
          <div key={label || idx} className="flex items-start justify-between gap-3 text-[11px] font-semibold text-black">
            <span className="uppercase tracking-wide text-black/60">{label}</span>
            <span className="text-right font-black">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}