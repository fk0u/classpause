"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* All data here is SIMULATED for the STACK 2026 semifinal prototype. */

export type ClassStatus =
  | "idle"          // before H-2h trigger
  | "pending"       // SLA timer running, awaiting lecturer
  | "confirmed"
  | "delayed"       // +20 min / online
  | "reschedule"    // lecturer asked for slots, Komti must pick
  | "rescheduled"   // Komti locked a slot
  | "micropause";   // async fallback

export type Slot = { id: string; label: string; day: string; time: string; room: string; meta: string; kind: "optimal" | "alt" | "async" };

export const SLOTS: Slot[] = [
  { id: "s1", label: "Optimal", day: "Thursday", time: "13:00–14:40", room: "Lab-301", meta: "0% student conflict • Room vacant", kind: "optimal" },
  { id: "s2", label: "Alternative", day: "Friday", time: "09:00–10:40", room: "B-105", meta: "95% available • 2 org-event conflicts", kind: "alt" },
  { id: "s3", label: "Async", day: "Today", time: "Self-paced", room: "Micro-Pause", meta: "Guided 15-min module + Q&A thread", kind: "async" },
];

export type Permission = { id: string; name: string; type: "Sick" | "Dispensation"; course: string; note: string; status: "pending" | "approved" };

export type Receipt = { course: string; at: string; score: string; id: string };

export const SLA_SECONDS = 15 * 60;

type Toast = { id: number; text: string; tone: "ok" | "warn" | "info" };

type Ctx = {
  status: ClassStatus;
  sla: number;
  lockedSlot: Slot | null;
  permissions: Permission[];
  receipts: Receipt[];
  recoveredMin: number;
  toasts: Toast[];
  lecturerPrompted: boolean;
  triggerH2: () => void;
  timeoutSla: () => void;
  reset: () => void;
  lecturerAction: (a: "confirm" | "delay" | "reschedule" | "micropause") => void;
  lockSlot: (s: Slot) => void;
  submitPermission: (type: Permission["type"], note: string) => void;
  approvePermission: (id: string) => void;
  addReceipt: (course: string, score: string) => Receipt;
  toast: (text: string, tone?: Toast["tone"]) => void;
};

const DemoCtx = createContext<Ctx | null>(null);
export const useDemo = () => {
  const c = useContext(DemoCtx);
  if (!c) throw new Error("useDemo outside provider");
  return c;
};

const SEED_PERMISSIONS: Permission[] = [
  { id: "p1", name: "Nadia P.", type: "Sick", course: "Digital Systems & Logic", note: "Fever, clinic letter attached", status: "pending" },
  { id: "p2", name: "Fajar R.", type: "Dispensation", course: "Digital Systems & Logic", note: "Regional debate competition", status: "pending" },
];

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ClassStatus>("pending");
  const [sla, setSla] = useState(14 * 60 + 22);
  const [lockedSlot, setLockedSlot] = useState<Slot | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(SEED_PERMISSIONS);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [recoveredMin, setRecoveredMin] = useState(156);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lecturerPrompted, setLecturerPrompted] = useState(true);
  const tid = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  // SLA ticker
  useEffect(() => {
    if (status !== "pending") return;
    const t = setInterval(() => setSla((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [status]);

  useEffect(() => {
    if (status === "pending" && sla === 0) {
      setStatus("micropause");
      setLecturerPrompted(false);
      toast("SLA expired at H+15m — Digital Systems auto-switched to Micro-Pause", "warn");
    }
  }, [sla, status, toast]);

  const triggerH2 = () => {
    setStatus("pending");
    setSla(SLA_SECONDS);
    setLockedSlot(null);
    setLecturerPrompted(true);
    toast("H-2h trigger: 1-tap confirmation sent to Dr. Naufal via WhatsApp webhook (simulated)");
  };

  const timeoutSla = () => {
    if (status !== "pending") return toast("No active SLA timer — run the H-2h trigger first", "warn");
    setSla(0);
  };

  const reset = () => {
    setStatus("pending");
    setSla(14 * 60 + 22);
    setLockedSlot(null);
    setPermissions(SEED_PERMISSIONS);
    setReceipts([]);
    setRecoveredMin(156);
    setLecturerPrompted(true);
    toast("Demo reset");
  };

  const lecturerAction: Ctx["lecturerAction"] = (a) => {
    setLecturerPrompted(false);
    if (a === "confirm") { setStatus("confirmed"); toast("Confirmed — 40 students got a green SAFE TO COMMUTE signal", "ok"); }
    if (a === "delay") { setStatus("delayed"); toast("Delay posted — new start 10:20, online link attached", "info"); }
    if (a === "reschedule") { setStatus("reschedule"); toast("3 conflict-free slots computed — waiting for Komti to lock one", "info"); }
    if (a === "micropause") { setStatus("micropause"); setRecoveredMin((m) => m + 52); toast("Converted to Micro-Pause — nobody commutes for nothing", "ok"); }
  };

  const lockSlot = (s: Slot) => {
    setLockedSlot(s);
    if (s.kind === "async") { setStatus("micropause"); setRecoveredMin((m) => m + 52); }
    else setStatus("rescheduled");
    toast(`Broadcast: Digital Systems moved to ${s.day} ${s.time} · ${s.room}`, "ok");
  };

  const submitPermission = (type: Permission["type"], note: string) => {
    setPermissions((p) => [{ id: `p${Date.now()}`, name: "Raka (you)", type, course: "Digital Systems & Logic", note: note || "Proof attached", status: "pending" }, ...p]);
    toast("Sent to Komti & lecturer — one door, no chat", "ok");
  };

  const approvePermission = (id: string) => {
    setPermissions((p) => p.map((x) => (x.id === id ? { ...x, status: "approved" } : x)));
    toast("Approved — attendance marked as Excused, not Alpa", "ok");
  };

  const addReceipt = (course: string, score: string) => {
    const r = { course, score, at: new Date().toLocaleString("en-GB", { hour12: false }), id: `CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
    setReceipts((x) => [r, ...x]);
    setRecoveredMin((m) => m + 15);
    return r;
  };

  return (
    <DemoCtx.Provider value={{ status, sla, lockedSlot, permissions, receipts, recoveredMin, toasts, lecturerPrompted,
      triggerH2, timeoutSla, reset, lecturerAction, lockSlot, submitPermission, approvePermission, addReceipt, toast }}>
      {children}
    </DemoCtx.Provider>
  );
}

export const fmt = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
