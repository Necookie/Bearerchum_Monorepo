import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { masteryByTag } from "../lib/learning";
import { ago } from "../lib/time";
import { Bar, Loading, PageHero } from "../components/ui";

interface Member {
  name: string; me: boolean; lastSeen: number; streak: number; reviewsWeek: number; reviewsToday: number;
  problems: Record<string, { solved: boolean; best: number; total: number }>;
  cards: Record<string, [number, number, number]>;
}

export default function Team() {
  const { content, user } = useStore();
  const [members, setMembers] = useState<Member[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ members: Member[] }>("/team").then((r) => setMembers(r.members)).catch((e) => setErr(e.message));
  }, [user]);

  if (!content) return <Loading />;
  if (!user) {
    return (
      <>
        <PageHero eyebrow="Team" title="Team board"><p className="body-lg mute">See everyone's streaks, solved problems and weak spots — then split the contest problems by strength.</p></PageHero>
        <div className="container section">
          <div className="card card-cream" style={{ textAlign: "center", padding: 48 }}>
            <h2 className="heading-lg">Sign in to see your team</h2>
            <p className="mute">You'll need the team code from your captain the first time.</p>
            <Link to="/account" className="btn btn-primary" style={{ marginTop: 10 }}>Sign in or join</Link>
          </div>
        </div>
      </>
    );
  }
  if (err) return <div className="container empty">{err}</div>;
  if (!members) return <Loading label="Loading team…" />;

  const rows = members.map((m) => {
    const cards = Object.fromEntries(Object.entries(m.cards).map(([k, [reps, lapses, ivl]]) => [k, { reps, lapses, ivl, step: ivl > 0 ? -1 : 0 }]));
    const mastery = masteryByTag(content, cards, m.problems);
    const tech = content.techniques.map((t) => ({ t, s: mastery[t.id]?.score ?? null }));
    const known = tech.filter((x) => x.s !== null) as { t: typeof tech[0]["t"]; s: number }[];
    const strongest = [...known].sort((a, b) => b.s - a.s).slice(0, 2);
    const weakest = [...known].sort((a, b) => a.s - b.s).slice(0, 2);
    const solved = Object.values(m.problems).filter((p) => p.solved).length;
    return { m, mastery, strongest, weakest, solved, learned: Object.values(m.cards).filter((c) => c[2] > 0).length };
  });

  // team-wide focus: techniques where the best member is still weak
  const focus = content.techniques.map((t) => ({
    t, best: Math.max(0, ...rows.map((r) => r.mastery[t.id]?.score ?? 0)),
  })).sort((a, b) => a.best - b.best).slice(0, 4);

  return (
    <>
      <PageHero eyebrow={`Team · ${members.length} member${members.length > 1 ? "s" : ""}`} title="Team board">
        <p className="body-lg mute">Use strengths to split Saturday's problems: give each member the techniques they're strongest at.</p>
      </PageHero>
      <div className="container section">
        <div className="card table-scroll">
          <table className="team-table">
            <thead><tr><th>Member</th><th>Streak</th><th>Today</th><th>This week</th><th>Solved</th><th>Strongest</th><th>Needs work</th></tr></thead>
            <tbody>
              {rows.map(({ m, strongest, weakest, solved, learned }) => (
                <tr key={m.name} className={m.me ? "me" : ""}>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <div className="avatar">{m.name.slice(0, 1).toUpperCase()}</div>
                      <div><b>{m.name}{m.me ? " (you)" : ""}</b><div className="caption">{learned} cards learned · {ago(m.lastSeen)}</div></div>
                    </div>
                  </td>
                  <td><b>{m.streak}</b> {m.streak > 0 ? "🔥" : ""}</td>
                  <td>{m.reviewsToday} reviews</td>
                  <td>{m.reviewsWeek} reviews</td>
                  <td style={{ minWidth: 130 }}>
                    <div className="caption">{solved}/{content.problems.length}</div>
                    <Bar value={solved / content.problems.length} tone="success" />
                  </td>
                  <td>{strongest.length ? strongest.map((x) => <div key={x.t.id} className="caption"><b>{x.t.id}</b> {x.t.name}</div>) : <span className="caption">—</span>}</td>
                  <td>{weakest.length ? weakest.map((x) => <div key={x.t.id} className="caption"><b>{x.t.id}</b> {x.t.name}</div>) : <span className="caption">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-head" style={{ marginTop: 40 }}>
          <div><h2 className="heading-lg">Team focus</h2><p className="mute">Techniques where even your strongest member isn't solid yet — drill these together.</p></div>
        </div>
        <div className="grid grid-4">
          {focus.map(({ t, best }) => (
            <Link key={t.id} to={`/learn/techniques#${t.id}`} className="card card-link">
              <div className="micro-cap mute">{t.id}</div>
              <h3 className="heading-sm" style={{ margin: "6px 0 10px" }}>{t.name}</h3>
              <Bar value={best} tone="honey" />
              <div className="caption" style={{ marginTop: 6 }}>best member: {Math.round(best * 100)}%</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
