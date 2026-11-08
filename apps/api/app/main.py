"""Bearerchum API + static web host.

/api/*   JSON API (auth, progress sync, team board)
/*       the built React app (apps/web/dist), with SPA fallback to index.html
"""
import json
import os
import re
import time
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db
from .security import RateLimiter, hash_pin, new_token, token_hash, verify_pin

TEAM_CODE = os.environ.get("TEAM_CODE", "").strip()
WEB_DIR = os.environ.get("WEB_DIR", os.path.join(os.path.dirname(__file__), "..", "..", "web", "dist"))
TZ = timezone(timedelta(hours=8))            # Asia/Manila — day boundaries for streaks
NAME_RE = re.compile(r"^[A-Za-z0-9 _.\-]{2,24}$")

app = FastAPI(title="Bearerchum API", docs_url="/api/docs", openapi_url="/api/openapi.json")
login_limiter = RateLimiter(limit=10, window_s=600)


@app.on_event("startup")
def _startup():
    db.init()


def now() -> int:
    return int(time.time())


# ------------------------------------------------------------------ auth
class Credentials(BaseModel):
    name: str = Field(min_length=2, max_length=24)
    pin: str = Field(min_length=4, max_length=32)
    teamCode: str | None = None


def current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not signed in")
    th = token_hash(authorization[7:].strip())
    with db.connect() as c:
        row = c.execute("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
                        (th,)).fetchone()
        if not row:
            raise HTTPException(401, "Session expired — sign in again")
        c.execute("UPDATE users SET last_seen = ? WHERE id = ?", (now(), row["id"]))
    return dict(row)


def _session_for(user_id: int) -> str:
    token, th = new_token()
    with db.connect() as c:
        c.execute("INSERT INTO sessions(token_hash, user_id, created_at) VALUES (?,?,?)", (th, user_id, now()))
    return token


def _public_user(u):
    return {"id": u["id"], "name": u["name"], "settings": json.loads(u.get("settings") or "{}")}


@app.post("/api/auth/register")
def register(body: Credentials, request: Request):
    name = body.name.strip()
    if not NAME_RE.match(name):
        raise HTTPException(400, "Name: 2–24 letters, numbers, spaces, . _ -")
    if TEAM_CODE and (body.teamCode or "").strip().upper() != TEAM_CODE.upper():
        raise HTTPException(403, "Wrong team code")
    if not login_limiter.allow("reg:" + (request.client.host if request.client else "?")):
        raise HTTPException(429, "Too many attempts — wait a few minutes")
    pin_h, salt = hash_pin(body.pin)
    try:
        with db.connect() as c:
            cur = c.execute("INSERT INTO users(name, pin_hash, salt, created_at, last_seen) VALUES (?,?,?,?,?)",
                            (name, pin_h, salt, now(), now()))
            uid = cur.lastrowid
            user = dict(c.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone())
    except Exception as e:  # sqlite3.IntegrityError
        if "UNIQUE" in str(e):
            raise HTTPException(409, "That name is taken — sign in instead")
        raise
    return {"token": _session_for(uid), "user": _public_user(user)}


@app.post("/api/auth/login")
def login(body: Credentials, request: Request):
    key = "login:" + body.name.strip().lower()
    if not login_limiter.allow(key):
        raise HTTPException(429, "Too many attempts — wait a few minutes")
    with db.connect() as c:
        row = c.execute("SELECT * FROM users WHERE name = ?", (body.name.strip(),)).fetchone()
    if not row or not verify_pin(body.pin, row["pin_hash"], row["salt"]):
        raise HTTPException(401, "Wrong name or PIN")
    return {"token": _session_for(row["id"]), "user": _public_user(dict(row))}


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        with db.connect() as c:
            c.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash(authorization[7:].strip()),))
    return {"ok": True}


@app.get("/api/me")
def me(user=Depends(current_user)):
    return {"user": _public_user(user), "teamCodeRequired": bool(TEAM_CODE)}


