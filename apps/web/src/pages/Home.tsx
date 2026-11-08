import { Link } from "react-router-dom";
import { BookOpen, Code2, Coffee, RotateCcw, Sparkles } from "lucide-react";
import { useStore } from "../lib/store";
import { buildQueue, CURRICULUM, masteryByTag, readiness, recommend, Recommendation } from "../lib/learning";
import { contestTime, countdown, dayKey, streakFrom } from "../lib/time";
import { Bar, Difficulty, diffKey, Loading, Ring, StatusIcon, TagList } from "../components/ui";

const ICON: Record<Recommendation["kind"], JSX.Element> = {
  review: <RotateCcw />, learn: <Sparkles />, problem: <Code2 />, technique: <BookOpen />, rest: <Coffee />,
};

export default function Home() {
  const { content, progress, settings, user } = useStore();
  if (!content) return <Loading />;

  const cd = countdown(contestTime(content.contestDate));
  const q = buildQueue(content, progress, settings);
  const recs = recommend(content, progress, settings);
  const m = masteryByTag(content, progress.cards, progress.problems);
  const streak = streakFrom(progress.days);
  const ready = readiness(m, content);
  const st = (id: string) => progress.problems[id]?.solved ? "solved" : progress.problems[id] ? "tried" : "new";
  const byId = new Map(content.problems.map((p) => [p.id, p]));
  const upNext = CURRICULUM.filter((id) => st(id) !== "solved").slice(0, 6).map((id) => byId.get(id)!).filter(Boolean);
  const solvedBy = (k: string) => content.problems.filter((p) => diffKey(p.level) === k);
  const contestDay = new Date(contestTime(content.contestDate)).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Manila" });
  const hour = Number(new Date().toLocaleString("en-PH", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }));
  const hello = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = progress.days[dayKey(Date.now() - (13 - i) * 86400000)];
    const n = d ? d.reviews + d.attempts * 3 : 0;
    return n === 0 ? "" : n < 10 ? "l1" : n < 30 ? "l2" : "l3";
  });
  const learned = Object.values(progress.cards).filter((c) => c.step === -1).length;

  return (
    <div className="container">
      <div className="dash-greeting">
        <h1>{hello}{user ? `, ${user.name}` : ""}</h1>
        <p>{cd.done ? "The contest is over. Keep your streak going." : <>The NPC is on {contestDay}. <span className="count">{cd.d} days {cd.h} hours</span> left.</>}</p>
      </div>

      <div className="layout-2">
        <div className="stack">
          <section className="panel">
            <div className="panel-head"><h2>Today's plan</h2><div className="spacer" /><span className="xs t3">{q.due.length} due, {q.fresh.length} new cards</span></div>
            {recs.map((r, i) => (
              <Link to={r.to} key={i} className="list-row">
                <span className="ico">{ICON[r.kind]}</span>
                <div style={{ flex: 1, minWidth: 0 }}><b>{r.title}</b><span className="sub">{r.detail}</span></div>
                <span className={`btn btn-sm ${i === 0 ? "btn-accent" : ""}`}>{r.kind === "review" || r.kind === "learn" ? "Start" : "Open"}</span>
              </Link>
            ))}
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Up next</h2><div className="spacer" /><Link to="/practice" className="sm">All problems</Link></div>
            <div className="table-wrap">
              <table className="table ptable">
                <tbody>
                  {upNext.map((p) => (
                    <tr key={p.id}>
                      <td className="status"><StatusIcon status={st(p.id)} /></td>
                      <td className="title"><Link to={`/practice/${p.id}`}>{p.id}. {p.title}</Link></td>
                      <td className="tags"><TagList tags={p.tags} link={false} max={1} /></td>
                      <td style={{ textAlign: "right" }}><Difficulty level={p.level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h2>Technique mastery</h2><div className="spacer" /><Link to="/learn/techniques" className="sm">Playbook</Link></div>
            <div className="table-wrap">
              <table className="table mastery-table">
                <tbody>
                  {content.techniques.map((t) => {
                    const s = m[t.id]?.score;
                    return (
                      <tr key={t.id}>
                        <td>{t.id}</td>
                        <td className="title"><Link to={`/learn/techniques#${t.id}`}>{t.name}</Link></td>
                        <td className="bar-cell"><Bar value={s ?? 0} tone={(s ?? 0) >= 0.75 ? "green" : ""} /></td>
                        <td className="pct">{s == null ? "New" : `${Math.round(s * 100)}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <div className="panel-head"><h3>Problems solved</h3></div>
            <div className="ring-wrap">
              <Ring value={content.problems.filter((p) => st(p.id) === "solved").length / content.problems.length}
                label={String(content.problems.filter((p) => st(p.id) === "solved").length)} sub={`of ${content.problems.length}`} />
              <div className="ring-legend">
                {(["easy", "medium", "hard"] as const).map((k) => {
                  const all = solvedBy(k), done = all.filter((p) => st(p.id) === "solved").length;
                  return (
                    <div className="row" key={k}>
                      <span className={`lbl diff-${k}`}>{k[0].toUpperCase() + k.slice(1)}</span>
                      <Bar value={all.length ? done / all.length : 0} tone={k} />
                      <span className="n">{done}/{all.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head"><h3>Activity</h3><div className="spacer" /><span className="xs t3">{streak} day streak</span></div>
            <div className="panel-body">
              <div className="heat">{days.map((c, i) => <i key={i} className={`${c} ${i === 13 ? "today" : ""}`} title={dayKey(Date.now() - (13 - i) * 86400000)} />)}</div>
              <div className="xs t3" style={{ marginTop: 8 }}>Last 14 days. Reviews and judge runs both count.</div>
            </div>
            <div className="kv"><span>Cards learned</span><b>{learned} / {content.cards.length}</b></div>
            <div className="kv"><span>Contest readiness</span><b>{ready}%</b></div>
          </section>

          <section className="panel panel-body">
            <h3 style={{ fontSize: "var(--fs-md)", marginBottom: 6 }}>How to use the week</h3>
            <p className="sm t2" style={{ marginBottom: 0 }}>
              Clear your review queue each day (about 15 minutes), then solve one or two problems with the timer running.
              Read the breakdown only after a real attempt.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
