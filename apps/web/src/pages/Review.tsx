import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useStore } from "../lib/store";
import { Card, DECK_NAMES } from "../lib/content";
import { buildQueue, techName } from "../lib/learning";
import { Grade, humanDelay, previewLabel, schedule } from "../lib/srs";
import { contestTime } from "../lib/time";
import { Html, Loading } from "../components/ui";

type Item = { id: string; isNew: boolean };

export default function Review() {
  const { content, progress, settings, reviewCard } = useStore();
  const [params, setParams] = useSearchParams();
  const deck = params.get("deck") || undefined;
  const tag = params.get("tag") || undefined;
  const [session, setSession] = useState<Item[] | null>(null);
  const [done, setDone] = useState({ count: 0, again: 0 });
  const [, setNow] = useState(Date.now());

  const cardsById = useMemo(() => new Map((content?.cards || []).map((c) => [c.id, c])), [content]);
  const q = content ? buildQueue(content, progress, settings, { deck, tag }) : null;

  const start = useCallback(() => {
    if (!q) return;
    setSession([...q.due.map((c) => ({ id: c.id, isNew: false })), ...q.fresh.map((c) => ({ id: c.id, isNew: true }))]);
    setDone({ count: 0, again: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, deck, tag]);
  useEffect(() => { if (content) start(); }, [content, deck, tag, start]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);

  if (!content || !q || !session) return <Loading />;
  const contest = contestTime(content.contestDate);
  const nowTs = Date.now();
  const readyIdx = session.findIndex((it) => { const s = progress.cards[it.id]; return it.isNew || !s || s.due <= nowTs + 15_000; });
  const current = readyIdx >= 0 ? session[readyIdx] : null;
  const waiting = session.length - (current ? 1 : 0);

  const onGrade = (item: Item, g: Grade) => {
    const prev = progress.cards[item.id];
    const next = schedule(prev, g, Date.now(), contest);
    reviewCard(item.id, next, g, item.isNew && !prev);
    setDone((d) => ({ count: d.count + 1, again: d.again + (g === 1 ? 1 : 0) }));
    setSession((s) => {
      if (!s) return s;
      const copy = s.slice();
      copy.splice(readyIdx, 1);
      if (next.due - Date.now() < 20 * 60_000) copy.push({ id: item.id, isNew: false });   // learning step: comes back this session
      return copy;
    });
  };

  const total = session.length + done.count;
  const nextWait = () => {
    const ds = session.map((i) => progress.cards[i.id]?.due).filter(Boolean) as number[];
    return ds.length ? humanDelay(Math.max(1000, Math.min(...ds) - Date.now())) : "a moment";
  };

  return (
    <div className="container page">
      <div className="review">
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div><h1>Review</h1><p>{q.due.length} due and {q.fresh.length} new{!deck && !tag ? `, out of a daily budget of ${settings.newPerDay} new cards` : ""}.</p></div>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <div className="seg" role="tablist">
            <button className={!deck && !tag ? "on" : ""} onClick={() => setParams({})}>All</button>
            {Object.entries(DECK_NAMES).map(([id, name]) => (
              <button key={id} className={deck === id ? "on" : ""} onClick={() => setParams({ deck: id })}>{name}</button>
            ))}
          </div>
          {tag && <Link className="tag on" to="/review" title="Clear the technique filter">{techName(content, tag)} <X style={{ width: 12, height: 12, marginLeft: 4 }} /></Link>}
        </div>
        <div className="review-bar">
          <div className="review-progress"><i style={{ width: `${total ? (done.count / total) * 100 : 0}%` }} /></div>
          <span className="xs t3 tabular">{done.count} reviewed{done.again ? `, ${done.again} to relearn` : ""}</span>
        </div>

        {current ? (
          <Flashcard key={`${current.id}-${done.count}`} card={cardsById.get(current.id)!} isNew={current.isNew && !progress.cards[current.id]}
            labels={([1, 2, 3, 4] as Grade[]).map((g) => previewLabel(progress.cards[current.id], g, Date.now(), contest))}
            onGrade={(g) => onGrade(current, g)} />
        ) : (
          <div className="flash"><div className="empty" style={{ margin: "auto" }}>
            {waiting > 0 ? (
              <>
                <h2>Waiting for learning cards</h2>
                <p>{waiting} card{waiting > 1 ? "s" : ""} will come back in {nextWait()}. Short gaps are how new cards stick.</p>
                <button className="btn" onClick={() => setNow(Date.now() + 1)}>Check again</button>
              </>
            ) : (
              <>
                <h2>{done.count ? "Queue cleared" : "Nothing to review here"}</h2>
                <p>{done.count ? `You reviewed ${done.count} card${done.count > 1 ? "s" : ""}. ` : ""}{q.nextDue ? `The next card is due in ${humanDelay(q.nextDue - Date.now())}.` : "New cards unlock tomorrow."}</p>
                <div className="row" style={{ justifyContent: "center" }}>
                  <Link to="/practice" className="btn btn-accent">Solve a problem</Link>
                  <button className="btn" onClick={start}>Reload queue</button>
                </div>
              </>
            )}
          </div></div>
        )}
        <p className="xs t3" style={{ textAlign: "center", marginTop: 12 }}>
          <kbd>Space</kbd> shows the answer. <kbd>1</kbd> to <kbd>4</kbd> grade it, or pick a choice.
        </p>
      </div>
    </div>
  );
}

const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trim();
const GRADES = ["Again", "Hard", "Good", "Easy"] as const;

function Flashcard({ card, isNew, labels, onGrade }: { card: Card; isNew: boolean; labels: string[]; onGrade: (g: Grade) => void }) {
  const { content } = useStore();
  const [shown, setShown] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const choose = (i: number) => { if (!shown) { setPick(i); setShown(true); } };
  const correct = card.type === "mcq" ? pick === card.answer
    : card.type === "output" && typed.trim() ? norm(typed) === norm(card.backRaw || "") : null;
  const suggested: Grade | null = correct === null ? null : correct ? 3 : 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === taRef.current) return;
      if (!shown) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); setShown(true); }
        if (card.type === "mcq" && /^[1-4]$/.test(e.key) && card.choices && +e.key <= card.choices.length) choose(+e.key - 1);
      } else if (/^[1-4]$/.test(e.key)) onGrade(+e.key as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tags = card.tags.filter((t) => t !== card.deck);
  return (
    <div className="flash">
      <div className="flash-meta">
        <span>{DECK_NAMES[card.deck] || card.deck}</span>
        {isNew && <span className="tag on">New</span>}
        {content && tags.map((t) => <span key={t} className="tag">{techName(content, t)}</span>)}
        {card.refs.map((r) => <Link key={r} to={`/practice/${r}`} className="tag">{r}</Link>)}
      </div>
      <div className="flash-main">
        <Html className="flash-front prose" html={card.front} />
        {card.code && <pre className="code-block"><code dangerouslySetInnerHTML={{ __html: card.code }} /></pre>}

        {card.type === "mcq" && card.choices?.map((c, i) => (
          <button key={i} className={`choice ${shown ? (i === card.answer ? "right" : i === pick ? "wrong" : "") : ""}`} onClick={() => choose(i)} disabled={shown}>
            <kbd>{i + 1}</kbd><span dangerouslySetInnerHTML={{ __html: c }} />
          </button>
        ))}

        {(card.type === "code" || card.type === "output") && !shown && (
          <textarea ref={taRef} className="input" rows={card.type === "code" ? 3 : 2} value={typed} onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) setShown(true); }}
            placeholder={card.type === "code" ? "Type it from memory, then press Ctrl+Enter" : "What exactly does it print? Ctrl+Enter to check"}
            style={{ width: "100%", marginTop: 6 }} />
        )}

        {shown && (
          <div className="flash-answer">
            {card.type !== "mcq" && (
              <>
                {typed.trim() && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="flash-label row" style={{ gap: 4 }}>
                      Your answer {correct === true && <><Check style={{ width: 14, color: "var(--green)" }} /> exact match</>}
                      {correct === false && <><X style={{ width: 14, color: "var(--red)" }} /> not an exact match</>}
                    </div>
                    <pre className="code-block" style={{ margin: 0 }}><code>{typed}</code></pre>
                  </div>
                )}
                <div className="flash-label">Answer</div>
                <Html html={card.back || ""} className="prose" />
              </>
            )}
            {card.explain && <Html className="flash-explain prose" html={card.explain} />}
          </div>
        )}
      </div>
      <div className="flash-foot">
        {!shown ? (
          card.type !== "mcq"
            ? <button className="btn btn-accent" style={{ width: "100%" }} onClick={() => setShown(true)}>Show answer</button>
            : <div className="xs t3" style={{ textAlign: "center" }}>Pick an answer</div>
        ) : (
          <div className="grades">
            {GRADES.map((name, i) => (
              <button key={name} className={`grade g${i + 1} ${suggested === i + 1 ? "suggested" : ""}`} onClick={() => onGrade((i + 1) as Grade)}>
                {name}<small>{labels[i]}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
