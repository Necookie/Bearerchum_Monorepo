import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "bearerchum.theme";

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

const listeners = new Set<(t: Theme) => void>();

export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  listeners.forEach((l) => l(t));
}

export function useTheme(): [Theme, () => void] {
  const [t, setT] = useState<Theme>(currentTheme());
  useEffect(() => { listeners.add(setT); return () => { listeners.delete(setT); }; }, []);
  return [t, () => setTheme(t === "dark" ? "light" : "dark")];
}

/** Persisted number (pane sizes etc.). */
export function usePersisted(key: string, initial: number): [number, (v: number) => void] {
  const [v, setV] = useState<number>(() => {
    try { const s = localStorage.getItem(key); return s ? Number(s) : initial; } catch { return initial; }
  });
  const set = (n: number) => { setV(n); try { localStorage.setItem(key, String(n)); } catch { /* ignore */ } };
  return [v, set];
}
