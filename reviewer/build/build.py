"""Builds Reviewer/CodeBearers_NPC2026_Python_Reviewer.pdf  (python build.py)"""
import os, subprocess, sys
from lib import md, ul, ol, table, callout, code, code_file, samples, ROOT
from content_guide import PART1, PART2, PART3, PART4, section
from content_problems import P
from content_drills import D

OUT_HTML = os.path.join(ROOT, "build", "reviewer.html")
OUT_PDF = os.path.join(ROOT, "CodeBearers_NPC2026_Python_Reviewer.pdf")

CSS = r"""
@page { size: A4; margin: 15mm 14mm 16mm 14mm;
  @bottom-left { content: "CodeBearers · CodeChum NPC 2026 · Python Reviewer"; font: 7.5pt 'Segoe UI', sans-serif; color: #8a94a6; }
  @bottom-right { content: counter(page); font: 600 8pt 'Segoe UI', sans-serif; color: #4b5563; } }
@page :first { @bottom-left { content: none; } @bottom-right { content: none; } }
:root { --ink:#1f2937; --muted:#6b7280; --line:#e5e7eb; --brand:#1d4ed8; --brand2:#0f766e; --soft:#f3f6fb;
        --e:#15803d; --m:#b45309; --h:#b91c1c; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font: 9.6pt/1.45 'Segoe UI', system-ui, sans-serif; color: var(--ink); margin: 0; background: #fff; }
h1 { font-size: 20pt; margin: 0; letter-spacing: -.3px; }
h2 { font-size: 12.5pt; color: var(--brand); margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1.5px solid #dbe4f5; break-after: avoid; }
h3 { font-size: 10.5pt; margin: 10px 0 4px; break-after: avoid; }
p { margin: 4px 0 6px; }
code { font: 8.6pt 'Cascadia Mono', Consolas, monospace; background: #eef2f7; padding: 0 3px; border-radius: 3px; color: #0b3b8c; }
ul, ol { margin: 4px 0 6px; padding-left: 18px; } li { margin: 1.5px 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 8.8pt; break-inside: auto; }
th { background: #e8eefb; color: #1e3a8a; text-align: left; padding: 4px 6px; font-weight: 600; }
td { border-bottom: 1px solid var(--line); padding: 3.5px 6px; vertical-align: top; }
tr { break-inside: avoid; }
td code { font-size: 8.2pt; }
.note { color: var(--muted); font-size: 8.8pt; }

/* cover */
.cover { height: 262mm; display: flex; flex-direction: column; gap: 26px; break-after: page; }
.cover-foot { margin-top: auto; }
.mark { position: absolute; font-size: 1px; color: #fff; }
.pg { float: right; color: var(--muted); font-weight: 600; margin-left: 8px; }
.toc-part .pg { font-size: 9.5pt; }
.cover-top { background: linear-gradient(135deg, #1d4ed8, #0f766e); color: #fff; border-radius: 14px; padding: 34px 32px 30px; }
.cover-top .kicker { font-size: 10pt; letter-spacing: 2px; text-transform: uppercase; opacity: .85; }
.cover-top h1 { font-size: 34pt; line-height: 1.08; margin: 10px 0 8px; }
.cover-top .sub { font-size: 12pt; opacity: .95; }
.cover-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
.stat { background: var(--soft); border-radius: 10px; padding: 12px 14px; }
.stat b { display: block; font-size: 20pt; color: var(--brand); }
.stat span { color: var(--muted); font-size: 9pt; }
.cover-how { border: 1.5px solid #dbe4f5; border-radius: 12px; padding: 14px 18px; }
.cover-how h3 { margin-top: 0; color: var(--brand2); }
.cover-foot { color: var(--muted); font-size: 8.5pt; }

/* toc */
.toc { break-after: page; }
.toc h1 { margin-bottom: 10px; }
.toc-part { margin: 10px 0 4px; font-weight: 700; color: var(--brand); font-size: 11pt; }
.toc a { color: inherit; text-decoration: none; }
.toc-items { columns: 2; column-gap: 18px; font-size: 9pt; }
.toc-items div { break-inside: avoid; padding: 1.5px 0; border-bottom: 1px dotted #e5e7eb; }
.toc-items .lv { float: right; font-size: 7.5pt; font-weight: 600; }

/* parts */
.part { break-before: page; }
.part-head { display: flex; gap: 14px; align-items: center; background: var(--soft); border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; }
.part-num { font: 800 26pt 'Segoe UI'; color: #fff; background: var(--brand); border-radius: 10px; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; flex: none; }
.part-sub { color: var(--muted); margin: 2px 0 0; }

/* callouts */
.callout { border-radius: 9px; padding: 8px 12px; margin: 8px 0; border-left: 4px solid; break-inside: avoid; }
.callout .ct { font-weight: 700; margin-bottom: 2px; }
.callout.key  { background: #fff4e5; border-color: #f59e0b; }
.callout.tip  { background: #eaf6ff; border-color: #3b82f6; }
.callout.skip { background: #f3f4f6; border-color: #9ca3af; }
.callout.warn { background: #fdecec; border-color: #ef4444; }
.callout p { margin: 2px 0; }

/* code */
.code { border: 1px solid #dfe5ee; border-radius: 8px; margin: 6px 0 8px; overflow: hidden; break-inside: avoid; background: #fbfcfe; }
.code-title { font: 600 7.8pt 'Segoe UI'; color: #475569; background: #eef2f7; padding: 3px 9px; border-bottom: 1px solid #dfe5ee; }
pre { margin: 0; padding: 7px 10px; font: 8.4pt/1.42 'Cascadia Mono', Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
pre .k { color: #7c3aed; font-weight: 600; } pre .b { color: #0369a1; } pre .s { color: #b45309; }
pre .c { color: #6b7280; font-style: italic; } pre .n { color: #be123c; }

/* techniques */
.tech { border: 1px solid #e2e8f0; border-radius: 9px; margin: 8px 0; break-inside: avoid; }
.tech-h { background: #f1f5f9; padding: 5px 10px; font-weight: 700; border-radius: 9px 9px 0 0; }
.tid { display: inline-block; background: var(--brand2); color: #fff; border-radius: 5px; padding: 0 6px; margin-right: 8px; font-size: 8.5pt; }
.tech-b { padding: 4px 10px 6px; }
.tech .seen { color: var(--muted); font-size: 8.6pt; margin: 2px 0 0; }

/* problem breakdown */
.prob { break-before: page; }
.prob-head { border-radius: 11px; padding: 10px 14px; color: #fff; background: linear-gradient(120deg, #1e40af, #0f766e); margin-bottom: 8px; }
.prob-head.prelims { background: linear-gradient(120deg, #6d28d9, #1d4ed8); }
.prob-head.semis { background: linear-gradient(120deg, #9f1239, #6d28d9); }
.prob-head .src { font-size: 8.5pt; opacity: .9; letter-spacing: .5px; text-transform: uppercase; }
.prob-head h1 { font-size: 17pt; margin: 2px 0 4px; }
.pill { display: inline-block; font-size: 7.8pt; font-weight: 600; padding: 1px 8px; border-radius: 99px; margin-right: 5px; background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.45); }
.pill.lvl { background: #fff; color: #111; border: none; }
.step { display: grid; grid-template-columns: 22px 1fr; gap: 8px; margin: 7px 0; break-inside: avoid; }
.step-n { width: 22px; height: 22px; border-radius: 50%; background: var(--brand); color: #fff; font: 700 9pt 'Segoe UI'; display: flex; align-items: center; justify-content: center; }
.step-t { font-weight: 700; font-size: 10pt; margin-bottom: 1px; }
.step-b p, .step-b ul, .step-b ol { margin-top: 1px; }
.io { display: grid; grid-template-columns: 46px 1fr; gap: 2px 6px; font-size: 9pt; }
.io .tag { font: 700 7.5pt 'Segoe UI'; border-radius: 4px; text-align: center; padding: 1px 0; height: fit-content; margin-top: 2px; }
.io .tag.in { background: #dbeafe; color: #1e40af; } .io .tag.out { background: #dcfce7; color: #166534; }
.hidden li::marker { content: "⚑  "; color: #dc2626; }
.mist li::marker { content: "✗  "; color: #dc2626; }
.vari li::marker { content: "↪  "; color: #0f766e; }
.trace { background: #fffbea; border: 1px dashed #e5c76b; border-radius: 7px; }
.trace pre { color: #3f3a1e; }
.samples-wrap { margin: 6px 0 4px; break-inside: avoid; }
.samples-title { font-weight: 700; font-size: 9pt; color: #334155; margin-bottom: 3px; }
.legend { font-weight: 400; color: var(--muted); font-size: 7.8pt; margin-left: 6px; }
.samples { display: flex; gap: 6px; flex-wrap: wrap; }
.sample { flex: 1 1 30%; min-width: 150px; background: #0f172a; border-radius: 7px; overflow: hidden; }
.sample-h { font: 600 7.3pt 'Segoe UI'; color: #94a3b8; padding: 3px 8px 0; }
.sample pre { color: #e2e8f0; font-size: 7.9pt; padding: 3px 8px 7px; }
.typed { background: #fde68a; color: #111; border-radius: 2px; padding: 0 1px; }
.sample .typed { background: #facc15; color: #111; }

/* drills */
.drill { border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; margin: 10px 0; break-inside: avoid; }
.drill h3 { margin: 0 0 3px; font-size: 11pt; }
.drill .meta { float: right; font-size: 7.8pt; color: var(--muted); }
.ans { border-top: 1px solid var(--line); padding-top: 4px; margin-top: 10px; break-inside: avoid; }
.lvl-Easy { color: var(--e); } .lvl-Medium { color: var(--m); } .lvl-Hard { color: var(--h); }
.check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.check-grid .box { border: 1.5px solid #dbe4f5; border-radius: 10px; padding: 8px 12px; }
.check li::marker { content: "☐  "; color: var(--brand); }
"""

