import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Code2, CloudUpload, EyeOff, FileText, History, Lightbulb, ListChecks, ListOrdered,
  Pause, Play, Plus, RotateCcw, SquareTerminal, Timer as TimerIcon, X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { loadProblem, ProblemFull, TestCase } from "../lib/content";
import { compare, Comparison, engine, EngineState } from "../lib/judge";
import { usePersisted } from "../lib/theme";
import CodeEditor from "../components/CodeEditor";
import ExplainedCode from "../components/ExplainedCode";
import { Gutter } from "../components/SplitPane";
import { AccountButton, ThemeButton } from "../components/Layout";
import { Difficulty, Html, Loading, Logo, Spinner, TagList } from "../components/ui";

type Verdict = "ok" | "bad" | "err" | "tle" | "done";
interface CaseResult { verdict: Verdict; ms: number; out: string; err: string | null; cmp: Comparison | null; expected?: string }
interface Case { input: string; expected?: string; sample: boolean }
interface RunState {
  kind: "run" | "submit"; running: boolean; done: number; total: number;
  results: CaseResult[]; tests?: TestCase[]; firstFail?: number;
}
interface Submission { ts: number; verdict: string; passed: number; total: number; ms: number }

const LABEL: Record<Verdict, string> = { ok: "Accepted", bad: "Wrong Answer", err: "Runtime Error", tle: "Time Limit Exceeded", done: "Finished" };
const STEPS = ["What it really asks", "Exact input and output", "Spot the pattern", "Hidden test cases", "Approach before you code",
  "Hand trace", "Python solution", "Is Python fast enough?", "Common mistakes and likely twists"];

function overall(rs: CaseResult[]): Verdict {
  if (rs.some((r) => r.verdict === "err")) return "err";
  if (rs.some((r) => r.verdict === "tle")) return "tle";
  if (rs.some((r) => r.verdict === "bad")) return "bad";
  if (rs.every((r) => r.verdict === "done")) return "done";
  return "ok";
}

function loadSubs(id: string): Submission[] {
  try { return JSON.parse(localStorage.getItem(`bearerchum.subs.${id}`) || "[]"); } catch { return []; }
}

