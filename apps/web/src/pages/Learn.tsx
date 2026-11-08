import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { masteryByTag } from "../lib/learning";
import { Bar, Html, LevelBadge, Loading, PageHero } from "../components/ui";

const SECTIONS = [
  { id: "rules", name: "Contest-day rules", blurb: "Exact output, hidden tests, the 5-step loop, choosing an algorithm from N, team split." },
  { id: "python", name: "Python must-know", blurb: "Every input shape, output formatting, strings, lists, math, loops — and the traps." },
  { id: "ds", name: "Data structures", blurb: "What you must know, what's good to have, and the speed facts that decide pass/fail." },
  { id: "techniques", name: "Techniques playbook", blurb: "15 patterns with how to spot them, a template, and the problems that use them." },
];

export function LearnIndex() {
  const { content } = useStore();
  if (!content) return <Loading />;
  return (
    <>
      <PageHero eyebrow="Learn" title="The playbook">
        <p className="body-lg mute">Read it once properly, then let the review cards keep it fresh. Everything here is also in the printable PDF.</p>
        <a className="btn btn-secondary" href="/reviewer.pdf" target="_blank" rel="noreferrer" style={{ marginTop: 18 }}>Download the 71-page PDF</a>
      </PageHero>
      <div className="container section">
        <div className="grid grid-2">
          {SECTIONS.map((s, i) => (
            <Link key={s.id} to={`/learn/${s.id}`} className={`card card-link ${i === 3 ? "card-cream" : ""}`} style={{ padding: 32 }}>
              <div className="micro-cap mute">Part {i + 1}</div>
              <h2 className="heading-lg" style={{ margin: "10px 0 6px" }}>{s.name}</h2>
              <p className="mute" style={{ margin: 0 }}>{s.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export function GuidePage() {
  const { section = "rules" } = useParams();
  const { content } = useStore();
  const meta = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const html = content ? (content.guide as Record<string, string>)[meta.id] : "";
  const heads = useMemo(() => {
    const out: { id: string; text: string }[] = [];
    const re = /<h2>(.*?)<\/h2>/g;
    let m;
    while ((m = re.exec(html || ""))) out.push({ id: slug(m[1]), text: m[1].replace(/<[^>]+>/g, "") });
    return out;
  }, [html]);
  const withIds = useMemo(() => (html || "").replace(/<h2>(.*?)<\/h2>/g, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`), [html]);
  const active = useActiveHeading(heads.map((h) => h.id));
  if (!content) return <Loading />;

  return (
    <>
      <PageHero eyebrow={`Learn · Part ${SECTIONS.indexOf(meta) + 1}`} title={meta.name}><p className="body-lg mute">{meta.blurb}</p></PageHero>
      <div className="container section">
        <div className="learn-layout">
          <nav className="toc">
            {heads.map((h) => <a key={h.id} href={`#${h.id}`} className={active === h.id ? "on" : ""}>{h.text}</a>)}
            <div className="hr" />
            {SECTIONS.filter((s) => s.id !== meta.id).map((s) => <Link key={s.id} to={`/learn/${s.id}`}>→ {s.name}</Link>)}
          </nav>
          <Html className="guide" html={withIds} />
        </div>
      </div>
    </>
  );
}

export function TechniquesPage() {
  const { content, progress } = useStore();
  const loc = useLocation();
  useEffect(() => {
    if (!loc.hash) return;
    const t = setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 80);
    return () => clearTimeout(t);
  }, [loc.hash, content]);
  if (!content) return <Loading />;
  const m = masteryByTag(content, progress.cards, progress.problems);
  const byId = new Map(content.problems.map((p) => [p.id, p]));
  const active = loc.hash.slice(1);

  return (
    <>
      <PageHero eyebrow="Learn · Part 4" title="Techniques playbook">
        <p className="body-lg mute">When you read a new problem, scan this list and ask “which one is this?”. The wording almost always gives it away.</p>
      </PageHero>
      <div className="container section">
        <div className="learn-layout">
          <nav className="toc">
            {content.techniques.map((t) => <a key={t.id} href={`#${t.id}`} className={active === t.id ? "on" : ""}>{t.id} · {t.name}</a>)}
          </nav>
          <div className="stack">
            {content.techniques.map((t) => {
              const s = m[t.id];
              const cards = content.cards.filter((c) => c.tags.includes(t.id)).length;
              return (
                <article id={t.id} key={t.id} className="card tech-card" style={active === t.id ? { borderColor: "var(--honey)", boxShadow: "0 0 0 3px rgba(233,162,59,.18)" } : undefined}>
                  <div className="row">
                    <span className="tid">{t.id}</span>
                    <h2 className="heading-md">{t.name}</h2>
                    <div className="spacer" />
                    <div style={{ width: 160 }}><Bar value={s?.score ?? 0} /></div>
                    <span className="caption" style={{ width: 44, textAlign: "right" }}>{s?.score == null ? "new" : `${Math.round(s.score * 100)}%`}</span>
                  </div>
                  <p style={{ margin: "14px 0 6px" }}><b>Spot it: </b><span dangerouslySetInnerHTML={{ __html: t.spot }} /></p>
                  <pre className="code-block py"><code dangerouslySetInnerHTML={{ __html: t.template }} /></pre>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="caption">Seen in:</span>
                    {t.problems.map((pid) => {
                      const p = byId.get(pid);
                      if (!p) return null;
                      const done = progress.problems[pid]?.solved;
                      return <Link key={pid} to={`/practice/${pid}`} className="chip chip-outline">{done ? "✓ " : ""}{pid} · {p.title} <LevelBadge level={p.level} /></Link>;
                    })}
                  </div>
                  <div className="row" style={{ marginTop: 14 }}>
                    {cards > 0 && <Link to={`/review?tag=${t.id}`} className="btn btn-secondary btn-sm">Drill {cards} card{cards > 1 ? "s" : ""}</Link>}
                    <Link to={`/practice?tech=${t.id}`} className="btn btn-ghost btn-sm">All problems using {t.id}</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function slug(s: string) {
  return s.replace(/<[^>]+>/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const onScroll = () => {
      let cur = ids[0] || "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}