STEPS = ["What it really asks", "Exact I/O (copy these strings)", "Spot the pattern", "Hidden test cases (from the constraints)",
         "Approach — before you code", "Hand trace", "Python solution", "Will Python be fast enough?", "Common mistakes & likely twists"]


def lvl_class(level):
    return "lvl-" + level.split("–")[0].split(" ")[0]


def step(n, body):
    return (f'<div class="step"><div class="step-n">{n}</div><div class="step-b">'
            f'<div class="step-t">{STEPS[n-1]}</div>{body}</div></div>')


def breakdown(p):
    pills = f'<span class="pill lvl">{p["level"]}</span>' + "".join(f'<span class="pill">{md(t)}</span>' for t in p["tags"])
    head = (f'<div class="prob-head {p["group"]}"><div class="src">{p["src"]} · {p["id"]}</div>'
            f'<h1>{md(p["title"])}</h1>{pills}</div>')
    io = '<div class="io">' + "".join(
        f'<span class="tag {k}">{"INPUT" if k == "in" else "OUTPUT"}</span><span>{md(v)}</span>' for k, v in p["io"]) + "</div>"
    sol = code_file(p["file"])
    for ex in p.get("extra", []):
        if len(ex) == 3:
            sol += code_file(ex[2], ex[0] + " — solutions/" + ex[2])
        else:
            sol += code(ex[1], ex[0])
    parts = [
        head,
        step(1, f"<p>{md(p['asks'])}</p>"),
        step(2, io + samples(p["file"], p["samples"])),
        step(3, f"<p>{md(p['pattern'])}</p>"),
        step(4, ul(p["hidden"], "hidden")),
        step(5, ol(p["approach"])),
        step(6, f'<div class="code trace"><pre>{md_pre(p["trace"])}</pre></div>'),
        step(7, sol),
        step(8, f"<p>{md(p['speed'])}</p>"),
        step(9, ul(p["mistakes"], "mist") + ul(p["variations"], "vari")),
    ]
    return f'<section class="prob" id="{p["id"]}"><span class="mark">@@{p["id"]}@@</span>' + "".join(parts) + "</section>"


