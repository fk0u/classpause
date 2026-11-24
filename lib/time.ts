/** Campus time is WITA (UTC+8, no DST). All DB timestamps are UTC. */
export const TZ_OFFSET_MIN = 8 * 60;
export const TZ = "Asia/Makassar";

/** Local calendar parts for an instant. day: 1 = Monday … 7 = Sunday. */
export function localParts(d: Date) {
  const l = new Date(d.getTime() + TZ_OFFSET_MIN * 60_000);
  const dow = l.getUTCDay();
  return {
    y: l.getUTCFullYear(), m: l.getUTCMonth(), d: l.getUTCDate(),
    day: dow === 0 ? 7 : dow,
    minutes: l.getUTCHours() * 60 + l.getUTCMinutes(),
  };
}

/** UTC instant for a local date (y,m,d) at `min` minutes past local midnight. */
export function atLocal(y: number, m: number, d: number, min: number) {
  return new Date(Date.UTC(y, m, d, 0, min) - TZ_OFFSET_MIN * 60_000);
}

export function startOfLocalDay(d: Date) {
  const p = localParts(d);
  return atLocal(p.y, p.m, p.d, 0);
}

const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });

export const fmtTime = (d: Date | string) => timeFmt.format(new Date(d));
export const fmtDay = (d: Date | string) => dayFmt.format(new Date(d));
export const fmtRange = (a: Date | string, b: Date | string) => `${fmtTime(a)}–${fmtTime(b)}`;
export const minToHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
