// Main-thread side of the Python judge. One worker, one run at a time, hard time limits.

export type EngineState = "idle" | "loading" | "ready" | "error";
export interface RunResult { out: string; err: string | null; stderr: string; ms: number; timedOut: boolean }

type Listener = (s: EngineState) => void;

class PyEngine {
  private worker: Worker | null = null;
  private readyPromise: Promise<void> | null = null;
  private seq = 0;
  private chain: Promise<unknown> = Promise.resolve();
  state: EngineState = "idle";
  private listeners = new Set<Listener>();

  onState(fn: Listener) { this.listeners.add(fn); fn(this.state); return () => { this.listeners.delete(fn); }; }
  private set(s: EngineState) { this.state = s; this.listeners.forEach((l) => l(s)); }

  warm(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    this.set("loading");
    const w = new Worker("/py-worker.js");
    this.worker = w;
    this.readyPromise = new Promise<void>((resolve, reject) => {
      const onMsg = (e: MessageEvent) => {
        if (e.data.type === "ready") { w.removeEventListener("message", onMsg); this.set("ready"); resolve(); }
        if (e.data.type === "fatal") { this.set("error"); reject(new Error(e.data.error)); }
      };
      w.addEventListener("message", onMsg);
      w.onerror = (ev) => { this.set("error"); reject(new Error(ev.message || "Python failed to load")); };
      w.postMessage({ type: "init" });
    });
    this.readyPromise.catch(() => { this.readyPromise = null; this.worker?.terminate(); this.worker = null; });
    return this.readyPromise;
  }

  private reset() {
    this.worker?.terminate();
    this.worker = null;
    this.readyPromise = null;
    this.set("idle");
  }

  run(code: string, input: string[], timeoutMs: number): Promise<RunResult> {
    const job = this.chain.then(() => this.runNow(code, input, timeoutMs));
    this.chain = job.catch(() => undefined);
    return job;
  }

  private async runNow(code: string, input: string[], timeoutMs: number): Promise<RunResult> {
    await this.warm();
    const w = this.worker!;
    const id = ++this.seq;
    return new Promise<RunResult>((resolve) => {
      const timer = window.setTimeout(() => {
        w.removeEventListener("message", onMsg);
        this.reset();                      // kill the infinite loop; next run reloads Python (cached)
        resolve({ out: "", err: null, stderr: "", ms: timeoutMs, timedOut: true });
      }, timeoutMs);
      const onMsg = (e: MessageEvent) => {
        if (e.data.type !== "result" || e.data.id !== id) return;
        window.clearTimeout(timer);
        w.removeEventListener("message", onMsg);
        resolve({ out: e.data.out, err: e.data.err, stderr: e.data.stderr, ms: e.data.ms, timedOut: false });
      };
      w.addEventListener("message", onMsg);
      w.postMessage({ type: "run", id, code, input });
    });
  }
}

export const engine = new PyEngine();

// ------------------------------------------------------------------ comparing transcripts
export function normalize(s: string): string[] {
  const lines = s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, ""));
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export interface Comparison { ok: boolean; firstBad: number; hint: string | null; exp: string[]; got: string[] }

export function compare(expected: string, actual: string): Comparison {
  const exp = normalize(expected), got = normalize(actual);
  let firstBad = -1;
  for (let i = 0; i < Math.max(exp.length, got.length); i++) {
    if (exp[i] !== got[i]) { firstBad = i; break; }
  }
  const ok = firstBad === -1;
  return { ok, firstBad, exp, got, hint: ok ? null : hintFor(exp, got, firstBad) };
}

function hintFor(exp: string[], got: string[], i: number): string {
  const e = exp[i], g = got[i];
  if (g === undefined) return `Your output stops early — expected line ${i + 1}: “${e}”. Did you forget a print, or exit early?`;
  if (e === undefined) return `You printed extra line(s) starting at line ${i + 1}: “${g}”. Remove debug prints.`;
  if (e.toLowerCase() === g.toLowerCase()) return "Only capitalisation differs — copy the label exactly.";
  if (e.replace(/\s+/g, "") === g.replace(/\s+/g, "")) return "Only spacing differs — check the space after “:” and between numbers.";
  const ec = e.indexOf(":"), gc = g.indexOf(":");
  if (ec > 0 && gc > 0 && e.slice(0, ec) !== g.slice(0, gc)) return `The label differs: expected “${e.slice(0, ec + 1)}”, you printed “${g.slice(0, gc + 1)}”.`;
  if (ec > 0 && gc > 0 && e.slice(0, ec) === g.slice(0, gc)) {
    const ev = e.slice(ec + 1).trim(), gv = g.slice(gc + 1).trim();
    if (/^-?\d+(\.\d+)?$/.test(ev) && /^-?\d+(\.\d+)?$/.test(gv)) {
      if (Number(ev) === Number(gv)) return "Same number, different format — check decimals (e.g. f\"{x:.2f}\") or int vs float.";
      return `Label is right but the value is wrong: expected ${ev}, got ${gv}. Re-check the logic for this case.`;
    }
    return "Label is right but the value differs — trace this test by hand.";
  }
  if (g.startsWith("[") && e.replace(/[[\],']/g, "") === g.replace(/[[\],']/g, "")) return "You printed a Python list — use print(*lst) or ' '.join(...).";
  return `First difference is on line ${i + 1}.`;
}
