import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "../lib/store";
import { buildQueue, masteryByTag, readiness, recommend } from "../lib/learning";
import { contestTime, countdown, streakFrom } from "../lib/time";
import { Bar, Loading } from "../components/ui";

export default function Home() {
  const { content, progress, settings, user } = useStore();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 30_000); return () => clearInterval(t); }, []);
  if (!content) return <Loading />;

  const target = contestTime(content.contestDate);
  const cd = countdown(target);
  const q = buildQueue(content, progress, settings);
  const recs = recommend(content, progress, settings);
  const m = masteryByTag(content, progress.cards, progress.problems);
  const solved = Object.values(progress.problems).filter((p) => p.solved).length;
  const learned = Object.values(progress.cards).filter((c) => c.step === -1).length;
  const streak = streakFrom(progress.days);
  const ready = readiness(m, content);
  const contestDay = new Date(target).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Manila" });

  return (
    <>
      <section className="mesh hero">
        <div className="container hero-grid">
          <div>
            <div className="eyebrow micro-cap">CodeChum NPC 2026 · {contestDay}</div>
            <h1 className="display-xxl">
              {cd.done ? "Contest's done. The habit stays." : <>Get contest-sharp in {cd.d} day{cd.d === 1 ? "" : "s"}.</>}
            </h1>
            <p className="lead body-lg">
              Spaced-repetition cards for the Python you must know cold, a CodeChum-style judge that checks your output
              character by character, and every solution explained line by line.
            </p>
            <div className="row">
              <Link to="/review" className="btn btn-primary btn-lg">Start today's review</Link>
              <Link to="/practice" className="btn btn-secondary btn-lg">Practice a problem</Link>
            </div>
            {!cd.done && (
              <div className="countdown" style={{ marginTop: 28 }}>
                <div><b>{cd.d}</b><span>days</span></div>
                <div><b>{cd.h}</b><span>hours</span></div>
                <div><b>{cd.m}</b><span>minutes</span></div>
              </div>
            )}
          </div>

          <div className="mockup" aria-label="Today's plan">
            <div className="mockup-bar"><i /><i /><i /></div>
            <div className="mockup-body">
              <div className="row" style={{ marginBottom: 6 }}>
                <span className="micro-cap mute">Today's plan</span>
                <div className="spacer" />
                <span className="caption">{user ? `Hi, ${user.name}` : "Guest — progress saved in this browser"}</span>
              </div>
              {recs.slice(0, 4).map((r, i) => (
                <Link to={r.to} key={i} className="plan-item" style={{ color: "inherit", textDecoration: "none" }}>
                  <div className="plan-ico">{r.icon}</div>
                  <div><b>{r.title}</b><span>{r.detail}</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid grid-4">
          <Stat n={q.due.length + q.fresh.length} label="cards waiting today" />
          <Stat n={`${solved}/${content.problems.length}`} label="problems fully solved" />
          <Stat n={streak} label={`day streak${streak ? " 🔥" : ""}`} />
          <Stat n={`${ready}%`} label="contest readiness" />
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2 className="display-md">Recommended next</h2>
            <p className="mute">Picked from what's due, what you haven't solved, and your weakest technique.</p>
          </div>
        </div>
        <div className="grid grid-2">
          {recs.map((r, i) => (
            <Link to={r.to} key={i} className={`card card-link ${i === 0 ? "card-cream" : ""}`}>
              <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <div className="plan-ico" style={{ background: i === 0 ? "#fff" : undefined }}>{r.icon}</div>
                <div>
                  <h3 className="heading-sm">{r.title}</h3>
                  <p className="caption" style={{ margin: "4px 0 0" }}>{r.detail}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <h2 className="display-md">Technique mastery</h2>
            <p className="mute">Built from your card reviews and judge results. {learned} card{learned === 1 ? "" : "s"} learned so far.</p>
          </div>
          <div className="spacer" />
          <Link to="/learn/techniques" className="btn btn-outline btn-sm">All techniques</Link>
        </div>
        <div className="card">
          <div className="grid grid-3" style={{ columnGap: 36, rowGap: 0 }}>
            {content.techniques.map((t) => {
              const s = m[t.id];
              return (
                <Link key={t.id} to={`/learn/techniques#${t.id}`} className="mastery-row" style={{ color: "inherit", textDecoration: "none" }}>
                  <span className="tid">{t.id}</span>
                  <div>
                    <div className="mastery-name">{t.name}</div>
                    <Bar value={s?.score ?? 0} tone={(s?.score ?? 0) >= 0.75 ? "success" : (s?.score ?? 0) >= 0.4 ? "" : "honey"} />
                  </div>
                  <span className="pct">{s?.score == null ? "new" : `${Math.round(s.score * 100)}%`}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="grid grid-3">
          <Feature title="Review that sticks" to="/review"
            text="Cards come back right before you'd forget them — compressed so everything you learn resurfaces before Saturday." />
          <Feature title="A judge that's as picky as CodeChum" to="/practice"
            text="Your Python runs in the browser against the samples and hidden edge cases, with hints when only a space is off." />
          <Feature title="Every solution, explained" to="/learn"
            text="26 contest problems and 14 drills, each broken into the same 9 thinking steps, plus line-by-line walkthroughs." />
        </div>
      </section>
    </>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return <div className="stat"><div className="stat-num">{n}</div><div className="stat-label">{label}</div></div>;
}

function Feature({ title, text, to }: { title: string; text: string; to: string }) {
  return (
    <Link to={to} className="card card-cream card-link">
      <h3 className="heading-md">{title}</h3>
      <p className="mute" style={{ margin: "8px 0 0" }}>{text}</p>
    </Link>
  );
}
