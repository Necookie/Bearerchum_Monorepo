import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../lib/store";
import { Card, DECK_NAMES } from "../lib/content";
import { buildQueue, techName } from "../lib/learning";
import { Grade, humanDelay, previewLabel, schedule } from "../lib/srs";
import { contestTime } from "../lib/time";
import { Html, Loading, TagChips } from "../components/ui";

type Item = { id: string; isNew: boolean };

export default function Review() {
  const { content, progress, settings, reviewCard } = useStore();
  const [params, setParams] = useSearchParams();
  const deck = params.get("deck") || undefined;
  const tag = params.get("tag") || undefined;

  const [session, setSession] = useState<Item[] | null>(null);
  const [pos, setPos] = useState(0);
  const [done, setDone] = useState({ count: 0, again: 0 });
  const [, setNow] = useState(Date.now());

  const cardsById = useMemo(() => new Map((content?.cards || []).map((c) => [c.id, c])), [content]);
  const q = content ? buildQueue(content, progress, settings, { deck, tag }) : null;

  // (re)start a session whenever the filter changes
  const start = useCallback(() => {
    if (!q) return;
    setSession([...q.due.map((c) => ({ id: c.id, isNew: false })), ...q.fresh.map((c) => ({ id: c.id, isNew: true }))]);
    setPos(0);
    setDone({ count: 0, again: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, deck, tag]);
  useEffect(() => { if (content) start(); }, [content, deck, tag, start]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);

  if (!content || !q || !session) return <Loading />;
  const contest = contestTime(content.contestDate);

  // the next card that is due now (learning cards re-enter the queue when their step is due)
  const remaining = session.slice(pos);
  const nowTs = Date.now();
  const readyIdx = remaining.findIndex((it) => { const s = progress.cards[it.id]; return it.isNew || !s || s.due <= nowTs + 15_000; });
  const current = readyIdx >= 0 ? remaining[readyIdx] : null;
  const waiting = remaining.length - (readyIdx >= 0 ? 1 : 0);

  const onGrade = (item: Item, g: Grade) => {
    const prev = progress.cards[item.id];
    const next = schedule(prev, g, Date.now(), contest);
    reviewCard(item.id, next, g, item.isNew && !prev);
    setDone((d) => ({ count: d.count + 1, again: d.again + (g === 1 ? 1 : 0) }));
    setSession((s) => {
      if (!s) return s;
      const absolute = pos + readyIdx;
      const copy = s.slice();
      copy.splice(absolute, 1);
      if (next.due - Date.now() < 20 * 60_000) copy.push({ id: item.id, isNew: false }); // comes back this session
      // keep `pos` pointing at the first unreviewed item
      return [...copy.slice(0, pos), ...copy.slice(pos)];
    });
  };

  const total = session.length + done.count;
  const pct = total ? done.count / total : 0;
  const filterLabel = tag ? `${tag} · ${techName(content, tag)}` : deck ? DECK_NAMES[deck] : "All decks";

  return (
    <div className="container" style={{ paddingTop: 36 }}>
      <div className="review-shell">
        <div className="review-top">
          <h1 className="heading-lg">Daily review</h1>
          <div className="spacer" />
          <span className="caption">{q.due.length} due · {q.fresh.length} new{!deck && !tag ? ` (${settings.newPerDay}/day)` : ""}</span>
        </div>
        <div className="filters" style={{ margin: "0 0 18px" }}>
          <button className={`chip ${!deck && !tag ? "chip-on" : "chip-outline"}`} onClick={() => setParams({})}>All decks</button>
          {Object.entries(DECK_NAMES).map(([id, name]) => (
            <button key={id} className={`chip ${deck === id ? "chip-on" : "chip-outline"}`} onClick={() => setParams({ deck: id })}>{name}</button>
          ))}
          {tag && <Link className="chip chip-on" to="/review" title="Clear filter">{filterLabel} ✕</Link>}
        </div>

        <div className="row" style={{ marginBottom: 14 }}>
          <div className="progress-line"><i style={{ width: `${pct * 100}%` }} /></div>
          <span className="caption">{done.count} done{done.again ? ` · ${done.again} again` : ""}</span>
        </div>

        {current ? (
          <Flashcard key={`${current.id}-${done.count}`} card={cardsById.get(current.id)!} isNew={current.isNew && !progress.cards[current.id]}
            labels={([1, 2, 3, 4] as Grade[]).map((g) => previewLabel(progress.cards[current.id], g, Date.now(), contest))}
            onGrade={(g) => onGrade(current, g)} />
        ) : waiting > 0 ? (
          <div className="flash" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <h2 className="heading-lg">Short break ☕</h2>
            <p className="mute">{waiting} learning card{waiting > 1 ? "s" : ""} will come back in {nextWait(session.slice(pos), progress.cards)}.</p>
            <button className="btn btn-secondary" onClick={() => setNow(Date.now() + 1)}>Check again</button>
          </div>
        ) : (
          <div className="flash" style={{ alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <div style={{ fontSize: 42 }}>🐻</div>
            <h2 className="heading-lg" style={{ marginTop: 8 }}>{done.count ? "Session complete!" : "Nothing due here right now"}</h2>
            <p className="mute" style={{ maxWidth: 440 }}>
              {done.count ? `You reviewed ${done.count} card${done.count > 1 ? "s" : ""}. ` : ""}
              {q.nextDue ? `Next card is due in ${humanDelay(q.nextDue - Date.now())}.` : "Come back tomorrow for more."}
            </p>
            <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
              <Link to="/practice" className="btn btn-primary">Practice a problem</Link>
              <button className="btn btn-secondary" onClick={start}>Refresh queue</button>
            </div>
          </div>
        )}
        <p className="caption" style={{ textAlign: "center", marginTop: 16 }}>
          Shortcuts: <kbd>Space</kbd> reveal · <kbd>1</kbd>–<kbd>4</kbd> grade (or pick an answer)
        </p>
      </div>
    </div>
  );
}

function nextWait(items: Item[], cards: Record<string, { due: number }>) {
  const ds = items.map((i) => cards[i.id]?.due).filter(Boolean) as number[];
  return ds.length ? humanDelay(Math.max(1000, Math.min(...ds) - Date.now())) : "a moment";
}

const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").trim();

function Flashcard({ card, isNew, labels, onGrade }: { card: Card; isNew: boolean; labels: string[]; onGrade: (g: Grade) => void }) {
  const [shown, setShown] = useState(false);
  const [pick, setPick] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  const reveal = () => setShown(true);
  const choose = (i: number) => { if (!shown) { setPick(i); setShown(true); } };
  const correct = card.type === "mcq" ? pick === card.answer
    : card.type === "output" && typed.trim() ? norm(typed) === norm(card.backRaw || "") : null;
  const suggested: Grade | null = correct === null ? null : correct ? 3 : 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === taRef.current && !(e.key === "Enter" && (e.ctrlKey || e.metaKey))) return;
      if (!shown) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); reveal(); }
        if (card.type === "mcq" && /^[1-4]$/.test(e.key) && card.choices && +e.key <= card.choices.length) choose(+e.key - 1);
      } else if (/^[1-4]$/.test(e.key)) {
        onGrade(+e.key as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flash">
      <div className="flash-meta">
        <span className="chip">{DECK_NAMES[card.deck] || card.deck}</span>
        {isNew && <span className="chip" style={{ background: "var(--honey-soft)" }}>new</span>}
        <TagChips tags={card.tags.filter((t) => t !== card.deck)} link={false} />
        {card.refs.map((r) => <Link key={r} to={`/practice/${r}`} className="chip chip-outline">{r}</Link>)}
      </div>

      <Html className="flash-front prose" html={card.front} />
      {card.code && <pre className="code-block py"><code dangerouslySetInnerHTML={{ __html: card.code }} /></pre>}

      {card.type === "mcq" && card.choices && (
        <div>
          {card.choices.map((c, i) => {
            const cls = shown ? (i === card.answer ? "right" : i === pick ? "wrong" : "") : "";
            return (
              <button key={i} className={`choice ${cls}`} onClick={() => choose(i)} disabled={shown}>
                <kbd>{i + 1}</kbd><span dangerouslySetInnerHTML={{ __html: c }} />
              </button>
            );
          })}
        </div>
      )}

      {(card.type === "code" || card.type === "output") && !shown && (
        <textarea ref={taRef} className="input typed-answer" rows={card.type === "code" ? 3 : 2} value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={card.type === "code" ? "Type the code from memory (optional), then reveal…" : "What exactly does it print? (optional)"}
          style={{ marginTop: 6 }} />
      )}

      {shown && (
        <div className="flash-answer">
          {card.type !== "mcq" && (
            <>
              {typed.trim() && (
                <div style={{ marginBottom: 8 }}>
                  <div className="micro-cap mute" style={{ marginBottom: 6 }}>
                    You wrote {correct === true ? "✓ exact match" : correct === false ? "✗ not exact" : ""}
                  </div>
                  <pre className="code-block" style={{ margin: 0 }}><code>{typed}</code></pre>
                </div>
              )}
              <div className="micro-cap mute" style={{ marginBottom: 6 }}>Answer</div>
              <Html html={card.back || ""} className="prose" />
            </>
          )}
          {card.explain && <Html className="prose callout" html={card.explain} />}
        </div>
      )}

      <div className="flash-foot">
        {!shown ? (
          card.type !== "mcq" && <button className="btn btn-primary" style={{ width: "100%" }} onClick={reveal}>Show answer</button>
        ) : (
          <div className="grades">
            {(["Again", "Hard", "Good", "Easy"] as const).map((name, i) => (
              <button key={name} className={`grade g${i + 1}`} onClick={() => onGrade((i + 1) as Grade)}
                style={suggested === i + 1 ? { outline: "2px solid currentColor" } : undefined}>
                {name}<small>{labels[i]} · {i + 1}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
