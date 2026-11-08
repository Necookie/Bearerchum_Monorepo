// Mastery, review queue and recommendations — all computed from progress + content.
import { Card, ContentIndex, ProblemMeta } from "./content";
import { CardState } from "./srs";
import { Progress, Settings } from "./store";
import { dayKey } from "./time";

/** Rough order a beginner should meet the problems in (easy wins first, then patterns, then hard). */
export const CURRICULUM = [
  "P01", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "S02", "S01", "D01", "D02", "P02", "D03", "D09",
  "L01", "L02", "L05", "L06", "S04", "S05", "D07", "D12", "D13", "P03", "D04", "L03", "L04", "L07", "S03",
  "S07", "D05", "D06", "D08", "D10", "D14", "L08", "D11", "S06", "S08",
];

const DECK_ORDER = ["io", "traps", "python", "ds", "techniques", "problems"];

// ------------------------------------------------------------------ mastery
export function cardScore(s?: Pick<CardState, "reps" | "lapses" | "ivl" | "step">): number | null {
  if (!s) return null;
  if (s.step >= 0 && s.reps === 0) return 0.25;
  const base = 0.45 + 0.55 * Math.min(1, s.ivl / 3);
  return Math.max(0.1, Math.min(1, base - 0.08 * Math.min(s.lapses, 4)));
}

export function problemScore(p?: { solved: boolean; bestPassed?: number; best?: number; total: number }): number | null {
  if (!p) return null;
  if (p.solved) return 1;
  const best = p.bestPassed ?? p.best ?? 0;
  return p.total ? 0.15 + 0.5 * (best / p.total) : 0.15;
}

export interface TagMastery { tag: string; score: number | null; coverage: number; items: number }

export function masteryByTag(
  content: ContentIndex,
  cards: Record<string, Pick<CardState, "reps" | "lapses" | "ivl" | "step">>,
  problems: Record<string, { solved: boolean; bestPassed?: number; best?: number; total: number }>,
): Record<string, TagMastery> {
  const acc: Record<string, { sum: number; w: number; touched: number; items: number }> = {};
  const add = (tag: string, score: number | null, weight: number) => {
    const a = (acc[tag] ||= { sum: 0, w: 0, touched: 0, items: 0 });
    a.items += 1;
    if (score !== null) { a.sum += score * weight; a.w += weight; a.touched += 1; }
  };
  for (const c of content.cards) for (const t of c.tags) add(t, cardScore(cards[c.id]), 1);
  for (const p of content.problems) for (const t of p.tags) add(t, problemScore(problems[p.id]), 3);
  const out: Record<string, TagMastery> = {};
  for (const [tag, a] of Object.entries(acc)) {
    out[tag] = { tag, score: a.w ? a.sum / a.w : null, coverage: a.items ? a.touched / a.items : 0, items: a.items };
  }
  return out;
}

/** Overall readiness: average technique mastery, untouched techniques count as 0. */
export function readiness(m: Record<string, TagMastery>, content: ContentIndex): number {
  const ts = content.techniques.map((t) => (m[t.id]?.score ?? 0) * Math.min(1, 0.4 + (m[t.id]?.coverage ?? 0)));
  return Math.round((100 * ts.reduce((a, b) => a + b, 0)) / Math.max(1, ts.length));
}

// ------------------------------------------------------------------ review queue
export interface QueueInfo { due: Card[]; fresh: Card[]; learningSoon: number; newLeftToday: number; nextDue: number | null }

export function buildQueue(content: ContentIndex, progress: Progress, settings: Settings, filter?: { deck?: string; tag?: string }): QueueInfo {
  const now = Date.now();
  const match = (c: Card) => (!filter?.deck || c.deck === filter.deck) && (!filter?.tag || c.tags.includes(filter.tag));
  const pool = content.cards.filter(match);
  const due = pool.filter((c) => progress.cards[c.id] && progress.cards[c.id].due <= now)
    .sort((a, b) => progress.cards[a.id].due - progress.cards[b.id].due);
  const newToday = progress.days[dayKey()]?.new ?? 0;
  const newLeftToday = Math.max(0, settings.newPerDay - newToday);
  const unseen = pool.filter((c) => !progress.cards[c.id])
    .sort((a, b) => DECK_ORDER.indexOf(a.deck) - DECK_ORDER.indexOf(b.deck));
  const fresh = filter?.tag || filter?.deck ? unseen : unseen.slice(0, newLeftToday);
  const future = pool.map((c) => progress.cards[c.id]?.due).filter((d): d is number => !!d && d > now);
  const learningSoon = pool.filter((c) => {
    const s = progress.cards[c.id];
    return s && s.step >= 0 && s.due > now && s.due - now < 30 * 60_000;
  }).length;
  return { due, fresh, learningSoon, newLeftToday, nextDue: future.length ? Math.min(...future) : null };
}

