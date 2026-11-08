from lib import md, ul, ol, table, callout, code


def section(sid, num, title, sub, body, cls=""):
    return (f'<section id="{sid}" class="part {cls}"><span class="mark">@@{sid}@@</span><div class="part-head"><span class="part-num">{num}</span>'
            f'<div><h1>{md(title)}</h1><p class="part-sub">{md(sub)}</p></div></div>{body}</section>')


# =====================================================================================
# PART 1 — CONTEST DAY RULES
# =====================================================================================
P1 = []
P1.append(callout("key", "The #1 reason correct code loses points on CodeChum",
    "<p>" + md("CodeChum checks your output **character by character**. The **prompt text** is part of the output. "
               "A missing space after a colon, a lowercase letter, or an extra line = **wrong answer**, even if your "
               "algorithm is perfect.") + "</p>"))

P1.append("<h2>Rule 1 — Copy the prompts and labels exactly</h2>")
P1.append(table(["The problem says…", "You write…"], [
    ["read after the prompt `Enter number:`", "`n = int(input(\"Enter number: \"))`  (note the space after the colon)"],
    ["output `Display: D`", "`print(f\"Display: {d}\")`"],
    ["program prints `Enter the crate:` **on its own line**, then reads R lines",
     "`print(\"Enter the crate:\")` then `input()` with **no prompt** for each line"],
    ["two values on one line after `Enter rows and columns:`",
     "`R, C = map(int, input(\"Enter rows and columns: \").split())`"],
]))
P1.append(callout("tip", "How to read a CodeChum sample box",
    "<p>" + md("`Enter number: 40507` — the part `40507` is what the **user typed**. Your program prints only "
               "`Enter number: `. Python's `input(\"Enter number: \")` does exactly that. In this reviewer the typed "
               "part is highlighted in every sample run.") + "</p>"))

P1.append("<h2>Rule 2 — The constraint bullets ARE the hidden test cases</h2>")
P1.append("<p>" + md("CodeChum shows 2–3 samples but grades on hidden tests. The extra bullets in **Constraints** "
                     "tell you exactly what those hidden tests are. From the practice set:") + "</p>")
P1.append(table(["Constraint bullet", "Hidden test you must pass"], [
    ["“R may be 1, in which case only the first row exists.”", "R = 1"],
    ["“There may be no rotten fruit; the answer is then 0.”", "grid with no `R`"],
    ["“Every lamp may be broken.”", "`0000` → 1"],
    ["“Rounding up may add a digit (when N ends in several 9s).”", "999 → 1000"],
    ["“N may have no zeros at all.”", "98765 → 98765"],
    ["“The count may be 0 (such as when N = 1).”", "N = 1"],
]))
P1.append("<p>" + md("**Habit:** before you submit, turn every bullet into a test case and run it with **Run code**.") + "</p>")

P1.append("<h2>Rule 3 — The 5-step loop for every problem</h2>")
P1.append(table(["Step", "Do this", "Time"], [
    ["1  READ", "Read the statement twice. Underline every prompt string and output label.", "2 min"],
    ["2  CLASSIFY", "Which pattern is it? (see Part 4). Check N in the constraints → decides the speed you need.", "1 min"],
    ["3  EDGE LIST", "Write the constraint bullets as test inputs in a comment at the top of your file.", "1 min"],
    ["4  CODE", "Start from the I/O template. Read input exactly as described, then solve.", "5–15 min"],
    ["5  TEST", "Run all samples, then every edge case, then one maximum-size input. Then submit.", "3 min"],
]))

P1.append("<h2>Rule 4 — Choose the algorithm from N</h2>")
P1.append("<p>" + md("Python does roughly **10 million simple operations per second**. Look at the biggest number in "
                     "the constraints and pick an approach that fits:") + "</p>")
P1.append(table(["Biggest N", "OK approach", "Example from our problem sets"], [
    ["N ≤ 10", "anything, even trying all orders (permutations)", "—"],
    ["N ≤ 100", "O(N³) — triple loops are fine", "Street Lamp (try every lamp), Stable Sequence"],
    ["N ≤ 2,000", "O(N²) — double loop", "Smallest Missing Subarray Sum"],
    ["N ≤ 500 × 500 grid", "O(N·M) — visit each cell a few times", "Maximal Square (DP)"],
    ["N ≤ 10⁵ – 10⁶", "O(N) or O(N log N) — one loop, sorting, sieve", "Palindromic Primes, Plus-Minus Sum"],
    ["N ≤ 10⁹ or more", "O(1) formula or O(digits) — never loop up to N", "Round to Ten, Calculator, Digital Root"],
]))

