# Bearerchum

**CodeBearers' study camp for the CodeChum National Programming Challenge (Python).**
Live at **https://bearerchum.necookie.dev**

- **Daily review**: 143 spaced-repetition cards (I/O idioms, Python built-ins, traps, data
  structures, "spot the technique", problem insights). The scheduler is contest-aware: intervals
  are capped so everything you learn comes back before contest day.
- **Practice judge**: 40 problems (10 practice, 16 from last year's NPC rounds, 14 drills) with
  385 tests. Your Python runs in the browser (Pyodide). Output is compared against a
  CodeChum-style transcript (prompts included), and you get hints when only a space or a label is off.
- **Explained solutions**: every problem has the same 9-step breakdown and a line-by-line
  walkthrough of the reference solution.
- **Recommendations + team board**: per-technique mastery from your reviews and judge results,
  "what to do next", and a team view of streaks, strengths and weak spots so you can split
  problems by strength on contest day.
- **PDF reviewer**: the same material as a 71-page printable PDF (`reviewer/`).

## Repository layout

```
apps/
  web/        React + Vite + TypeScript front end (judge, review, learn, team)
  api/        FastAPI + SQLite: accounts (name + PIN + team code), progress sync, team board.
              In production it also serves the built web app.
content/      everything the site teaches. See content/README.md for formats.
  solutions/          tested reference solutions
  problems/           meta.py (ids, techniques, breakdowns), statements/*.md, tests/*.json
  explanations/       line-by-line walkthroughs
  cards/              flashcards
tools/
  build_content.py    validates content, runs every reference solution, emits JSON for the web app
  textkit.py          tiny markdown + Python highlighter used by the build
reviewer/     PDF reviewer + its HTML->PDF build (reads content/)
Dockerfile    content build -> web build -> runtime (one container)
```

## Develop locally

```bash
# 1. content bundle (re-run after editing anything in content/)
python tools/build_content.py --strict

# 2. API on :8000
cd apps/api && pip install -r requirements.txt
TEAM_CODE=LOCALDEV python -m uvicorn app.main:app --reload --port 8000

# 3. web on :5173 (proxies /api to :8000)
cd apps/web && npm install && npm run dev
```

Production-like run: `docker compose up --build`, then open http://localhost:8080.

## Adding content

- **A problem:** add the reference solution to `content/solutions/`, metadata to
  `content/problems/breakdowns.py` (or `drills.py` + `DRILL_TAGS` in `meta.py`), a statement in
  `statements/<ID>.md`, tests in `tests/<ID>.json` and an explanation in `explanations/`. Then run
  `python tools/build_content.py --strict`. The build fails if a reference solution crashes,
  leaves input unread, or disagrees with an official sample.
- **Cards:** append to `content/cards/<deck>.json`. Card ids are permanent because progress is
  stored by id, so add new ids at the end and never renumber.

## Deployment

- **Frontend:** Cloudflare Worker `bearerchum-web` on `bearerchum.necookie.dev`, with static assets
  plus `/api` forwarding. Deploy with `node infra/scripts/deploy-web.mjs`. See
  [`infra/cloudflare/README.md`](infra/cloudflare/README.md).
- **Backend + database:** Coolify on `necore`, reached privately through Workers VPC and a tunnel
  that has no public hostname.

### Backend (Coolify on `necore`)

Same isolation pattern as the other stacks on `necore`: one Coolify project (**Bearerchum**) with
one "Docker Compose" application. Use Base Directory `/infra/coolify` and Compose file
`/docker-compose.yml`.

| Service | What it does |
|---|---|
| `bearerchum-web` | FastAPI + built site on :8000 (internal only, no host port) |
| `bearerchum-tunnel` | private Cloudflare Tunnel connector (no public hostname), used by the Workers VPC service |
| `bearerchum-backup` | nightly SQLite online backup to `/data/backups` (03:00 Manila, keeps 14 days) |

- Volume `bearerchum-data` (mounted at `/data`) holds `bearerchum.db` and its backups.
- Coolify environment variables: `TEAM_CODE` and `CLOUDFLARE_TUNNEL_TOKEN`. Never commit them.
- The shared Coolify proxy isn't used, and nothing listens on host ports, so it can't clash with
  other projects.

---
Independent study tool by CodeBearers. Not affiliated with CodeChum.