def md_pre(s):
    import html
    return html.escape(s)


def cover():
    return f"""
<div class="cover">
  <div>
    <div class="cover-top">
      <div class="kicker">CodeBearers · Study Pack</div>
      <h1>CodeChum National<br>Programming Challenge 2026</h1>
      <div class="sub">Python reviewer: rules, must-know functions, data structures, techniques,<br>
      and step-by-step breakdowns of every practice and past problem.</div>
    </div>
    <div class="cover-grid">
      <div class="stat"><b>26</b><span>problems broken down step by step (10 practice + 16 from last year)</span></div>
      <div class="stat"><b>15</b><span>solving techniques with templates</span></div>
      <div class="stat"><b>14</b><span>new drill problems with answer key</span></div>
    </div>
  </div>
  <div class="cover-how">
    <h3>How to use this in the days before the contest</h3>
    {table(["When", "Do this"], [
        ["Day 1", "Part 1 (rules) + Part 2 (Python). Type every snippet once from memory."],
        ["Day 2", "Part 3 + Part 4. For each technique, re-solve its “Seen in” problem **without looking**."],
        ["Day 3–4", "Part 5: cover the solution, read steps 1–5, write code yourself, then compare."],
        ["Day 5", "Part 6 drills under a timer (15 min each). Check with the answer key."],
        ["Night before", "Only Part 1 + the final checklist on the last page. Sleep."],
    ])}
  </div>
  <div class="cover-foot">Every solution in this PDF was run against every sample shown, cross-checked against brute force on random inputs,
  and timed at the maximum input size. Source files: <code>content/solutions/</code> · Online: <code>bearerchum.necookie.dev</code>.</div>
</div>"""


