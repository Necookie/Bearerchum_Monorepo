// All "day" logic uses Philippine time (UTC+8) so streaks match the team's actual days.
const OFFSET = 8 * 3600_000;

export function dayKey(ts = Date.now()): string {
  return new Date(ts + OFFSET).toISOString().slice(0, 10);
}

export function contestTime(date: string): number {
  // 08:00 Manila on contest day
  return Date.parse(`${date}T08:00:00+08:00`);
}

export function countdown(target: number, now = Date.now()) {
  const ms = Math.max(0, target - now);
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return { ms, d, h, m, done: target <= now };
}

export function streakFrom(days: Record<string, { reviews: number; attempts: number }>): number {
  let t = Date.now();
  if (!active(days[dayKey(t)])) t -= 86400000;
  let n = 0;
  while (active(days[dayKey(t)])) { n++; t -= 86400000; }
  return n;
}

function active(d?: { reviews: number; attempts: number }) {
  return !!d && (d.reviews > 0 || d.attempts > 0);
}

export function ago(tsSec: number): string {
  const s = Math.max(0, Date.now() / 1000 - tsSec);
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} d ago`;
}
