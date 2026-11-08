import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { masteryByTag } from "../lib/learning";
import { ago } from "../lib/time";
import { Bar, Loading } from "../components/ui";

interface Member {
  name: string; me: boolean; lastSeen: number; streak: number; reviewsWeek: number; reviewsToday: number;
  problems: Record<string, { solved: boolean; best: number; total: number }>;
  cards: Record<string, [number, number, number]>;
}

export default function Team() {
  const { content, user } = useStore();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (user) api<{ members: Member[] }>("/team").then((r) => setMembers(r.members)).catch((e) => setErr(e.message)); }, [user]);

  if (!content) return <Loading />;
  if (!user) {
    return (
      <div className="container page">
        <div className="page-head"><div><h1>Team</h1><p>Streaks, solved problems and each member's strongest techniques, for splitting problems on contest day.</p></div></div>
        <div className="panel empty"><h2>Sign in to see your team</h2><p>Creating an account needs the team code from your captain.</p><Link to="/account" className="btn btn-accent">Sign in</Link></div>
      </div>
    );
  }
  if (err) return <div className="container page"><div className="panel empty"><h2>Could not load the team</h2><p>{err}</p></div></div>;
  if (!members) return <Loading label="Loading team" />;

  const rows = members.map((m) => {
    const cards = Object.fromEntries(Object.entries(m.cards).map(([k, [reps, lapses, ivl]]) => [k, { reps, lapses, ivl, step: ivl > 0 ? -1 : 0 }]));
    const mastery = masteryByTag(content, cards, m.problems);
    const known = content.techniques.map((t) => ({ t, s: mastery[t.id]?.score })).filter((x): x is { t: typeof x.t; s: number } => x.s != null);
    return {
      m, mastery,
      strongest: [...known].sort((a, b) => b.s - a.s).slice(0, 2),
      weakest: [...known].sort((a, b) => a.s - b.s).slice(0, 2),
      solved: Object.values(m.problems).filter((p) => p.solved).length,
      learned: Object.values(m.cards).filter((c) => c[2] > 0).length,
    };
  });
  const focus = content.techniques.map((t) => ({ t, best: Math.max(0, ...rows.map((r) => r.mastery[t.id]?.score ?? 0)) }))
    .sort((a, b) => a.best - b.best).slice(0, 5);

  return (
    <div className="container page">
      <div className="page-head"><div><h1>Team</h1><p>{members.length} member{members.length > 1 ? "s" : ""}. Give each person the techniques they are strongest at.</p></div></div>
      <div className="panel table-wrap">
        <table className="table">
          <thead><tr><th>Member</th><th className="num">Streak</th><th className="num">Reviews today</th><th className="num">This week</th><th>Solved</th><th>Strongest</th><th>Needs work</th></tr></thead>
          <tbody>
            {rows.map(({ m, strongest, weakest, solved, learned }) => (
              <tr key={m.name}>
                <td><div className="row" style={{ flexWrap: "nowrap" }}><span className="avatar">{m.name[0].toUpperCase()}</span>
                  <div><div style={{ fontWeight: 500 }}>{m.name}{m.me ? " (you)" : ""}</div><div className="xs t3">{learned} cards learned, active {ago(m.lastSeen)}</div></div></div></td>
                <td className="num">{m.streak}</td>
                <td className="num">{m.reviewsToday}</td>
                <td className="num">{m.reviewsWeek}</td>
                <td style={{ minWidth: 120 }}><div className="xs t3 tabular">{solved} of {content.problems.length}</div><Bar value={solved / content.problems.length} tone="green" /></td>
                <td className="sm">{strongest.length ? strongest.map((x) => <div key={x.t.id}>{x.t.name}</div>) : <span className="t3">Not enough data</span>}</td>
                <td className="sm">{weakest.length ? weakest.map((x) => <div key={x.t.id}>{x.t.name}</div>) : <span className="t3">Not enough data</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head"><h2>Team weak spots</h2><div className="spacer" /><span className="xs t3">Even the strongest member is below 75% here</span></div>
        <table className="table mastery-table">
          <tbody>
            {focus.map(({ t, best }) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td className="title"><Link to={`/learn/techniques#${t.id}`}>{t.name}</Link></td>
                <td className="bar-cell"><Bar value={best} /></td>
                <td className="pct">{Math.round(best * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