def toc(pages):
    def pg(key):
        return f'<span class="pg">{pages[key]}</span>' if key in pages else ""
    groups = [("practice", "5A · Practice problems (given to us)"), ("prelims", "5B · Last year — Preliminaries"),
              ("semis", "5C · Last year — Semifinals")]
    out = ['<div class="toc"><h1>Contents</h1>']
    for sid, n, t in [("rules", 1, "Contest-Day Rules"), ("python", 2, "Python You Must Have Memorised"),
                      ("ds", 3, "Data Structures"), ("tech", 4, "Techniques Playbook")]:
        out.append(f'<div class="toc-part"><a href="#{sid}">{n} · {t}</a>{pg(sid)}</div>')
    out.append(f'<div class="toc-part"><a href="#breakdowns">5 · Problem Breakdowns</a>{pg("breakdowns")}</div>')
    for g, label in groups:
        out.append(f'<div style="margin:4px 0 2px;font-weight:600">{label}</div><div class="toc-items">')
        for p in P:
            if p["group"] == g:
                out.append(f'<div><a href="#{p["id"]}">{p["id"]} · {md(p["title"])}</a>{pg(p["id"])}'
                           f'<span class="lv {lvl_class(p["level"])}">{p["level"]}</span></div>')
        out.append("</div>")
    out.append(f'<div class="toc-part"><a href="#drills">6 · Drill Set (14 problems)</a>{pg("drills")}</div>')
    out.append(f'<div class="toc-part"><a href="#answers">7 · Drill Answer Key</a>{pg("answers")}</div>')
    out.append(f'<div class="toc-part"><a href="#final">8 · Final Checklist</a>{pg("final")}</div></div>')
    return "".join(out)


def breakdowns_intro():
    body = ("<p>" + md("Every breakdown follows the **same 9 steps**. Train yourself to run these steps in your head on "
                       "Saturday — that's the real skill, not the individual answers.") + "</p>"
            + ol([f"**{s}**" for s in STEPS])
            + callout("tip", "How to study a breakdown",
                      "<p>" + md("Cover steps 6–9 with a sheet of paper. Read steps 1–5, write the code yourself in an editor, "
                                 "run the samples, **then** uncover and compare. If yours differs, find out why.") + "</p>")
            + "<h2>Difficulty map</h2>"
            + table(["Level", "Practice set", "Last year"], [
                ["Easy", "Theater, Calculator, Longest Word, Round, Warmer, Library, Plus-Minus, Water Bill",
                 "Alternating Factorial, Digital Root, Digit Sum Power"],
                ["Medium", "Street Lamp, Rotting Fruit", "Alternating Pattern, Peak-Valley, Palindromic Prime, Digit Product, "
                 "Cyclic Shift, Pascal, Stable Sequence, Cipher, Roman, ZigZag"],
                ["Hard", "—", "Maximal Square, Smallest Missing Subarray Sum, Largest Symmetric Subgrid"],
            ])
            + callout("key", "What this tells us about Saturday",
                      "<p>" + md("The practice set is mostly Easy, but last year's rounds had real Medium/Hard problems "
                                 "(DP, sieve, grid search). **Bank every Easy item fast and correctly**, then spend the "
                                 "remaining time on one or two Hard ones.") + "</p>"))
    return section("breakdowns", "5", "Problem Breakdowns", "26 problems × the same 9 thinking steps.", body)


