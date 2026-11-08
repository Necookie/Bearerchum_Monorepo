import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Download } from "lucide-react";
import { useStore } from "../lib/store";
import { masteryByTag } from "../lib/learning";
import { Bar, Difficulty, Html, Loading } from "../components/ui";

const GUIDES = [
  { id: "rules", name: "Contest-day rules", blurb: "Exact output, hidden tests, choosing an algorithm from N, and how to split the problems." },
  { id: "python", name: "Python you must know", blurb: "Every input shape, output formatting, strings, lists, math, and the traps that cost points." },
  { id: "ds", name: "Data structures", blurb: "What you must know, what is good to have, and which operations are fast enough." },
];

function slug(s: string) { return s.replace(/<[^>]+>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function DocsNav({ active }: { active: string }) {
  const { content } = useStore();
  return (
    <nav className="docs-nav" aria-label="Learn">
      <div className="group">Guides</div>
      {GUIDES.map((g) => <Link key={g.id} to={`/learn/${g.id}`} className={active === g.id ? "on" : ""}>{g.name}</Link>)}
      <div className="group">Techniques</div>
      <Link to="/learn/techniques" className={active === "techniques" ? "on" : ""}>All 15 techniques</Link>
      {content?.techniques.map((t) => <Link key={t.id} to={`/learn/techniques#${t.id}`}>{t.id} {t.name}</Link>)}
      <div className="group">Offline</div>
      <a href="/reviewer.pdf" target="_blank" rel="noreferrer"><Download style={{ width: 14, height: 14, display: "inline", verticalAlign: -2, marginRight: 6 }} />PDF reviewer</a>
    </nav>
  );
}

export function GuidePage() {
  const { section = "rules" } = useParams();
  const { content } = useStore();
  const g = GUIDES.find((x) => x.id === section) || GUIDES[0];
  const html = content ? (content.guide as Record<string, string>)[g.id] : "";
  const withIds = useMemo(() => (html || "").replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`), [html]);
  if (!content) return <Loading />;
  return (
    <div className="container">
      <div className="docs">
        <DocsNav active={g.id} />
        <article>
          <div className="page-head" style={{ marginBottom: 20 }}><div><h1>{g.name}</h1><p>{g.blurb}</p></div></div>
          <Html className="guide" html={withIds} />
        </article>
      </div>
    </div>
  );
}

export function LearnIndex() { return <GuidePage />; }

export function TechniquesPage() {
  const { content, progress } = useStore();
  const loc = useLocation();
  const [focus, setFocus] = useState("");
  useEffect(() => {
    const id = loc.hash.slice(1);
    setFocus(id);
    if (!id) return;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, [loc.hash, content]);
  if (!content) return <Loading />;
  const m = masteryByTag(content, progress.cards, progress.problems);
  const byId = new Map(content.problems.map((p) => [p.id, p]));

  return (
    <div className="container">
      <div className="docs">
        <DocsNav active="techniques" />
        <article>
          <div className="page-head"><div><h1>Techniques</h1><p>Read a new problem, then ask which of these it is. The wording almost always gives it away.</p></div></div>
          {content.techniques.map((t) => {
            const s = m[t.id]?.score;
            const cards = content.cards.filter((c) => c.tags.includes(t.id)).length;
            return (
              <section id={t.id} key={t.id} className={`tech ${focus === t.id ? "focus" : ""}`}>
                <div className="tech-head">
                  <span className="tid">{t.id}</span>
                  <h2>{t.name}</h2>
                  <div className="spacer" />
                  <div style={{ width: 120 }}><Bar value={s ?? 0} tone={(s ?? 0) >= 0.75 ? "green" : ""} /></div>
                  <span className="xs t3 tabular" style={{ width: 70, textAlign: "right" }}>{s == null ? "Not started" : `${Math.round(s * 100)}% mastery`}</span>
                </div>
                <p style={{ margin: "10px 0 6px" }}><span className="t3">How to spot it: </span><span dangerouslySetInnerHTML={{ __html: t.spot }} /></p>
                <pre className="code-block"><code dangerouslySetInnerHTML={{ __html: t.template }} /></pre>
                <table className="table" style={{ marginTop: 4 }}>
                  <tbody>
                    {t.problems.map((pid) => {
                      const p = byId.get(pid);
                      if (!p) return null;
                      return (
                        <tr key={pid}>
                          <td className="title"><Link to={`/practice/${pid}`}>{pid}. {p.title}</Link></td>
                          <td style={{ textAlign: "right" }}>{progress.problems[pid]?.solved ? <span className="sm" style={{ color: "var(--green)", marginRight: 12 }}>Solved</span> : null}<Difficulty level={p.level} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {cards > 0 && <div style={{ marginTop: 10 }}><Link to={`/review?tag=${t.id}`} className="btn btn-sm">Review {cards} card{cards > 1 ? "s" : ""} on this technique</Link></div>}
              </section>
            );
          })}
        </article>
      </div>
    </div>
  );
}
