"use client";
import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslation } from "@/hooks/useTranslation";

gsap.registerPlugin(ScrollTrigger);

/* ═══════════════════════════════════════════════════════
   SUPER MARIO THEME — DETAILED CSS/SVG DECORATIONS
   Highly polished 3D-style elements inspired by Mario games
   ═══════════════════════════════════════════════════════ */

/* ─── DETAILED TREE (Multiple Styles with Shadows) ─── */
export function Tree({
  variant = "oak",
  size = "md",
  className = "",
}: {
  variant?: "oak" | "pine" | "bush" | "palm";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = { sm: 0.6, md: 1, lg: 1.4 }[size];

  if (variant === "pine") {
    return (
      <div className={`${className}`} style={{ transform: `scale(${s})`, transformOrigin: "bottom center", filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.3))" }}>
        <svg width="52" height="80" viewBox="0 0 52 80" fill="none">
          {/* Shadow under tree */}
          <ellipse cx="26" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.15)" />
          {/* Main trunk */}
          <rect x="20" y="54" width="12" height="26" rx="2" fill="#3E2723" />
          <rect x="21" y="55" width="10" height="24" fill="#5D4037" />
          <rect x="22" y="55" width="2" height="20" fill="#795548" opacity="0.6" />
          {/* Pine triangles - layered for 3D */}
          <polygon points="26,0 46,28 6,28" fill="#1B5E20" />
          <polygon points="26,2 42,26 10,26" fill="#2E7D32" />
          <polygon points="26,8 50,42 2,42" fill="#1B5E20" />
          <polygon points="26,10 48,40 4,40" fill="#2E7D32" />
          <polygon points="26,18 52,56 0,56" fill="#1B5E20" />
          <polygon points="26,20 50,54 2,54" fill="#388E3C" />
          {/* Highlights on left side */}
          <polygon points="26,6 34,20 22,20" fill="#43A047" opacity="0.4" />
          <polygon points="26,16 38,34 20,34" fill="#66BB6A" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (variant === "bush") {
    return (
      <div className={`${className}`} style={{ transform: `scale(${s})`, transformOrigin: "bottom center", filter: "drop-shadow(2px 3px 4px rgba(0,0,0,0.25))" }}>
        <svg width="60" height="36" viewBox="0 0 60 36" fill="none">
          {/* Shadow */}
          <ellipse cx="30" cy="34" rx="20" ry="3" fill="rgba(0,0,0,0.12)" />
          {/* Back circles */}
          <ellipse cx="15" cy="22" rx="14" ry="12" fill="#2E7D32" />
          <ellipse cx="30" cy="18" rx="18" ry="15" fill="#2E7D32" />
          <ellipse cx="45" cy="22" rx="14" ry="12" fill="#2E7D32" />
          {/* Mid circles */}
          <ellipse cx="14" cy="20" rx="14" ry="12" fill="#43A047" />
          <ellipse cx="30" cy="16" rx="18" ry="15" fill="#388E3C" />
          <ellipse cx="46" cy="20" rx="14" ry="12" fill="#43A047" />
          {/* Front circles */}
          <ellipse cx="14" cy="20" rx="12" ry="10" fill="#4CAF50" />
          <ellipse cx="30" cy="15" rx="16" ry="13" fill="#4CAF50" />
          <ellipse cx="46" cy="20" rx="12" ry="10" fill="#4CAF50" />
          {/* Shine spots */}
          <circle cx="22" cy="10" r="4" fill="#81C784" opacity="0.5" />
          <circle cx="38" cy="8" r="3" fill="#A5D6A7" opacity="0.4" />
          <circle cx="14" cy="18" r="2.5" fill="#C8E6C9" opacity="0.3" />
        </svg>
      </div>
    );
  }

  if (variant === "palm") {
    return (
      <div className={`${className}`} style={{ transform: `scale(${s})`, transformOrigin: "bottom center", filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.3))" }}>
        <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
          {/* Shadow */}
          <ellipse cx="32" cy="78" rx="18" ry="3" fill="rgba(0,0,0,0.15)" />
          {/* Detailed trunk */}
          <rect x="28" y="40" width="8" height="40" rx="2" fill="#5D4037" />
          <rect x="29" y="42" width="6" height="36" fill="#6D4C41" />
          <path d="M29,42 L32,80 L35,42 Z" fill="#8D6E63" opacity="0.3" />
          {/* Trunk texture lines */}
          <rect x="29" y="48" width="0.5" height="28" fill="#3E2723" opacity="0.4" />
          <rect x="33" y="50" width="0.5" height="26" fill="#3E2723" opacity="0.3" />
          {/* Fronds - detailed palm leaves */}
          <g>
            <path d="M32,40 Q8,15 2,5" stroke="#558B2F" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M32,40 Q12,8 5,0" stroke="#689F38" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>
          <g>
            <path d="M32,40 Q56,15 62,5" stroke="#558B2F" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M32,40 Q52,8 59,0" stroke="#689F38" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
          </g>
          <g>
            <path d="M32,40 Q20,10 18,0" stroke="#4CAF50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M32,40 Q44,10 46,0" stroke="#4CAF50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
          {/* Frond tips glow */}
          <circle cx="5" cy="2" r="1.5" fill="#81C784" opacity="0.6" />
          <circle cx="59" cy="2" r="1.5" fill="#81C784" opacity="0.6" />
        </svg>
      </div>
    );
  }

  // Oak (default) - detailed layers
  return (
    <div className={`${className}`} style={{ transform: `scale(${s})`, transformOrigin: "bottom center", filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.3))" }}>
      <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
        {/* Shadow */}
        <ellipse cx="28" cy="76" rx="16" ry="4" fill="rgba(0,0,0,0.18)" />
        {/* Trunk with depth */}
        <rect x="22" y="48" width="12" height="32" rx="2" fill="#3E2723" />
        <rect x="23" y="50" width="10" height="30" fill="#5D4037" />
        <rect x="24" y="50" width="3" height="28" fill="#795548" opacity="0.5" />
        {/* Main canopy - back layer */}
        <circle cx="28" cy="24" r="22" fill="#1B5E20" opacity="0.7" />
        {/* Middle layer */}
        <circle cx="28" cy="22" r="22" fill="#2E7D32" />
        <circle cx="16" cy="18" r="16" fill="#388E3C" opacity="0.9" />
        <circle cx="40" cy="18" r="16" fill="#388E3C" opacity="0.9" />
        {/* Front layer - brightens toward light */}
        <circle cx="28" cy="20" r="20" fill="#43A047" />
        <circle cx="18" cy="16" r="14" fill="#4CAF50" />
        <circle cx="38" cy="16" r="14" fill="#4CAF50" />
        {/* Shine highlights */}
        <circle cx="24" cy="12" r="6" fill="#66BB6A" opacity="0.5" />
        <circle cx="34" cy="10" r="4" fill="#81C784" opacity="0.4" />
        <circle cx="20" cy="20" r="3" fill="#A5D6A7" opacity="0.3" />
      </svg>
    </div>
  );
}

/* ─── DETAILED COIN (3D Gold Coin with Spinning Animation) ─── */
export function Coin({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      animate={{ 
        y: [0, -8, 0],
        rotateZ: [0, 360],
      }}
      transition={{ 
        duration: 2,
        repeat: Infinity, 
        ease: "easeInOut", 
        delay,
        rotateZ: { duration: 0.8, repeat: Infinity, ease: "linear" }
      }}
      className={className}
      style={{ perspective: "1000px" }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* Outer shadow/depth */}
        <g filter="drop-shadow(2px 3px 4px rgba(0,0,0,0.35))">
          {/* Back rim (dark) */}
          <circle cx="14" cy="14" r="13" fill="#D4701D" opacity="0.6" />
          {/* Main gold body */}
          <circle cx="14" cy="14" r="12" fill="url(#coinGradient)" />
          {/* Inner shine circle */}
          <circle cx="14" cy="11" r="8" fill="#FFEB52" opacity="0.6" />
          {/* Center highlight */}
          <circle cx="14" cy="10" r="5" fill="#FFFF99" opacity="0.8" />
          {/* Ring pattern */}
          <circle cx="14" cy="14" r="10" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.5" />
          <circle cx="14" cy="14" r="7" fill="none" stroke="#FBD000" strokeWidth="0.8" opacity="0.4" />
        </g>
        <defs>
          <radialGradient id="coinGradient" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#FDD835" />
            <stop offset="50%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#F9A825" />
          </radialGradient>
        </defs>
      </svg>
    </motion.div>
  );
}

/* ─── DETAILED PIPE (3D Green Pipe with Rim) ─── */
export function Pipe({ color = "green", className = "" }: { color?: "green" | "red"; className?: string }) {
  const c = color === "green"
    ? { body: "#43A047", rim: "#2E7D32", hi: "#66BB6A", dark: "#1B5E20", light: "#7AC74F" }
    : { body: "#E53935", rim: "#C62828", hi: "#EF5350", dark: "#B71C1C", light: "#FF6E40" };
  
  return (
    <div className={`${className}`} style={{ filter: "drop-shadow(4px 5px 8px rgba(0,0,0,0.35))" }}>
      <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
        {/* Top rim - inner edge (dark side) */}
        <ellipse cx="24" cy="6" rx="22" ry="6" fill={c.dark} opacity="0.8" />
        {/* Top rim - main */}
        <ellipse cx="24" cy="5" rx="22" ry="6" fill={c.rim} />
        {/* Top rim - highlight */}
        <ellipse cx="24" cy="4" rx="20" ry="5" fill={c.light} opacity="0.5" />
        {/* Main pipe body */}
        <rect x="4" y="8" width="40" height="44" fill={c.body} />
        {/* Pipe left side shadow */}
        <rect x="4" y="8" width="5" height="44" fill="rgba(0,0,0,0.15)" />
        {/* Pipe right side shine */}
        <rect x="38" y="8" width="6" height="44" fill={c.light} opacity="0.2" />
        {/* Vertical stripe (depth) */}
        <rect x="8" y="10" width="4" height="40" fill={c.hi} opacity="0.25" />
        {/* Bottom rim */}
        <ellipse cx="24" cy="54" rx="22" ry="5" fill={c.rim} opacity="0.9" />
        {/* Inner opening glow */}
        <ellipse cx="24" cy="52" rx="18" ry="4" fill="rgba(0,0,0,0.4)" />
        {/* Connection bolts */}
        {[8, 14, 30, 36].map((x, i) => (
          <circle key={i} cx={x} cy="14" r="1.5" fill={c.dark} opacity="0.6" />
        ))}
      </svg>
    </div>
  );
}

/* ─── DETAILED MUSHROOM (3D with Spots) ─── */
export function Mushroom({ className = "", color = "red" }: { className?: string; color?: "red" | "green" }) {
  const cap = color === "red" ? { main: "#E53935", dark: "#C62828", light: "#FF6E40" } 
             : { main: "#43B047", dark: "#2E7D32", light: "#66BB6A" };
  const stem = { main: "#FFECB3", dark: "#FFD54F" };
  
  return (
    <div className={`${className}`} style={{ filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.3))" }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {/* Back cap shadow */}
        <ellipse cx="22" cy="16" rx="20" ry="16" fill={cap.dark} opacity="0.4" />
        {/* Main cap */}
        <ellipse cx="22" cy="15" rx="20" ry="15" fill={cap.main} />
        {/* Cap highlight - left side */}
        <ellipse cx="16" cy="8" rx="12" ry="9" fill={cap.light} opacity="0.4" />
        {/* White spots - various sizes */}
        <circle cx="12" cy="11" r="4.5" fill="white" opacity="0.95" />
        <circle cx="28" cy="9" r="3.5" fill="white" opacity="0.92" />
        <circle cx="18" cy="4" r="3" fill="white" opacity="0.88" />
        <circle cx="32" cy="16" r="3.2" fill="white" opacity="0.9" />
        {/* Stem - 3D look */}
        <rect x="14" y="28" width="16" height="16" rx="3" fill={stem.main} />
        <rect x="15" y="29" width="14" height="14" rx="2.5" fill={stem.main} />
        {/* Stem shine */}
        <rect x="16" y="30" width="3" height="12" rx="1.5" fill={stem.dark} opacity="0.2" />
        {/* Stem shadow edge */}
        <rect x="14" y="28" width="16" height="1" rx="1" fill={cap.dark} opacity="0.3" />
        {/* Eyes (optional) */}
        <circle cx="16" cy="20" r="2" fill={cap.dark} opacity="0.8" />
        <circle cx="28" cy="20" r="2" fill={cap.dark} opacity="0.8" />
      </svg>
    </div>
  );
}

/* ─── DETAILED QUESTION BLOCK (Bouncy with 3D Shading) ─── */
export function QuestionBlock({ className = "" }: { className?: string }) {
  return (
    <motion.div 
      animate={{ y: [0, -4, 0] }} 
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }} 
      className={className}
      style={{ filter: "drop-shadow(3px 4px 6px rgba(0,0,0,0.35))" }}
    >
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {/* Shadow/back */}
        <rect x="1" y="2" width="42" height="40" rx="4" fill="rgba(0,0,0,0.15)" />
        {/* Main block */}
        <rect x="0" y="0" width="44" height="44" rx="5" fill="#FDD835" />
        {/* Top shine */}
        <rect x="2" y="2" width="40" height="6" rx="4" fill="#FFEB52" opacity="0.8" />
        {/* Left shadow */}
        <rect x="0" y="0" width="4" height="44" rx="4" fill="rgba(0,0,0,0.2)" opacity="0.8" />
        {/* Right shine */}
        <rect x="40" y="4" width="4" height="40" rx="2" fill="white" opacity="0.3" />
        {/* Border */}
        <rect x="2" y="2" width="40" height="40" rx="3" fill="none" stroke="#E6B800" strokeWidth="2.5" />
        {/* Corner bolts */}
        <circle cx="6" cy="6" r="2.5" fill="#DAA520" opacity="0.7" />
        <circle cx="38" cy="6" r="2.5" fill="#DAA520" opacity="0.7" />
        <circle cx="6" cy="38" r="2.5" fill="#DAA520" opacity="0.7" />
        <circle cx="38" cy="38" r="2.5" fill="#DAA520" opacity="0.7" />
        {/* Question mark - centered */}
        <text x="22" y="32" textAnchor="middle" fill="#5D4037" fontWeight="900" fontSize="28" fontFamily="Arial, sans-serif">?</text>
      </svg>
    </motion.div>
  );
}