P1.append("<h2>Rule 5 — Points strategy</h2>")
P1.append(ul([
    "In the practice set **every item was worth 10 points**. Equal points → solve the **easiest first**, not in order.",
    "First 5 minutes: skim **all** problems and label each **E / M / H**. Do every E, then M, then H.",
    "Stuck for more than ~15 minutes? Submit what you have (if scoring is per test case, a brute force still earns points) and move on. Come back later.",
    "**Check the editor language before typing.** The practice screens showed `main.c` on most items — make sure the file says `script.py` / Python is selected.",
    "Never leave an item blank. Even reading the input and printing the label right can pass an edge test (e.g. answer 0).",
]))

P1.append("<h2>Rule 6 — Team split (adjust to your team size)</h2>")
P1.append(table(["Member", "First pass", "Then"], [
    ["A — fastest typer", "All **Easy** items, top to bottom (formula, loops, strings)", "Helps test others' edge cases"],
    ["B — strongest on strings/lists", "**Medium** string / array items (ciphers, patterns, shifts)", "Takes the next Medium"],
    ["C — strongest on grids/logic", "**Hard** items (grids, DP, BFS, simulations)", "Partial-credit brute force if stuck"],
]))
P1.append("<p class='note'>" + md("If the contest is individual, use the same order yourself: Easy → Medium → Hard.") + "</p>")

P1.append("<h2>The I/O template — memorise this shape</h2>")
P1.append(code('''# 1) READ  — copy prompt text exactly (including the space after ':')
n = int(input("Enter N: "))
arr = list(map(int, input("Enter the numbers: ").split()))

# 2) SOLVE — plain variables, no fancy tricks needed
answer = 0
for x in arr:
    answer += x

# 3) PRINT — copy the output label exactly
print(f"Result: {answer}")''', "template.py"))

PART1 = section("rules", "1", "Contest-Day Rules", "Read this first. These rules matter more than any algorithm.", "".join(P1))

# =====================================================================================
# PART 2 — PYTHON MUST-KNOW
# =====================================================================================
P2 = []
P2.append("<h2>2.1 Reading input — every shape you will meet</h2>")
P2.append(table(["Input looks like", "Code"], [
    ["one integer", "`n = int(input(\"Enter N: \"))`"],
    ["two integers on one line `3 3`", "`a, b = map(int, input(\"...: \").split())`"],
    ["N integers on one line", "`arr = list(map(int, input(\"...: \").split()))`"],
    ["an int and a float on one line `4 2.0`", "`p = input().split(); n = int(p[0]); t = float(p[1])`"],
    ["a sentence (keep spaces)", "`s = input(\"Enter sentence: \")` — do **not** split"],
    ["a 'number' you treat as text (`0011`)", "`s = input().strip()` — `int()` would delete leading zeros"],
    ["R lines of characters (grid)", "`grid = [list(input().strip()) for _ in range(R)]`"],
    ["R lines of numbers (matrix)", "`mat = [list(map(int, input().split())) for _ in range(R)]`"],
    ["a single character `L` / `R`", "`d = input().strip().upper()`"],
    ["numbers that may wrap onto several lines", "`a = []` then `while len(a) < n: a += map(int, input().split())`"],
]))

P2.append("<h2>2.2 Printing output</h2>")
P2.append(table(["Goal", "Code", "Prints"], [
    ["label + value", "`print(f\"Total: {t}\")`", "`Total: 52`"],
    ["label + value (comma form)", "`print(\"Total:\", t)`", "`Total: 52` (adds one space)"],
    ["list space-separated", "`print(*lst)`", "`1 2 3`"],
    ["label + list", "`print(\"Shifted array:\", *lst)`", "`Shifted array: 3 4 5 1 2`"],
    ["join strings", "`\" \".join(map(str, lst))`", "`1 2 3`"],
    ["2 decimals", "`f\"{x:.2f}\"`", "`10.50`"],
    ["no newline at end", "`print(x, end=\"\")`", ""],
    ["no space between items", "`print(a, b, sep=\"\")`", "`ab`"],
    ["pad to width 5", "`f\"{x:>5}\"`  /  `f\"{x:<5}\"`", "`   42`"],
    ["each row of a grid", "`for row in grid: print(\"\".join(row))`", "`RRF`"],
]))

