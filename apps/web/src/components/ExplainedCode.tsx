import { useState } from "react";
import { SolutionEntry } from "../lib/content";
import { Html } from "./ui";

/** Annotated solution: each explanation block shows its own lines of code next to the text. */
export default function ExplainedCode({ sol, onLoad }: { sol: SolutionEntry; onLoad?: (code: string) => void }) {
  const [mode, setMode] = useState<"walk" | "full">(sol.explain ? "walk" : "full");
  const [copied, setCopied] = useState(false);
  const ex = sol.explain;

  const lines = (a: number, b: number) => (
    <div>
      {sol.lines.slice(a - 1, b).map((html, i) => (
        <div className="cline" key={a + i}><span className="ln">{a + i}</span><span dangerouslySetInnerHTML={{ __html: html || " " }} /></div>
      ))}
    </div>
  );

  return (
    <div style={{ marginTop: 8 }}>
      <div className="row" style={{ marginBottom: 10 }}>
        <h3 className="heading-sm">{sol.title}</h3>
        {sol.file && <code>{sol.file}</code>}
        <div className="spacer" />
        {ex && (
          <div className="tabs">
            <button className={`tab ${mode === "walk" ? "on" : ""}`} onClick={() => setMode("walk")}>Line by line</button>
            <button className={`tab ${mode === "full" ? "on" : ""}`} onClick={() => setMode("full")}>Full code</button>
          </div>
        )}
      </div>

      {ex && mode === "walk" && (
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
          <div className="callout" style={{ marginTop: 14 }}>
            <b>Speed: </b><span dangerouslySetInnerHTML={{ __html: ex.complexity }} />
            {ex.pitfalls.length > 0 && (
              <ul className="list-mist" style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                {ex.pitfalls.map((p, i) => <li key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
              </ul>
            )}
          </div>
        </>
      )}

      {mode === "full" && (
        <div className="xblock" style={{ gridTemplateColumns: "1fr" }}>
          <div className="xblock-code" style={{ borderRight: 0 }}>{lines(1, sol.lines.length)}</div>
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard?.writeText(sol.code); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? "Copied" : "Copy code"}
        </button>
        {onLoad && <button className="btn btn-ghost btn-sm" onClick={() => onLoad(sol.code)}>Load into editor</button>}
      </div>
    </div>
  );
}
