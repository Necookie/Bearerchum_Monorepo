// Content bundle produced by tools/build_content.py (served from /content).

export type Level = string; // "Easy" | "Easy–Medium" | "Medium" | "Medium–Hard" | "Hard"

export interface Group { id: string; name: string; blurb: string }
export interface Technique { id: string; name: string; spot: string; template: string; problems: string[] }
export interface ProblemMeta {
  id: string; title: string; group: string; level: Level; src: string; tags: string[]; summary: string;
  tests: number; hash: string;
}
export interface Card {
  id: string; deck: string; type: "basic" | "mcq" | "code" | "output"; tags: string[];
  front: string; back?: string; backRaw?: string; code?: string; choices?: string[]; answer?: number;
  explain: string; refs: string[];
}
export interface ContentIndex {
  version: string; contestDate: string; groups: Group[]; topics: Record<string, string>;
  techniques: Technique[]; problems: ProblemMeta[]; cards: Card[];
  guide: { rules: string; python: string; ds: string };
}
export interface TestCase {
  kind: "sample" | "hidden"; name: string; input: string[]; expected: string; display?: string; big?: boolean;
}
export interface ExplainBlock { lines: [number, number]; title: string; text: string }
export interface SolutionEntry {
  file: string | null; title: string; code: string; lines: string[];
  explain: { summary: string; complexity: string; pitfalls: string[]; blocks: ExplainBlock[] } | null;
}
export interface Breakdown {
  asks: string; io: { kind: "in" | "out"; html: string }[]; pattern: string; hidden: string[];
  approach: string[]; trace: string; speed: string; mistakes: string[]; variations: string[];
}
export interface ProblemFull extends Omit<ProblemMeta, "tests" | "hash"> {
  statement: string; breakdown: Breakdown | null; solutions: SolutionEntry[]; tests: TestCase[];
  slowest: number; starter: string;
}

let indexPromise: Promise<ContentIndex> | null = null;
const problemCache = new Map<string, Promise<ProblemFull>>();

export function loadIndex(): Promise<ContentIndex> {
  if (!indexPromise) {
    indexPromise = fetch(`/content/index.json?t=${Math.floor(Date.now() / 60000)}`).then((r) => {
      if (!r.ok) throw new Error("Could not load content");
      return r.json();
    });
  }
  return indexPromise;
}

export function loadProblem(id: string, hash = ""): Promise<ProblemFull> {
  const key = `${id}:${hash}`;
  if (!problemCache.has(key)) {
    problemCache.set(key, fetch(`/content/p/${id}.json?h=${hash}`).then((r) => {
      if (!r.ok) throw new Error(`Problem ${id} not found`);
      return r.json();
    }));
  }
  return problemCache.get(key)!;
}

export function levelClass(level: string): string {
  const l = level.toLowerCase();
  if (l.startsWith("hard") || l.includes("–hard")) return "level-hard";
  if (l.startsWith("medium") || l.includes("medium")) return "level-medium";
  return "level-easy";
}

export const DECK_NAMES: Record<string, string> = {
  io: "Input / output", python: "Python built-ins", traps: "Python traps", ds: "Data structures",
  techniques: "Spot the technique", problems: "Problem insights",
};