/* ─── DETAILED WATERFALL (Realistic flowing water) ─── */
export function Waterfall({ className = "", height = 80 }: { className?: string; height?: number }) {
  return (
    <div className={`${className} relative`} style={{ filter: "drop-shadow(2px 3px 5px rgba(0,0,0,0.25))" }}>
      {/* Rock face - detailed */}
      <div className="w-12 rounded-t-md relative overflow-hidden" style={{ 
        height, 
        background: "linear-gradient(180deg, #90A4AE, #78909C, #607D8B)",
        boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3)"
      }}>
        {/* Rock texture pattern */}
        <div className="absolute inset-0" style={{ 
          background: "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 7px)" 
        }} />
        {/* Water streams - multiple layers */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2.5 + (i % 2) * 1.5,
              left: 4 + i * 6,
              height: 20,
              background: `linear-gradient(180deg, rgba(66,165,245,0.8), rgba(33,150,243,0.4), rgba(13,110,253,0.1))`,
            }}
            animate={{ y: [-20, height + 10] }}
            transition={{ duration: 0.9 + i * 0.12, repeat: Infinity, ease: "linear", delay: i * 0.18 }}
          />
        ))}
        {/* Pool at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4" style={{ background: "linear-gradient(180deg, rgba(66,165,245,0.4), rgba(33,150,243,0.2))" }} />
      </div>
      {/* Splash effect */}
      <motion.div
        animate={{ scaleX: [1, 1.4, 1], scaleY: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="w-14 h-3 rounded-full mx-auto -mt-1"
        style={{ background: "radial-gradient(ellipse, rgba(144,202,249,0.6), rgba(100,181,246,0.2))" }}
      />
    </div>
  );
}

