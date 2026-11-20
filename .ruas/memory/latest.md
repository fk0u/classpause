---
ruas_dialect: ai-native/v1
target: "Autonomous AI Coding Agents (Cursor, Claude, Antigravity, Cline)"
generated_at: "2026-11-20T08:42:38.410Z"
project_root: "/Users/kou/Documents/classPause"
total_symbols: 54
total_edges: 81
vibe_session_id: "vibe-1795164158402-qlkg0"
vibe_timestamp: 1795164158402
---

# 🌿 Ruas AI-Native Memory & Working Context
> **LLM NOTICE:** This document is pre-indexed semantic ground truth. Do NOT rescan ASTs or hallucinate unverified relationships.

## 🧠 Active Vibe Intent & Working Memory
- **Developer Intent:** `Handbook, abstract PDF and Discovery Kit converted to docs/sources (ignored); semifinal proposal sections and Final Day rules added to docs/PROJECT_CONTEXT.md section 6`
- **Active Files (0):**

## 🏛️ Central Hub Symbols (God Nodes)
| Symbol | Kind | Inbound Callers | Outbound Calls | Risk Assessment |
| :--- | :--- | :---: | :---: | :--- |
| `useDemo` | `function` | 11 | 0 | 🔴 HIGH BLAST RADIUS |
| `fmt` | `function` | 7 | 0 | 🔴 HIGH BLAST RADIUS |
| `KomtiView` | `function` | 1 | 5 | 🟡 MODERATE |
| `ContrastMatrix` | `function` | 0 | 3 | 🟡 MODERATE |
| `LecturerView` | `function` | 1 | 2 | 🟡 MODERATE |
| `Card2` | `function` | 0 | 3 | 🟡 MODERATE |
| `contrast` | `function` | 1 | 1 | 🟡 MODERATE |
| `useCountdown` | `function` | 2 | 0 | 🟡 MODERATE |
| `CommuteRadar` | `function` | 0 | 2 | 🟡 MODERATE |
| `LiveMono` | `function` | 0 | 2 | 🟡 MODERATE |

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
- `[KomtiView.tsx] --(IMPORTS:95%)--> [useDemo]`
- `[KomtiView.tsx] --(IMPORTS:95%)--> [fmt]`
- `[LecturerView.tsx] --(IMPORTS:95%)--> [useDemo]`
- `[StudentView.tsx] --(IMPORTS:95%)--> [useDemo]`
- `[StudentView.tsx] --(IMPORTS:95%)--> [fmt]`
- `[page.tsx] --(IMPORTS:95%)--> [DemoProvider]`
- `[page.tsx] --(IMPORTS:95%)--> [useDemo]`
- `[page.tsx] --(IMPORTS:95%)--> [StudentView]`
- `[page.tsx] --(IMPORTS:95%)--> [KomtiView]`
- `[page.tsx] --(IMPORTS:95%)--> [LecturerView]`
- `[page.tsx] --(IMPORTS:95%)--> [DesignSystem]`

## 📐 Compact AST Signatures (Zero-Fluff Token Layout)
### `app/manifest.ts`
- [function] `manifest` :: (): MetadataRoute.Manifest (L3-L14)

### `components/DesignSystem.tsx`
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
- [function] `DesignSystem` :: () (L458-L554)
- [function] `LiveMono` :: () (L556-L559)

### `components/KomtiView.tsx`
- [function] `KomtiView` :: () (L7-L96)

### `components/LecturerView.tsx`
- [function] `LecturerView` :: () (L13-L57)

### `components/StudentView.tsx`
- [function] `ClassCard` :: ({ tone, icon: Icon, badge, title, time, room, children }: {
  tone: Tone; icon: React.ElementType; badge: string; title: string; time: string; room: string; children?: React.ReactNode;
}) (L17-L37)
- [function] `Card2` :: ({ status, sla, onStart }: { status: ClassStatus; sla: number; onStart: () => void }) (L39-L74)
- [function] `MicroPauseDrawer` :: ({ course, onClose }: { course: string; onClose: () => void }) (L84-L180)
- [function] `next` :: () (L92-L95)
- [function] `LeaveSheet` :: ({ onClose }: { onClose: () => void }) (L184-L206)
- [function] `StudentView` :: () (L210-L270)

### `components/demo-state.tsx`
- [function] `useDemo` :: () (L53-L57)
- [function] `DemoProvider` :: ({ children }: { children: React.ReactNode }) (L64-L158)
- [function] `triggerH2` :: () (L96-L102)
- [function] `timeoutSla` :: () (L104-L107)
- [function] `reset` :: () (L109-L118)
- [function] `lecturerAction` :: (a) (L120-L126)
- [function] `lockSlot` :: (s: Slot) (L128-L133)
- [function] `submitPermission` :: (type: Permission["type"], note: string) (L135-L138)
- [function] `approvePermission` :: (id: string) (L140-L143)
- [function] `addReceipt` :: (course: string, score: string) (L145-L150)
- [function] `fmt` :: (s: number) (L160-L160)

### `app/layout.tsx`
- [function] `RootLayout` :: ({ children }: { children: React.ReactNode }) (L17-L23)

### `app/page.tsx`
- [function] `Shell` :: () (L19-L78)
- [function] `badge` :: (id: Tab) (L27-L28)
- [function] `Page` :: () (L80-L82)
