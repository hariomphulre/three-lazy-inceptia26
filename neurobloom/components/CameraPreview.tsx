"use client";

import { useEffect, useRef, useState } from "react";
import { useVideo } from "@/context/VideoContext";
import { getCameraStream } from "@/lib/cameraManager";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { FaceDetectionAlert } from "./FaceDetectionAlert";

export function CameraPreview() {
  const { isRecording } = useVideo();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const { alert, faceCount, clearAlert } = useFaceDetection(
    videoReady ? videoRef.current : null,
    isRecording
  );

  useEffect(() => {
    if (!isRecording) {
      setVideoReady(false);
      return;
    }

    let active = true;
    let hasSetReady = false;

    const setupCamera = async () => {
      try {
        console.log("📷 Setting up camera...");
        const stream = await getCameraStream();
        console.log("✅ Camera stream obtained:", stream);
        
        if (active && videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("✅ Stream attached to video element");
          
          videoRef.current.onloadedmetadata = () => {
            if (active && !hasSetReady) {
              console.log("✅ Video metadata loaded");
              videoRef.current?.play();
              console.log("✅ Video playing");
              hasSetReady = true;
              setVideoReady(true);
            }
          };

          setTimeout(() => {
            if (active && !hasSetReady) {
              console.log("⚠️ Forcing video ready after timeout");
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
    <>
      {/* Face Detection Alert */}
      {alert && (
        <FaceDetectionAlert
          type={alert.type}
          message={alert.message}
          severity={alert.severity}
          onDismiss={clearAlert}
        />
      )}

      {/* Camera Feed */}
      <div className="hidden sm:flex fixed bottom-3 right-3 z-[9999] flex-col items-end gap-1.5">
        <div className="w-64 h-44 rounded-lg overflow-hidden border-0 border-white/20 shadow-2xl bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>

        {videoReady && faceCount > 0 && (
          <div className="bg-green-500/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {faceCount === 1 ? "✓ 1 face detected" : `⚠️ ${faceCount} faces`}
          </div>
        )}
      </div>
    </>
  );
}