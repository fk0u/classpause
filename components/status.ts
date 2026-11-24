import type { SessionStatus } from "@/db/schema";

export type Tone = "emerald" | "amber" | "indigo" | "slate" | "crimson";

export const STATUS: Record<SessionStatus, { label: string; tone: Tone; advice: string }> = {
  scheduled: { label: "Scheduled", tone: "slate", advice: "Lecturer is asked to confirm 2 hours before." },
  pending: { label: "Hold commute", tone: "amber", advice: "Waiting for the lecturer. Don’t leave yet." },
  confirmed: { label: "Safe to commute", tone: "emerald", advice: "Verified by the lecturer. Class is on." },
  delayed: { label: "Delayed 20 min", tone: "amber", advice: "Class starts 20 minutes late." },
  reschedule: { label: "Rescheduling", tone: "indigo", advice: "Komti is locking a conflict-free slot." },
  rescheduled: { label: "Moved", tone: "indigo", advice: "Class moved. Today’s slot is free." },
  micropause: { label: "Micro-Pause", tone: "indigo", advice: "Don’t commute. Do the 15-minute module to log attendance." },
};

export const TONE_CLASSES: Record<Tone, { chip: string; bar: string; glow: string; text: string }> = {
  emerald: { chip: "bg-emerald-100 text-emerald-800", bar: "bg-emerald", glow: "shadow-emerald/30", text: "text-emerald-700" },
  amber: { chip: "bg-amber-100 text-amber-800", bar: "bg-amber", glow: "shadow-amber/30", text: "text-amber-700" },
  indigo: { chip: "bg-indigo-100 text-indigo-800", bar: "bg-indigo", glow: "shadow-indigo/30", text: "text-indigo" },
  slate: { chip: "bg-slate-100 text-slate-700", bar: "bg-slate-300", glow: "shadow-slate-300/30", text: "text-slate-600" },
  crimson: { chip: "bg-red-100 text-red-800", bar: "bg-crimson", glow: "shadow-crimson/30", text: "text-red-700" },
};
