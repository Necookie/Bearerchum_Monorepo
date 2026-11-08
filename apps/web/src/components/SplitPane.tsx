import { useRef } from "react";

/** Drag handle that reports a new size (percent of the parent) while dragging. */
export function Gutter({ dir, onResize, min = 20, max = 80 }: {
  dir: "x" | "y"; onResize: (pct: number) => void; min?: number; max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const start = (e: React.PointerEvent) => {
    const el = ref.current!;
    const parent = el.parentElement!;
    const rect = parent.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    el.classList.add("dragging");
    document.body.classList.add("resizing", dir === "x" ? "col" : "row");
    const move = (ev: PointerEvent) => {
      const pct = dir === "x" ? ((ev.clientX - rect.left) / rect.width) * 100 : ((ev.clientY - rect.top) / rect.height) * 100;
      onResize(Math.max(min, Math.min(max, pct)));
    };
    const up = () => {
      el.classList.remove("dragging");
      document.body.classList.remove("resizing", "col", "row");
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };
  return <div ref={ref} className={`gutter gutter-${dir}`} onPointerDown={start} role="separator" aria-orientation={dir === "x" ? "vertical" : "horizontal"} />;
}