class DeleteBody(BaseModel):
    pin: str = Field(min_length=4, max_length=32)


@app.post("/api/me/delete")
def delete_me(body: DeleteBody, user=Depends(current_user)):
    """Permanently delete the signed-in account and all its progress (PIN required)."""
    if not verify_pin(body.pin, user["pin_hash"], user["salt"]):
        raise HTTPException(403, "Wrong PIN")
    with db.connect() as c:
        c.execute("DELETE FROM users WHERE id = ?", (user["id"],))      # cascades to all progress tables
    return {"ok": True}


@app.get("/api/config")
def config():
    return {"teamCodeRequired": bool(TEAM_CODE)}


# ------------------------------------------------------------------ progress
class CardReview(BaseModel):
    state: dict
    grade: int = Field(ge=1, le=4)
    isNew: bool = False
    ts: int | None = None


class Attempt(BaseModel):
    problemId: str = Field(max_length=8)
    kind: str = Field(pattern="^(run|submit)$")
    passed: int = Field(ge=0)
    total: int = Field(ge=0)
    code: str | None = Field(default=None, max_length=50_000)


class Draft(BaseModel):
    code: str = Field(max_length=50_000)


class Settings(BaseModel):
    settings: dict


class ImportBody(BaseModel):
    cards: dict = {}
    problems: dict = {}
    drafts: dict = {}


def _progress(uid: int):
    with db.connect() as c:
        cards = {r["card_id"]: json.loads(r["state"])
                 for r in c.execute("SELECT card_id, state FROM card_states WHERE user_id = ?", (uid,))}
        problems = {r["problem_id"]: {"bestPassed": r["best_passed"], "total": r["total"], "solved": bool(r["solved"]),
                                      "attempts": r["attempts"], "solvedAt": r["solved_at"], "lastTs": r["last_ts"]}
                    for r in c.execute("SELECT * FROM problem_status WHERE user_id = ?", (uid,))}
        drafts = {r["problem_id"]: r["code"] for r in c.execute(
            "SELECT problem_id, code FROM drafts WHERE user_id = ?", (uid,))}
        since = now() - 40 * 86400
        days: dict[str, dict] = {}
        for r in c.execute("SELECT ts, is_new FROM reviews WHERE user_id = ? AND ts > ?", (uid, since)):
            d = _day(r["ts"])
            e = days.setdefault(d, {"reviews": 0, "new": 0, "attempts": 0})
            e["reviews"] += 1
            e["new"] += r["is_new"]
        for r in c.execute("SELECT ts FROM attempts WHERE user_id = ? AND ts > ?", (uid, since)):
            days.setdefault(_day(r["ts"]), {"reviews": 0, "new": 0, "attempts": 0})["attempts"] += 1
    return {"cards": cards, "problems": problems, "drafts": drafts, "days": days}


def _day(ts: int) -> str:
    return datetime.fromtimestamp(ts, TZ).strftime("%Y-%m-%d")


@app.get("/api/progress")
def get_progress(user=Depends(current_user)):
    return _progress(user["id"])


