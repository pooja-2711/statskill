import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text

from app.core.config import (
    INGEST_ENABLED,
    INGEST_HOUR_IST,
    INGEST_MINUTE_IST,
    INGEST_TIMEZONE,
)
from app.db.session import engine
from app.jobs.daily_ingest import run_daily_ingest

logger = logging.getLogger("uvicorn.error")  # shows up in the uvicorn console

JOB_ID = "daily_ingest"
ADVISORY_LOCK_KEY = 7_412_026_04  # arbitrary constant shared by every process that runs the ingest
MISFIRE_GRACE_SECONDS = 300

_scheduler: BackgroundScheduler | None = None


def run_ingest_job() -> str:
    """Run the ingest once, unless another process is already running it. Never raises."""
    try:
        conn = engine.connect()
    except Exception:
        logger.exception("Daily ingest: could not open a database connection.")
        return "error"

    try:
        got_lock = conn.execute(
            text("SELECT pg_try_advisory_lock(:k)"), {"k": ADVISORY_LOCK_KEY}
        ).scalar()
        if not got_lock:
            logger.warning("Daily ingest skipped: another process is already running it.")
            return "skipped_locked"

        try:
            logger.info("Daily ingest started.")
            stats = run_daily_ingest()
            logger.info("Daily ingest finished in %ss: %s | ai: %s", stats.get("seconds"), stats.get("saved"), stats.get("ai"))
            return "ok"
        except Exception:
            logger.exception("Daily ingest failed.")
            return "error"
        finally:
            try:
                conn.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": ADVISORY_LOCK_KEY})
            except Exception:
                pass  # closing the connection releases the lock anyway
    except Exception:
        logger.exception("Daily ingest: lock handling failed.")
        return "error"
    finally:
        conn.close()


def start_scheduler() -> bool:
    """Start the daily scheduler. Returns True only if this call started it."""
    global _scheduler

    if not INGEST_ENABLED:
        logger.info("Daily ingest scheduler is disabled (INGEST_ENABLED=false).")
        return False
    if _scheduler is not None and _scheduler.running:
        logger.info("Daily ingest scheduler is already running; not starting a second one.")
        return False

    try:
        tz = ZoneInfo(INGEST_TIMEZONE)
        trigger = CronTrigger(hour=INGEST_HOUR_IST, minute=INGEST_MINUTE_IST, timezone=tz)
        scheduler = BackgroundScheduler(timezone=tz)
        scheduler.add_job(
            run_ingest_job,
            trigger,
            id=JOB_ID,
            name="Daily news ingest",
            max_instances=1,
            coalesce=True,
            misfire_grace_time=MISFIRE_GRACE_SECONDS,
            replace_existing=True,
        )
        scheduler.start()
    except Exception:
        logger.exception("Could not start the daily ingest scheduler. The API will run without it.")
        return False

    _scheduler = scheduler
    job = scheduler.get_job(JOB_ID)
    logger.info(
        "Daily ingest scheduler started. Next run: %s (%s)",
        job.next_run_time if job else "unknown",
        INGEST_TIMEZONE,
    )
    return True


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            if _scheduler.running:
                _scheduler.shutdown(wait=False)
                logger.info("Daily ingest scheduler stopped.")
        except Exception:
            logger.exception("Error while stopping the daily ingest scheduler.")
        finally:
            _scheduler = None


def scheduler_status() -> dict:
    if _scheduler is None or not _scheduler.running:
        return {"running": False, "jobs": 0, "next_run": None, "timezone": INGEST_TIMEZONE}
    job = _scheduler.get_job(JOB_ID)
    return {
        "running": True,
        "jobs": len(_scheduler.get_jobs()),
        "next_run": str(job.next_run_time) if job else None,
        "timezone": INGEST_TIMEZONE,
    }