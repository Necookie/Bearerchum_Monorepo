"""Nightly SQLite backup sidecar:  python -m app.backup

Uses SQLite's online backup API (safe while the app is writing) to copy
$DATA_DIR/bearerchum.db -> $DATA_DIR/backups/bearerchum-YYYYmmdd-HHMM.db once a day at
BACKUP_HOUR (Asia/Manila), keeping BACKUP_RETENTION_DAYS days. One backup is also taken at start.
"""
import os
import sqlite3
import time
from datetime import datetime, timedelta, timezone

DATA_DIR = os.environ.get("DATA_DIR", "/data")
DB = os.path.join(DATA_DIR, "bearerchum.db")
OUT = os.path.join(DATA_DIR, "backups")
HOUR = int(os.environ.get("BACKUP_HOUR", "3"))
KEEP_DAYS = int(os.environ.get("BACKUP_RETENTION_DAYS", "14"))
TZ = timezone(timedelta(hours=8))


def backup_once() -> str | None:
    if not os.path.exists(DB):
        print("backup: no database yet", flush=True)
        return None
    os.makedirs(OUT, exist_ok=True)
    dest = os.path.join(OUT, f"bearerchum-{datetime.now(TZ):%Y%m%d-%H%M}.db")
    src = sqlite3.connect(DB)
    dst = sqlite3.connect(dest)
    with dst:
        src.backup(dst)
    dst.close()
    src.close()
    ok = sqlite3.connect(dest).execute("PRAGMA integrity_check").fetchone()[0]
    print(f"backup: wrote {dest} ({os.path.getsize(dest)} bytes, integrity={ok})", flush=True)
    prune()
    return dest


def prune():
    cutoff = time.time() - KEEP_DAYS * 86400
    for f in os.listdir(OUT):
        p = os.path.join(OUT, f)
        if f.endswith(".db") and os.path.getmtime(p) < cutoff:
            os.remove(p)
            print(f"backup: pruned {f}", flush=True)


def seconds_until_next() -> float:
    now = datetime.now(TZ)
    nxt = now.replace(hour=HOUR, minute=0, second=0, microsecond=0)
    if nxt <= now:
        nxt += timedelta(days=1)
    return (nxt - now).total_seconds()


if __name__ == "__main__":
    backup_once()
    while True:
        time.sleep(seconds_until_next())
        try:
            backup_once()
        except Exception as e:  # keep the sidecar alive; next night will retry
            print(f"backup: FAILED {e!r}", flush=True)
            time.sleep(60)
