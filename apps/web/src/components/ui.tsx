import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { levelClass } from "../lib/content";
import { useStore } from "../lib/store";
import { techName } from "../lib/learning";

/** Renders trusted HTML produced by our own content build. */
export function Html({ html, className, as: Tag = "div" }: { html: string; className?: string; as?: "div" | "span" | "li" | "p" }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="16" cy="16" r="10" fill="currentColor" />
      <circle cx="48" cy="16" r="10" fill="currentColor" />
      <circle cx="32" cy="36" r="24" fill="currentColor" />
      <ellipse cx="32" cy="44" rx="11" ry="8.5" fill="#e9a23b" />
      <circle cx="23" cy="31" r="3" fill="#fff" />
      <circle cx="41" cy="31" r="3" fill="#fff" />
      <ellipse cx="32" cy="41" rx="4" ry="3" fill="currentColor" />
    </svg>
  );
}

export function LevelBadge({ level }: { level: string }) {
  return <span className={`level ${levelClass(level)}`}>{level}</span>;
}

export function TagChips({ tags, link = true }: { tags: string[]; link?: boolean }) {
  const { content } = useStore();
  if (!content) return null;
  return (
    <>
      {tags.map((t) => {
        const label = t.startsWith("T") ? `${t} · ${techName(content, t)}` : techName(content, t);
        return link && t.startsWith("T")
          ? <Link key={t} className="chip chip-tag" to={`/learn/techniques#${t}`} title={techName(content, t)}>{label}</Link>
          : <span key={t} className="chip chip-tag">{label}</span>;
      })}
    </>
  );
}

export function Terminal({ title, html, copy }: { title: string; html: string; copy?: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="terminal">
      <div className="terminal-h">
        <span>{title}</span>
        {copy !== undefined && (
          <button className="copy-btn" onClick={() => { navigator.clipboard?.writeText(copy); setDone(true); setTimeout(() => setDone(false), 1200); }}>
            {done ? "copied" : "copy input"}
          </button>
        )}
      </div>
      <pre dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export function Bar({ value, tone = "" }: { value: number; tone?: "" | "honey" | "success" }) {
  return <div className={`bar ${tone}`}><i style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} /></div>;
}

export function Spinner() { return <span className="spinner" aria-label="loading" />; }

export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <section className="mesh page-hero">
      <div className="container">
        {eyebrow && <div className="eyebrow micro-cap">{eyebrow}</div>}
        <h1 className="display-xl">{title}</h1>
        {children}
      </div>
    </section>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <div className="empty"><div className="row" style={{ justifyContent: "center" }}><Spinner /> {label}</div></div>;
}
