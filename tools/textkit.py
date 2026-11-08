"""Tiny markdown + Python highlighting helpers used by the content build.

Deliberately small: our content only needs headings, paragraphs, lists, fenced code, simple
pipe tables, `inline code`, **bold** and [links](url).
"""
import html
import io
import keyword
import re
import tokenize

# ------------------------------------------------------------------ inline
_CODE = re.compile(r"`([^`]+)`")
_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")


def inline(text: str) -> str:
    out, pos = [], 0
    for m in _CODE.finditer(text):
        out.append(_prose(text[pos:m.start()]))
        out.append("<code>" + html.escape(m.group(1)) + "</code>")
        pos = m.end()
    out.append(_prose(text[pos:]))
    return "".join(out)


def _prose(s: str) -> str:
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = _LINK.sub(lambda m: f'<a href="{html.escape(m.group(2))}">{m.group(1)}</a>', s)
    s = s.replace("-&gt;", "&rarr;").replace("&lt;=", "&le;").replace("&gt;=", "&ge;")
    s = re.sub(r"10\^(\d+)", r"10<sup>\1</sup>", s)
    return s


# ------------------------------------------------------------------ blocks
def block(text: str) -> str:
    """Markdown (subset) -> HTML."""
    if not text:
        return ""
    lines = text.replace("\r\n", "\n").split("\n")
    out, i = [], 0
    para: list[str] = []

    def flush_para():
        if para:
            out.append("<p>" + inline(" ".join(x.strip() for x in para)) + "</p>")
            para.clear()

    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if s.startswith("```"):
            flush_para()
            lang = s[3:].strip().lower()
            body = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                body.append(lines[i])
                i += 1
            i += 1
            src = "\n".join(body)
            inner = highlight(src) if lang in ("python", "py") else html.escape(src)
            out.append(f'<pre class="code-block{" py" if lang in ("python", "py") else ""}"><code>{inner}</code></pre>')
            continue
        m = re.match(r"(#{1,4})\s+(.*)", s)
        if m:
            flush_para()
            lvl = min(len(m.group(1)) + 1, 5)          # '## X' -> <h3>, keeps page <h1>/<h2> for chrome
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
            i += 1
            continue
        if s.startswith("|") and i + 1 < len(lines) and re.match(r"^\|?\s*:?-{2,}", lines[i + 1].strip()):
            flush_para()
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            head, body_rows = rows[0], rows[2:]
            t = "<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in head) + "</tr></thead><tbody>"
            t += "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body_rows)
            out.append(t + "</tbody></table>")
            continue
        if re.match(r"^[-*]\s+", s) or re.match(r"^\d+[.)]\s+", s):
            flush_para()
            ordered = bool(re.match(r"^\d+[.)]\s+", s))
            items = []
            while i < len(lines):
                t = lines[i].strip()
                mm = re.match(r"^(?:[-*]|\d+[.)])\s+(.*)", t)
                if mm:
                    items.append(mm.group(1))
                elif t and items and lines[i].startswith(("  ", "\t")):
                    items[-1] += " " + t              # continuation line
                else:
                    break
                i += 1
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>" + "".join(f"<li>{inline(x)}</li>" for x in items) + f"</{tag}>")
            continue
        if not s:
            flush_para()
            i += 1
            continue
        para.append(ln)
        i += 1
    flush_para()
    return "".join(out)


# ------------------------------------------------------------------ highlighting
BUILTINS = {"print", "input", "int", "float", "str", "list", "dict", "set", "tuple", "len", "range", "sum",
            "min", "max", "abs", "sorted", "reversed", "enumerate", "zip", "map", "filter", "any", "all",
            "ord", "chr", "round", "pow", "divmod", "open", "bool", "isinstance", "iter", "next", "type"}


def highlight(src: str) -> str:
    """Python source -> HTML with <span class="tk-*"> tokens. Never raises."""
    src = src.rstrip("\n") + "\n"
    lines = src.splitlines(keepends=True)
    offsets = [0]
    for ln in lines:
        offsets.append(offsets[-1] + len(ln))

    def idx(rc):
        return offsets[rc[0] - 1] + rc[1]

    try:
        toks = list(tokenize.generate_tokens(io.StringIO(src).readline))
    except (tokenize.TokenError, SyntaxError, IndentationError):
        return html.escape(src.rstrip("\n"))
    out, pos = [], 0
    for tok in toks:
        a, b = idx(tok.start), idx(tok.end)
        if a < pos:
            continue
        out.append(html.escape(src[pos:a]))
        name = tokenize.tok_name[tok.type]
        cls = None
        if name in ("STRING", "FSTRING_START", "FSTRING_MIDDLE", "FSTRING_END"):
            cls = "str"
        elif name == "COMMENT":
            cls = "com"
        elif name == "NUMBER":
            cls = "num"
        elif name == "NAME":
            if keyword.iskeyword(tok.string) or tok.string in ("True", "False", "None"):
                cls = "kw"
            elif tok.string in BUILTINS:
                cls = "bi"
        # split multi-line tokens so every output line stays balanced
        parts = html.escape(src[a:b]).split("\n")
        out.append("\n".join(f'<span class="tk-{cls}">{p}</span>' if cls and p else p for p in parts))
        pos = b
    out.append(html.escape(src[pos:]))
    return "".join(out).rstrip("\n")


def highlight_lines(src: str) -> list[str]:
    return highlight(src).split("\n")
