"""Small helpers: inline markup, syntax highlighting, running solutions for transcripts."""
import builtins, html, io, keyword, re, sys, tokenize, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))          # reviewer/
SOL = os.path.join(os.path.dirname(ROOT), "content", "solutions")          # monorepo content

# ---------------------------------------------------------------- inline markup
_CODE = re.compile(r"`([^`]+)`")


def md(text):
    """`code` -> <code>, **bold** -> <b>, everything else HTML-escaped."""
    out = []
    pos = 0
    for m in _CODE.finditer(text):
        out.append(_prose(text[pos:m.start()]))
        out.append("<code>" + html.escape(m.group(1)) + "</code>")
        pos = m.end()
    out.append(_prose(text[pos:]))
    return "".join(out)


def _prose(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = s.replace("-&gt;", "&rarr;").replace("&lt;=", "&le;").replace("&gt;=", "&ge;")
    return s


def ul(items, cls=""):
    return f'<ul class="{cls}">' + "".join(f"<li>{md(i)}</li>" for i in items) + "</ul>"


def ol(items, cls=""):
    return f'<ol class="{cls}">' + "".join(f"<li>{md(i)}</li>" for i in items) + "</ol>"


def table(headers, rows, cls=""):
    h = "".join(f"<th>{md(x)}</th>" for x in headers)
    b = "".join("<tr>" + "".join(f"<td>{md(c)}</td>" for c in r) + "</tr>" for r in rows)
    return f'<table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>'


def callout(kind, title, body):
    return f'<div class="callout {kind}"><div class="ct">{md(title)}</div>{body}</div>'


# ---------------------------------------------------------------- highlighting
BUILTINS = {"print", "input", "int", "float", "str", "list", "dict", "set", "tuple", "len",
            "range", "sum", "min", "max", "abs", "sorted", "reversed", "enumerate", "zip",
            "map", "filter", "any", "all", "ord", "chr", "round", "pow", "divmod", "open",
            "bool", "isinstance", "iter", "next", "type"}


def highlight(src):
    src = src.rstrip("\n") + "\n"
    lines = src.splitlines(keepends=True)
    offsets = [0]
    for ln in lines:
        offsets.append(offsets[-1] + len(ln))

    def idx(rc):
        r, c = rc
        return offsets[r - 1] + c

    out, pos = [], 0
    try:
        toks = list(tokenize.generate_tokens(io.StringIO(src).readline))
    except (tokenize.TokenError, SyntaxError):
        return html.escape(src)
    fstr_depth = 0
    for tok in toks:
        a, b = idx(tok.start), idx(tok.end)
        if a < pos:
            continue
        out.append(html.escape(src[pos:a]))
        text = html.escape(src[a:b])
        name = tokenize.tok_name[tok.type]
        cls = None
        if name in ("FSTRING_START", "FSTRING_MIDDLE", "FSTRING_END", "STRING"):
            cls = "s"
        elif name == "COMMENT":
            cls = "c"
        elif name == "NUMBER":
            cls = "n"
        elif name == "NAME":
            if keyword.iskeyword(tok.string):
                cls = "k"
            elif tok.string in BUILTINS:
                cls = "b"
        out.append(f'<span class="{cls}">{text}</span>' if cls else text)
        pos = b
    out.append(html.escape(src[pos:]))
    return "".join(out).rstrip("\n")


def code(src, title=None, cls=""):
    head = f'<div class="code-title">{md(title)}</div>' if title else ""
    return f'<div class="code {cls}">{head}<pre>{highlight(src)}</pre></div>'


def code_file(rel, title=None):
    with open(os.path.join(SOL, rel), encoding="utf-8") as f:
        src = f.read()
    return code(src, title or f"solutions/{rel.replace(os.sep, '/')}")


# ---------------------------------------------------------------- transcripts
def transcript(rel, inputs):
    """Run a solution with an echoing input() so the output looks like CodeChum's sample box."""
    path = os.path.join(SOL, rel)
    feed = iter(inputs)
    buf = io.StringIO()

    def fake_input(prompt=""):
        buf.write(str(prompt))
        line = next(feed)
        buf.write(f"\x00{line}\x01\n")        # mark typed text so we can colour it
        return line

    old_out, old_in = sys.stdout, builtins.input
    sys.stdout, builtins.input = buf, fake_input
    try:
        exec(compile(open(path, encoding="utf-8").read(), path, "exec"), {"__name__": "__main__"})
    finally:
        sys.stdout, builtins.input = old_out, old_in
    raw = html.escape(buf.getvalue().rstrip("\n"))
    return raw.replace("\x00", '<span class="typed">').replace("\x01", "</span>")


def samples(rel, cases, title="Sample runs"):
    boxes = "".join(
        f'<div class="sample"><div class="sample-h">Sample {i}</div><pre>{transcript(rel, c)}</pre></div>'
        for i, c in enumerate(cases, 1))
    return (f'<div class="samples-wrap"><div class="samples-title">{title} '
            f'<span class="legend"><span class="typed">highlighted</span> = what the user types</span></div>'
            f'<div class="samples">{boxes}</div></div>')