P2.append("<h2>2.3 Strings</h2>")
P2.append(table(["Code", "What it does"], [
    ["`s.split()`", "words, splits on any whitespace (safer than `split(' ')`)"],
    ["`\" \".join(words)`", "glue a list of strings back together"],
    ["`s.replace('0', '')`", "remove / replace every occurrence"],
    ["`s.strip()`", "remove spaces and newline at both ends"],
    ["`s.lower()`, `s.upper()`", "change case (for case-insensitive checks)"],
    ["`ch.isalpha()`, `ch.isdigit()`, `ch.isupper()`, `ch.islower()`, `ch.isspace()`", "classify one character"],
    ["`s[::-1]`", "reverse — palindrome test: `s == s[::-1]`"],
    ["`s[i]`, `s[a:b]`, `s[-1]`", "index, slice, last character"],
    ["`s.count('a')`, `s.find('ab')`, `'ab' in s`", "count, first position (-1 if none), contains"],
    ["`ord('a')` → 97, `chr(97)` → `'a'`", "letters ↔ numbers (ciphers)"],
    ["`(ord(ch) - ord('a') + k) % 26`", "position 0–25 after shifting by k, wraps around"],
    ["`str(n)`, `len(str(n))`, `int(d) for d in str(n)`", "digits of a number"],
]))

P2.append("<h2>2.4 Lists</h2>")
P2.append(table(["Code", "What it does"], [
    ["`a.append(x)`, `a.pop()`, `a.pop(0)`", "add to end, remove from end (fast), remove from front (slow → use deque)"],
    ["`a[k:] + a[:k]`", "rotate left by k"],
    ["`a[::-1]`, `a.reverse()`, `reversed(a)`", "reverse (copy / in place / iterator)"],
    ["`sorted(a)`, `sorted(a, reverse=True)`, `a.sort()`", "sort (copy / descending / in place)"],
    ["`sorted(a, key=len)`, `key=lambda p: (-p[1], p[0])`", "sort by a rule; tuple key = tie-breakers"],
    ["`sum(a)`, `min(a)`, `max(a)`, `max(a, key=len)`", "totals and extremes"],
    ["`a.index(x)`, `a.count(x)`, `x in a`", "position, count, membership (O(N) — use a set for speed)"],
    ["`for i, x in enumerate(a)`", "index and value together"],
    ["`for x, y in zip(a, a[1:])`", "every pair of neighbours"],
    ["`[x * 2 for x in a if x > 0]`", "list comprehension: map + filter"],
    ["`[[0] * m for _ in range(n)]`", "**correct** 2D grid"],
    ["`list(zip(*m))`", "transpose a matrix; `zip(*m[::-1])` rotates 90° clockwise"],
]))

P2.append("<h2>2.5 Math</h2>")
P2.append(table(["Code", "Notes"], [
    ["`a // b`, `a % b`, `divmod(a, b)`", "integer division, remainder, both at once"],
    ["`n % 10`, `n // 10`", "last digit, remove last digit"],
    ["`abs(x)`, `x ** y`, `pow(a, b, m)`", "absolute, power, fast power mod m"],
    ["`math.isqrt(n)`", "exact integer square root (prime checks)"],
    ["`math.gcd(a, b)`, `math.lcm(a, b)`", "gcd / lcm (lcm needs Python 3.9+)"],
    ["`math.factorial(n)`, `math.comb(n, k)`, `math.perm(n, k)`", "n!, nCk, nPk"],
    ["`float('inf')`, `-float('inf')`", "start values for min / max searches"],
    ["`(n + 5) // 10 * 10`", "round to nearest 10 (half rounds up) — safe integer way"],
    ["`-(-a // b)`", "ceiling division without floats"],
    ["Python ints never overflow", "20! or 10¹⁸ is fine — no `long long` worries"],
]))

