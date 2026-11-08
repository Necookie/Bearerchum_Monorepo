"""Single source of truth for problem ids, groups, technique tags and techniques.

breakdowns.py  -> P  (26 practice / past problems with the 9-step breakdown)
drills.py      -> D  (14 drills)
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from breakdowns import P  # noqa: E402
from drills import D      # noqa: E402

CONTEST_DATE = "2026-11-14"   # Saturday — CodeChum NPC 2026

GROUPS = [
    {"id": "practice", "name": "Practice set", "blurb": "The 10 practice problems CodeChum gave us."},
    {"id": "prelims", "name": "Last year · Preliminaries", "blurb": "NPC Group Stage 3 preliminary round."},
    {"id": "semis", "name": "Last year · Semifinals", "blurb": "NPC Group Stage 3 semifinal round."},
    {"id": "drills", "name": "Drills", "blurb": "Fresh CodeChum-style problems for timed practice."},
]

# Topic tags that are not one of the 15 techniques (used by drills / cards).
TOPICS = {
    "io": "Input / output", "python": "Python built-ins", "traps": "Python traps",
    "ds": "Data structures", "stack": "Stack", "sets-sorting": "Sets & sorting",
    "counter": "Counting (Counter / dict)", "math": "Math (gcd, lcm, powers)",
}

TECHNIQUES = [
    dict(id="T1", name="Direct formula / simple loop",
         spot="“Each row has 2 more…”, “first 10 cost…, beyond that…”, “add the first, subtract the second…”",
         template="total = 0\nfor i in range(1, n + 1):\n    total += term(i)          # or find the closed formula",
         problems=["P01", "P09", "P10", "S01"]),
    dict(id="T2", name="Digit manipulation",
         spot="“digits of N”, “remove zeros”, “sum of digits”, “palindromic number”, N up to 10^9",
         template="s = str(n)                        # easiest: treat as text\ndigit_sum = sum(int(d) for d in s)\n"
                  "count = len(s)\nis_pal = s == s[::-1]\n# math way:  while n > 0: d = n % 10; n //= 10",
         problems=["P04", "S02", "S04", "L04", "L03", "D13"]),
    dict(id="T3", name="String processing & classification",
         spot="“words separated by spaces”, “vowels/consonants”, “ignore non-letters”, “case-insensitive”",
         template="words = s.split()\nletters = [ch.lower() for ch in s if ch.isalpha()]\nis_vowel = ch in \"aeiou\"",
         problems=["P05", "L01", "S05", "D01", "D08"]),
    dict(id="T4", name="Character shifting (ciphers)",
         spot="“shift each letter by…”, “wraps around”, “Caesar”",
         template="base = ord('a') if ch.islower() else ord('A')\nnew = chr((ord(ch) - base - shift) % 26 + base)",
         problems=["S03"]),
    dict(id="T5", name="Neighbour comparison",
         spot="“higher than the day before”, “greater than both neighbours”",
         template="for i in range(1, n):            # a[i] vs a[i-1]\n    if a[i] > a[i - 1]: ...\n"
                  "for i in range(1, n - 1):        # a[i] vs both sides\n    if a[i] > a[i-1] and a[i] > a[i+1]: ...",
         problems=["P07", "L02", "L01"]),
    dict(id="T6", name="Runs / streaks & “try every option”",
         spot="“longest stretch”, “consecutive”, “choose exactly one to change, best result”",
         template="best = cur = 0\nfor x in a:\n    cur = cur + 1 if ok(x) else 0\n    best = max(best, cur)\n"
                  "# try every option: for each candidate, compute result, keep max",
         problems=["P02", "D03", "D09"]),
    dict(id="T7", name="Clamping & tiers",
         spot="“never more than 50”, “no fine for 7 days or less”, “first 10 at …, the rest at …”",
         template="fine = min(50, max(0, d - 7) * 5)\nbill = min(u, 10) * 15 + max(u - 10, 0) * 25",
         problems=["P08", "P10"]),
    dict(id="T8", name="Grid neighbours with bounds",
         spot="grid / matrix + “above, below, left, right”",
         template="DIRS = ((-1, 0), (1, 0), (0, -1), (0, 1))\nfor dr, dc in DIRS:\n    nr, nc = r + dr, c + dc\n"
                  "    if 0 <= nr < R and 0 <= nc < C:      # ALWAYS check before g[nr][nc]\n        ...",
         problems=["P03", "S08", "D04", "D10", "D14"]),
    dict(id="T9", name="Multi-source BFS (spreading)",
         spot="“every minute it spreads to neighbours”, “minimum steps”, “at the same time from several places”",
         template="from collections import deque\nq = deque(starts)\ndist = {cell: 0 for cell in starts}\nwhile q:\n"
                  "    r, c = q.popleft()\n    for nr, nc in neighbours(r, c):\n        if (nr, nc) not in dist:\n"
                  "            dist[(nr, nc)] = dist[(r, c)] + 1\n            q.append((nr, nc))",
         problems=["P03", "D04"]),
    dict(id="T10", name="Simulate until stable",
         spot="“repeat until no more changes”, “all changes happen at the same time”",
         template="while True:\n    changes = find_changes()   # 1) FIND all, don't apply yet\n    if not changes:\n"
                  "        break\n    apply(changes)             # 2) APPLY all at once\n    steps += 1",
         problems=["P03", "L07"]),
    dict(id="T11", name="Primes: sieve",
         spot="“count primes in a range”, R up to 10^5–10^6",
         template="is_p = [True] * (R + 1)\nis_p[0] = is_p[1] = False\nfor i in range(2, int(R ** 0.5) + 1):\n"
                  "    if is_p[i]:\n        for j in range(i * i, R + 1, i):\n            is_p[j] = False",
         problems=["L03"]),
    dict(id="T12", name="Subarray sums / prefix sums / sliding window",
         spot="“contiguous subarray”, “sum from L to R”, “K consecutive days”",
         template="for i in range(n):              # every subarray starting at i\n    s = 0\n    for j in range(i, n):\n"
                  "        s += a[j]                 # s = sum(a[i..j])",
         problems=["S06", "D05", "D06"]),
    dict(id="T13", name="Dynamic programming on a grid / table",
         spot="“largest square”, “number of paths”, each answer built from smaller neighbours",
         template="dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])   # max square\n"
                  "row = [1] + [row[k] + row[k+1] for k in range(len(row)-1)] + [1]   # Pascal",
         problems=["L08", "L06", "D11"]),
    dict(id="T14", name="Rotation, wrap-around & bouncing indexes",
         spot="“cyclic”, “wrap around”, “K can be larger than N”, “zigzag”",
         template="k %= n\nleft = a[k:] + a[:k]\nright = a[n - k:] + a[:n - k]\n"
                  "# bouncing row: if r == 0: step = 1 / elif r == rows-1: step = -1 / r += step",
         problems=["L05", "S07", "D10"]),
    dict(id="T15", name="Brute force + pruning",
         spot="“largest … such that …”, small enough N, no obvious formula",
         template="for size in range(N, 0, -1):          # biggest first\n    for r in range(N - size + 1):\n"
                  "        for c in range(N - size + 1):\n            if cheap_check(r, c, size) and full_check(r, c, size):\n"
                  "                print(size); raise SystemExit",
         problems=["S08", "P02"]),
]

DRILL_TAGS = {
    "D01": ["T3"], "D02": ["sets-sorting"], "D03": ["T6", "T5"], "D04": ["T9", "T8"], "D05": ["T12"],
    "D06": ["T12"], "D07": ["stack"], "D08": ["counter", "T3"], "D09": ["T6", "T3"], "D10": ["T14", "T8"],
    "D11": ["T13"], "D12": ["math"], "D13": ["T2"], "D14": ["T8"],
}


def tag_ids(tags):
    """'T6 Runs / try every option' -> 'T6'. Non-technique tags are dropped."""
    out = []
    for t in tags:
        m = re.match(r"(T\d+)\b", t)
        if m:
            out.append(m.group(1))
    return out


def all_problems():
    """Unified list used by the content build."""
    items = []
    for p in P:
        items.append(dict(p, kind="problem", tagIds=tag_ids(p["tags"]),
                          solution=p["file"]))
    for d in D:
        items.append(dict(d, kind="drill", group="drills", src="Drill", tagIds=DRILL_TAGS[d["id"]],
                          solution="drills/" + d["file"]))
    return items
