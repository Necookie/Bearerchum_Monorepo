import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { loadProblem, ProblemFull, TestCase } from "../lib/content";
import { compare, Comparison, engine, EngineState } from "../lib/judge";
import CodeEditor from "../components/CodeEditor";
import ExplainedCode from "../components/ExplainedCode";
import { Html, LevelBadge, Loading, Spinner, TagChips, Terminal } from "../components/ui";

type Verdict = "wait" | "ok" | "bad" | "err" | "tle";
interface TestResult { test: TestCase; verdict: Verdict; ms: number; out: string; err: string | null; cmp: Comparison | null }

const STEPS = ["What it really asks", "Exact I/O (copy these strings)", "Spot the pattern", "Hidden test cases (from the constraints)",
  "Approach — before you code", "Hand trace", "Python solution", "Will Python be fast enough?", "Common mistakes & likely twists"];

export default function Problem() {
  const { id = "" } = useParams();
  const { content, progress, saveDraft, recordAttempt, toast } = useStore();
  const meta = content?.problems.find((p) => p.id === id);
  const [prob, setProb] = useState<ProblemFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"problem" | "breakdown" | "solution">("problem");
  const [reveal, setReveal] = useState(false);
  const [code, setCode] = useState("");
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [runKind, setRunKind] = useState<"run" | "submit" | "custom" | null>(null);
  const [custom, setCustom] = useState<string | null>(null);
  const [customOut, setCustomOut] = useState<{ out: string; err: string | null; ms: number; timedOut: boolean } | null>(null);
  const [eng, setEng] = useState<EngineState>(engine.state);
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => engine.onState(setEng), []);
  useEffect(() => { engine.warm().catch(() => undefined); }, []);

  useEffect(() => {
    if (!meta) return;
    setProb(null); setResults(null); setCustomOut(null); setTab("problem"); setReveal(false);
    loadProblem(meta.id, meta.hash).then((p) => {
      setProb(p);
      setCode(progress.drafts[meta.id] ?? p.starter);
    }).catch((e) => setError(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.id, meta?.hash]);

  const onChange = useCallback((v: string) => { setCode(v); if (meta) saveDraft(meta.id, v); }, [meta, saveDraft]);

  const runTests = useCallback(async (kind: "run" | "submit") => {
    if (!prob || runKind) return;
    const tests = prob.tests.filter((t) => kind === "submit" || t.kind === "sample");
    const src = codeRef.current;
    setRunKind(kind);
    setTab((t) => t);
    setResults(tests.map((t) => ({ test: t, verdict: "wait", ms: 0, out: "", err: null, cmp: null })));
    let passed = 0;
    try {
      for (let i = 0; i < tests.length; i++) {
        const t = tests[i];
        const limit = t.big ? 20000 : t.kind === "sample" ? 6000 : 8000;
        const r = await engine.run(src, t.input, limit);
        let verdict: Verdict, cmp: Comparison | null = null;
        if (r.timedOut) verdict = "tle";
        else {
          cmp = compare(t.expected, r.out);
          verdict = r.err && !cmp.ok ? "err" : cmp.ok ? "ok" : "bad";
        }
        if (verdict === "ok") passed++;
        setResults((rs) => rs && rs.map((x, j) => j === i ? { ...x, verdict, ms: r.ms, out: r.out, err: r.err, cmp } : x));
      }
      recordAttempt(prob.id, kind, passed, tests.length, src);
      if (kind === "submit" && passed === tests.length) toast(`Solved ${prob.id}! All ${tests.length} tests passed 🎉`);
    } catch (e: any) {
      toast(`Python engine failed: ${e?.message || e}`);
    } finally {
      setRunKind(null);
    }
  }, [prob, runKind, recordAttempt, toast]);

  const runCustom = async () => {
    if (custom === null || runKind) return;
    setRunKind("custom");
    try {
      const lines = custom.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
      setCustomOut(await engine.run(codeRef.current, custom ? lines : [], 10000));
    } finally { setRunKind(null); }
  };

  const onRun = useCallback(() => { runTests("run"); }, [runTests]);
  const onSubmit = useCallback(() => { runTests("submit"); }, [runTests]);

  const status = meta ? progress.problems[meta.id] : undefined;
  const samples = useMemo(() => prob?.tests.filter((t) => t.kind === "sample") || [], [prob]);

  if (!content) return <Loading />;
  if (!meta) return <div className="container empty"><h2>Problem not found</h2><Link to="/practice">Back to practice</Link></div>;
  if (error) return <div className="container empty">{error}</div>;
  const group = content.groups.find((g) => g.id === meta.group);
  const idx = content.problems.findIndex((p) => p.id === meta.id);
  const prev = content.problems[idx - 1], next = content.problems[idx + 1];

  return (
    <div className="container">
      <div className="problem-head">
        <div className="crumbs"><Link to="/practice">Practice</Link><span>/</span><Link to={`/practice?group=${meta.group}`}>{group?.name}</Link><span>/</span><span>{meta.id}</span></div>
        <h1 className="display-md">{meta.title}</h1>
        <div className="row" style={{ gap: 8 }}>
          <LevelBadge level={meta.level} />
          <TagChips tags={meta.tags} />
          <span className="caption">{meta.src}</span>
          <div className="spacer" />
          {status?.solved ? <span className="chip" style={{ background: "var(--success-soft)", color: "var(--success)" }}>✓ Solved</span>
            : status ? <span className="chip" style={{ background: "var(--honey-soft)" }}>Best {status.bestPassed}/{status.total}</span> : null}
        </div>
      </div>

      {!prob ? <Loading label="Loading problem…" /> : (
        <div className="workspace">
          {/* ------------------------------------------------ left: read */}
          <div className="ws-left">
            <div className="tabs">
              <button className={`tab ${tab === "problem" ? "on" : ""}`} onClick={() => setTab("problem")}>Problem</button>
              {prob.breakdown && <button className={`tab ${tab === "breakdown" ? "on" : ""}`} onClick={() => setTab("breakdown")}>Breakdown</button>}
              <button className={`tab ${tab === "solution" ? "on" : ""}`} onClick={() => setTab("solution")}>Solution</button>
            </div>

            {tab === "problem" && (
              <div className="ws-panel">
                <Html className="prose" html={prob.statement} />
                <h3 className="heading-sm" style={{ marginTop: 18 }}>Sample runs <span className="caption">— <span className="typed">highlighted</span> = what the user types</span></h3>
                <div className="samples">
                  {samples.map((s, i) => <Terminal key={i} title={s.name} html={s.display || ""} copy={s.input.join("\n")} />)}
                </div>
                <p className="caption" style={{ marginTop: 14 }}>
                  Judged on {prob.tests.length} tests: {samples.length} samples + {prob.tests.length - samples.length} hidden edge cases.
                </p>
              </div>
            )}

            {tab === "breakdown" && prob.breakdown && (
              <div className="ws-panel">
                {[
                  <Html html={prob.breakdown.asks} as="p" />,
                  <div>{prob.breakdown.io.map((r, i) => <div className="io-row" key={i}><span className={`io-tag ${r.kind}`}>{r.kind === "in" ? "INPUT" : "OUTPUT"}</span><span dangerouslySetInnerHTML={{ __html: r.html }} /></div>)}</div>,
                  <Html html={prob.breakdown.pattern} as="p" />,
                  <ul className="list-hidden">{prob.breakdown.hidden.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>,
                  <ol>{prob.breakdown.approach.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ol>,
                  <pre className="trace" dangerouslySetInnerHTML={{ __html: prob.breakdown.trace }} />,
                  <p>Try writing it yourself first — then open <button className="btn btn-ghost btn-sm" onClick={() => setTab("solution")}>Explained solution →</button></p>,
                  <Html html={prob.breakdown.speed} as="p" />,
                  <div>
                    <ul className="list-mist">{prob.breakdown.mistakes.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>
                    <ul className="list-vari" style={{ marginTop: 8 }}>{prob.breakdown.variations.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>
                  </div>,
                ].map((body, i) => (
                  <div className="step" key={i}><div className="step-n">{i + 1}</div><div><h3>{STEPS[i]}</h3>{body}</div></div>
                ))}
              </div>
            )}

            {tab === "solution" && (
              <div className="ws-panel">
                {!status?.solved && !reveal ? (
                  <div className="spoiler">
                    <div style={{ fontSize: 36 }}>🙈</div>
                    <h3 className="heading-md" style={{ margin: "6px 0" }}>Try it first?</h3>
                    <p className="mute" style={{ maxWidth: 420, margin: "0 auto 16px" }}>
                      Struggling for 10 minutes teaches more than reading for 10 seconds. Read the Breakdown, give it a shot, then come back.
                    </p>
                    <div className="row" style={{ justifyContent: "center" }}>
                      {prob.breakdown && <button className="btn btn-secondary" onClick={() => setTab("breakdown")}>Read the breakdown</button>}
                      <button className="btn btn-outline" onClick={() => setReveal(true)}>Show me the solution</button>
                    </div>
                  </div>
                ) : prob.solutions.map((s, i) => (
                  <div key={i} style={{ marginTop: i ? 28 : 0 }}>
                    <ExplainedCode sol={s} onLoad={(c) => { if (confirm("Replace the code in your editor with this solution?")) onChange(c); }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ------------------------------------------------ right: code */}
          <div className="ws-right">
            <div className="editor-card">
              <div className="editor-top">
                <span className="editor-file">script.py</span>
                <div className="spacer" />
                <span className="engine-note">
                  {eng === "loading" && <><Spinner /> loading Python…</>}
                  {eng === "ready" && <>● Python 3.12 ready</>}
                  {eng === "error" && <span style={{ color: "var(--error)" }}>Python failed to load — check your connection</span>}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Reset your code to the starter template?")) onChange(prob.starter); }}>Reset</button>
              </div>
              <CodeEditor value={code} onChange={onChange} onRun={onRun} onSubmit={onSubmit} height="400px" />
              <div className="editor-actions">
                <button className="btn btn-secondary btn-sm" disabled={!!runKind} onClick={onRun}>
                  {runKind === "run" ? <Spinner /> : "▶"} Run samples
                </button>
                <button className="btn btn-primary btn-sm" disabled={!!runKind} onClick={onSubmit}>
                  {runKind === "submit" ? <Spinner /> : null} Submit all {prob.tests.length} tests
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setCustom((c) => (c === null ? samples[0]?.input.join("\n") ?? "" : null))}>
                  {custom === null ? "Custom input" : "Hide custom input"}
                </button>
                <div className="spacer" />
                <span className="caption"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> run · <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> submit</span>
              </div>
            </div>

            {custom !== null && (
              <div className="card" style={{ marginTop: 14 }}>
                <div className="field">
                  <label>Custom input — one line per <code>input()</code> call</label>
                  <textarea className="input" rows={4} value={custom} onChange={(e) => setCustom(e.target.value)} />
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="btn btn-secondary btn-sm" disabled={!!runKind} onClick={runCustom}>{runKind === "custom" ? <Spinner /> : "▶"} Run</button>
                  {customOut && <span className="caption">{customOut.timedOut ? "timed out after 10 s" : `${Math.round(customOut.ms)} ms`}</span>}
                </div>
                {customOut && !customOut.timedOut && (
                  <>
                    <div className="terminal" style={{ marginTop: 10 }}><pre>{customOut.out || "(no output)"}</pre></div>
                    {customOut.err && <pre className="err-pre">{customOut.err}</pre>}
                  </>
                )}
              </div>
            )}

            {results && <Results results={results} running={runKind === "run" || runKind === "submit"} />}
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: 36 }}>
        {prev && <Link className="btn btn-ghost" to={`/practice/${prev.id}`}>← {prev.id} · {prev.title}</Link>}
        <div className="spacer" />
        {next && <Link className="btn btn-ghost" to={`/practice/${next.id}`}>{next.id} · {next.title} →</Link>}
      </div>
    </div>
  );
}

function Results({ results, running }: { results: TestResult[]; running: boolean }) {
  const passed = results.filter((r) => r.verdict === "ok").length;
  const finished = results.every((r) => r.verdict !== "wait");
  const firstBad = results.findIndex((r) => r.verdict !== "ok" && r.verdict !== "wait");
  return (
    <div className="results">
      <div className={`verdict ${!finished || running ? "run" : passed === results.length ? "pass" : "fail"}`}>
        {!finished ? <><Spinner /> Running {results.length} test{results.length > 1 ? "s" : ""}…</>
          : passed === results.length ? <>✓ All {results.length} tests passed</>
          : <>✗ {passed}/{results.length} passed — open the first failing test below</>}
        <div className="spacer" />
        <span style={{ fontWeight: 500 }}>{passed}/{results.length}</span>
      </div>
      {results.map((r, i) => (
        <details className="test-row" key={i} open={i === firstBad}>
          <summary>
            <span className={`t-ico ${r.verdict === "ok" ? "ok" : r.verdict === "wait" ? "wait" : r.verdict === "err" ? "err" : r.verdict === "tle" ? "tle" : "bad"}`}>
              {r.verdict === "ok" ? "✓" : r.verdict === "wait" ? "…" : r.verdict === "tle" ? "⏱" : r.verdict === "err" ? "!" : "✗"}
            </span>
            <span>{r.test.name}</span>
            {r.test.kind === "hidden" && <span className="chip chip-tag">hidden</span>}
            <span className="t-ms">{r.verdict === "wait" ? "" : r.verdict === "tle" ? "time limit" : `${Math.round(r.ms)} ms`}</span>
          </summary>
          {r.verdict !== "wait" && r.verdict !== "ok" && <TestDetail r={r} />}
          {r.verdict === "ok" && (
            <div className="test-body"><div className="terminal"><pre>{clip(r.out)}</pre></div></div>
          )}
        </details>
      ))}
    </div>
  );
}

function clip(s: string, max = 3000) { return s.length > max ? s.slice(0, max) + "\n… (truncated)" : s; }

function TestDetail({ r }: { r: TestResult }) {
  if (r.verdict === "tle") {
    return <div className="test-body"><div className="hint">Took longer than the time limit. Look for an infinite loop or an approach that is too slow for the input size (browser Python is ~2–3× slower than CodeChum's, so limits here are generous).</div></div>;
  }
  const cmp = r.cmp!;
  const preview = r.test.input.length > 14 ? [...r.test.input.slice(0, 12), `… ${r.test.input.length - 12} more lines`] : r.test.input;
  return (
    <div className="test-body">
      <div className="caption" style={{ marginBottom: 6 }}>Input lines: <code>{preview.join(" ⏎ ").slice(0, 400)}</code></div>
      {r.err && <pre className="err-pre">{r.err}</pre>}
      <div className="diff">
        <div>
          <h5>Expected</h5>
          <pre>{window2(cmp.exp, cmp.firstBad).map(([n, l]) => <span key={n} className={n === cmp.firstBad ? "bad-line" : "ok-line"}>{l || " "}</span>)}</pre>
        </div>
        <div>
          <h5>Your output</h5>
          <pre>{cmp.got.length === 0 ? <span className="ok-line">(nothing printed)</span> :
            window2(cmp.got, cmp.firstBad).map(([n, l]) => <span key={n} className={n === cmp.firstBad ? "bad-line" : "ok-line"}>{l || " "}</span>)}</pre>
        </div>
      </div>
      {cmp.hint && <div className="hint">💡 {cmp.hint}</div>}
    </div>
  );
}

/** Show at most ~40 lines around the first difference. */
function window2(lines: string[], focus: number): [number, string][] {
  const f = Math.max(0, focus);
  const a = Math.max(0, f - 15), b = Math.min(lines.length, f + 25);
  const out: [number, string][] = [];
  if (a > 0) out.push([-1, `… ${a} line(s) above`]);
  for (let i = a; i < b; i++) out.push([i, lines[i]]);
  if (b < lines.length) out.push([-2, `… ${lines.length - b} more line(s)`]);
  return out;
}
