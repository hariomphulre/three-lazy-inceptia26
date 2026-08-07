// Maps the assessment report's free-text `detected_disabilities` onto the fixed
// disability vocabulary, so every dashboard renders the condition the same way
// (badges), rather than a teacher-chosen label. The condition is an OUTPUT of the
// assessment — never selected up front.

export interface ConditionBadge {
  label: string;
  icon: string;
  color: string;
}

const CONDITIONS = [
  { label: "Dyslexia", icon: "📖", color: "bg-[#7C6FF7]", aliases: ["dyslexia", "reading"] },
  { label: "Dyscalculia", icon: "🔢", color: "bg-[#2E7D32]", aliases: ["dyscalculia", "math", "maths", "numeracy"] },
  { label: "Dysgraphia", icon: "✏️", color: "bg-[#7C6FF7]", aliases: ["dysgraphia", "writing", "handwriting"] },
  { label: "ADHD", icon: "⚡", color: "bg-[#F44336]", aliases: ["adhd", "attention", "hyperactivity"] },
  { label: "Autism (ASD)", icon: "🧩", color: "bg-[#FF9800]", aliases: ["asd", "autism", "autistic"] },
  { label: "Speech", icon: "🗣️", color: "bg-[#9C27B0]", aliases: ["speech", "language"] },
  { label: "Hearing", icon: "👂", color: "bg-[#00BCD4]", aliases: ["hearing", "auditory"] },
];

// Tokens that mean "nothing found" — not real conditions.
const NEGATIVE = /^(none|no|nil|na|n\/a|normal|healthy|typical|not detected|no disabilit)/i;

/**
 * Parse a report's detected-disabilities string into structured badges.
 * Returns an empty array when nothing meaningful was detected.
 */
export function parseConditions(detected?: string | null): ConditionBadge[] {
  if (!detected) return [];
  const tokens = detected.split(/[,;/|]+/).map(t => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: ConditionBadge[] = [];

  for (const tok of tokens) {
    if (NEGATIVE.test(tok)) continue;
    const low = tok.toLowerCase();
    const match = CONDITIONS.find(c => c.aliases.some(a => low === a || low.includes(a)));
    const badge: ConditionBadge = match
      ? { label: match.label, icon: match.icon, color: match.color }
      : { label: tok, icon: "🧠", color: "bg-black" };
    const key = badge.label.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(badge);
    }
  }
  return out;
}
