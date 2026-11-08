import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useMatch } from "react-router-dom";
import { Flame, Menu, Moon, Sun, Timer, UserRound } from "lucide-react";
import { useStore } from "../lib/store";
import { buildQueue } from "../lib/learning";
import { contestTime, countdown, streakFrom } from "../lib/time";
import { useTheme } from "../lib/theme";
import { Logo } from "./ui";

export function ThemeButton() {
  const [theme, toggle] = useTheme();
  return (
    <button className="btn icon-btn" onClick={toggle} title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} aria-label="Toggle theme">
      {theme === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}

export function AccountButton() {
  const { user } = useStore();
  return user
    ? <Link to="/account" className="btn btn-ghost btn-sm" title="Account"><span className="avatar" style={{ width: 22, height: 22, fontSize: 11 }}>{user.name[0].toUpperCase()}</span><span className="hide-sm">{user.name}</span></Link>
    : <Link to="/account" className="btn btn-outline btn-sm" title="Sign in"><UserRound /><span className="hide-xs">Sign in</span></Link>;
}

export default function Layout() {
  const { content, progress, settings, toasts } = useStore();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const inWorkspace = useMatch("/practice/:id");

  useEffect(() => { setOpen(false); if (!inWorkspace) window.scrollTo({ top: 0 }); }, [loc.pathname, inWorkspace]);

  const toastEl = <div className="toast-wrap">{toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}</div>;
  if (inWorkspace) return <><Outlet />{toastEl}</>;   // the problem page brings its own IDE chrome

  const q = content ? buildQueue(content, progress, settings) : null;
  const dueCount = q ? q.due.length + q.fresh.length : 0;
  const cd = content ? countdown(contestTime(content.contestDate)) : null;
  const streak = streakFrom(progress.days);

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label="Bearerchum home"><Logo /><span className="brand-word">bearerchum</span></Link>
          <nav className={`nav-links row ${open ? "open" : ""}`} style={{ gap: 0 }}>
            <NavLink to="/" end className="nav-link">Today</NavLink>
            <NavLink to="/practice" className="nav-link">Problems</NavLink>
            <NavLink to="/review" className="nav-link">Review {dueCount > 0 && <span className="nav-badge">{dueCount}</span>}</NavLink>
            <NavLink to="/learn" className="nav-link">Learn</NavLink>
            <NavLink to="/team" className="nav-link">Team</NavLink>
          </nav>
          <div className="spacer" />
          {cd && !cd.done && <span className="nav-meta hide-sm" title="Time until the CodeChum NPC"><Timer /> {cd.d}d {cd.h}h to NPC</span>}
          <span className="nav-meta" title="Day streak"><Flame className="flame" /> {streak}</span>
          <ThemeButton />
          <AccountButton />
          <button className="btn icon-btn nav-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}><Menu /></button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="container row">
          <span>Bearerchum by CodeBearers</span>
          <a href="/reviewer.pdf" target="_blank" rel="noreferrer">PDF reviewer</a>
          <a href="https://github.com/Necookie/Bearerchum_Monorepo" target="_blank" rel="noreferrer">Source</a>
          <span className="spacer" />
          <span>Independent study tool, not affiliated with CodeChum.</span>
        </div>
      </footer>
      {toastEl}
    </>
  );
}
