# ClassPause — MVP Prototype v0.1

Team **bug itu fitur** · STACK 2026 (GDGoC ITB) · Case 1: Smarter Campus and Learning

ClassPause replaces manual WhatsApp coordination with a zero-chat SLA protocol: lecturers answer a 1-tap card, students see a traffic-light commute radar, Komti locks one of three conflict-free makeup slots, and unconfirmed classes fall back to a 15-minute Micro-Pause module that issues an attendance receipt.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

## What works in this prototype

| Area | Status |
|---|---|
| Student Radar (3 class states, live SLA countdown, Micro-Pause 3-step drawer + quiz, receipt, leave request) | Working UI, **simulated data** |
| Komti view (KPIs, 3-option slot picker, Lock & Broadcast, permission queue) | Working UI, **slots are hard-coded** |
| Lecturer 1-tap card (4 actions updating all views) | Working UI, **WhatsApp/Telegram delivery is simulated** |
| Design System & Psychology tab | Working |
| PWA (manifest, installable, basic offline cache via `public/sw.js`, production build only) | Basic |

All state lives in the browser (`components/demo-state.tsx`). There is **no backend yet**: no Node.js API, PostgreSQL, Redis, WebSocket, messaging webhook, or SIAKAD sync. Those are planned, not built.

## Planned / reserved for Final Day build session

1. Real slot engine: compute conflict-free slots from KRS schedules and room data (currently hard-coded).
2. Messaging webhook: send the lecturer card through WhatsApp Business / Telegram Bot API with a queue fallback.
3. Server-side SLA timer and attendance receipts persisted in PostgreSQL.

## Material AI assistance disclosure

- **Claude Code (Anthropic, Claude Opus 5.5):** generated the Next.js/Tailwind code for the design system page and the 3-role prototype, from prompts written by the team.
- Earlier planning, survey analysis, and abstract drafting used AI chat assistants (see `docs/PROJECT_CONTEXT.md`).

The team reviewed, tested, and is responsible for all submitted work.
