import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { CURRICULUM } from "../lib/learning";
import { LevelBadge, Loading, PageHero, TagChips } from "../components/ui";

export default function Practice() {
  const { content, progress } = useStore();
  const [params, setParams] = useSearchParams();
  if (!content) return <Loading />;

  const group = params.get("group") || "all";
  const tech = params.get("tech") || "";
  const status = params.get("status") || "all";
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (!v || v === "all") p.delete(k); else p.set(k, v);
    setParams(p, { replace: true });
  };

  const st = (id: string) => progress.problems[id]?.solved ? "solved" : progress.problems[id] ? "tried" : "new";
  const solved = content.problems.filter((p) => st(p.id) === "solved").length;
  const nextUp = CURRICULUM.find((id) => st(id) !== "solved");

  const visible = content.problems.filter((p) =>
    (group === "all" || p.group === group) && (!tech || p.tags.includes(tech)) && (status === "all" || st(p.id) === status));

  return (
    <>
      <PageHero eyebrow={`${solved} of ${content.problems.length} solved`} title="Practice judge">
        <p className="body-lg mute">
          Write Python, run it against the samples and the hidden edge cases, and see exactly where your output differs.
          Same transcript format as CodeChum — the prompt text counts.
        </p>
        {nextUp && <Link to={`/practice/${nextUp}`} className="btn btn-primary" style={{ marginTop: 18 }}>Continue with {nextUp}</Link>}
      </PageHero>

      <div className="container">
        <div className="filters" style={{ marginTop: 28 }}>
          {[{ id: "all", name: "All" }, ...content.groups].map((g) => (
            <button key={g.id} className={`chip ${group === g.id ? "chip-on" : "chip-outline"}`} onClick={() => set("group", g.id)}>{g.name}</button>
          ))}
          <span className="spacer" />
          <select className="input" style={{ minHeight: 36, padding: "6px 10px", borderRadius: 99 }} value={tech} onChange={(e) => set("tech", e.target.value)}>
            <option value="">Any technique</option>
            {content.techniques.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.name}</option>)}
          </select>
          <select className="input" style={{ minHeight: 36, padding: "6px 10px", borderRadius: 99 }} value={status} onChange={(e) => set("status", e.target.value)}>
            <option value="all">Any status</option><option value="new">Not started</option>
            <option value="tried">Attempted</option><option value="solved">Solved</option>
          </select>
        </div>

        {content.groups.map((g) => {
          const items = visible.filter((p) => p.group === g.id);
          if (!items.length) return null;
          const gs = content.problems.filter((p) => p.group === g.id);
          return (
            <section key={g.id}>
              <div className="group-title">
                <h2 className="heading-lg">{g.name}</h2>
                <span className="progress-ring">{gs.filter((p) => st(p.id) === "solved").length}/{gs.length} solved · {g.blurb}</span>
              </div>
              <div className="grid grid-3">
                {items.map((p) => (
                  <Link key={p.id} to={`/practice/${p.id}`} className="card card-link problem-card">
                    <div className="row">
                      <span className={`status-dot ${st(p.id)}`} title={st(p.id)} />
                      <span className="pid">{p.id}</span>
                      <div className="spacer" />
                      <LevelBadge level={p.level} />
                    </div>
                    <h3>{p.title}</h3>
                    <p dangerouslySetInnerHTML={{ __html: p.summary }} />
                    <div className="row" style={{ gap: 6 }}><TagChips tags={p.tags} link={false} /></div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
        {!visible.length && <div className="empty">No problems match these filters.</div>}
      </div>
    </>
  );
}
