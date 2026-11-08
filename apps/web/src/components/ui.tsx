import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { useStore } from "../lib/store";
import { techName } from "../lib/learning";

/** Renders trusted HTML produced by our own content build. */
export function Html({ html, className, as: Tag = "div" }: { html: string; className?: string; as?: "div" | "span" | "li" | "p" }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="16" cy="16" r="10" fill="currentColor" />
      <circle cx="48" cy="16" r="10" fill="currentColor" />
      <circle cx="32" cy="36" r="24" fill="currentColor" />
      <ellipse cx="32" cy="44" rx="10" ry="8" fill="var(--surface)" />
      <circle cx="23" cy="31" r="3" fill="var(--surface)" />
      <circle cx="41" cy="31" r="3" fill="var(--surface)" />
      <ellipse cx="32" cy="41" rx="3.6" ry="2.8" fill="currentColor" />
    </svg>
  );
}

export function diffKey(level: string): "easy" | "medium" | "hard" {
  const l = level.toLowerCase();
  if (l.includes("hard")) return "hard";
  if (l.includes("medium")) return "medium";
  return "easy";
}

/** LeetCode-style difficulty: coloured text, not a badge. */
export function Difficulty({ level, pill = false }: { level: string; pill?: boolean }) {
  const k = diffKey(level);
  return <span className={`diff diff-${k} ${pill ? "diff-pill" : ""}`}>{level}</span>;
}

export function TagList({ tags, link = true, max = 3 }: { tags: string[]; link?: boolean; max?: number }) {
  const { content } = useStore();
  if (!content) return null;
  return (
    <>
      {tags.slice(0, max).map((t) => link && t.startsWith("T")
        ? <Link key={t} className="tag" to={`/learn/techniques#${t}`} title={`${t}: ${techName(content, t)}`}>{techName(content, t)}</Link>
        : <span key={t} className="tag" title={t}>{techName(content, t)}</span>)}
    </>
  );
}

export function StatusIcon({ status }: { status: "solved" | "tried" | "new" }) {
  if (status === "solved") return <CheckCircle2 className="ok-ico" aria-label="Solved" />;
  if (status === "tried") return <CircleDashed className="try-ico" aria-label="Attempted" />;
  return <span aria-label="Not started" />;
}

export function Bar({ value, tone = "" }: { value: number; tone?: "" | "green" | "easy" | "medium" | "hard" }) {
  return <div className={`bar ${tone}`}><i style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} /></div>;
}

export function Ring({ value, label, sub }: { value: number; label: string; sub: string }) {
  const r = 34, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, value));
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" role="img" aria-label={`${label} ${sub}`}>
      <circle cx="46" cy="46" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="6" />
      <circle cx="46" cy="46" r={r} fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 46 46)" />
      <text x="46" y="45" textAnchor="middle" fill="var(--text)" fontSize="18" fontWeight="600" fontFamily="var(--font)">{label}</text>
      <text x="46" y="61" textAnchor="middle" fill="var(--text-3)" fontSize="11" fontFamily="var(--font)">{sub}</text>
    </svg>
  );
}

export function Spinner() { return <span className="spinner" aria-label="Loading" />; }

export function Loading({ label = "Loading" }: { label?: string }) {
  return <div className="empty"><div className="row" style={{ justifyContent: "center" }}><Spinner /> {label}</div></div>;
}
