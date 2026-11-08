import { useState } from "react";
import { Copy, FileInput } from "lucide-react";
import { SolutionEntry } from "../lib/content";
import { Html } from "./ui";

/** Annotated solution: each explanation block shows its own lines of code above the text. */
export default function ExplainedCode({ sol, onLoad }: { sol: SolutionEntry; onLoad?: (code: string) => void }) {
  const [mode, setMode] = useState<"walk" | "full">(sol.explain ? "walk" : "full");
  const [copied, setCopied] = useState(false);
  const ex = sol.explain;

  const lines = (a: number, b: number) => sol.lines.slice(a - 1, b).map((html, i) => (
    <div className="cline" key={a + i}><span className="ln">{a + i}</span><span dangerouslySetInnerHTML={{ __html: html || " " }} /></div>
  ));

  return (
    <div>
      <div className="row" style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: "var(--fs-md)" }} dangerouslySetInnerHTML={{ __html: sol.title }} />
        <div className="spacer" />
        {ex && (
          <div className="seg">
            <button className={mode === "walk" ? "on" : ""} onClick={() => setMode("walk")}>Line by line</button>
            <button className={mode === "full" ? "on" : ""} onClick={() => setMode("full")}>Full code</button>
          </div>
        )}
        <button className="btn icon-btn sm" title={copied ? "Copied" : "Copy code"} onClick={() => { navigator.clipboard?.writeText(sol.code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}><Copy /></button>
        {onLoad && <button className="btn icon-btn sm" title="Load into editor" onClick={() => onLoad(sol.code)}><FileInput /></button>}
      </div>

      {ex && mode === "walk" ? (
        <>
          <Html className="explain-summary prose" html={ex.summary} />
          {ex.blocks.map((b, i) => (
            <div className="xblock" key={i}>
              <div className="xblock-code">{lines(b.lines[0], b.lines[1])}</div>
              <div className="xblock-text">
                <b className="t" dangerouslySetInnerHTML={{ __html: b.title }} />
                <Html className="prose" html={b.text} />
              </div>
            </div>
          ))}
          <div className="note-block" style={{ marginTop: 12 }}>
            <b>Complexity.</b> <span dangerouslySetInnerHTML={{ __html: ex.complexity }} />
            {ex.pitfalls.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{ex.pitfalls.map((p, i) => <li key={i} dangerouslySetInnerHTML={{ __html: p }} />)}</ul>
            )}
          </div>
        </>
      ) : (
        <div className="xblock"><div className="xblock-code" style={{ borderBottom: 0 }}>{lines(1, sol.lines.length)}</div></div>
      )}
    </div>
  );
}
