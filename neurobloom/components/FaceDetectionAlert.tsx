"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, Eye, X } from "lucide-react";

interface FaceDetectionAlertProps {
  type: "multiple-faces" | "no-face" | "distracted" | null;
  message: string;
  severity: "warning" | "error" | "info";
  onDismiss?: () => void;
}

const config = {
  "no-face": {
    icon: AlertCircle,
    gradient: "from-rose-500 to-red-600",
    glow: "shadow-rose-500/40",
    pill: "bg-rose-100 text-rose-600",
    bar: "bg-rose-400",
    emoji: "😶",
    title: "No Face Detected",
    tag: "ALERT",
  },
  "multiple-faces": {
    icon: AlertTriangle,
    gradient: "from-orange-400 to-amber-500",
    glow: "shadow-orange-400/40",
    pill: "bg-orange-100 text-orange-600",
    bar: "bg-orange-300",
    emoji: "👥",
    title: "Multiple People Detected",
    tag: "WARNING",
  },
  distracted: {
    icon: Eye,
    gradient: "from-yellow-400 to-amber-400",
    glow: "shadow-yellow-400/40",
    pill: "bg-yellow-100 text-yellow-700",
    bar: "bg-yellow-300",
    emoji: "👀",
    title: "You Seem Distracted",
    tag: "NOTICE",
  },
};

export function FaceDetectionAlert({
  type,
  message,
  severity,
  onDismiss,
}: FaceDetectionAlertProps) {
  if (!type) return null;

  const c = config[type];
  const Icon = c.icon;

  return (
    <AnimatePresence>
      <motion.div
        key={type}
        initial={{ opacity: 0, y: -24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-sm`}
      >
        {/* Card */}
        <div className={`relative overflow-hidden bg-white rounded-2xl shadow-2xl ${c.glow}`}>
          
          {/* Top gradient bar */}
          <div className={`h-1 w-full bg-gradient-to-r ${c.gradient}`} />

          {/* Soft background tint */}
          <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-[0.04] pointer-events-none`} />

          <div className="p-4 flex items-start gap-3">
            
            {/* Icon blob */}
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.05 }}
              className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-lg ${c.glow} text-white`}
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md ${c.pill}`}>
                  {c.tag}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight">
                {c.title}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5 leading-snug">
                {message}
              </p>
            </div>

            {/* Emoji */}
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl flex-shrink-0 select-none"
            >
              {c.emoji}
            </motion.span>

            {/* Dismiss */}
            {onDismiss && (
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={onDismiss}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>

          {/* Animated progress bar (auto-dismiss hint) */}
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: "linear" }}
            style={{ originX: 0 }}
            className={`h-0.5 w-full ${c.bar} opacity-60`}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}