import type { SessionStatus } from "@/db/schema";

export type Tone = "mint" | "butter" | "lilac" | "sky" | "plain";

export const STATUS: Record<SessionStatus, { label: string; tone: Tone; advice: string; emoji: string }> = {
  scheduled: { label: "Scheduled", tone: "plain", emoji: "🗓️", advice: "Lecturer gets a 1-tap card 2 hours before." },
  pending: { label: "Hold commute", tone: "butter", emoji: "⏳", advice: "Waiting for the lecturer. Don’t leave yet." },
  confirmed: { label: "Safe to commute", tone: "mint", emoji: "👏", advice: "Verified by the lecturer. Class is on." },
  delayed: { label: "Delayed 20 min", tone: "butter", emoji: "🐢", advice: "Class starts 20 minutes late." },
  reschedule: { label: "Rescheduling", tone: "sky", emoji: "🧭", advice: "Komti is locking a conflict-free slot." },
  rescheduled: { label: "Moved", tone: "sky", emoji: "📦", advice: "Class moved. Today’s slot is free." },
  micropause: { label: "Micro-Pause", tone: "lilac", emoji: "🎧", advice: "Don’t commute. Do the 15-minute module to log attendance." },
};

export const TONE: Record<Tone, { card: string; chip: string; deep: string; dot: string; block: string }> = {
  mint: { card: "bg-mint", chip: "bg-mint text-mint-deep", deep: "text-mint-deep", dot: "bg-mint-deep", block: "bg-mint border-mint-deep/20" },
  butter: { card: "bg-butter", chip: "bg-butter text-butter-deep", deep: "text-butter-deep", dot: "bg-butter-deep", block: "bg-butter border-butter-deep/20" },
  lilac: { card: "bg-lilac", chip: "bg-lilac text-lilac-deep", deep: "text-lilac-deep", dot: "bg-lilac-deep", block: "bg-lilac border-lilac-deep/20" },
  sky: { card: "bg-sky", chip: "bg-sky text-sky-deep", deep: "text-sky-deep", dot: "bg-sky-deep", block: "bg-sky border-sky-deep/20" },
  plain: { card: "bg-white", chip: "bg-paper text-slate-600", deep: "text-slate-600", dot: "bg-slate-400", block: "bg-white border-slate-200 hatch" },
};

const AVATAR_BG = ["bg-rose", "bg-mint", "bg-lilac", "bg-butter", "bg-sky"];
export const avatarBg = (seed: string) => AVATAR_BG[[...seed].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_BG.length];
export const initials = (name: string) => name.replace(/^(Dr|Ir)\.?\s+/i, "").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
