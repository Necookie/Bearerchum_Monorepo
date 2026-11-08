// Contest-aware spaced repetition (SM-2 family, compressed for a short runway).
//
// - New cards go through learning steps (1 min, 10 min) before "graduating" to day intervals.
// - Before the contest, no interval may exceed half of the time left, so every card you know
//   still comes back at least once or twice before Saturday. After the contest the cap lifts.

export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface CardState {
  reps: number;      // successful reviews
  lapses: number;    // times forgotten after graduating
  ease: number;      // growth factor
  ivl: number;       // current interval in days (0 while learning)
  step: number;      // learning step index, -1 once graduated
  due: number;       // epoch ms
  last: number;      // epoch ms of last review
}

const MIN = 60_000;
const DAY = 86_400_000;
const LEARN_STEPS = [1 * MIN, 10 * MIN];
const RELEARN_STEP = 10 * MIN;

export function capDays(now: number, contest: number): number {
  const left = (contest - now) / DAY;
  if (left <= 0) return 60;
  return Math.max(0.5, left / 2);
}

export function schedule(prev: CardState | undefined, grade: Grade, now: number, contest: number): CardState {
  const s: CardState = prev ? { ...prev } : { reps: 0, lapses: 0, ease: 2.5, ivl: 0, step: 0, due: now, last: now };
  const cap = capDays(now, contest);
  s.last = now;

  if (s.step >= 0) {
    // learning / relearning
    if (grade === 1) { s.step = 0; s.due = now + LEARN_STEPS[0]; return s; }
    if (grade === 2) { s.due = now + Math.max(LEARN_STEPS[s.step] * 1.5, 5 * MIN); return s; }
    if (grade === 4) { return graduate(s, Math.min(prev && prev.ivl > 0 ? prev.ivl * 1.5 : 3, cap), now, true); }
    s.step += 1;
    if (s.step >= LEARN_STEPS.length) return graduate(s, Math.min(s.ivl > 0 ? s.ivl : 1, cap), now, false);
    s.due = now + LEARN_STEPS[s.step];
    return s;
  }

  // graduated review
  if (grade === 1) {
    s.lapses += 1;
    s.ease = Math.max(1.3, s.ease - 0.2);
    s.ivl = Math.max(0.5, s.ivl * 0.4);
    s.step = LEARN_STEPS.length - 1; // one relearning step, then back to reviews
    s.due = now + RELEARN_STEP;
    return s;
  }
  let ivl: number;
  if (grade === 2) { ivl = s.ivl * 1.2; s.ease = Math.max(1.3, s.ease - 0.15); }
  else if (grade === 3) { ivl = s.ivl * s.ease; }
  else { ivl = s.ivl * s.ease * 1.3; s.ease += 0.15; }
  ivl = Math.min(Math.max(ivl, s.ivl + (grade === 2 ? 0.25 : 0.5)), cap);
  s.reps += 1;
  s.ivl = ivl;
  s.due = now + fuzz(ivl) * DAY;
  return s;
}

function graduate(s: CardState, ivl: number, now: number, easy: boolean): CardState {
  s.step = -1;
  s.ivl = ivl;
  s.reps += 1;
  if (easy) s.ease += 0.15;
  s.due = now + fuzz(ivl) * DAY;
  return s;
}

function fuzz(days: number): number {
  if (days < 1) return days;
  return days * (0.95 + Math.random() * 0.1);
}

export function previewLabel(prev: CardState | undefined, grade: Grade, now: number, contest: number): string {
  const next = schedule(prev, grade, now, contest);
  return humanDelay(next.due - now);
}

export function humanDelay(ms: number): string {
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))}m`;
  if (ms < DAY) return `${Math.round(ms / (60 * MIN))}h`;
  const d = ms / DAY;
  return d < 10 ? `${Math.round(d * 10) / 10}d`.replace(".0d", "d") : `${Math.round(d)}d`;
}

export function isLearned(s?: CardState): boolean {
  return !!s && s.step === -1;
}