P2.append("<h2>2.6 Loops you should be able to write without thinking</h2>")
P2.append(code('''for i in range(a, b + 1):          # a..b INCLUSIVE
for i in range(n - 1, -1, -1):     # n-1 down to 0
for i in range(1, n):              # compare a[i] with a[i-1]
for i in range(1, n - 1):          # both neighbours exist (peaks/valleys)
for r in range(R):                 # every cell of a grid
    for c in range(C):
        ...
while n > 0:                       # every digit of n, right to left
    d = n % 10
    n //= 10
while True:                        # simulate until nothing changes
    changed = False
    ...
    if not changed:
        break''', "loop patterns"))

P2.append("<h2>2.7 Python traps that silently give wrong answers</h2>")
P2.append(table(["Trap", "What happens", "Fix"], [
    ["`round(2.5)` / `round(25, -1)`", "gives `2` / `20` — Python rounds .5 to the **even** number", "integer math: `(n + 5) // 10 * 10`"],
    ["`grid = [[0]*m]*n`", "every row is the **same** list; changing one changes all", "`[[0]*m for _ in range(n)]`"],
    ["`a[i-1]` when `i = 0`", "`a[-1]` is the **last** element — no error, wrong answer", "start loops at 1 / check `i > 0`"],
    ["`int(\"0011\")`", "becomes `11` — leading zeros gone", "keep it as a string"],
    ["`\"a  b\".split(\" \")`", "`['a', '', 'b']` — empty words", "use `split()` with no argument"],
    ["`-7 // 2`", "`-4` (floors toward −∞)", "be careful with negatives"],
    ["`-1 % 26`", "`25` — Python's `%` is never negative (good for ciphers!)", "use it on purpose"],
    ["`int(\"2.0\")`", "crashes (`ValueError`)", "`float(\"2.0\")` first"],
    ["naming a variable `sum`, `max`, `list`, `str`", "you lose the built-in function", "use `total`, `best`, `arr`, `s`"],
    ["deep recursion", "crashes after ~1000 calls", "write it with a loop / queue instead"],
    ["`0.1 + 0.2 == 0.3`", "`False` (float error)", "compare with `abs(a-b) < 1e-9`, or use integers"],
]))
PART2 = section("python", "2", "Python You Must Have Memorised", "No internet, no autocomplete. These must come out of your fingers.", "".join(P2))

# =====================================================================================
# PART 3 — DATA STRUCTURES
# =====================================================================================
P3 = []
P3.append("<h2>3.1 MUST know (used in our problem sets)</h2>")
P3.append(table(["Structure", "Use it when…", "Key operations", "Seen in"], [
    ["**list**", "ordered values, arrays, results", "`append`, index, slice, `sort`, `sum`", "almost everything"],
    ["**2D list** (grid)", "rows × columns, maps, matrices", "`g[r][c]`, bounds check `0 <= r < R`", "Rotting Fruit, Maximal Square, Symmetric Subgrid"],
    ["**str**", "text, digits of a number", "`split`, `replace`, slicing, `[::-1]`", "Calculator, Longest Word, Cipher, ZigZag"],
    ["**dict**", "map a key to a value (lookup table)", "`d[k]`, `d.get(k, 0)`, `for k, v in d.items()`", "Roman to Integer"],
    ["**set**", "fast 'have I seen this?', remove duplicates", "`add`, `in` (O(1)), `len(set(a))`", "Smallest Missing Sum, distinct digits"],
    ["**deque**", "queue for BFS (fast pop from the front)", "`append`, `popleft`", "Rotting Fruit (BFS version)"],
]))
P3.append(code('''from collections import deque, Counter, defaultdict

q = deque([(0, 0)]); q.append((1, 2)); r, c = q.popleft()     # queue
cnt = Counter("banana")            # Counter({'a': 3, 'n': 2, 'b': 1})
cnt.most_common(1)                 # [('a', 3)]
groups = defaultdict(list)         # missing key -> empty list automatically
groups["even"].append(4)''', "collections — the three you need"))

