"""Build the web app's content bundle from /content.

    python tools/build_content.py                 # -> apps/web/public/content
    python tools/build_content.py --out DIR       # custom output (used by the Dockerfile)
    python tools/build_content.py --strict        # fail on any missing statement/test/explanation

What it does
  1. loads problem metadata, statements, tests, explanations, cards
  2. runs every reference solution on every test (samples, hidden, generated) to compute the
     expected transcript — exactly what CodeChum's sample box shows
  3. cross-checks the official sample transcripts recorded in tools/legacy_sample_transcripts.py
  4. writes index.json (catalogue, techniques, guide, cards) and p/<ID>.json (one per problem)
"""
import argparse
import ast
import builtins
import hashlib
import html
import io
import json
import os
import random
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
SOL = os.path.join(CONTENT, "solutions")
sys.path.insert(0, os.path.join(CONTENT, "problems"))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import meta  # noqa: E402
from textkit import block, inline, highlight, highlight_lines  # noqa: E402

WARN: list[str] = []


def warn(msg):
    WARN.append(msg)
    print("  ! " + msg)


# ------------------------------------------------------------------ running solutions
def run_solution(rel, lines):
    """Exec a solution with an echoing input(); returns (plain transcript, html transcript, seconds)."""
    path = os.path.join(SOL, rel)
    feed = iter(lines)
    plain, marked = io.StringIO(), io.StringIO()

    class Tee(io.TextIOBase):
        def write(self, s):
            plain.write(s)
            marked.write(html.escape(s))
            return len(s)

    def fake_input(prompt=""):
        prompt = str(prompt)
        plain.write(prompt)
        marked.write(html.escape(prompt))
        try:
            line = next(feed)
        except StopIteration:
            raise RuntimeError(f"{rel}: solution asked for more input than the test provides")
        plain.write(line + "\n")
        marked.write(f'<span class="typed">{html.escape(line)}</span>\n')
        return line

    old_out, old_in = sys.stdout, builtins.input
    sys.stdout, builtins.input = Tee(), fake_input
    t0 = time.perf_counter()
    try:
        with open(path, encoding="utf-8") as f:
            exec(compile(f.read(), path, "exec"), {"__name__": "__main__"})
    finally:
        sys.stdout, builtins.input = old_out, old_in
    dt = time.perf_counter() - t0
    left = list(feed)
    if left:
        raise RuntimeError(f"{rel}: {len(left)} input line(s) were never read: {left[:3]}")
    return plain.getvalue().rstrip("\n"), marked.getvalue().rstrip("\n"), dt


def legacy_samples():
    """{problem_stem: [(inputs, transcript), ...]} parsed (not executed) from the legacy test file."""
    path = os.path.join(ROOT, "tools", "legacy_sample_transcripts.py")
    out = {}
    if not os.path.exists(path):
        return out
    tree = ast.parse(open(path, encoding="utf-8").read())
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and getattr(node.func, "id", None) == "t" and len(node.args) == 3:
            try:
                name = ast.literal_eval(node.args[0])
                transcript = ast.literal_eval(node.args[1])
                inputs = ast.literal_eval(node.args[2])
            except ValueError:
                continue
            out.setdefault(name, []).append((inputs, transcript.strip("\n")))
    return out


