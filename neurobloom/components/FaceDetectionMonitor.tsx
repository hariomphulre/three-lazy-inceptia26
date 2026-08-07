"use client";

import { useVideo } from "@/context/VideoContext";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

const STATUS_CONFIG = {
  "no-face": {
    dot: "bg-red-500",
    ring: "ring-red-400/30",
    bg: "bg-red-50 border-red-200",
    text: "text-red-600",
    labelKey: "fdm_no_face",
    pulse: true,
  },
  "multiple-faces": {
    dot: "bg-orange-500",
    ring: "ring-orange-400/30",
    bg: "bg-orange-50 border-orange-200",
    text: "text-orange-600",
    labelKey: null, // dynamic
    pulse: true,
  },
  distracted: {
    dot: "bg-yellow-400",
    ring: "ring-yellow-400/30",
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    labelKey: "fdm_looking_away",
    pulse: true,
  },
  ok: {
    dot: "bg-emerald-500",
    ring: "ring-emerald-400/30",
    bg: "bg-white border-slate-200",
    text: "text-slate-600",
    labelKey: "fdm_face_detected",
    pulse: false,
  },
  detecting: {
    dot: "bg-slate-400",
    ring: "ring-slate-300/30",
    bg: "bg-white border-slate-200",
    text: "text-slate-400",
    labelKey: "fdm_detecting",
    pulse: false,
  },
};

export function FaceDetectionMonitor() {
  const { t } = useTranslation();
  const { faceDetectionState } = useVideo();
  const { faceCount, alert } = faceDetectionState;

  const key = alert?.type ?? (faceCount === 1 ? "ok" : "detecting");
  const c = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG];
  const label =
    key === "multiple-faces"
      ? `${faceCount} ${t("fdm_faces")}`
      : c.labelKey
      ? t(c.labelKey)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`fixed bottom-24 right-4 z-[9998]`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-xl border shadow-sm ${c.bg} ring-2 ${c.ring}`}
        >
          {/* Status dot */}
          <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
            {c.pulse && (
              <span className={`absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-40 animate-ping`} />
            )}
            <span className={`relative w-2 h-2 rounded-full ${c.dot}`} />
          </div>

          {/* Label */}
          <span className={`text-xs font-semibold tracking-wide whitespace-nowrap ${c.text}`}>
            {label}
          </span>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}