---
ruas_dialect: ai-native/v1
target: "Autonomous AI Coding Agents (Cursor, Claude, Antigravity, Cline)"
generated_at: "2026-11-20T05:09:30.775Z"
project_root: "/Users/kou/Documents/classPause"
total_symbols: 25
total_edges: 30
vibe_session_id: "vibe-1795151370771-avlvc"
vibe_timestamp: 1795151370771
---

# 🌿 Ruas AI-Native Memory & Working Context
> **LLM NOTICE:** This document is pre-indexed semantic ground truth. Do NOT rescan ASTs or hallucinate unverified relationships.

## 🧠 Active Vibe Intent & Working Memory
- **Developer Intent:** `3-role PWA prototype built: Student/Komti/Lecturer/Design System tabs, shared state in components/demo-state.tsx, all data simulated; Final Day reserved: real slot engine, messaging webhook, server SLA+Postgres`
- **Active Files (0):**

## 🏛️ Central Hub Symbols (God Nodes)
| Symbol | Kind | Inbound Callers | Outbound Calls | Risk Assessment |
| :--- | :--- | :---: | :---: | :--- |
| `fmt` | `function` | 3 | 0 | 🟡 MODERATE |
| `ContrastMatrix` | `function` | 0 | 3 | 🟡 MODERATE |
| `contrast` | `function` | 1 | 1 | 🟡 MODERATE |
| `useCountdown` | `function` | 2 | 0 | 🟡 MODERATE |
| `CommuteRadar` | `function` | 0 | 2 | 🟡 MODERATE |
| `LiveMono` | `function` | 0 | 2 | 🟡 MODERATE |
| `lum` | `function` | 1 | 0 | 🟡 MODERATE |
| `grade` | `function` | 1 | 0 | 🟡 MODERATE |
| `tone` | `function` | 1 | 0 | 🟡 MODERATE |
| `MicroPause` | `function` | 0 | 1 | 🟡 MODERATE |

## ⚡ Bayesian Critical Call Trajectories
- `[contrast] --(CALLS:89%)--> [lum]`
- `[ContrastMatrix] --(CALLS:89%)--> [contrast]`
- `[ContrastMatrix] --(CALLS:89%)--> [tone]`
- `[ContrastMatrix] --(CALLS:89%)--> [grade]`
- `[CommuteRadar] --(CALLS:89%)--> [useCountdown]`
- `[CommuteRadar] --(CALLS:89%)--> [fmt]`
- `[MicroPause] --(CALLS:89%)--> [fmt]`
- `[LiveMono] --(CALLS:89%)--> [useCountdown]`
- `[LiveMono] --(CALLS:89%)--> [fmt]`

## 📐 Compact AST Signatures (Zero-Fluff Token Layout)
### `app/layout.tsx`
- [function] `RootLayout` :: ({ children }: { children: React.ReactNode }) (L14-L20)

### `app/page.tsx`
- [function] `Section` :: ({ id, eyebrow, title, intro, children }: {
  id: string; eyebrow: string; title: string; intro?: string; children: React.ReactNode;
}) (L11-L22)
- [function] `Rationale` :: ({ children }: { children: React.ReactNode }) (L24-L30)
- [function] `PatternFrame` :: ({ label, title, children, rationale }: {
  label: string; title: string; children: React.ReactNode; rationale: React.ReactNode;
}) (L32-L48)
- [function] `fmt` :: (s: number) (L50-L51)
- [function] `lum` :: (hex: string) (L81-L87)
- [function] `contrast` :: (a: string, b: string) (L88-L91)
- [function] `Swatch` :: ({ c }: { c: (typeof COLORS)[number] }) (L93-L119)
- [function] `copy` :: () (L95-L99)
- [function] `ContrastMatrix` :: () (L121-L167)
- [function] `grade` :: (r: number) (L124-L124)
- [function] `tone` :: (r: number) (L125-L126)
- [function] `useCountdown` :: (start: number) (L171-L178)
- [function] `RadarCard` :: ({ tone, icon: Icon, status, headline, children }: {
  tone: "emerald" | "amber" | "indigo"; icon: React.ElementType; status: string; headline: string; children: React.ReactNode;
}) (L180-L204)
- [function] `CommuteRadar` :: () (L206-L235)
- [function] `SlotSelector` :: () (L245-L286)
- [function] `Ring` :: ({ pct }: { pct: number }) (L295-L304)
- [function] `MicroPause` :: () (L306-L385)
- [function] `ThumbZone` :: () (L389-L452)
- [function] `Page` :: () (L458-L569)
- [function] `LiveMono` :: () (L571-L574)