# ------------------------------------------------------------------ loaders
def read(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return f.read()


def load_json(path, default=None):
    s = read(path)
    return default if s is None else json.loads(s)


def load_tests(p):
    t = load_json(os.path.join(CONTENT, "problems", "tests", p["id"] + ".json"))
    if t is None:
        warn(f"{p['id']}: no tests file — using meta samples only")
        t = {"samples": p.get("samples", []), "hidden": [], "generated": []}
    cases = []
    for i, inp in enumerate(t.get("samples", []), 1):
        cases.append({"kind": "sample", "name": f"Sample {i}", "input": inp})
    for h in t.get("hidden", []):
        cases.append({"kind": "hidden", "name": h["name"], "input": h["input"]})
    for g in t.get("generated", []):
        random.seed(p["id"])
        scope = {"random": random}
        exec(g["gen"], scope)
        cases.append({"kind": "hidden", "name": g["name"], "input": [str(x) for x in scope["lines"]], "big": True})
    return cases


def explanation_for(rel):
    stem = os.path.splitext(os.path.basename(rel))[0]
    e = load_json(os.path.join(CONTENT, "explanations", stem + ".json"))
    if e is None:
        warn(f"no explanation for {rel}")
        return None
    return {
        "summary": block(e.get("summary", "")),
        "complexity": inline(e.get("complexity", "")),
        "pitfalls": [inline(x) for x in e.get("pitfalls", [])],
        "blocks": [{"lines": b["lines"], "title": inline(b.get("title", "")), "text": block(b.get("text", ""))}
                   for b in e.get("blocks", [])],
    }


def code_entry(rel, title):
    src = read(os.path.join(SOL, rel))
    return {"file": rel, "title": title, "code": src.rstrip("\n"), "lines": highlight_lines(src),
            "explain": explanation_for(rel)}


# ------------------------------------------------------------------ build one problem
def build_problem(p, legacy):
    rel = p["solution"]
    stmt = read(os.path.join(CONTENT, "problems", "statements", p["id"] + ".md"))
    if stmt is None:
        warn(f"{p['id']}: no statement — using summary")
        stmt = "## Problem Statement\n" + (p.get("asks") or p.get("statement", ""))
    cases = load_tests(p)
    tests, slowest = [], 0.0
    for c in cases:
        plain, marked, dt = run_solution(rel, c["input"])
        slowest = max(slowest, dt)
        entry = {"kind": c["kind"], "name": c["name"], "input": c["input"], "expected": plain}
        if c["kind"] == "sample":
            entry["display"] = marked
        if c.get("big"):
            entry["big"] = True
        tests.append(entry)

    # cross-check official sample transcripts (practice / last year)
    stem = os.path.splitext(os.path.basename(rel))[0]
    for inputs, transcript in legacy.get(stem, []):
        for t in tests:
            if t["input"] == inputs:
                norm = lambda s: "\n".join(x.rstrip() for x in s.strip("\n").split("\n"))  # noqa: E731
                if norm(t["expected"]) != norm(transcript):
                    raise SystemExit(f"{p['id']}: reference output differs from the official sample!\n"
                                     f"--- official\n{transcript}\n--- got\n{t['expected']}")

    solutions = [code_entry(rel, "Reference solution")]
    breakdown = None
    if p["kind"] == "problem":
        for ex in p.get("extra", []):
            if len(ex) == 3:
                solutions.append(code_entry(ex[2], ex[0]))
            else:
                solutions.append({"file": None, "title": inline(ex[0]), "code": ex[1],
                                  "lines": highlight_lines(ex[1]), "explain": None})
        breakdown = {
            "asks": inline(p["asks"]),
            "io": [{"kind": k, "html": inline(v)} for k, v in p["io"]],
            "pattern": inline(p["pattern"]),
            "hidden": [inline(x) for x in p["hidden"]],
            "approach": [inline(x) for x in p["approach"]],
            "trace": html.escape(p["trace"]),
            "speed": inline(p["speed"]),
            "mistakes": [inline(x) for x in p["mistakes"]],
            "variations": [inline(x) for x in p["variations"]],
        }
    summary = inline(p["asks"]) if p["kind"] == "problem" else inline(p["statement"])
    return {
        "id": p["id"], "title": p["title"], "group": p["group"], "level": p["level"], "src": p["src"],
        "tags": p["tagIds"], "summary": summary, "statement": block(stmt), "breakdown": breakdown,
        "solutions": solutions, "tests": tests, "slowest": round(slowest, 3),
        "starter": starter_code(p, tests),
    }


def starter_code(p, tests):
    return (f"# {p['id']}. {p['title']}\n# Read the input exactly like the examples, then print the answer.\n\n")


# ------------------------------------------------------------------ cards
def load_cards():
    cards, seen = [], set()
    folder = os.path.join(CONTENT, "cards")
    order = ["io", "python", "traps", "ds", "techniques", "problems"]
    files = sorted(os.listdir(folder)) if os.path.isdir(folder) else []
    files.sort(key=lambda f: order.index(f[:-5]) if f[:-5] in order else 99)
    for fn in files:
        if not fn.endswith(".json"):
            continue
        for c in load_json(os.path.join(folder, fn)):
            if c["id"] in seen:
                raise SystemExit(f"duplicate card id {c['id']}")
            seen.add(c["id"])
            out = {"id": c["id"], "deck": c["deck"], "type": c["type"], "tags": c.get("tags", []),
                   "front": block(c.get("front", "")), "explain": block(c.get("explain", "")),
                   "refs": c.get("refs", [])}
            if c.get("code"):
                out["code"] = highlight(c["code"])
            if c["type"] == "mcq":
                out["choices"] = [inline(x) for x in c["choices"]]
                out["answer"] = c["answer"]
            else:
                back = c.get("back", "")
                out["backRaw"] = back
                if c["type"] in ("code",):
                    out["back"] = f'<pre class="code-block py"><code>{highlight(back)}</code></pre>'
                elif c["type"] == "output":
                    out["back"] = f'<pre class="code-block out"><code>{html.escape(back)}</code></pre>'
                else:
                    out["back"] = block(back)
            cards.append(out)
    if not cards:
        warn("no cards found")
    return cards


# ------------------------------------------------------------------ guide (reuses the PDF reviewer content)
def load_guide():
    sys.path.insert(0, os.path.join(ROOT, "reviewer", "build"))
    import content_guide as g  # noqa: E402
    return {"rules": "".join(g.P1), "python": "".join(g.P2), "ds": "".join(g.P3)}


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "apps", "web", "public", "content"))
    ap.add_argument("--strict", action="store_true")
    args = ap.parse_args()

    os.makedirs(os.path.join(args.out, "p"), exist_ok=True)
    legacy = legacy_samples()
    catalogue, n_tests = [], 0
    for p in meta.all_problems():
        t0 = time.perf_counter()
        data = build_problem(p, legacy)
        n_tests += len(data["tests"])
        blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        with open(os.path.join(args.out, "p", p["id"] + ".json"), "w", encoding="utf-8") as f:
            f.write(blob)
        catalogue.append({k: data[k] for k in ("id", "title", "group", "level", "src", "tags", "summary")}
                         | {"tests": len(data["tests"]), "hash": hashlib.sha1(blob.encode()).hexdigest()[:10]})
        print(f"  {p['id']}  {len(data['tests']):2d} tests  ref {data['slowest']:.2f}s  "
              f"({time.perf_counter() - t0:.1f}s)")

    techniques = [{"id": t["id"], "name": t["name"], "spot": inline(t["spot"]),
                   "template": highlight(t["template"]), "problems": t["problems"]} for t in meta.TECHNIQUES]
    index = {
        "contestDate": meta.CONTEST_DATE,
        "groups": meta.GROUPS,
        "topics": meta.TOPICS,
        "techniques": techniques,
        "problems": catalogue,
        "cards": load_cards(),
        "guide": load_guide(),
    }
    blob = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
    index["version"] = hashlib.sha1(blob.encode()).hexdigest()[:12]
    with open(os.path.join(args.out, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))
    print(f"built {len(catalogue)} problems, {n_tests} tests, {len(index['cards'])} cards -> {args.out}")
    if WARN:
        print(f"{len(WARN)} warning(s)")
        if args.strict:
            raise SystemExit("strict mode: warnings are errors")


if __name__ == "__main__":
    main()
