# Bearerchum content

Everything the website teaches lives here as plain files. `tools/build_content.py` validates it,
runs every reference solution to produce expected outputs, and emits JSON for the web app.

```
content/
  solutions/            reference solutions (tested). drills/ holds the D01–D14 drills
  problems/
    meta.py             per-problem metadata + 9-step breakdowns (source of truth for ids)
    statements/<ID>.md  full problem statement (CodeChum format)
    tests/<ID>.json     test INPUTS (samples + hidden + generated). Expected output is computed.
  explanations/<stem>.json   line-by-line explanation of a solution file
  cards/<deck>.json     spaced-repetition flashcards
```

Problem IDs: `P01`–`P10` (practice set), `L01`–`L08` (last year prelims), `S01`–`S08` (last year
semifinals), `D01`–`D14` (drills). Technique tags: `T1`–`T15` (see `problems/meta.py`, `TECHNIQUES`).

---

## How programs are judged (important for tests)

Programs read input with `input("Prompt: ")`. The judge feeds one test line per `input()` call and
builds a **transcript** exactly like CodeChum's sample box: the prompt, then the typed line, then a
newline; everything the program prints is appended in between. Example transcript:

```
Enter number: 40507
Display: 457
```

So a test is just the **list of lines the user types**, in order.

## `problems/statements/<ID>.md`

Faithful wording of the original problem (do not paraphrase CodeChum/past problems; fix only
obvious PDF extraction glitches such as lost superscripts: write `10^9`, `≤`, `×`). Use exactly
these sections, in this order. Inline code with backticks for prompts/labels/literals.

```md
## Problem Statement
...paragraphs...

## Input Format
- ...

## Output Format
- ...

## Constraints
- ...
```

No title line (the title comes from meta). No sample section (samples render from tests).

## `problems/tests/<ID>.json`

```json
{
  "samples": [["10", "4"], ["1", "1"]],
  "hidden": [
    {"name": "R = 1 (only the first row)", "input": ["7", "1"]}
  ],
  "generated": [
    {"name": "max size 500x500 all ones",
     "gen": "lines = ['500 500'] + [' '.join(['1']*500) for _ in range(500)]"}
  ]
}
```

- `samples`: the official sample inputs, in the original order.
- `hidden`: 4–8 edge cases taken from the constraint bullets + classic traps. Each `name` says what
  it tests in plain words (it is shown to students when they fail it).
- `generated` (optional): for big inputs. `gen` is Python executed with `random` already seeded
  (`random.seed(<ID>)`); it must assign a list of strings to `lines`. Keep each generated input
  under ~300 KB.
- Every input must satisfy the problem's constraints.

## `explanations/<stem>.json` (stem = solution filename without `.py`)

```json
{
  "file": "P02_fix_one_street_lamp.py",
  "summary": "2–3 sentences: the big idea in plain words.",
  "blocks": [
    {"lines": [1, 1], "title": "Read the row as text", "text": "markdown, 1–4 sentences: WHAT and WHY"},
    {"lines": [5, 6], "title": "...", "text": "..."}
  ],
  "complexity": "Time O(N^2) with N ≤ 100 → about 10,000 steps.",
  "pitfalls": ["optional short bullet", "..."]
}
```

- `lines` are 1-based inclusive ranges in the solution file. Blocks are in order, do not overlap,
  and together cover every non-blank line. Blank lines may be skipped.
- Explain like a patient senior teammate: why this line exists, what would break without it.

## `cards/<deck>.json`

An array of cards. Decks: `io`, `python`, `traps`, `ds`, `techniques`, `problems`.

```json
{
  "id": "traps-003",
  "deck": "traps",
  "type": "basic | mcq | code | output",
  "tags": ["T6", "strings"],
  "front": "markdown question",
  "back": "markdown answer (basic / code / output)",
  "code": "optional python shown under the question (output cards: the snippet to predict)",
  "choices": ["only for mcq"],
  "answer": 0,
  "explain": "markdown: why (shown after answering, all types)",
  "refs": ["P02"]
}
```

- `basic`: recall a fact. `code`: student types the code from memory, then compares with `back`.
  `output`: predict exactly what `code` prints (`back` = exact output). `mcq`: choose; `answer` is the
  0-based index of the correct choice.
- Every `output` card's `back` must be the real output of running `code` with Python 3.12.
- `id` is permanent (progress is stored by id). Never renumber existing cards.
