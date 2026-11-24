# ClassPause

Zero-chat class coordination and Micro-Pause learning. STACK 2026, Case 1: Smarter Campus and Learning. Team “Bug itu fitur”.

Live: https://classpause.kousozo.tech (synthetic East Kalimantan campus dataset, demo mode on)

## How it works

1. **H-2h:** the server sends the lecturer a single-use 1-tap link (Telegram adapter; logged when no bot token is set).
2. **Lecturer taps once:** confirm, delay 20 min, reschedule, or convert to Micro-Pause.
3. **Reschedule:** the slot engine checks every enrolled student’s timetable, the lecturer’s classes and room capacity/bookings, then offers the best slot, an alternative and an async option. The komti locks one and it is broadcast.
4. **No reply by H+15m:** the server switches the class to Micro-Pause. Students do a 15-minute module and quiz; finishing it issues an attendance receipt.
5. Every screen updates live over Server-Sent Events.

## Stack

| Layer | Choice |
| --- | --- |
| App | Next.js 15 App Router, React 19, server actions |
| Data | PostgreSQL + Drizzle ORM (versioned migrations in `db/migrations`) |
| Validation | zod on every server action and env var; the same schema runs in the browser |
| Realtime | SSE (`/api/stream`) fed by an in-process event bus |
| Protocol clock | `instrumentation.ts` sweeper every 15 s; `/api/cron/tick` for an external cron |
| UI | Tailwind v4, motion, lucide-react; PWA with service worker + offline page |

### Caching and performance

- Slow-changing catalog (classes, rooms, modules, roster counts) uses `unstable_cache` with tag `catalog` (1 h).
- Per-request dedupe of the current user and lookups with React `cache()`.
- Live session state is never cached; changes reach clients by SSE push and a debounced `router.refresh()`.
- Indexes on session status/deadline, start time, enrollments, meetings, events.
- Pooled connections and parallel queries; optimistic version check when locking a slot; conditional updates so an SLA expiry and a last-second lecturer reply can’t both win.
- In-memory rate limits on magic links and leave requests. Immutable static assets are cached by the service worker.

## Run locally

```bash
npm install
npm run db:dev          # PGlite Postgres on :5433 (or point DATABASE_URL at any Postgres)
cp .env.example .env.local
npm run db:migrate && npm run db:seed
npm run dev
```

Environment variables: see `.env.example`. `DEMO_MODE=true` shows the demo clock bar (start a class now, skip to H+15m).

## Honest status

- Login is a persona picker over synthetic data; a real rollout replaces it with campus SSO.
- WhatsApp Business adapter is not built; Telegram is.
- The event bus is single-process; scaling out needs Postgres LISTEN/NOTIFY or Redis behind the same `publish()` API.

## AI disclosure

Built with help from Claude Code (Anthropic). All data in this repository is synthetic.
