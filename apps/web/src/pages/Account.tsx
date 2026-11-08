import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../lib/store";
import { api } from "../lib/api";
import { PageHero } from "../components/ui";

export default function Account() {
  const { user, signIn, signOut, settings, updateSettings, progress, toast } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [team, setTeam] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needCode, setNeedCode] = useState(true);
  const nav = useNavigate();

  useEffect(() => { api<{ teamCodeRequired: boolean }>("/config").then((c) => setNeedCode(c.teamCodeRequired)).catch(() => undefined); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      await signIn(mode, name.trim(), pin, team.trim());
      toast(mode === "register" ? `Welcome to the team, ${name.trim()}!` : `Welcome back, ${name.trim()}`);
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
      <>
        <PageHero eyebrow="Account" title={`Hi, ${user.name}`}><p className="body-lg mute">Your progress syncs to the team server, so you can switch devices.</p></PageHero>
        <div className="container section">
          <div className="grid grid-2">
            <div className="card">
              <h2 className="heading-md">Study settings</h2>
              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="npd">New cards per day</label>
                <input id="npd" className="input" type="number" min={5} max={150} value={settings.newPerDay}
                  onChange={(e) => updateSettings({ newPerDay: Math.max(5, Math.min(150, Number(e.target.value) || 30)) })} />
                <span className="caption">With 6 days to go, 25–35 a day covers the whole deck with time to review it.</span>
              </div>
            </div>
            <div className="card">
              <h2 className="heading-md">Your data</h2>
              <p className="mute">{Object.keys(progress.cards).length} cards studied · {solved} problems solved.</p>
              <div className="row">
                <button className="btn btn-secondary btn-sm" onClick={exportData}>Export progress (JSON)</button>
                <button className="btn btn-outline btn-sm" onClick={async () => { await signOut(); toast("Signed out"); }}>Sign out</button>
              </div>
              <div className="hr" />
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--error)" }} onClick={async () => {
                const p = prompt("This permanently deletes your account and all synced progress. Enter your PIN to confirm:");
                if (!p) return;
                try { await api("/me/delete", { body: { pin: p } }); await signOut(); toast("Account deleted"); }
                catch (e: any) { toast(e.message || "Could not delete account"); }
              }}>Delete my account</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHero eyebrow="Account" title={mode === "login" ? "Sign in" : "Join the team"}>
        <p className="body-lg mute">You can study as a guest (progress stays in this browser). Sign in to sync across devices and appear on the team board — guest progress moves into your account.</p>
      </PageHero>
      <div className="container section">
        <form className="card" onSubmit={submit} style={{ maxWidth: 480, margin: "0 auto", padding: 32 }}>
          <div className="tabs" style={{ marginBottom: 20 }}>
            <button type="button" className={`tab ${mode === "login" ? "on" : ""}`} onClick={() => setMode("login")}>Sign in</button>
            <button type="button" className={`tab ${mode === "register" ? "on" : ""}`} onClick={() => setMode("register")}>Create account</button>
          </div>
          <div className="stack">
            <div className="field"><label htmlFor="n">Name</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" required minLength={2} maxLength={24} placeholder="e.g. Dheyn" /></div>
            <div className="field"><label htmlFor="p">PIN</label><input id="p" className="input" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={4} maxLength={32} placeholder="at least 4 characters" /></div>
            {mode === "register" && needCode && (
              <div className="field"><label htmlFor="t">Team code</label><input id="t" className="input" value={team} onChange={(e) => setTeam(e.target.value)} required placeholder="ask your team captain" /></div>
            )}
            {err && <div className="error-text">{err}</div>}
            <button className="btn btn-primary" disabled={busy} style={{ width: "100%" }}>{busy ? "…" : mode === "login" ? "Sign in" : "Create account"}</button>
          </div>
        </form>
      </div>
    </>
  );
}
