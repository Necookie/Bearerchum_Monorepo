import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView, keymap } from "@codemirror/view";
import { HighlightStyle, indentUnit, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { useMemo } from "react";
import { useTheme } from "../lib/theme";

// Colours come from CSS variables so both themes stay in sync with the rest of the app.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword, t.bool, t.null], color: "var(--tk-kw)", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "var(--tk-str)" },
  { tag: [t.number], color: "var(--tk-num)" },
  { tag: [t.comment, t.lineComment], color: "var(--tk-com)", fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.standard(t.variableName)], color: "var(--tk-bi)" },
  { tag: [t.className, t.definition(t.className)], color: "var(--tk-bi)" },
  { tag: [t.self], color: "var(--tk-kw)" },
]);

const base = (dark: boolean) => EditorView.theme({
  "&": { backgroundColor: "var(--surface)", color: "var(--text)" },
  ".cm-content": { fontFamily: "var(--mono)", padding: "8px 0", caretColor: "var(--accent)" },
  ".cm-gutters": { fontFamily: "var(--mono)", backgroundColor: "var(--surface)", color: "var(--text-3)", border: "none" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": { backgroundColor: "var(--accent-soft) !important" },
  ".cm-matchingBracket": { backgroundColor: "var(--surface-3)", outline: "1px solid var(--border-strong)" },
  ".cm-tooltip": { backgroundColor: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" },
  ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: "var(--surface-3)", color: "var(--text)" },
}, { dark });

export default function CodeEditor({ value, onChange, onRun, onSubmit }: {
  value: string; onChange: (v: string) => void; onRun?: () => void; onSubmit?: () => void;
}) {
  const [theme] = useTheme();
  const extensions = useMemo(() => [
    python(),
    indentUnit.of("    "),
    base(theme === "dark"),
    syntaxHighlighting(highlight),
    keymap.of([
      { key: "Mod-'", run: () => { onRun?.(); return true; } },
      { key: "Mod-Enter", run: () => { onSubmit?.(); return true; } },
    ]),
  ], [onRun, onSubmit, theme]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme="none"
      extensions={extensions}
      onChange={onChange}
      basicSetup={{ tabSize: 4, highlightActiveLine: true, foldGutter: false, autocompletion: true, syntaxHighlighting: false }}
    />
  );
}