/* ─── DETAILED CLOUD (Fluffy and Soft) ─── */
export function Cloud({ w = 100, className = "" }: { w?: number; className?: string }) {
  const h = w * 0.5;
  return (
    <div className={`${className}`} style={{ filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.15))" }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
        {/* Shadow under cloud */}
        <ellipse cx={w * 0.5} cy={h * 0.95} rx={w * 0.35} ry={h * 0.1} fill="rgba(0,0,0,0.08)" />
        {/* Back puffs (darker) */}
        <ellipse cx={w * 0.25} cy={h * 0.7} rx={w * 0.2} ry={h * 0.35} fill="rgb(245, 248, 250)" opacity="0.85" />
        <ellipse cx={w * 0.5} cy={h * 0.55} rx={w * 0.25} ry={h * 0.45} fill="rgb(245, 248, 250)" opacity="0.88" />
        <ellipse cx={w * 0.75} cy={h * 0.7} rx={w * 0.2} ry={h * 0.35} fill="rgb(245, 248, 250)" opacity="0.85" />
        {/* Main puffs (lighter) */}
        <ellipse cx={w * 0.24} cy={h * 0.65} rx={w * 0.18} ry={h * 0.32} fill="white" opacity="0.95" />
        <ellipse cx={w * 0.5} cy={h * 0.48} rx={w * 0.28} ry={h * 0.42} fill="white" opacity="0.98" />
        <ellipse cx={w * 0.76} cy={h * 0.65} rx={w * 0.18} ry={h * 0.32} fill="white" opacity="0.95" />
        {/* Bright highlights */}
        <ellipse cx={w * 0.37} cy={h * 0.35} rx={w * 0.18} ry={h * 0.2} fill="white" opacity="0.6" />
        <ellipse cx={w * 0.62} cy={h * 0.32} rx={w * 0.14} ry={h * 0.16} fill="white" opacity="0.5" />
      </svg>
    </div>
  );
}

