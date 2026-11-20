import json
import sys

from app.jobs.daily_ingest import run_daily_ingest

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

if __name__ == "__main__":
    print(json.dumps(run_daily_ingest(), indent=2, ensure_ascii=False))
