import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { api } from "../lib/api";

export default function Account() {
  const { user, signIn, signOut, settings, updateSettings, progress, toast } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [team, setTeam] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needCode, setNeedCode] = useState(true);
  const [offline, setOffline] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    api<{ teamCodeRequired: boolean }>("/config").then((c) => setNeedCode(c.teamCodeRequired)).catch(() => setOffline(true));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await signIn(mode, name.trim(), pin, team.trim());
      toast(mode === "register" ? `Account created. Welcome, ${name.trim()}.` : `Signed in as ${name.trim()}.`);
      nav("/");
    } catch (e: any) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), progress, settings }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bearerchum-progress-${user?.name || "guest"}.json`;
    a.click();
  };

  if (user) {
    const solved = Object.values(progress.problems).filter((p) => p.solved).length;
    return (
      <div className="container page" style={{ maxWidth: 760 }}>
        <div className="page-head"><div><h1>{user.name}</h1><p>Your progress syncs to the team server, so you can switch devices.</p></div></div>
        <section className="panel">
          <div className="panel-head"><h2>Study settings</h2></div>
          <div className="panel-body field">
            <label htmlFor="npd">New cards per day</label>
            <input id="npd" className="input" style={{ width: 120 }} type="number" min={5} max={150} value={settings.newPerDay}
              onChange={(e) => updateSettings({ newPerDay: Math.max(5, Math.min(150, Number(e.target.value) || 30)) })} />
            <span className="xs t3">25 to 35 a day covers the whole deck before Saturday with time left to review it.</span>
          </div>
        </section>
        <section className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head"><h2>Your data</h2><div className="spacer" /><span className="xs t3">{Object.keys(progress.cards).length} cards studied, {solved} problems solved</span></div>
          <div className="panel-body row">
            <button className="btn" onClick={exportData}>Export progress</button>
            <button className="btn btn-outline" onClick={async () => { await signOut(); toast("Signed out."); }}>Sign out</button>
            <div className="spacer" />
            <button className="btn btn-danger" onClick={async () => {
              const p = prompt("This permanently deletes your account and all synced progress. Enter your PIN to confirm.");
              if (!p) return;
              try { await api("/me/delete", { body: { pin: p } }); await signOut(); toast("Account deleted."); }
              catch (e: any) { toast(e.message || "Could not delete the account."); }
            }}>Delete account</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="auth">
        <h1 style={{ textAlign: "center", marginBottom: 6 }}>{mode === "login" ? "Sign in" : "Create an account"}</h1>
        <p className="t2 sm" style={{ textAlign: "center", marginBottom: 20 }}>
          You can study without an account; progress stays in this browser. An account syncs across devices, shows you on the team board, and keeps your guest progress.
        </p>
        <form className="panel" onSubmit={submit}>
          <div className="panel-head" style={{ padding: "0 10px" }}>
            <button type="button" className={`tab ${mode === "login" ? "on" : ""}`} onClick={() => setMode("login")}>Sign in</button>
            <button type="button" className={`tab ${mode === "register" ? "on" : ""}`} onClick={() => setMode("register")}>Create account</button>
          </div>
          <div className="panel-body stack">
            {offline && <div className="note-block">The team server is not reachable right now. You can keep studying; your progress is saved in this browser.</div>}
            <div className="field"><label htmlFor="n">Name</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" required minLength={2} maxLength={24} /></div>
            <div className="field"><label htmlFor="p">PIN</label><input id="p" className="input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={4} maxLength={32} /></div>
            {mode === "register" && needCode && (
              <div className="field"><label htmlFor="t">Team code</label><input id="t" className="input" value={team} onChange={(e) => setTeam(e.target.value)} required /><span className="xs t3">Ask your team captain for it.</span></div>
            )}
            {err && <div className="error-text">{err}</div>}
            <button className="btn btn-accent btn-lg" disabled={busy} style={{ width: "100%" }}>{busy ? "Working" : mode === "login" ? "Sign in" : "Create account"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