export default function Problem() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { content, progress, saveDraft, recordAttempt, toast } = useStore();
  const meta = content?.problems.find((p) => p.id === id);

  const [prob, setProb] = useState<ProblemFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState<"desc" | "breakdown" | "solution" | "subs">("desc");
  const [reveal, setReveal] = useState(false);
  const [code, setCode] = useState("");
  const [cases, setCases] = useState<Case[]>([]);
  const [caseIdx, setCaseIdx] = useState(0);
  const [consoleTab, setConsoleTab] = useState<"cases" | "result">("cases");
  const [run, setRun] = useState<RunState | null>(null);
  const [resIdx, setResIdx] = useState(0);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [eng, setEng] = useState<EngineState>(engine.state);
  const [xPct, setXPct] = usePersisted("bearerchum.split.x", 44);
  const [yPct, setYPct] = usePersisted("bearerchum.split.y", 60);
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => engine.onState(setEng), []);
  useEffect(() => { engine.warm().catch(() => undefined); }, []);

  useEffect(() => {
    if (!meta) return;
    setProb(null); setRun(null); setLeft("desc"); setReveal(false); setConsoleTab("cases"); setCaseIdx(0);
    setSubs(loadSubs(meta.id));
    loadProblem(meta.id, meta.hash).then((p) => {
      setProb(p);
      setCode(progress.drafts[meta.id] ?? p.starter);
      setCases(p.tests.filter((t) => t.kind === "sample").map((t) => ({ input: t.input.join("\n"), expected: t.expected, sample: true })));
    }).catch((e) => setError(String(e.message || e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.id, meta?.hash]);

  const onChange = useCallback((v: string) => { setCode(v); if (meta) saveDraft(meta.id, v); }, [meta, saveDraft]);

  const execCase = async (src: string, lines: string[], expected: string | undefined, limit: number): Promise<CaseResult> => {
    const r = await engine.run(src, lines, limit);
    if (r.timedOut) return { verdict: "tle", ms: r.ms, out: "", err: null, cmp: null, expected };
    if (expected === undefined) return { verdict: r.err ? "err" : "done", ms: r.ms, out: r.out, err: r.err, cmp: null };
    const cmp = compare(expected, r.out);
    return { verdict: r.err && !cmp.ok ? "err" : cmp.ok ? "ok" : "bad", ms: r.ms, out: r.out, err: r.err, cmp, expected };
  };

  const doRun = useCallback(async () => {
    if (!prob || run?.running || !cases.length) return;
    const src = codeRef.current;
    setConsoleTab("result"); setResIdx(0);
    setRun({ kind: "run", running: true, done: 0, total: cases.length, results: [] });
    const results: CaseResult[] = [];
    try {
      for (const c of cases) {
        const lines = c.input === "" ? [] : c.input.replace(/\r\n/g, "\n").split("\n");
        results.push(await execCase(src, lines, c.expected, 8000));
        setRun((r) => r && { ...r, done: results.length, results: [...results] });
      }
      recordAttempt(prob.id, "run", results.filter((r) => r.verdict === "ok").length, results.length, src);
    } catch (e: any) { toast(`Python failed to start: ${e?.message || e}`); }
    setRun((r) => r && { ...r, running: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prob, run?.running, cases, recordAttempt, toast]);

  const doSubmit = useCallback(async () => {
    if (!prob || run?.running) return;
    const src = codeRef.current, tests = prob.tests;
    setConsoleTab("result");
    setRun({ kind: "submit", running: true, done: 0, total: tests.length, results: [], tests });
    const results: CaseResult[] = [];
    const t0 = performance.now();
    try {
      for (const t of tests) {
        results.push(await execCase(src, t.input, t.expected, t.big ? 20000 : 8000));
        setRun((r) => r && { ...r, done: results.length, results: [...results] });
      }
      const passed = results.filter((r) => r.verdict === "ok").length;
      const firstFail = results.findIndex((r) => r.verdict !== "ok");
      setRun((r) => r && { ...r, running: false, firstFail });
      recordAttempt(prob.id, "submit", passed, tests.length, src);
      const v = overall(results);
      const sub: Submission = { ts: Date.now(), verdict: LABEL[v], passed, total: tests.length, ms: Math.round(performance.now() - t0) };
      const next = [sub, ...loadSubs(prob.id)].slice(0, 30);
      setSubs(next);
      try { localStorage.setItem(`bearerchum.subs.${prob.id}`, JSON.stringify(next)); } catch { /* ignore */ }
      if (passed === tests.length) toast(`Accepted. ${prob.id} solved.`);
    } catch (e: any) {
      toast(`Python failed to start: ${e?.message || e}`);
      setRun((r) => r && { ...r, running: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prob, run?.running, recordAttempt, toast]);

  // global shortcuts (the editor has its own keymap with the same keys)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "'") { e.preventDefault(); doRun(); }
      if (e.key === "Enter") { e.preventDefault(); doSubmit(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doRun, doSubmit]);

  const status = meta ? progress.problems[meta.id] : undefined;
  const idx = content ? content.problems.findIndex((p) => p.id === id) : -1;
  const prev = content?.problems[idx - 1], next = content?.problems[idx + 1];

  if (!content) return <Loading />;
  if (!meta) return <div className="empty"><h2>Problem not found</h2><Link to="/practice">Back to the problem list</Link></div>;
  if (error) return <div className="empty"><h2>Could not load this problem</h2><p>{error}</p></div>;

  return (
    <div className="ws">
      {/* ------------------------------------------------ top bar */}
      <header className="ws-top">
        <div className="ws-top-left">
          <Link to="/" className="brand" style={{ marginRight: 4 }} aria-label="Home"><Logo /></Link>
          <Link to="/practice" className="ws-crumb"><ListOrdered /> <span className="hide-md">Problem list</span></Link>
          <button className="btn icon-btn" disabled={!prev} onClick={() => prev && nav(`/practice/${prev.id}`)} title={prev ? `Previous: ${prev.title}` : ""}><ChevronLeft /></button>
          <button className="btn icon-btn" disabled={!next} onClick={() => next && nav(`/practice/${next.id}`)} title={next ? `Next: ${next.title}` : ""}><ChevronRight /></button>
        </div>
        <div className="ws-top-center">
          <button className="btn" onClick={doRun} disabled={!prob || !!run?.running} title="Run the test cases (Ctrl + ')">
            {run?.running && run.kind === "run" ? <Spinner /> : <Play />} Run
          </button>
          <button className="btn btn-submit" onClick={doSubmit} disabled={!prob || !!run?.running} title="Judge against every test (Ctrl + Enter)">
            {run?.running && run.kind === "submit" ? <Spinner /> : <CloudUpload />} Submit
          </button>
        </div>
        <div className="ws-top-right">
          <Stopwatch key={meta.id} />
          <ThemeButton />
          <AccountButton />
        </div>
      </header>

      {!prob ? <Loading label="Loading problem" /> : (
        <div className="ws-main">
          {/* ------------------------------------------------ left: read */}
          <section className="pane ws-left-pane" style={{ width: `${xPct}%` }}>
            <div className="pane-head">
              <button className={`tab ${left === "desc" ? "on" : ""}`} onClick={() => setLeft("desc")}><FileText /> Description</button>
              {prob.breakdown && <button className={`tab ${left === "breakdown" ? "on" : ""}`} onClick={() => setLeft("breakdown")}><ListChecks /> Breakdown</button>}
              <button className={`tab ${left === "solution" ? "on" : ""}`} onClick={() => setLeft("solution")}><Lightbulb /> Solution</button>
              <button className={`tab ${left === "subs" ? "on" : ""}`} onClick={() => setLeft("subs")}><History /> Submissions</button>
            </div>
            <div className="pane-body pane-pad">
              {left === "desc" && <Description prob={prob} solved={!!status?.solved} />}
              {left === "breakdown" && prob.breakdown && <Breakdown prob={prob} onSolution={() => setLeft("solution")} />}
              {left === "solution" && (
                !status?.solved && !reveal ? (
                  <div className="spoiler">
                    <EyeOff />
                    <h3>Try it before you look</h3>
                    <p className="t2" style={{ maxWidth: 420, margin: "8px auto 16px" }}>
                      Ten minutes of struggling teaches more than ten seconds of reading. The Breakdown tab walks you to the idea without the code.
                    </p>
                    <div className="row" style={{ justifyContent: "center" }}>
                      {prob.breakdown && <button className="btn" onClick={() => setLeft("breakdown")}>Open the breakdown</button>}
                      <button className="btn btn-outline" onClick={() => setReveal(true)}>Show the solution</button>
                    </div>
                  </div>
                ) : prob.solutions.map((s, i) => (
                  <div key={i} style={{ marginTop: i ? 28 : 0 }}>
                    <ExplainedCode sol={s} onLoad={(c) => { if (confirm("Replace the code in your editor with this solution?")) onChange(c); }} />
                  </div>
                ))
              )}
              {left === "subs" && <Submissions subs={subs} best={status} />}
            </div>
          </section>

          <Gutter dir="x" onResize={setXPct} min={25} max={70} />

          {/* ------------------------------------------------ right: code + console */}
          <div className="ws-col ws-right-col" style={{ flex: 1 }}>
            <section className="pane editor-pane" style={{ height: `${yPct}%` }}>
              <div className="pane-head">
                <span className="tab on" style={{ cursor: "default" }}><Code2 /> Code</span>
                <span className="lang">Python 3</span>
                <div className="spacer" />
                <span className="engine xs t3" title="Your code runs in the browser with Pyodide (CPython 3.12)">
                  <span className={`dot ${eng === "ready" ? "ready" : eng === "error" ? "error" : ""}`} />
                  {eng === "ready" ? "Ready" : eng === "loading" ? "Loading Python" : eng === "error" ? "Python failed to load" : "Idle"}
                </span>
                <button className="btn icon-btn sm" title="Reset to the starter code" onClick={() => { if (confirm("Reset your code to the starter template?")) onChange(prob.starter); }}><RotateCcw /></button>
              </div>
              <div className="editor-host"><CodeEditor value={code} onChange={onChange} onRun={doRun} onSubmit={doSubmit} /></div>
            </section>

            <Gutter dir="y" onResize={setYPct} min={22} max={85} />

            <section className="pane console-pane" style={{ flex: 1 }}>
              <div className="pane-head">
                <button className={`tab ${consoleTab === "cases" ? "on" : ""}`} onClick={() => setConsoleTab("cases")}><ListChecks /> Testcase</button>
                <button className={`tab ${consoleTab === "result" ? "on" : ""}`} onClick={() => setConsoleTab("result")}><SquareTerminal /> Test Result</button>
                <div className="spacer" />
                <span className="xs t3 hide-md"><kbd>Ctrl</kbd> <kbd>'</kbd> run, <kbd>Ctrl</kbd> <kbd>Enter</kbd> submit</span>
              </div>
              <div className="pane-body console-body">
                {consoleTab === "cases"
                  ? <Testcases cases={cases} setCases={setCases} idx={caseIdx} setIdx={setCaseIdx} />
                  : <Result run={run} cases={cases} idx={resIdx} setIdx={setResIdx} />}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================== left panel */
function Description({ prob, solved }: { prob: ProblemFull; solved: boolean }) {
  const samples = prob.tests.filter((t) => t.kind === "sample");
  return (
    <>
      <h1 className="pd-title">{prob.id}. {prob.title}</h1>
      <div className="pd-meta">
        <Difficulty level={prob.level} pill />
        <TagList tags={prob.tags} max={4} />
        {solved && <span className="pd-solved"><CheckCircle2 /> Solved</span>}
      </div>
      <Html className="prose" html={prob.statement} />
      {samples.map((s, i) => (
        <div className="example" key={i}>
          <div className="example-h">Example {i + 1}</div>
          <pre dangerouslySetInnerHTML={{ __html: s.display || "" }} />
        </div>
      ))}
      <p className="xs t3" style={{ marginTop: 18 }}>
        Highlighted text is what the user types. Submit runs {prob.tests.length} tests: {samples.length} examples and {prob.tests.length - samples.length} hidden edge cases. Source: {prob.src}.
      </p>
    </>
  );
}

function Breakdown({ prob, onSolution }: { prob: ProblemFull; onSolution: () => void }) {
  const b = prob.breakdown!;
  const bodies = [
    <Html html={b.asks} as="p" />,
    <div>{b.io.map((r, i) => <div className="io-row" key={i}><span className="io-tag">{r.kind === "in" ? "Input" : "Output"}</span><span dangerouslySetInnerHTML={{ __html: r.html }} /></div>)}</div>,
    <Html html={b.pattern} as="p" />,
    <ul className="marks">{b.hidden.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>,
    <ol>{b.approach.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ol>,
    <pre className="trace" dangerouslySetInnerHTML={{ __html: b.trace }} />,
    <p className="t2">Write it yourself first, then compare with the <button className="btn btn-ghost btn-sm" onClick={onSolution}>explained solution</button></p>,
    <Html html={b.speed} as="p" />,
    <div>
      <ul className="marks">{b.mistakes.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>
      <div className="io-label" style={{ marginTop: 12 }}>How it could change in the contest</div>
      <ul className="marks">{b.variations.map((h, i) => <li key={i} dangerouslySetInnerHTML={{ __html: h }} />)}</ul>
    </div>,
  ];
  return (
    <div className="prose">
      {bodies.map((body, i) => (
        <div className="bd-step" key={i}><span className="bd-n">{i + 1}</span><div><h3>{STEPS[i]}</h3>{body}</div></div>
      ))}
    </div>
  );
}

function Submissions({ subs, best }: { subs: Submission[]; best?: { bestPassed: number; total: number; solved: boolean } }) {
  if (!subs.length) {
    return <div className="console-empty">No submissions on this device yet.{best ? ` Best synced result: ${best.bestPassed}/${best.total} tests.` : ""}</div>;
  }
  return (
    <table className="table">
      <thead><tr><th>Status</th><th>Tests</th><th className="num">Time</th><th className="num">When</th></tr></thead>
      <tbody>
        {subs.map((s, i) => (
          <tr key={i}>
            <td style={{ color: s.passed === s.total ? "var(--green)" : "var(--red)", fontWeight: 500 }}>{s.verdict}</td>
            <td className="tabular">{s.passed} / {s.total}</td>
            <td className="num">{(s.ms / 1000).toFixed(1)} s</td>
            <td className="num">{new Date(s.ts).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ================================================================== console */
function Testcases({ cases, setCases, idx, setIdx }: {
  cases: Case[]; setCases: (c: Case[]) => void; idx: number; setIdx: (i: number) => void;
}) {
  const cur = cases[Math.min(idx, cases.length - 1)];
  const edit = (v: string) => setCases(cases.map((c, i) => i === idx ? { input: v, sample: false, expected: c.input === v ? c.expected : undefined } : c));
  return (
    <>
      <div className="cases">
        {cases.map((c, i) => (
          <button key={i} className={`case ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)}>
            Case {i + 1}{!c.sample && " (custom)"}
            {cases.length > 1 && <X className="x" onClick={(e) => { e.stopPropagation(); const n = cases.filter((_, j) => j !== i); setCases(n); setIdx(Math.max(0, Math.min(idx, n.length - 1))); }} />}
          </button>
        ))}
        <button className="btn icon-btn sm" title="Add a test case" onClick={() => { setCases([...cases, { input: cur?.input ?? "", sample: false }]); setIdx(cases.length); }}><Plus /></button>
      </div>
      {cur && (
        <>
          <div className="io-label">Input lines, one per <code>input()</code> call</div>
          <textarea className="io-edit" spellCheck={false} value={cur.input} onChange={(e) => edit(e.target.value)}
            rows={Math.min(12, Math.max(3, cur.input.split("\n").length + 1))} />
          <div className="xs t3" style={{ marginTop: 6 }}>
            {cur.expected !== undefined ? "This example has an expected output, so Run checks it." : "Custom case: Run shows your output without checking it."}
          </div>
        </>
      )}
    </>
  );
}

function Result({ run, cases, idx, setIdx }: { run: RunState | null; cases: Case[]; idx: number; setIdx: (i: number) => void }) {
  if (!run) return <div className="console-empty">Run your code to see results here.</div>;
  if (run.kind === "run") {
    const rs = run.results;
    const v = rs.length ? overall(rs) : null;
    const cur = rs[Math.min(idx, rs.length - 1)];
    const c = cases[Math.min(idx, cases.length - 1)];
    return (
      <>
        <div className={`verdict ${v === "ok" || v === "done" ? "ok" : "bad"}`}>
          {run.running ? <h2 className="t2" style={{ display: "flex", gap: 8, alignItems: "center" }}><Spinner /> Running {run.done}/{run.total}</h2>
            : <><h2 style={v === "done" ? { color: "var(--text)" } : undefined}>{v ? LABEL[v] : ""}</h2>
               <span className="t3">Runtime {Math.round(rs.reduce((a, r) => a + r.ms, 0))} ms</span></>}
        </div>
        <div className="cases">
          {rs.map((r, i) => (
            <button key={i} className={`case ${i === idx ? "on" : ""}`} onClick={() => setIdx(i)}>
              <span className={`dot ${r.verdict === "ok" || r.verdict === "done" ? "ok" : "bad"}`} /> Case {i + 1}
            </button>
          ))}
        </div>
        {cur && c && <CaseDetail r={cur} input={c.input} />}
      </>
    );
  }
  // submit
  const passed = run.results.filter((r) => r.verdict === "ok").length;
  if (run.running) {
    return <div className="verdict"><h2 className="t2" style={{ display: "flex", gap: 8, alignItems: "center" }}><Spinner /> Judging {run.done}/{run.total}</h2></div>;
  }
  const ff = run.firstFail ?? -1;
  if (ff === -1) {
    return (
      <>
        <div className="verdict ok"><h2>Accepted</h2><span className="t3">{passed} / {run.total} testcases passed</span></div>
        <p className="t2">Every example and hidden edge case matches, character for character. Try the next problem or explain your solution to a teammate.</p>
      </>
    );
  }
  const r = run.results[ff], t = run.tests![ff];
  return (
    <>
      <div className="verdict bad"><h2>{LABEL[r.verdict]}</h2><span className="t3">{passed} / {run.total} testcases passed</span></div>
      <div className="io-label">Failed on: {t.name}{t.kind === "hidden" ? " (hidden test)" : ""}</div>
      <CaseDetail r={r} input={t.input.length > 40 ? [...t.input.slice(0, 30), `… ${t.input.length - 30} more lines`].join("\n") : t.input.join("\n")} />
    </>
  );
}

function CaseDetail({ r, input }: { r: CaseResult; input: string }) {
  if (r.verdict === "tle") {
    return <div className="hint"><Lightbulb /> <span>Your program took longer than the time limit. Look for an infinite loop, or an approach that is too slow for this input size. Python in the browser is 2 to 3 times slower than CodeChum, so these limits are generous.</span></div>;
  }
  const cmp = r.cmp;
  return (
    <>
      <div className="io-label">Input</div>
      <pre className="io-box">{input || " "}</pre>
      {r.err && <><div className="io-label">Error</div><pre className="err-box">{r.err}</pre></>}
      <div className="io-label">Output</div>
      <pre className="io-box">{cmp ? (cmp.got.length ? cmp.got.map((l, i) => <span key={i} className={i === cmp.firstBad ? "bad-line" : "ok-line"}>{l || " "}</span>) : "(nothing printed)") : (r.out || "(nothing printed)")}</pre>
      {r.expected !== undefined && cmp && (
        <>
          <div className="io-label">Expected</div>
          <pre className="io-box">{cmp.exp.map((l, i) => <span key={i} className="ok-line">{l || " "}</span>)}</pre>
        </>
      )}
      {cmp?.hint && <div className="hint"><Lightbulb /> <span>{cmp.hint}</span></div>}
    </>
  );
}

/* ================================================================== stopwatch */
function Stopwatch() {
  const [start, setStart] = useState<number | null>(null);
  const [acc, setAcc] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => { if (start === null) return; const t = setInterval(() => tick((x) => x + 1), 500); return () => clearInterval(t); }, [start]);
  const total = acc + (start ? Date.now() - start : 0);
  const mm = Math.floor(total / 60000), ss = Math.floor((total % 60000) / 1000);
  const label = useMemo(() => `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`, [mm, ss]);
  return (
    <span className="row" style={{ gap: 0 }}>
      <button className={`timer ${start ? "running" : ""}`} title={start ? "Pause timer" : "Start a timer (CodeChum problems: aim for 15 minutes)"}
        onClick={() => { if (start) { setAcc(total); setStart(null); } else setStart(Date.now()); }}>
        {start ? <Pause /> : <TimerIcon />} {total > 0 || start ? label : <span className="hide-md">Timer</span>}
      </button>
      {total > 0 && !start && <button className="btn icon-btn sm" title="Reset timer" onClick={() => setAcc(0)}><RotateCcw /></button>}
    </span>
  );
}