P3.append("<h2>3.2 GOOD to have (common in harder rounds)</h2>")
P3.append(table(["Structure / idea", "Use it when…", "Code"], [
    ["**stack** (list)", "brackets, undo, 'most recent first'", "`st.append(x)`, `st.pop()`, `st[-1]`"],
    ["**prefix sums**", "many 'sum from L to R' questions", "`pre[i+1] = pre[i] + a[i]`; sum = `pre[R+1] - pre[L]`"],
    ["**sliding window**", "best sum / count over K consecutive items", "add new item, subtract the one leaving"],
    ["**heapq**", "repeatedly take the smallest item", "`heapq.heappush(h, x)`, `heapq.heappop(h)`"],
    ["**bisect**", "position in a sorted list", "`bisect.bisect_left(a, x)`"],
    ["**tuple as dict key**", "grid cells, pairs", "`seen.add((r, c))`"],
    ["**itertools**", "all pairs / orders / combos", "`combinations(a, 2)`, `permutations(a)`, `product(a, b)`"],
]))

P3.append("<h2>3.3 Speed facts that decide pass / fail</h2>")
P3.append(table(["Operation", "Cost", "Lesson"], [
    ["`x in list`", "O(N) — scans everything", "inside a loop → O(N²). Use a **set**."],
    ["`x in set`, `d[k]`", "O(1)", "default choice for lookups"],
    ["`list.pop(0)`, `list.insert(0, x)`", "O(N)", "use `deque.popleft()` for queues"],
    ["`s += ch` on strings in a loop", "fine for ≤ 10⁴ chars", "for huge strings, collect in a list and `''.join`"],
    ["`sorted(a)`", "O(N log N)", "10⁶ items ≈ 1 second"],
]))
P3.append(callout("skip", "You can skip this week",
    "<p>" + md("Linked lists, binary trees, Dijkstra, segment trees, tries. Nothing in last year's 16 problems "
               "or this year's 10 practice problems needed them. Spend the time on Parts 4 and 5.") + "</p>"))
PART3 = section("ds", "3", "Data Structures", "What you must know vs. what is nice to have.", "".join(P3))

