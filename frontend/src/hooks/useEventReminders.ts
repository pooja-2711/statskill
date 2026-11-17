import { useEffect, useRef } from "react";
import { calendarService } from "../services/calendarService";

const KEY = "statskill_reminded_events";

function load(): Set<string> {
  try { return new Set<string>(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); }
}
function save(s: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...s].slice(-200))); } catch { /* ignore */ }
}

export function useEventReminders(enabled: boolean, notify: (message: string) => void) {
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; });

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const check = async () => {
      try {
        const due = await calendarService.remindersDue();
        if (stopped) return;
        const seen = load();
        let changed = false;
        for (const ev of due) {
          const id = `${ev.id}:${ev.start_at}:${ev.remind_minutes_before}`;
          if (seen.has(id)) continue;
          seen.add(id);
          changed = true;
          const when = ev.all_day
            ? new Date(ev.start_at).toISOString().slice(0, 10)
            : new Date(ev.start_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
          notifyRef.current(`Reminder: ${ev.title} (${when})`);
        }
        if (changed) save(seen);
      } catch { /* offline or logged out: try again next tick */ }
    };
    void check();
    const t = setInterval(() => void check(), 60_000);
    return () => { stopped = true; clearInterval(t); };
  }, [enabled]);
}