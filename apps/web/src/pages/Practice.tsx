import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Shuffle } from "lucide-react";
import { useStore } from "../lib/store";
import { Bar, Difficulty, diffKey, Loading, Ring, StatusIcon, TagList } from "../components/ui";

const SET_NAME: Record<string, string> = { practice: "Practice set", prelims: "2025 Prelims", semis: "2025 Semifinals", drills: "Drill" };

export default function Practice() {
  const { content, progress } = useStore();
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const q = params.get("q") || "", group = params.get("group") || "", tech = params.get("tech") || "";
  const level = params.get("level") || "", status = params.get("status") || "";
  const set = (k: string, v: string) => { const p = new URLSearchParams(params); v ? p.set(k, v) : p.delete(k); setParams(p, { replace: true }); };
  const st = (id: string) => progress.problems[id]?.solved ? "solved" : progress.problems[id] ? "tried" : "new";

  const rows = useMemo(() => (content?.problems || []).filter((p) =>
    (!q || `${p.id} ${p.title}`.toLowerCase().includes(q.toLowerCase())) && (!group || p.group === group) &&
    (!tech || p.tags.includes(tech)) && (!level || diffKey(p.level) === level) && (!status || st(p.id) === status),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [content, q, group, tech, level, status, progress.problems]);

  if (!content) return <Loading />;
  const solved = content.problems.filter((p) => st(p.id) === "solved").length;
  const pickOne = () => {
    const pool = rows.filter((p) => st(p.id) !== "solved");
    const list = pool.length ? pool : rows;
    if (list.length) nav(`/practice/${list[Math.floor(Math.random() * list.length)].id}`);
  };

  return (
    <div className="container page">
      <div className="page-head">
        <div><h1>Problems</h1><p>{content.problems.length} problems, each judged on its examples and hidden edge cases.</p></div>
      </div>
      <div className="layout-2">
        <div>
          <div className="filters">
            <label className="search"><Search /><input className="input" placeholder="Search problems" value={q} onChange={(e) => set("q", e.target.value)} aria-label="Search problems" /></label>
            <select className="select" value={group} onChange={(e) => set("group", e.target.value)} aria-label="Problem set">
              <option value="">All sets</option>{content.groups.map((g) => <option key={g.id} value={g.id}>{SET_NAME[g.id] || g.name}</option>)}
            </select>
            <select className="select" value={level} onChange={(e) => set("level", e.target.value)} aria-label="Difficulty">
              <option value="">Difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
            <select className="select" value={tech} onChange={(e) => set("tech", e.target.value)} aria-label="Technique">
              <option value="">Technique</option>{content.techniques.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className="select" value={status} onChange={(e) => set("status", e.target.value)} aria-label="Status">
              <option value="">Status</option><option value="new">Not started</option><option value="tried">Attempted</option><option value="solved">Solved</option>
            </select>
            <div className="spacer" />
            <button className="btn btn-ghost" onClick={pickOne} title="Open a random unsolved problem from this list"><Shuffle /> Pick one</button>
          </div>
          <div className="panel table-wrap">
            <table className="table ptable">
              <thead><tr><th className="status">Status</th><th>Title</th><th className="set">Set</th><th className="tags">Technique</th><th>Difficulty</th><th className="num">Tests</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="status"><StatusIcon status={st(p.id)} /></td>
                    <td className="title"><Link to={`/practice/${p.id}`}>{p.id}. {p.title}</Link></td>
                    <td className="set">{SET_NAME[p.group]}</td>
                    <td className="tags"><TagList tags={p.tags} link={false} max={1} /></td>
                    <td><Difficulty level={p.level} /></td>
                    <td className="num">{p.tests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <div className="empty">No problems match these filters. <button className="btn btn-ghost btn-sm" onClick={() => setParams({})}>Clear filters</button></div>}
          </div>
        </div>

        <aside className="stack">
          <section className="panel">
            <div className="ring-wrap">
              <Ring value={solved / content.problems.length} label={String(solved)} sub="solved" />
              <div className="ring-legend">
                {(["easy", "medium", "hard"] as const).map((k) => {
                  const all = content.problems.filter((p) => diffKey(p.level) === k), done = all.filter((p) => st(p.id) === "solved").length;
                  return <div className="row" key={k}><span className={`lbl diff-${k}`}>{k[0].toUpperCase() + k.slice(1)}</span><Bar value={all.length ? done / all.length : 0} tone={k} /><span className="n">{done}/{all.length}</span></div>;
                })}
              </div>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h3>Sets</h3></div>
            {content.groups.map((g) => {
              const all = content.problems.filter((p) => p.group === g.id), done = all.filter((p) => st(p.id) === "solved").length;
              return (
                <button key={g.id} className="plan-group" style={{ display: "block", width: "100%", textAlign: "left", background: group === g.id ? "var(--surface-2)" : "transparent", border: 0, borderTop: "1px solid var(--border)", cursor: "pointer", color: "inherit" }}
                  onClick={() => set("group", group === g.id ? "" : g.id)}>
                  <div className="row"><b style={{ fontWeight: 500 }}>{SET_NAME[g.id] || g.name}</b><span className="t3 tabular">{done}/{all.length}</span></div>
                  <Bar value={all.length ? done / all.length : 0} />
                  <div className="xs t3" style={{ marginTop: 6 }}>{g.blurb}</div>
                </button>
              );
            })}
          </section>
        </aside>
      </div>
    </div>
  );
}