# =====================================================================================
# PART 4 — TECHNIQUES PLAYBOOK
# =====================================================================================
TECH = [
    ("T1", "Direct formula / simple loop",
     "“Each row has 2 more…”, “first 10 cost…, beyond that…”, “add the first, subtract the second…”",
     '''total = 0
for i in range(1, n + 1):
    total += term(i)          # or find the closed formula''',
     "Theater Seats, Water Bill, Plus-Minus Sum, Alternating Factorial"),
    ("T2", "Digit manipulation",
     "“digits of N”, “remove zeros”, “sum of digits”, “palindromic number”, N up to 10⁹",
     '''s = str(n)                        # easiest: treat as text
digit_sum = sum(int(d) for d in s)
count = len(s)
is_pal = s == s[::-1]
# math way:  while n > 0: d = n % 10; n //= 10''',
     "Calculator Without Zeros, Digital Root, Digit Sum Power, Digit Product Series"),
    ("T3", "String processing & classification",
     "“words separated by spaces”, “vowels/consonants”, “ignore non-letters”, “case-insensitive”",
     '''words = s.split()
letters = [ch.lower() for ch in s if ch.isalpha()]
is_vowel = ch in "aeiou"''',
     "Longest Word, Alternating Character Pattern, Roman to Integer"),
    ("T4", "Character shifting (ciphers)",
     "“shift each letter by…”, “wraps around”, “Caesar”",
     '''base = ord('a') if ch.islower() else ord('A')
new = chr((ord(ch) - base - shift) % 26 + base)''',
     "Positional Cipher"),
    ("T5", "Neighbour comparison",
     "“higher than the day before”, “greater than both neighbours”",
     '''for i in range(1, n):            # a[i] vs a[i-1]
    if a[i] > a[i - 1]: ...
for i in range(1, n - 1):        # a[i] vs both sides
    if a[i] > a[i-1] and a[i] > a[i+1]: ...''',
     "Warmer Than Yesterday, Peak-Valley Difference"),
    ("T6", "Runs / streaks & “try every option”",
     "“longest stretch”, “consecutive”, “choose exactly one to change, best result”",
     '''best = cur = 0
for x in a:
    cur = cur + 1 if ok(x) else 0
    best = max(best, cur)
# try every option: for each candidate, compute result, keep max''',
     "Fix One Street Lamp"),
    ("T7", "Clamping & tiers",
     "“never more than 50”, “no fine for 7 days or less”, “first 10 at …, the rest at …”",
     '''fine = min(50, max(0, d - 7) * 5)
bill = min(u, 10) * 15 + max(u - 10, 0) * 25''',
     "Library Late Fines, Tiered Water Bill"),
    ("T8", "Grid neighbours with bounds",
     "grid / matrix + “above, below, left, right”",
     '''DIRS = ((-1, 0), (1, 0), (0, -1), (0, 1))
for dr, dc in DIRS:
    nr, nc = r + dr, c + dc
    if 0 <= nr < R and 0 <= nc < C:      # ALWAYS check before g[nr][nc]
        ...''',
     "Rotting Fruit Crate, Largest Symmetric Subgrid"),
    ("T9", "Multi-source BFS (spreading)",
     "“every minute it spreads to neighbours”, “minimum steps”, “at the same time from several places”",
     '''from collections import deque
q = deque(all_start_cells); dist = {cell: 0 for cell in all_start_cells}
while q:
    r, c = q.popleft()
    for each valid neighbour (nr, nc) not in dist:
        dist[(nr, nc)] = dist[(r, c)] + 1
        q.append((nr, nc))''',
     "Rotting Fruit Crate (fast version), drill D04 Island Counter"),
    ("T10", "Simulate until stable",
     "“repeat until no more changes”, “all changes happen at the same time”",
     '''while True:
    changes = [...]          # 1) FIND all changes without applying them
    if not changes: break
    apply(changes)           # 2) APPLY all at once
    steps += 1''',
     "Rotting Fruit Crate, Stable Sequence Reduction"),
    ("T11", "Primes: sieve",
     "“count primes in a range”, R up to 10⁵–10⁶",
     '''is_p = [True] * (R + 1); is_p[0] = is_p[1] = False
for i in range(2, int(R ** 0.5) + 1):
    if is_p[i]:
        for j in range(i * i, R + 1, i):
            is_p[j] = False''',
     "Palindromic Prime Counter"),
    ("T12", "Subarray sums / prefix sums / sliding window",
     "“contiguous subarray”, “sum from L to R”, “K consecutive days”",
     '''for i in range(n):              # every subarray starting at i
    s = 0
    for j in range(i, n):
        s += a[j]                 # s = sum(a[i..j]) in O(1) per step''',
     "Smallest Missing Subarray Sum, drills D05–D06"),
    ("T13", "Dynamic programming on a grid / table",
     "“largest square”, “number of paths”, each answer built from smaller neighbours",
     '''dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])   # max square
row = [1] + [row[k] + row[k+1] for k in range(len(row)-1)] + [1]   # Pascal''',
     "Maximal Square of Ones, Pascal's Triangle, drill D11"),
    ("T14", "Rotation, wrap-around & bouncing indexes",
     "“cyclic”, “wrap around”, “K can be larger than N”, “zigzag”",
     '''k %= n
left = a[k:] + a[:k]
right = a[n - k:] + a[:n - k]
# bouncing row: if r == 0: step = 1; elif r == rows-1: step = -1; r += step''',
     "Cyclic Array Shift, ZigZag Conversion"),
    ("T15", "Brute force + pruning",
     "“largest … such that …”, small enough N, no obvious formula",
     '''for size in range(N, 0, -1):          # biggest first
    for every position:
        if cheap_check() and full_check():
            print(size); exit''',
     "Largest Symmetric Subgrid"),
]
P4 = ["<p>" + md("Each pattern: **how to spot it** in the wording, a **template**, and **where it appeared**. "
                 "When you read a new problem, scan this list and ask “which one is this?”") + "</p>"]
for tid, name, spot, tmpl, seen in TECH:
    P4.append(f'<div class="tech"><div class="tech-h"><span class="tid">{tid}</span>{md(name)}</div>'
              f'<div class="tech-b"><p><b>Spot it:</b> {md(spot)}</p>{code(tmpl)}'
              f'<p class="seen"><b>Seen in:</b> {md(seen)}</p></div></div>')
PART4 = section("tech", "4", "Techniques Playbook", "15 patterns that cover all 26 problems.", "".join(P4))