/* ─── ROCK TOWER / CLIFF PLATEAU (Mario World style) ─── */
export function RockTower({
  height = 160,
  width = 80,
  className = "",
}: {
  height?: number;
  width?: number;
  className?: string;
}) {
  return (
    <div className={`${className}`} style={{ filter: "drop-shadow(6px 8px 16px rgba(0,0,0,0.5))" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        {/* Base shadow on ground */}
        <ellipse cx={width * 0.5} cy={height * 0.99} rx={width * 0.38} ry={height * 0.018} fill="rgba(0,0,0,0.25)" />
        {/* Main rock body — back (darker) */}
        <rect x={width * 0.12} y={height * 0.38} width={width * 0.76} height={height * 0.62} rx="3" fill="#6D5E4A" />
        {/* Main rock body — front face */}
        <rect x={width * 0.14} y={height * 0.37} width={width * 0.72} height={height * 0.63} rx="3" fill="#8D7B5E" />
        {/* Left shadow strip */}
        <rect x={width * 0.14} y={height * 0.37} width={width * 0.13} height={height * 0.63} rx="2" fill="#6D5E4A" opacity="0.9" />
        {/* Right highlight strip */}
        <rect x={width * 0.73} y={height * 0.37} width={width * 0.13} height={height * 0.63} rx="2" fill="#B09A78" opacity="0.45" />
        {/* Horizontal rock strata lines */}
        {[0.43, 0.52, 0.61, 0.71, 0.80, 0.89].map((y, i) => (
          <rect key={i} x={width * 0.16} y={height * y} width={width * 0.68} height={1.8} rx="1" fill="rgba(0,0,0,0.13)" />
        ))}
        {/* Crack detail */}
        <path
          d={`M${width * 0.42},${height * 0.41} L${width * 0.47},${height * 0.54} L${width * 0.40},${height * 0.64} L${width * 0.44},${height * 0.73}`}
          stroke="#5D4E3E" strokeWidth="1.5" strokeLinecap="round" opacity="0.55"
        />
        {/* Second crack */}
        <path
          d={`M${width * 0.65},${height * 0.55} L${width * 0.60},${height * 0.65} L${width * 0.63},${height * 0.78}`}
          stroke="#6A5A48" strokeWidth="1" strokeLinecap="round" opacity="0.4"
        />
        {/* Cliff ledge at top of rock */}
        <rect x={width * 0.08} y={height * 0.355} width={width * 0.84} height={height * 0.028} rx="2" fill="#A89070" />
        {/* Grass top — base layer */}
        <rect x={width * 0.06} y={height * 0.26} width={width * 0.88} height={height * 0.105} rx="5" fill="#4A7D1C" />
        {/* Grass top — bright surface */}
        <rect x={width * 0.06} y={height * 0.26} width={width * 0.88} height={height * 0.065} rx="5" fill="#71BC2B" />
        {/* Grass highlight (sunlit) */}
        <rect x={width * 0.12} y={height * 0.27} width={width * 0.55} height={height * 0.032} rx="3" fill="#8FE040" opacity="0.55" />
        {/* Grass edge drape */}
        <rect x={width * 0.06} y={height * 0.35} width={width * 0.88} height={height * 0.02} rx="2" fill="#3D6B18" opacity="0.7" />
        {/* Grass tufts */}
        {[0.14, 0.26, 0.40, 0.55, 0.68, 0.80].map((x, i) => (
          <ellipse key={i} cx={width * x} cy={height * 0.265} rx={width * 0.045} ry={height * 0.022} fill="#9AE848" opacity={0.5 + (i % 3) * 0.1} />
        ))}
      </svg>
    </div>
  );
}

/* ─── CAVE ENTRANCE (Stone Arch) ─── */
export function CaveEntrance({ className = "" }: { className?: string }) {
  return (
    <div className={`${className}`} style={{ filter: "drop-shadow(4px 6px 12px rgba(0,0,0,0.45))" }}>
      <svg width="110" height="120" viewBox="0 0 110 120" fill="none">
        {/* Rock mass background */}
        <rect x="5" y="18" width="100" height="102" rx="5" fill="#5D4E3A" />
        {/* Stone arch — outer face */}
        <path d="M5,120 L5,58 Q5,14 55,14 Q105,14 105,58 L105,120 Z" fill="#7D6E58" />
        {/* Stone arch — lighter face highlight */}
        <path d="M10,120 L10,60 Q10,22 55,22 Q100,22 100,60 L100,120 Z" fill="#8D7B65" />
        {/* Stone blocks drawn as grid */}
        {[
          [8, 62, 28, 11], [38, 62, 30, 11], [70, 62, 30, 11],
          [8, 75, 34, 11], [44, 75, 28, 11], [74, 75, 28, 11],
          [8, 88, 28, 11], [38, 88, 34, 11], [74, 88, 28, 11],
          [8, 101, 34, 11], [44, 101, 28, 11], [74, 101, 28, 11],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx="1.5"
            fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" />
        ))}
        {/* Stone color variation on blocks */}
        {[[8, 75], [70, 62], [38, 88], [8, 101]].map(([x, y], i) => (
          <rect key={`tint${i}`} x={x} y={y} width="28" height="11" rx="1.5" fill="#6D5E4A" opacity="0.2" />
        ))}
        {/* Cave mouth — dark interior */}
        <path d="M24,120 L24,61 Q24,38 55,38 Q86,38 86,61 L86,120 Z" fill="#12080200" />
        <path d="M24,120 L24,61 Q24,38 55,38 Q86,38 86,61 L86,120 Z" fill="#0A0500" opacity="0.9" />
        {/* Cave depth gradient */}
        <path d="M28,120 L28,63 Q28,42 55,42 Q82,42 82,63 L82,120 Z" fill="url(#caveDepth)" />
        {/* Arch stone edge */}
        <path d="M24,62 Q24,38 55,38 Q86,38 86,62" stroke="#3E2D1A" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M24,62 Q24,38 55,38 Q86,38 86,62" stroke="#9E8A6E" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
        {/* Moss on arch */}
        <ellipse cx="24" cy="70" rx="6" ry="4" fill="#3A6B1A" opacity="0.55" />
        <ellipse cx="86" cy="68" rx="5" ry="3.5" fill="#3A6B1A" opacity="0.45" />
        <ellipse cx="14" cy="95" rx="4" ry="3" fill="#3A6B1A" opacity="0.3" />
        {/* Keystone at top of arch */}
        <path d="M46,14 L64,14 L60,28 L50,28 Z" fill="#9E8A6E" />
        <path d="M48,14 L62,14 L59,24 L51,24 Z" fill="#B0A088" opacity="0.5" />
        {/* Defs */}
        <defs>
          <radialGradient id="caveDepth" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="rgba(30,15,5,0.35)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

/* ─── MARIO CHARACTER (detailed CSS SVG) ─── */
export function MarioCharacter({
  className = "",
  scale = 1,
  direction = "right",
}: {
  className?: string;
  scale?: number;
  direction?: "left" | "right";
}) {
  return (
    <motion.div
      className={`${className}`}
      animate={{ y: [0, -7, 0] }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
      style={{
        transform: `scale(${scale}) scaleX(${direction === "left" ? -1 : 1})`,
        transformOrigin: "bottom center",
        filter: "drop-shadow(3px 5px 10px rgba(0,0,0,0.5))",
      }}
    >
      <svg width="58" height="76" viewBox="0 0 58 76" fill="none">
        {/* ── Ground shadow ── */}
        <ellipse cx="29" cy="74" rx="18" ry="4" fill="rgba(0,0,0,0.25)" />
        {/* ── HAT ── */}
        {/* Hat brim */}
        <rect x="7" y="22" width="44" height="7" rx="3.5" fill="#CC2200" />
        <rect x="8" y="22" width="42" height="4" rx="3" fill="#E83318" opacity="0.5" />
        {/* Hat crown */}
        <rect x="15" y="9" width="28" height="15" rx="5" fill="#CC2200" />
        <rect x="17" y="10" width="10" height="6" rx="3" fill="#E83318" opacity="0.45" />
        {/* Hat shadow under brim */}
        <rect x="7" y="27" width="44" height="3" rx="2" fill="#8B1A00" opacity="0.35" />
        {/* ── HAIR / SIDEBURNS ── */}
        <rect x="11" y="22" width="7" height="7" rx="2" fill="#6B3D2B" />
        <rect x="40" y="22" width="7" height="7" rx="2" fill="#6B3D2B" />
        {/* ── FACE ── */}
        <rect x="15" y="28" width="28" height="20" rx="7" fill="#FFCC99" />
        {/* Cheeks */}
        <circle cx="20" cy="40" r="4" fill="#FFA07A" opacity="0.45" />
        <circle cx="38" cy="40" r="4" fill="#FFA07A" opacity="0.45" />
        {/* ── EYES ── */}
        <rect x="19" y="32" width="7" height="7" rx="2" fill="white" />
        <rect x="32" y="32" width="7" height="7" rx="2" fill="white" />
        <rect x="21" y="33" width="5" height="5" rx="1.5" fill="#1A0D00" />
        <rect x="34" y="33" width="5" height="5" rx="1.5" fill="#1A0D00" />
        {/* Eye shine */}
        <rect x="22" y="33.5" width="2" height="2" rx="0.5" fill="white" opacity="0.9" />
        <rect x="35" y="33.5" width="2" height="2" rx="0.5" fill="white" opacity="0.9" />
        {/* ── NOSE ── */}
        <ellipse cx="29" cy="42" rx="5.5" ry="4.5" fill="#FF9966" />
        <ellipse cx="27" cy="41" rx="2" ry="1.5" fill="#FFC0A0" opacity="0.5" />
        {/* ── MUSTACHE ── */}
        <rect x="16" y="44" width="12" height="5" rx="2.5" fill="#6B3D2B" />
        <rect x="30" y="44" width="12" height="5" rx="2.5" fill="#6B3D2B" />
        {/* Mustache curl tips */}
        <ellipse cx="16" cy="47" rx="3" ry="2.5" fill="#6B3D2B" />
        <ellipse cx="42" cy="47" rx="3" ry="2.5" fill="#6B3D2B" />
        {/* ── BODY (Red shirt) ── */}
        <rect x="16" y="47" width="26" height="18" rx="5" fill="#CC2200" />
        <rect x="18" y="48" width="8" height="6" rx="2" fill="#E83318" opacity="0.35" />
        {/* ── OVERALLS BIB ── */}
        <rect x="20" y="47" width="18" height="15" rx="4" fill="#2244BB" />
        {/* Bib highlight */}
        <rect x="22" y="49" width="6" height="4" rx="2" fill="#4466DD" opacity="0.5" />
        {/* Buttons */}
        <circle cx="25" cy="52" r="2.2" fill="#FDD835" />
        <circle cx="33" cy="52" r="2.2" fill="#FDD835" />
        {/* ── ARMS ── */}
        <rect x="5"  y="47" width="13" height="11" rx="5" fill="#CC2200" />
        <rect x="40" y="47" width="13" height="11" rx="5" fill="#CC2200" />
        {/* ── GLOVES (white) ── */}
        <circle cx="9"  cy="59" r="8" fill="white" />
        <circle cx="49" cy="59" r="8" fill="white" />
        {/* Glove seam lines */}
        <line x1="9" y1="53" x2="9" y2="64" stroke="#DDD" strokeWidth="1.2" opacity="0.5" />
        <line x1="4" y1="58" x2="14" y2="58" stroke="#DDD" strokeWidth="1.2" opacity="0.5" />
        <line x1="49" y1="53" x2="49" y2="64" stroke="#DDD" strokeWidth="1.2" opacity="0.5" />
        <line x1="44" y1="58" x2="54" y2="58" stroke="#DDD" strokeWidth="1.2" opacity="0.5" />
        {/* ── PANTS LEGS ── */}
        <rect x="18" y="62" width="10" height="12" rx="3" fill="#2244BB" />
        <rect x="30" y="62" width="10" height="12" rx="3" fill="#2244BB" />
        {/* Pants crease */}
        <rect x="22" y="63" width="1.5" height="9" rx="0.5" fill="#1A3599" opacity="0.35" />
        <rect x="34" y="63" width="1.5" height="9" rx="0.5" fill="#1A3599" opacity="0.35" />
        {/* ── SHOES ── */}
        <rect x="13" y="70" width="18" height="7" rx="3.5" fill="#5D3317" />
        <rect x="27" y="70" width="18" height="7" rx="3.5" fill="#5D3317" />
        {/* Shoe toe highlight */}
        <rect x="15" y="71" width="6" height="2.5" rx="1.5" fill="#7A4824" opacity="0.55" />
        <rect x="29" y="71" width="6" height="2.5" rx="1.5" fill="#7A4824" opacity="0.55" />
        {/* Shoe sole edge */}
        <rect x="13" y="76" width="18" height="1" rx="0.5" fill="#3E1E0A" opacity="0.5" />
        <rect x="27" y="76" width="18" height="1" rx="0.5" fill="#3E1E0A" opacity="0.5" />
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   CHECKPOINT — REALISTIC WOODEN NOTICEBOARD
   Multi-plank construction · wood grain · riveted metal
   nameplate · nail heads · ruled paper · wax seal · post
   ═══════════════════════════════════════════════════════ */

/* ── SVG DEFS shared across the board (grain + paper filters) ── */
function BoardDefs({ id, accentColor }: { id: string; accentColor: string }) {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {/* Wood grain turbulence */}
        <filter id={`grain-${id}`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65 0.015" numOctaves="4" seed={id} result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        {/* Aged-paper noise */}
        <filter id={`paper-${id}`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed={Number(id) + 7} result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
          <feComposite in="blended" in2="SourceGraphic" operator="in" />
        </filter>
        {/* Glow for accent strip */}
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Metal sheen */}
        <linearGradient id={`metal-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="#D0D0D0" />
          <stop offset="30%" stopColor="#A8A8A8" />
          <stop offset="55%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>
        {/* Plank face gradient */}
        <linearGradient id={`plank-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#4A2E0E" />
          <stop offset="12%"  stopColor="#7B4B1A" />
          <stop offset="40%"  stopColor="#9C6128" />
          <stop offset="60%"  stopColor="#B5722F" />
          <stop offset="80%"  stopColor="#8C5420" />
          <stop offset="100%" stopColor="#5C3510" />
        </linearGradient>
        {/* Nameplate gradient */}
        <linearGradient id={`plate-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#C8860A" />
          <stop offset="25%"  stopColor="#E8A820" />
          <stop offset="50%"  stopColor="#F5C842" />
          <stop offset="75%"  stopColor="#D49515" />
          <stop offset="100%" stopColor="#A06B08" />
        </linearGradient>
        {/* Accent glow radial */}
        <radialGradient id={`badge-${id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={accentColor} stopOpacity="1" />
          <stop offset="60%"  stopColor={accentColor} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.55" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ── NAIL HEAD ── */
function Nail({ x, y, size = 5 }: { x: number; y: number; size?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={size} fill="#2C2C2C" />
      <circle cx={x} cy={y} r={size - 1} fill="#555" />
      <circle cx={x - size * 0.28} cy={y - size * 0.28} r={size * 0.35} fill="rgba(255,255,255,0.35)" />
      <line x1={x - size * 0.45} y1={y} x2={x + size * 0.45} y2={y} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
      <line x1={x} y1={y - size * 0.45} x2={x} y2={y + size * 0.45} stroke="rgba(0,0,0,0.45)" strokeWidth="0.8" />
    </g>
  );
}

/* ── RIVET ── */
function Rivet({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="4.5" fill="#3A3A3A" />
      <circle cx={x} cy={y} r="3.5" fill="#606060" />
      <circle cx={x - 1.2} cy={y - 1.2} r="1.4" fill="rgba(255,255,255,0.4)" />
    </g>
  );
}

/* ── WAX SEAL ── */
function WaxSeal({ color }: { color: string }) {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
      {/* Drop shadow */}
      <circle cx="22" cy="23" r="16" fill="rgba(0,0,0,0.25)" />
      {/* Drip base */}
      <ellipse cx="21" cy="27" rx="13" ry="5" fill={color} opacity="0.7" />
      {/* Main wax disc */}
      <circle cx="21" cy="21" r="15" fill={color} />
      {/* Wax texture - darker on edges */}
      <circle cx="21" cy="21" r="15" fill="rgba(0,0,0,0.15)" />
      <circle cx="21" cy="21" r="12" fill={color} />
      {/* Emboss star */}
      <polygon points="21,9 23.5,16.5 31,16.5 25,21 27.5,28.5 21,24 14.5,28.5 17,21 11,16.5 18.5,16.5"
               fill="rgba(255,255,255,0.25)" />
      <polygon points="21,11 23,17 29.5,17 24.5,20.5 26.5,27 21,23.5 15.5,27 17.5,20.5 12.5,17 19,17"
               fill="rgba(255,255,255,0.12)" />
      {/* Wax sheen highlight */}
      <ellipse cx="16" cy="16" rx="5" ry="3.5" fill="rgba(255,255,255,0.22)" transform="rotate(-20 16 16)" />
    </svg>
  );
}

export default function AdventurePoint({
  point,
  index,
  side = "center",
}: {
  point: any;
  index: number;
  side?: "left" | "right" | "center";
}) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef    = useRef<HTMLDivElement>(null);
  const boardRef    = useRef<HTMLDivElement>(null);
  const uid = String(index + 1);

  /* scroll parallax */
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const floatY       = useTransform(scrollYProgress, [0, 1], [-18, 18]);
  const floatYSpring = useSpring(floatY, { stiffness: 55, damping: 18 });

  /* GSAP entrance + sway */
  useEffect(() => {
    if (!containerRef.current || !badgeRef.current || !boardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(badgeRef.current,
        { scale: 0, rotation: -20, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 1.3, ease: "elastic.out(1.2, 0.45)",
          scrollTrigger: { trigger: containerRef.current, start: "top 88%", toggleActions: "play none none reverse" } });
      gsap.fromTo(boardRef.current,
        { rotation: side === "right" ? 10 : -10, opacity: 0, y: 50, scaleY: 0.75 },
        { rotation: 0, opacity: 1, y: 0, scaleY: 1, duration: 1.4, ease: "elastic.out(1, 0.5)", delay: 0.18,
          scrollTrigger: { trigger: containerRef.current, start: "top 88%", toggleActions: "play none none reverse" } });
      gsap.to(boardRef.current, {
        rotation: side === "right" ? -1.8 : 1.8, duration: 3.5,
        ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.4,
      });
    }, containerRef);
    return () => ctx.revert();
  }, [index, side]);

  const align =
    side === "left"  ? "items-start ml-[4%] md:ml-[7%]"
    : side === "right" ? "items-end mr-[4%] md:mr-[7%]"
    : "items-center mx-auto";

  /* Stars (always show 3 filled for now — extend with point.stars if needed) */
  const stars = point.stars ?? 3;

  return (
    <div ref={containerRef} className={`relative flex flex-col ${align} py-2`}>
      <BoardDefs id={uid} accentColor={point.color} />

      {/* ══════════════════════════════════════════
           CHECKPOINT MEDAL / BADGE
         ══════════════════════════════════════════ */}
      <motion.div
        ref={badgeRef}
        style={{ y: floatYSpring as any }}
        className="relative mb-4 cursor-pointer select-none"
        whileHover={{ scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        {/* Outer metallic ring */}
        <div className="w-[92px] h-[92px] rounded-full flex items-center justify-center relative"
          style={{
            background: "conic-gradient(from 0deg, #888 0%, #ddd 15%, #aaa 30%, #fff 45%, #999 60%, #ccc 75%, #888 90%, #ddd 100%)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.55), inset 0 2px 4px rgba(255,255,255,0.3)",
            padding: "4px",
          }}
        >
          {/* Inner accent disc */}
          <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `radial-gradient(circle at 35% 32%, ${point.color}ff 0%, ${point.color}cc 55%, ${point.color}88 100%)`,
              boxShadow: `inset 0 3px 8px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Shine sweep */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, transparent 55%)" }} />
            {/* Icon */}
            <motion.span
              className="text-4xl relative z-10 drop-shadow-[2px_3px_4px_rgba(0,0,0,0.5)]"
              animate={{ y: [0, -6, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
            >
              {point.icon}
            </motion.span>
          </div>
        </div>

        {/* Level number badge bottom-right */}
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-2 border-black flex items-center justify-center z-20"
          style={{
            background: "linear-gradient(135deg, #FDD835, #F9A825)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.4)",
          }}
        >
          <span className="text-[10px] font-black text-black leading-none">{index + 1}</span>
        </div>

        {/* Flag pole */}
        <div className="absolute -top-6 right-0 z-20 flex flex-col items-center">
          <div className="w-[2.5px] h-10 rounded-full"
               style={{ background: "linear-gradient(180deg, #7B5E2A, #4A3010)" }} />
          <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className="absolute top-0 left-[2.5px]">
            <path d="M0,0 L13,4.5 L0,9 Z" fill={point.color} />
            <path d="M0,0 L10,3.5 L0,7 Z" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>

        {/* Star row below badge */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-0.5">
          {[0,1,2].map(i => (
            <svg key={i} width="12" height="12" viewBox="0 0 12 12">
              <polygon points="6,0.5 7.5,4.3 11.5,4.3 8.3,6.8 9.5,10.8 6,8.3 2.5,10.8 3.7,6.8 0.5,4.3 4.5,4.3"
                fill={i < stars ? "#FDD835" : "rgba(255,255,255,0.2)"}
                stroke={i < stars ? "#C8990A" : "rgba(255,255,255,0.15)"}
                strokeWidth="0.5" />
            </svg>
          ))}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════
           WOODEN NOTICEBOARD
         ══════════════════════════════════════════ */}
      <motion.div
        ref={boardRef as any}
        className="relative z-10 w-full max-w-[500px] mt-6"
        style={{ transformOrigin: "top center" }}
      >

        {/* ── HANGING CHAIN / ROPE ── */}
        <div className="flex justify-center mb-0 relative z-20">
          <svg width="120" height="22" viewBox="0 0 120 22" fill="none">
            {/* Chain links */}
            {[0,1,2,3,4,5,6,7,8,9].map(i => (
              <g key={i} transform={`translate(${6 + i*10.5}, 8)`}>
                <ellipse cx="0" cy="0" rx="5" ry="3" fill="none"
                  stroke={i % 2 === 0 ? "#8A7040" : "#6A5030"} strokeWidth="2" />
                <ellipse cx="0" cy="0" rx="4" ry="2" fill="none"
                  stroke={i % 2 === 0 ? "#B09050" : "#907040"} strokeWidth="0.8" />
              </g>
            ))}
            {/* Hooks at ends */}
            <path d="M6,8 Q3,2 6,0 Q9,0 8,5" stroke="#7A6035" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M114,8 Q117,2 114,0 Q111,0 112,5" stroke="#7A6035" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* ── BOARD BODY — 4 wood planks ── */}
        <div className="relative" style={{
          filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.55)) drop-shadow(0 4px 8px rgba(0,0,0,0.35))",
        }}>
          {/* 3px side shadow (gives board depth / thickness) */}
          <div className="absolute top-1 left-full w-2 h-full rounded-r-sm"
               style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.5),transparent)", borderRadius: "0 3px 3px 0" }} />
          <div className="absolute top-2 left-0 right-0 bottom-0 rounded-xl"
               style={{ background: "rgba(0,0,0,0.22)", transform: "translateY(6px) scaleX(0.97)", filter: "blur(6px)", zIndex: -1 }} />

          {/* SVG board — planks + grain */}
          <svg
            width="100%" viewBox="0 0 480 280"
            style={{ display: "block", borderRadius: "10px", overflow: "hidden" }}
          >
            <defs>
              {/* Plank divider gradient */}
              <linearGradient id={`div-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A1505" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#110700" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#2A1505" stopOpacity="0.8" />
              </linearGradient>
              {/* Board outer dark bevel */}
              <linearGradient id={`bevel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#2A1200" />
                <stop offset="40%"  stopColor="#4A2208" />
                <stop offset="100%" stopColor="#1A0A00" />
              </linearGradient>
              {/* Paper area */}
              <linearGradient id={`pap-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#FFF8E8" />
                <stop offset="50%"  stopColor="#FFF3D8" />
                <stop offset="100%" stopColor="#FFECC5" />
              </linearGradient>
              {/* Wood grain lines for each plank */}
              <pattern id={`wg-${uid}`} x="0" y="0" width="480" height="60" patternUnits="userSpaceOnUse">
                {[4,11,17,24,31,38,44,52].map((x,i)=>(
                  <path key={i} d={`M${x},0 Q${x+2},30 ${x},60`}
                    stroke="rgba(0,0,0,0.07)" strokeWidth={i%3===0?"1.2":"0.6"} fill="none" />
                ))}
                {[6,18,30,42,54].map((x,i)=>(
                  <path key={`h${i}`} d={`M${x},0 Q${x-1},30 ${x+1},60`}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" fill="none" />
                ))}
              </pattern>
            </defs>

            {/* ─ OUTER FRAME / BEVEL ─ */}
            <rect x="0" y="0" width="480" height="280" rx="10" fill={`url(#bevel-${uid})`} />

            {/* ─ PLANK 1 (top — thinner, header) ─ */}
            <rect x="4" y="4"  width="472" height="58" rx="4" fill={`url(#plank-${uid})`} />
            <rect x="4" y="4"  width="472" height="58" fill={`url(#wg-${uid})`} opacity="0.9" />
            {/* plank top highlight */}
            <rect x="4" y="4"  width="472" height="8"  rx="4" fill="rgba(255,255,255,0.12)" />
            {/* plank bottom bevel */}
            <rect x="4" y="57" width="472" height="4"  fill="rgba(0,0,0,0.35)" />

            {/* ─ PLANK 2 ─ */}
            <rect x="4" y="65" width="472" height="62" fill={`url(#plank-${uid})`} />
            <rect x="4" y="65" width="472" height="62" fill={`url(#wg-${uid})`} opacity="0.85" />
            <rect x="4" y="65" width="472" height="6"  fill="rgba(255,255,255,0.07)" />
            <rect x="4" y="122" width="472" height="4"  fill="rgba(0,0,0,0.28)" />

            {/* ─ PLANK 3 ─ */}
            <rect x="4" y="130" width="472" height="62" fill={`url(#plank-${uid})`} />
            <rect x="4" y="130" width="472" height="62" fill={`url(#wg-${uid})`} opacity="0.85" />
            <rect x="4" y="130" width="472" height="6"  fill="rgba(255,255,255,0.07)" />
            <rect x="4" y="187" width="472" height="4"  fill="rgba(0,0,0,0.28)" />

            {/* ─ PLANK 4 (bottom) ─ */}
            <rect x="4" y="195" width="472" height="80" rx="4" fill={`url(#plank-${uid})`} />
            <rect x="4" y="195" width="472" height="80" fill={`url(#wg-${uid})`} opacity="0.85" />
            <rect x="4" y="195" width="472" height="6"  fill="rgba(255,255,255,0.06)" />
            <rect x="4" y="270" width="472" height="6"  rx="3" fill="rgba(0,0,0,0.3)" />

            {/* ─ Left accent strip ─ */}
            <rect x="4" y="4" width="10" height="272" rx="3" fill={point.color} opacity="0.75"
              filter={`url(#glow-${uid})`} />
            <rect x="4" y="4" width="10" height="272" rx="3" fill="rgba(255,255,255,0.18)" />

            {/* ─ PAPER AREA ─ */}
            <rect x="20" y="68" width="454" height="198" rx="4" fill={`url(#pap-${uid})`} />
            {/* Paper texture overlay */}
            <rect x="20" y="68" width="454" height="198" rx="4" fill="none"
              stroke="rgba(180,140,80,0.3)" strokeWidth="1" />
            {/* Ruled lines on paper */}
            {[98,118,138,158,178,198,218,238].map((y,i) => (
              <line key={i} x1="28" y1={y} x2="468" y2={y}
                stroke="rgba(100,120,180,0.18)" strokeWidth="0.8" />
            ))}
            {/* Left margin rule */}
            <line x1="55" y1="72" x2="55" y2="262" stroke="rgba(220,100,80,0.2)" strokeWidth="0.8" />
            {/* Paper fold/dog-ear corner */}
            <path d="M452,68 L474,68 L474,90 Z" fill="rgba(0,0,0,0.06)" />
            <path d="M452,68 L474,90 L452,90 Z" fill="rgba(255,255,255,0.25)" />
            {/* Paper age stain */}
            <ellipse cx="380" cy="230" rx="45" ry="25" fill="rgba(180,130,60,0.08)" />
            <ellipse cx="60"  cy="200" rx="30" ry="18" fill="rgba(160,110,50,0.06)" />

            {/* ─ METAL NAMEPLATE (riveted) ─ */}
            {/* Plate shadow */}
            <rect x="17" y="8"  width="450" height="50" rx="5" fill="rgba(0,0,0,0.35)" />
            {/* Plate body */}
            <rect x="14" y="6"  width="450" height="50" rx="5" fill={`url(#plate-${uid})`} />
            {/* Plate top shine */}
            <rect x="14" y="6"  width="450" height="12" rx="5" fill="rgba(255,255,255,0.3)" />
            {/* Plate engraved inner recess */}
            <rect x="20" y="12" width="438" height="38" rx="3"
              fill="rgba(0,0,0,0.12)" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            {/* Plate rivets */}
            <Rivet x={28}  y={31} />
            <Rivet x={456} y={31} />
            <Rivet x={242} y={10} />

            {/* ─ NAIL HEADS at plank intersections ─ */}
            {/* Top plank nails */}
            <Nail x={30}  y={62} size={4.5} />
            <Nail x={240} y={62} size={4.5} />
            <Nail x={450} y={62} size={4.5} />
            {/* Mid plank nails */}
            <Nail x={30}  y={127} size={4.5} />
            <Nail x={240} y={127} size={4.5} />
            <Nail x={450} y={127} size={4.5} />
            <Nail x={30}  y={192} size={4.5} />
            <Nail x={240} y={192} size={4.5} />
            <Nail x={450} y={192} size={4.5} />
            {/* Accent strip screw */}
            <Nail x={9} y={140} size={3.5} />

            {/* ─ METAL CORNER BRACKETS ─ */}
            {/* Top-left */}
            <path d="M4,4 L30,4 L30,8 L8,8 L8,30 L4,30 Z" fill={`url(#metal-${uid})`} opacity="0.9" />
            <path d="M4,4 L30,4 L30,5 L4,5 Z" fill="rgba(255,255,255,0.4)" />
            {/* Top-right */}
            <path d="M476,4 L450,4 L450,8 L472,8 L472,30 L476,30 Z" fill={`url(#metal-${uid})`} opacity="0.9" />
            {/* Bottom-left */}
            <path d="M4,276 L30,276 L30,272 L8,272 L8,252 L4,252 Z" fill={`url(#metal-${uid})`} opacity="0.9" />
            {/* Bottom-right */}
            <path d="M476,276 L450,276 L450,272 L472,272 L472,252 L476,252 Z" fill={`url(#metal-${uid})`} opacity="0.9" />
            {/* Bracket screws */}
            <Nail x={10}  y={9}   size={3} />
            <Nail x={25}  y={9}   size={3} />
            <Nail x={10}  y={271} size={3} />
            <Nail x={25}  y={271} size={3} />
            <Nail x={455} y={9}   size={3} />
            <Nail x={470} y={9}   size={3} />
            <Nail x={455} y={271} size={3} />
            <Nail x={470} y={271} size={3} />
          </svg>

          {/* ── TEXT CONTENT overlaid on the SVG ── */}
          <div className="absolute inset-0 flex flex-col pointer-events-none" style={{ padding: "0 28px" }}>

            {/* Nameplate label */}
            <div className="flex items-center justify-between" style={{ height: "56px", paddingLeft: "28px" }}>
              <div className="flex items-center gap-2">
                {/* Engraved star */}
                <svg width="20" height="20" viewBox="0 0 16 16">
                  <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6"
                    fill="rgba(0,0,0,0.35)" />
                  <polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6"
                    fill="rgba(255,255,255,0.25)" />
                </svg>
                <span className="font-black text-sm md:text-base tracking-[0.25em] uppercase select-none"
                  style={{ color: "rgba(30,15,0,0.75)", textShadow: "0 1px 0 rgba(255,255,255,0.3), 0 -1px 0 rgba(0,0,0,0.2)" }}>
                  {point.label}
                </span>
              </div>
              {/* Coin cluster top-right */}
              <div className="flex gap-1 mr-2">
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <circle cx="7" cy="7" r="6.5" fill="#D4701D" opacity="0.5" />
                      <circle cx="7" cy="7" r="6"   fill="#FBC02D" />
                      <circle cx="7" cy="5" r="3.5" fill="#FDD835" opacity="0.7" />
                    </svg>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Paper content */}
            <div className="flex-1 flex flex-col justify-center px-2 pt-1 pb-3" style={{ marginTop: "4px" }}>
              {/* Title */}
              <div className="flex items-start gap-3 mb-2">
                {/* Left accent rule */}
                <div className="w-1 self-stretch rounded-full mt-1 shrink-0"
                     style={{ background: `linear-gradient(180deg, ${point.color}, ${point.color}55)` }} />
                <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug tracking-tight"
                    style={{ fontFamily: "'Georgia', serif", textShadow: "0.5px 0.5px 0 rgba(0,0,0,0.08)" }}>
                  {t(point.title)}
                </h3>
              </div>

              {/* Ornamental divider */}
              <div className="flex items-center gap-2 mb-3 ml-4">
                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${point.color}88, ${point.color}22)` }} />
                <svg width="16" height="10" viewBox="0 0 16 10">
                  <path d="M8,1 L15,5 L8,9 L1,5 Z" fill={point.color} opacity="0.7" />
                </svg>
                <div className="h-px w-8" style={{ background: `${point.color}44` }} />
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm md:text-base leading-relaxed ml-4"
                 style={{ fontFamily: "'Georgia', serif" }}>
                {t(point.desc)}
              </p>

              {/* Bottom row: wax seal + progress dots */}
              <div className="flex items-end justify-between mt-3 ml-4">
                <div className="flex gap-2 items-center">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className={`rounded-full border`}
                      style={{
                        width: i < 3 ? "8px" : "6px",
                        height: i < 3 ? "8px" : "6px",
                        background: i < 3 ? point.color : "rgba(0,0,0,0.12)",
                        borderColor: i < 3 ? `${point.color}88` : "rgba(0,0,0,0.15)",
                        boxShadow: i < 3 ? `0 0 5px ${point.color}66` : "none",
                      }}
                    />
                  ))}
                </div>
                <div style={{ marginRight: "8px", marginBottom: "4px" }}>
                  <WaxSeal color={point.color} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SINGLE CENTER POST ── */}
        <div className="flex justify-center -mt-0.5 relative z-0">
          {/* Post */}
          <div className="relative" style={{ width: "22px" }}>
            {/* Post body */}
            <div className="w-full rounded-b-sm" style={{
              height: "52px",
              background: "linear-gradient(90deg, #2A1200 0%, #5C3010 18%, #8C5428 35%, #A8682E 50%, #8C5428 65%, #5C3010 82%, #2A1200 100%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.12), 2px 0 4px rgba(0,0,0,0.4)",
            }}>
              {/* Wood ring bands */}
              {[14, 28, 42].map(y => (
                <div key={y} className="absolute left-0 right-0 h-px"
                  style={{ top: y, background: "rgba(0,0,0,0.3)" }} />
              ))}
              {/* Post highlight */}
              <div className="absolute top-0 bottom-0 left-[5px] w-[3px]"
                   style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
            {/* Metal band around post */}
            <div className="absolute w-full" style={{
              top: "12px", height: "7px",
              background: "linear-gradient(180deg, #999 0%, #ddd 30%, #bbb 55%, #888 100%)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
            }}>
              <div className="absolute inset-x-0 top-0 h-1 bg-white opacity-30 rounded-t-sm" />
            </div>
            {/* Ground spike */}
            <div className="mx-auto" style={{
              width: "10px", height: "10px",
              background: "linear-gradient(180deg, #7A5020, #3A2008)",
              clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
            }} />
          </div>
        </div>

        {/* Cast ground shadow */}
        <div className="flex justify-center -mt-0.5">
          <div style={{
            width: "80px", height: "6px",
            background: "radial-gradient(ellipse 60px 4px at center, rgba(0,0,0,0.28), transparent)",
          }} />
        </div>
      </motion.div>
    </div>
  );
}