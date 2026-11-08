import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, getToken, setToken } from "./api";
import { ContentIndex, loadIndex } from "./content";
import { CardState, Grade } from "./srs";
import { dayKey } from "./time";

export interface ProblemStatus {
  bestPassed: number; total: number; solved: boolean; attempts: number; solvedAt?: number | null; lastTs: number;
}
export interface DayStat { reviews: number; new: number; attempts: number }
export interface Settings { newPerDay: number }
export interface Progress {
  cards: Record<string, CardState>;
  problems: Record<string, ProblemStatus>;
  drafts: Record<string, string>;
  days: Record<string, DayStat>;
}
export interface User { id: number; name: string; settings: Partial<Settings> }

const GUEST_KEY = "bearerchum.guest.v1";
const SETTINGS_KEY = "bearerchum.settings.v1";
const EMPTY: Progress = { cards: {}, problems: {}, drafts: {}, days: {} };
export const DEFAULT_SETTINGS: Settings = { newPerDay: 30 };

function readGuest(): Progress {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
  } catch { return { ...EMPTY }; }
}
function writeGuest(p: Progress) {
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(p)); } catch { /* storage full / blocked */ }
}
function hasData(p: Progress) {
  return Object.keys(p.cards).length > 0 || Object.keys(p.problems).length > 0;
}

interface Store {
  content: ContentIndex | null;
  contentError: string | null;
  user: User | null;
  ready: boolean;
  progress: Progress;
  settings: Settings;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
  signIn: (mode: "login" | "register", name: string, pin: string, teamCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  reviewCard: (id: string, state: CardState, grade: Grade, isNew: boolean) => void;
  recordAttempt: (problemId: string, kind: "run" | "submit", passed: number, total: number, code: string) => void;
  saveDraft: (problemId: string, code: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ContentIndex | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<Progress>(() => readGuest());
  const [settings, setSettings] = useState<Settings>(() => {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; }
    catch { return DEFAULT_SETTINGS; }
  });
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const userRef = useRef<User | null>(null);
  userRef.current = user;
  const draftTimers = useRef<Record<string, number>>({});

  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // content
  useEffect(() => {
    loadIndex().then(setContent).catch((e) => setContentError(String(e.message || e)));
  }, []);

  // session restore
  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    (async () => {
      try {
        const me = await api<{ user: User }>("/me");
        const prog = await api<Progress>("/progress");
        setUser(me.user);
        setProgress({ ...EMPTY, ...prog });
        if (me.user.settings) setSettings((s) => ({ ...s, ...me.user.settings }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) setToken(null);
        else toast("Offline — showing this browser's progress");
      } finally { setReady(true); }
    })();
  }, [toast]);

  const mutate = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((p) => {
      const next = fn(p);
      if (!userRef.current) writeGuest(next);
      return next;
    });
  }, []);

  const bumpDay = (p: Progress, field: keyof DayStat): Progress => {
    const k = dayKey();
    const d = p.days[k] || { reviews: 0, new: 0, attempts: 0 };
    return { ...p, days: { ...p.days, [k]: { ...d, [field]: d[field] + 1 } } };
  };

  const remote = useCallback((fn: () => Promise<unknown>) => {
    if (!userRef.current) return;
    fn().catch((e) => toast(e instanceof ApiError && e.status === 401 ? "Signed out — sign in again to sync" : "Couldn't sync — check your connection"));
  }, [toast]);

  const reviewCard: Store["reviewCard"] = (id, state, grade, isNew) => {
    mutate((p) => {
      let n = { ...p, cards: { ...p.cards, [id]: state } };
      n = bumpDay(n, "reviews");
      if (isNew) n = bumpDay(n, "new");
      return n;
    });
    remote(() => api(`/progress/cards/${encodeURIComponent(id)}`, { method: "PUT", body: { state, grade, isNew } }));
  };

  const recordAttempt: Store["recordAttempt"] = (problemId, kind, passed, total, code) => {
    mutate((p) => {
      const prev = p.problems[problemId];
      const solved = kind === "submit" && total > 0 && passed === total;
      const now = Math.floor(Date.now() / 1000);
      const better = kind === "submit" && (!prev || passed >= prev.bestPassed);
      const st: ProblemStatus = {
        bestPassed: better ? passed : prev?.bestPassed ?? 0,
        total: better ? total : prev?.total ?? 0,
        solved: !!prev?.solved || solved,
        attempts: (prev?.attempts ?? 0) + 1,
        solvedAt: prev?.solvedAt ?? (solved ? now : null),
        lastTs: now,
      };
      return bumpDay({ ...p, problems: { ...p.problems, [problemId]: st }, drafts: { ...p.drafts, [problemId]: code } }, "attempts");
    });
    remote(() => api("/progress/attempts", { body: { problemId, kind, passed, total, code } }));
  };

  const saveDraft: Store["saveDraft"] = (problemId, code) => {
    mutate((p) => ({ ...p, drafts: { ...p.drafts, [problemId]: code } }));
    window.clearTimeout(draftTimers.current[problemId]);
    draftTimers.current[problemId] = window.setTimeout(
      () => remote(() => api(`/progress/drafts/${problemId}`, { method: "PUT", body: { code } })), 1200);
  };

  const updateSettings: Store["updateSettings"] = (s) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      remote(() => api("/settings", { method: "PUT", body: { settings: next } }));
      return next;
    });
  };

  const signIn: Store["signIn"] = async (mode, name, pin, teamCode) => {
    const res = await api<{ token: string; user: User }>(`/auth/${mode}`, { body: { name, pin, teamCode } });
    setToken(res.token);
    const guest = readGuest();
    let prog: Progress;
    if (hasData(guest)) {
      prog = await api<Progress>("/progress/import", { body: { cards: guest.cards, problems: guest.problems, drafts: guest.drafts } });
      try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
      toast("Your guest progress was moved into your account");
    } else {
      prog = await api<Progress>("/progress");
    }
    setUser(res.user);
    setProgress({ ...EMPTY, ...prog });
    if (res.user.settings) setSettings((s) => ({ ...s, ...res.user.settings }));
  };

  const signOut = async () => {
    try { await api("/auth/logout", { body: {} }); } catch { /* ignore */ }
    setToken(null);
    setUser(null);
    setProgress(readGuest());
  };

  const value = useMemo<Store>(() => ({
    content, contentError, user, ready, progress, settings, toast, toasts,
    signIn, signOut, reviewCard, recordAttempt, saveDraft, updateSettings,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [content, contentError, user, ready, progress, settings, toasts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
