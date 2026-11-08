import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView, keymap } from "@codemirror/view";
import { indentUnit } from "@codemirror/language";
import { useMemo } from "react";

const theme = EditorView.theme({
  "&": { backgroundColor: "#fff" },
  ".cm-content": { fontFamily: "var(--mono)", padding: "10px 0" },
  ".cm-gutters": { fontFamily: "var(--mono)" },
  ".cm-cursor": { borderLeftColor: "#2f1c14", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "#ffe3b5 !important" },
});

export default function CodeEditor({ value, onChange, onRun, onSubmit, height = "420px" }: {
  value: string; onChange: (v: string) => void; onRun?: () => void; onSubmit?: () => void; height?: string;
}) {
  const extensions = useMemo(() => [
    python(),
    indentUnit.of("    "),
    theme,
    keymap.of([
      { key: "Mod-Enter", run: () => { onRun?.(); return true; } },
      { key: "Shift-Mod-Enter", run: () => { onSubmit?.(); return true; } },
    ]),
  ], [onRun, onSubmit]);

  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        height={height}
        extensions={extensions}
        onChange={onChange}
        basicSetup={{ tabSize: 4, highlightActiveLine: true, foldGutter: false, autocompletion: true }}
      />
    </div>
  );
}