@app.put("/api/progress/cards/{card_id}")
def put_card(card_id: str, body: CardReview, user=Depends(current_user)):
    if len(card_id) > 40:
        raise HTTPException(400, "bad card id")
    ts = body.ts or now()
    due = int(body.state.get("due", ts * 1000) // 1000)
    with db.connect() as c:
        c.execute("""INSERT INTO card_states(user_id, card_id, state, due, updated_at) VALUES (?,?,?,?,?)
                     ON CONFLICT(user_id, card_id) DO UPDATE SET state=excluded.state, due=excluded.due,
                     updated_at=excluded.updated_at""",
                  (user["id"], card_id, json.dumps(body.state), due, ts))
        c.execute("INSERT INTO reviews(user_id, card_id, grade, is_new, ts) VALUES (?,?,?,?,?)",
                  (user["id"], card_id, body.grade, int(body.isNew), ts))
    return {"ok": True}


@app.post("/api/progress/attempts")
def post_attempt(body: Attempt, user=Depends(current_user)):
    ts = now()
    solved = body.kind == "submit" and body.total > 0 and body.passed == body.total
    with db.connect() as c:
        c.execute("INSERT INTO attempts(user_id, problem_id, kind, passed, total, ts) VALUES (?,?,?,?,?,?)",
                  (user["id"], body.problemId, body.kind, body.passed, body.total, ts))
        row = c.execute("SELECT * FROM problem_status WHERE user_id = ? AND problem_id = ?",
                        (user["id"], body.problemId)).fetchone()
        if row is None:
            c.execute("""INSERT INTO problem_status(user_id, problem_id, best_passed, total, solved, attempts,
                         solved_at, last_ts) VALUES (?,?,?,?,?,?,?,?)""",
                      (user["id"], body.problemId, body.passed if body.kind == "submit" else 0,
                       body.total if body.kind == "submit" else 0, int(solved), 1, ts if solved else None, ts))
        else:
            best, total = row["best_passed"], row["total"]
            if body.kind == "submit" and body.passed >= best:
                best, total = body.passed, body.total
            c.execute("""UPDATE problem_status SET best_passed=?, total=?, solved=MAX(solved, ?), attempts=attempts+1,
                         solved_at=COALESCE(solved_at, ?), last_ts=? WHERE user_id=? AND problem_id=?""",
                      (best, total, int(solved), ts if solved else None, ts, user["id"], body.problemId))
        if body.code is not None:
            c.execute("""INSERT INTO drafts(user_id, problem_id, code, updated_at) VALUES (?,?,?,?)
                         ON CONFLICT(user_id, problem_id) DO UPDATE SET code=excluded.code, updated_at=excluded.updated_at""",
                      (user["id"], body.problemId, body.code, ts))
    return {"ok": True, "solved": solved}


@app.put("/api/progress/drafts/{problem_id}")
def put_draft(problem_id: str, body: Draft, user=Depends(current_user)):
    with db.connect() as c:
        c.execute("""INSERT INTO drafts(user_id, problem_id, code, updated_at) VALUES (?,?,?,?)
                     ON CONFLICT(user_id, problem_id) DO UPDATE SET code=excluded.code, updated_at=excluded.updated_at""",
                  (user["id"], problem_id[:8], body.code, now()))
    return {"ok": True}


@app.put("/api/settings")
def put_settings(body: Settings, user=Depends(current_user)):
    with db.connect() as c:
        c.execute("UPDATE users SET settings = ? WHERE id = ?", (json.dumps(body.settings)[:4000], user["id"]))
    return {"ok": True}


@app.post("/api/progress/import")
def import_progress(body: ImportBody, user=Depends(current_user)):
    """Merge guest (browser) progress into the account. Server copy wins when it is newer."""
    uid, ts = user["id"], now()
    with db.connect() as c:
        for cid, st in list(body.cards.items())[:2000]:
            have = c.execute("SELECT state FROM card_states WHERE user_id=? AND card_id=?", (uid, cid)).fetchone()
            if have and json.loads(have["state"]).get("last", 0) >= st.get("last", 0):
                continue
            c.execute("""INSERT INTO card_states(user_id, card_id, state, due, updated_at) VALUES (?,?,?,?,?)
                         ON CONFLICT(user_id, card_id) DO UPDATE SET state=excluded.state, due=excluded.due,
                         updated_at=excluded.updated_at""",
                      (uid, cid[:40], json.dumps(st), int(st.get("due", ts * 1000) // 1000), ts))
        for pid, ps in list(body.problems.items())[:200]:
            have = c.execute("SELECT 1 FROM problem_status WHERE user_id=? AND problem_id=?", (uid, pid)).fetchone()
            if have:
                continue
            c.execute("""INSERT INTO problem_status(user_id, problem_id, best_passed, total, solved, attempts,
                         solved_at, last_ts) VALUES (?,?,?,?,?,?,?,?)""",
                      (uid, pid[:8], int(ps.get("bestPassed", 0)), int(ps.get("total", 0)), int(bool(ps.get("solved"))),
                       int(ps.get("attempts", 0)), ps.get("solvedAt"), int(ps.get("lastTs") or ts)))
        for pid, code in list(body.drafts.items())[:200]:
            c.execute("""INSERT OR IGNORE INTO drafts(user_id, problem_id, code, updated_at) VALUES (?,?,?,?)""",
                      (uid, pid[:8], str(code)[:50_000], ts))
    return _progress(uid)


# ------------------------------------------------------------------ team board
def _streak(day_set: set[str]) -> int:
    d = datetime.now(TZ).date()
    if d.strftime("%Y-%m-%d") not in day_set:      # today not done yet: streak continues from yesterday
        d -= timedelta(days=1)
    n = 0
    while d.strftime("%Y-%m-%d") in day_set:
        n += 1
        d -= timedelta(days=1)
    return n


@app.get("/api/team")
def team(user=Depends(current_user)):
    week_ago, today = now() - 7 * 86400, datetime.now(TZ).strftime("%Y-%m-%d")
    members = []
    with db.connect() as c:
        for u in c.execute("SELECT id, name, last_seen, created_at FROM users ORDER BY name COLLATE NOCASE"):
            uid = u["id"]
            days = set()
            reviews_week = reviews_today = 0
            for r in c.execute("SELECT ts FROM reviews WHERE user_id=? AND ts > ?", (uid, now() - 60 * 86400)):
                dd = _day(r["ts"])
                days.add(dd)
                if r["ts"] > week_ago:
                    reviews_week += 1
                if dd == today:
                    reviews_today += 1
            for r in c.execute("SELECT ts FROM attempts WHERE user_id=? AND ts > ?", (uid, now() - 60 * 86400)):
                days.add(_day(r["ts"]))
            probs = {r["problem_id"]: {"solved": bool(r["solved"]), "best": r["best_passed"], "total": r["total"]}
                     for r in c.execute("SELECT * FROM problem_status WHERE user_id=?", (uid,))}
            cards = {}
            for r in c.execute("SELECT card_id, state FROM card_states WHERE user_id=?", (uid,)):
                s = json.loads(r["state"])
                cards[r["card_id"]] = [s.get("reps", 0), s.get("lapses", 0), s.get("ivl", 0)]
            members.append({"name": u["name"], "me": uid == user["id"], "lastSeen": u["last_seen"],
                            "streak": _streak(days), "reviewsWeek": reviews_week, "reviewsToday": reviews_today,
                            "problems": probs, "cards": cards})
    return {"members": members}


@app.get("/api/health")
def health():
    with db.connect() as c:
        c.execute("SELECT 1")
    return {"ok": True}


# ------------------------------------------------------------------ static web app
class SPA(StaticFiles):
    async def get_response(self, path, scope):
        path = path.replace("\\", "/")          # Windows dev servers hand us backslashes
        try:
            resp = await super().get_response(path, scope)
        except Exception:
            resp = None
        if resp is None or resp.status_code == 404:
            if path.startswith("api/"):
                return JSONResponse({"detail": "Not found"}, status_code=404)
            return FileResponse(os.path.join(self.directory, "index.html"), headers={"Cache-Control": "no-cache"})
        if path.startswith("assets/"):
            resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        elif path.startswith("content/") or path.endswith(".html") or path in ("", "."):
            resp.headers["Cache-Control"] = "no-cache"
        return resp


if os.path.isdir(WEB_DIR):
    app.mount("/", SPA(directory=WEB_DIR, html=True), name="web")