def drills():
    out = ["<p>" + md("New problems in the same style as CodeChum. Do them **under a timer** (≈15 min each). "
                      "Prompts and labels are exact — practise copying them. Answers are in Part 7.") + "</p>"]
    for d in D:
        out.append(
            f'<div class="drill"><span class="meta"><span class="{lvl_class(d["level"])}">{d["level"]}</span></span>'
            f'<h3>{d["id"]} · {md(d["title"])}</h3><p>{md(d["statement"])}</p>'
            f'<b>Input / Output</b>{ul(d["io"])}<b>Constraints</b>{ul(d["cons"], "hidden")}'
            f'{samples("drills/" + d["file"], d["samples"], "Sample runs")}</div>')
    return section("drills", "6", "Drill Set", "14 fresh problems that use the techniques from Part 4.", "".join(out))


def answers():
    out = ["<p>" + md("Try first! Each answer names the technique so you can review it in Part 4.") + "</p>"]
    for d in D:
        out.append(f'<div class="ans"><h3>{d["id"]} · {md(d["title"])} — <span style="color:#0f766e">{md(d["tech"])}</span></h3>'
                   f'{code_file("drills/" + d["file"])}</div>')
    return section("answers", "7", "Drill Answer Key", "Tested solutions.", "".join(out))


def final():
    body = '<div class="check-grid">'
    body += '<div class="box"><h3>Before submitting EVERY problem</h3>' + ul([
        "Prompt strings copied exactly (spaces, colons, capitals)?",
        "Output label copied exactly?",
        "Input read in the right **order** and on the right **lines**?",
        "Ran all samples with **Run code**?",
        "Ran each constraint bullet as a test (0, 1, all-same, max size, ends)?",
        "Language is **Python**, not C?",
        "No leftover debug `print`?",
    ], "check") + "</div>"
    body += '<div class="box"><h3>When you are stuck</h3>' + ul([
        "Re-read the statement — the tip in the problem often IS the algorithm (Street Lamp, Rotting Fruit).",
        "Solve the sample by hand on paper, then turn your hand steps into code.",
        "Write the brute force first. Submit it. Optimise only if time remains.",
        "Check the N limit → Rule 4 table → is your approach fast enough?",
        "15 minutes without progress → move on, come back later.",
    ], "check") + "</div></div>"
    body += "<h2>The 12 lines that solve most Easy problems</h2>" + code('''n = int(input("Enter N: "))
a = list(map(int, input("Enter the numbers: ").split()))
s = input("Enter sentence: ")
words = s.split()
digits = [int(d) for d in str(n)]
best = max(len(w) for w in words)
cnt = sum(1 for x, y in zip(a, a[1:]) if y > x)
fine = min(50, max(0, d - 7) * 5)
r = (n + 5) // 10 * 10
print(f"Result: {best}")
print("Shifted array:", *a)
print(f"{x:.2f}")''')
    body += callout("key", "Remember", "<p>" + md("**Exact output → easy points first → constraints are the hidden tests → "
                                                  "brute force beats a blank.** Good luck, CodeBearers!") + "</p>")
    return section("final", "8", "Final Checklist", "Print this page and keep it next to your keyboard.", body)


def render(pages):
    html_doc = ["<!doctype html><html><head><meta charset='utf-8'><title>CodeBearers NPC 2026 Python Reviewer</title>",
                f"<style>{CSS}</style></head><body>", cover(), toc(pages), PART1, PART2, PART3, PART4, breakdowns_intro()]
    html_doc += [breakdown(p) for p in P]
    html_doc += [drills(), answers(), final(), "</body></html>"]
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write("".join(html_doc))
    chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome):
        chrome = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    url = "file:///" + OUT_HTML.replace("\\", "/")
    subprocess.run([chrome, "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    "--generate-pdf-document-outline", f"--print-to-pdf={OUT_PDF}", url],
                   check=True, capture_output=True, timeout=180)


def find_pages():
    import re
    from pypdf import PdfReader
    pages = {}
    for i, page in enumerate(PdfReader(OUT_PDF).pages, 1):
        for key in re.findall(r"@@(\w+)@@", page.extract_text() or ""):
            pages.setdefault(key, i)
    return pages


def build():
    render({})                 # pass 1: layout
    pages = find_pages()       # where did each section land?
    render(pages)              # pass 2: same layout, TOC now has page numbers
    assert find_pages() == pages, "page numbers shifted between passes"
    print(f"wrote {OUT_PDF}  ({len(pages)} sections located)")


if __name__ == "__main__":
    build()
