import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStore } from "../lib/store";
import { buildQueue } from "../lib/learning";
import { contestTime, countdown } from "../lib/time";
import { Logo } from "./ui";

export default function Layout() {
  const { user, content, progress, settings, toasts } = useStore();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const due = content ? buildQueue(content, progress, settings) : null;
  const dueCount = due ? due.due.length + due.fresh.length : 0;

  return (
    <>
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label="Bearerchum home"><Logo /><span className="brand-word">bearerchum</span></Link>
          <nav className={`nav-links ${open ? "open" : ""}`}>
            <NavLink to="/" end className="nav-link">Today</NavLink>
            <NavLink to="/review" className="nav-link">Review {dueCount > 0 && <span className="nav-count">{dueCount}</span>}</NavLink>
            <NavLink to="/practice" className="nav-link">Practice</NavLink>
            <NavLink to="/learn" className="nav-link">Learn</NavLink>
            <NavLink to="/team" className="nav-link">Team</NavLink>
            <NavLink to="/account" className="nav-link nav-only-mobile">{user ? `Account · ${user.name}` : "Sign in"}</NavLink>
          </nav>
          <div className="spacer" />
          {user
            ? <Link to="/account" className="btn btn-secondary btn-sm nav-cta-secondary">{user.name}</Link>
            : <Link to="/account" className="btn btn-secondary btn-sm nav-cta-secondary">Sign in</Link>}
          <Link to="/review" className="btn btn-primary btn-sm nav-cta-primary">Start review</Link>
          <button className="nav-burger" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
      </header>

      <main><Outlet /></main>

      <Footer />
      <div className="toast-wrap">{toasts.map((t) => <div key={t.id} className="toast">{t.msg}</div>)}</div>
    </>
  );
}

function Footer() {
  const { content } = useStore();
  const target = content ? contestTime(content.contestDate) : 0;
  const cd = countdown(target);
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <div className="micro-cap" style={{ color: "var(--honey)" }}>CodeBearers · NPC 2026</div>
            <h2 className="display-md" style={{ marginTop: 12 }}>
              {cd.done ? "Contest day has passed — keep the streak alive." : `${cd.d} day${cd.d === 1 ? "" : "s"}, ${cd.h} h to go. Make each one count.`}
            </h2>
            <p>Fifteen minutes of review plus one problem a day beats a night of cramming.</p>
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <a className="btn btn-on-primary" href="/reviewer.pdf" target="_blank" rel="noreferrer">Download PDF reviewer</a>
            <Link className="btn btn-secondary" to="/practice">Practice now</Link>
          </div>
        </div>
        <div className="footer-cols">
          <div><h4>Study</h4><ul><li><Link to="/review">Daily review</Link></li><li><Link to="/practice">Practice judge</Link></li><li><Link to="/learn/techniques">Techniques</Link></li></ul></div>
          <div><h4>Learn</h4><ul><li><Link to="/learn/rules">Contest-day rules</Link></li><li><Link to="/learn/python">Python must-know</Link></li><li><Link to="/learn/ds">Data structures</Link></li></ul></div>
          <div><h4>Team</h4><ul><li><Link to="/team">Team board</Link></li><li><Link to="/account">Account</Link></li></ul></div>
          <div><h4>Project</h4><ul><li><a href="https://github.com/Necookie/Bearerchum_Monorepo" target="_blank" rel="noreferrer">Source on GitHub</a></li><li><a href="/reviewer.pdf" target="_blank" rel="noreferrer">PDF reviewer</a></li></ul></div>
        </div>
        <div className="footer-legal">
          <span>© 2026 CodeBearers · Bearerchum</span>
          <span>Independent study tool — not affiliated with CodeChum.</span>
          <span>Python runs in your browser via Pyodide.</span>
        </div>
      </div>
    </footer>
  );
}