// ------------------------------------------------------------------ recommendations
export interface Recommendation {
  kind: "review" | "learn" | "problem" | "technique" | "rest";
  title: string; detail: string; to: string; icon: string;
}

export function recommend(content: ContentIndex, progress: Progress, settings: Settings): Recommendation[] {
  const recs: Recommendation[] = [];
  const q = buildQueue(content, progress, settings);
  const m = masteryByTag(content, progress.cards, progress.problems);

  if (q.due.length) {
    recs.push({ kind: "review", icon: "🔁", to: "/review", title: `Review ${q.due.length} due card${q.due.length > 1 ? "s" : ""}`,
      detail: `About ${Math.max(1, Math.round(q.due.length * 0.25))} min. Due cards first — that's where forgetting happens.` });
  }
  if (q.fresh.length) {
    recs.push({ kind: "learn", icon: "✨", to: "/review", title: `Learn ${q.fresh.length} new card${q.fresh.length > 1 ? "s" : ""}`,
      detail: `Today's new-card budget. Next up: ${deckLabel(q.fresh[0].deck)}.` });
  }

  const byId = new Map(content.problems.map((p) => [p.id, p]));
  const unsolved = CURRICULUM.map((id) => byId.get(id)).filter((p): p is ProblemMeta => !!p && !progress.problems[p.id]?.solved);
  const window = unsolved.slice(0, 6);
  const avgTag = (p: ProblemMeta) => {
    const s = p.tags.map((t) => m[t]?.score ?? 0.2);
    return s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0.5;
  };
  const started = window.find((p) => progress.problems[p.id] && !progress.problems[p.id].solved);
  const pick = started || [...window].sort((a, b) => avgTag(a) - avgTag(b))[0];
  if (pick) {
    const st = progress.problems[pick.id];
    recs.push({ kind: "problem", icon: "🧩", to: `/practice/${pick.id}`,
      title: `${st ? "Finish" : "Solve"} ${pick.id} · ${pick.title}`,
      detail: st ? `You passed ${st.bestPassed}/${st.total} tests — the hidden cases are waiting.`
                 : `${pick.level}. Trains ${pick.tags.map((t) => techName(content, t)).join(", ") || "the basics"}.` });
  }

  const weakest = content.techniques
    .map((t) => ({ t, s: m[t.id]?.score, c: m[t.id]?.coverage ?? 0 }))
    .filter((x) => x.s !== undefined && x.s !== null && x.c > 0)
    .sort((a, b) => (a.s as number) - (b.s as number))[0];
  const untouched = content.techniques.find((t) => !m[t.id] || m[t.id].coverage === 0);
  const tech = weakest && (weakest.s as number) < 0.6 ? weakest.t : untouched;
  if (tech) {
    recs.push({ kind: "technique", icon: "🧠", to: `/learn/techniques#${tech.id}`,
      title: `${weakest && tech === weakest.t ? "Shore up" : "Meet"} ${tech.id}: ${tech.name}`,
      detail: weakest && tech === weakest.t ? "Your weakest technique right now. Re-read the template, then drill its cards." : "You haven't touched this technique yet." });
  }
  if (!recs.length) recs.push({ kind: "rest", icon: "☕", to: "/practice", title: "All caught up", detail: "Nothing due. Try a drill under a 15-minute timer." });
  return recs;
}

export function techName(content: ContentIndex, tag: string): string {
  const t = content.techniques.find((x) => x.id === tag);
  return t ? t.name : content.topics[tag] || tag;
}

export function deckLabel(deck: string): string {
  return ({ io: "Input / output", python: "Python built-ins", traps: "Python traps", ds: "Data structures",
    techniques: "Spot the technique", problems: "Problem insights" } as Record<string, string>)[deck] || deck;
}
