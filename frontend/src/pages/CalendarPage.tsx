import { useCallback, useEffect, useMemo, useState } from "react";
import { calendarService } from "../services/calendarService";
import type { CalendarEvent, EventType, NewCalendarEvent } from "../services/calendarService";
import "./CalendarPage.css";

type View = "month" | "week" | "day";

const TYPES: EventType[] = ["exam", "deadline", "study", "assignment", "other"];
const REMINDERS: { label: string; value: number | null }[] = [
  { label: "No reminder", value: null },
  { label: "At start", value: 0 },
  { label: "10 minutes before", value: 10 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "1 day before", value: 1440 },
];

const pad = (n: number) => String(n).padStart(2, "0");
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfWeek = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7)); // Monday start
const evKey = (ev: CalendarEvent) =>
  ev.all_day ? new Date(ev.start_at).toISOString().slice(0, 10) : localKey(new Date(ev.start_at));
const evTime = (ev: CalendarEvent) =>
  ev.all_day ? "All day" : new Date(ev.start_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function CalendarPage() {
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(() => startOfDay(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [formDate, setFormDate] = useState<string | null>(null); // non-null => form open

  const { gridStart, count } = useMemo(() => {
    if (view === "month") {
      return { gridStart: startOfWeek(new Date(cursor.getFullYear(), cursor.getMonth(), 1)), count: 42 };
    }
    if (view === "week") return { gridStart: startOfWeek(cursor), count: 7 };
    return { gridStart: startOfDay(cursor), count: 1 };
  }, [view, cursor]);

  const days = useMemo(() => Array.from({ length: count }, (_, i) => addDays(gridStart, i)), [gridStart, count]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // pad by one day each side so all-day events (stored at UTC midnight) never fall off the edge
      setEvents(await calendarService.list(addDays(gridStart, -1), addDays(gridStart, count + 1)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [gridStart, count]);

  useEffect(() => { void load(); }, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const ev of [...events].sort((a, b) => a.start_at.localeCompare(b.start_at))) {
      const k = evKey(ev);
      m.set(k, [...(m.get(k) ?? []), ev]);
    }
    return m;
  }, [events]);

  const shift = (dir: -1 | 1) => {
    if (view === "month") setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1));
    else setCursor(addDays(cursor, dir * (view === "week" ? 7 : 1)));
  };

  const title =
    view === "month"
      ? cursor.toLocaleDateString([], { month: "long", year: "numeric" })
      : view === "week"
      ? `${days[0].toLocaleDateString([], { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}`
      : cursor.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const openNew = (d: Date) => { setEditing(null); setFormDate(localKey(d)); };
  const openEdit = (ev: CalendarEvent) => { setEditing(ev); setFormDate(evKey(ev)); };
  const todayKey = localKey(new Date());

  const chip = (ev: CalendarEvent) => (
    <button key={ev.id} className={`sk-cal-chip sk-cal-${ev.type}`} onClick={(e) => { e.stopPropagation(); openEdit(ev); }} title={ev.title}>
      <span className="sk-cal-chip-time">{evTime(ev)}</span> {ev.title}
    </button>
  );

  return (
    <div className="sk-cal">
      <div className="sk-cal-bar">
        <div className="sk-cal-nav">
          <button onClick={() => shift(-1)} aria-label="Previous">‹</button>
          <button onClick={() => setCursor(startOfDay(new Date()))}>Today</button>
          <button onClick={() => shift(1)} aria-label="Next">›</button>
          <h2>{title}</h2>
        </div>
        <div className="sk-cal-actions">
          {(["month", "week", "day"] as View[]).map((v) => (
            <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>{v}</button>
          ))}
          <button onClick={() => void calendarService.exportIcs().catch((e) => setError(e.message))}>Export .ics</button>
          <button className="primary" onClick={() => openNew(cursor)}>+ Add event</button>
        </div>
      </div>

      {error && <div className="sk-cal-error">{error}</div>}
      {loading && <div className="sk-cal-loading">Loading…</div>}

      {view === "day" ? (
        <div className="sk-cal-daylist">
          {(byDay.get(localKey(cursor)) ?? []).length === 0 && <p className="sk-cal-empty">No events this day.</p>}
          {(byDay.get(localKey(cursor)) ?? []).map((ev) => (
            <button key={ev.id} className={`sk-cal-dayrow sk-cal-${ev.type}`} onClick={() => openEdit(ev)}>
              <strong>{evTime(ev)}</strong> {ev.title} <em>{ev.type}</em>
              {ev.notes && <span className="sk-cal-notes">{ev.notes}</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="sk-cal-grid">
          {days.slice(0, 7).map((d) => (
            <div key={d.getDay()} className="sk-cal-dow">{d.toLocaleDateString([], { weekday: "short" })}</div>
          ))}
          {days.map((d) => {
            const k = localKey(d);
            const list = byDay.get(k) ?? [];
            const limit = view === "month" ? 3 : list.length;
            return (
              <div
                key={k}
                className={`sk-cal-cell${k === todayKey ? " today" : ""}${view === "month" && d.getMonth() !== cursor.getMonth() ? " muted" : ""}`}
                onClick={() => openNew(d)}
              >
                <div className="sk-cal-daynum">{d.getDate()}</div>
                {list.slice(0, limit).map(chip)}
                {list.length > limit && (
                  <button className="sk-cal-more" onClick={(e) => { e.stopPropagation(); setCursor(d); setView("day"); }}>
                    +{list.length - limit} more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {formDate && (
        <EventForm
          key={editing?.id ?? "new"}
          initial={editing}
          defaultDate={formDate}
          onClose={() => setFormDate(null)}
          onSaved={() => { setFormDate(null); void load(); }}
        />
      )}
    </div>
  );
}

function EventForm({ initial, defaultDate, onClose, onSaved }: {
  initial: CalendarEvent | null;
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const s = initial && !initial.all_day ? new Date(initial.start_at) : null;
  const e = initial && !initial.all_day && initial.end_at ? new Date(initial.end_at) : null;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "study");
  const [date, setDate] = useState(defaultDate);
  const [allDay, setAllDay] = useState(initial?.all_day ?? false);
  const [startTime, setStartTime] = useState(s ? hhmm(s) : "09:00");
  const [endTime, setEndTime] = useState(e ? hhmm(e) : "");
  const [remind, setRemind] = useState<number | null>(initial?.remind_minutes_before ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr(null);
    if (!title.trim()) return setErr("Title is required");
    if (!date) return setErr("Date is required");
    let start_at: string;
    let end_at: string | null = null;
    if (allDay) {
      start_at = `${date}T00:00:00Z`;
    } else {
      const st = new Date(`${date}T${startTime}`);
      start_at = st.toISOString();
      if (endTime) {
        const en = new Date(`${date}T${endTime}`);
        if (en < st) return setErr("End time must be after start time");
        end_at = en.toISOString();
      }
    }
    const payload: NewCalendarEvent = {
      title: title.trim(), type, start_at, end_at, all_day: allDay,
      notes: notes.trim() || null, remind_minutes_before: remind,
    };
    setBusy(true);
    try {
      if (initial) await calendarService.update(initial.id, payload);
      else await calendarService.create(payload);
      onSaved();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!initial || !window.confirm("Delete this event?")) return;
    setBusy(true);
    try { await calendarService.remove(initial.id); onSaved(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : "Delete failed"); setBusy(false); }
  };

  return (
    <div className="sk-cal-overlay" onClick={onClose}>
      <div className="sk-cal-modal" onClick={(ev) => ev.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{initial ? "Edit event" : "New event"}</h3>
        <label>Title<input value={title} maxLength={200} onChange={(ev) => setTitle(ev.target.value)} autoFocus /></label>
        <div className="sk-cal-row">
          <label>Type
            <select value={type} onChange={(ev) => setType(ev.target.value as EventType)}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>Date<input type="date" value={date} onChange={(ev) => setDate(ev.target.value)} /></label>
        </div>
        <label className="sk-cal-check"><input type="checkbox" checked={allDay} onChange={(ev) => setAllDay(ev.target.checked)} /> All day</label>
        {!allDay && (
          <div className="sk-cal-row">
            <label>Start<input type="time" value={startTime} onChange={(ev) => setStartTime(ev.target.value)} /></label>
            <label>End (optional)<input type="time" value={endTime} onChange={(ev) => setEndTime(ev.target.value)} /></label>
          </div>
        )}
        <label>Reminder
          <select value={remind ?? ""} onChange={(ev) => setRemind(ev.target.value === "" ? null : Number(ev.target.value))}>
            {REMINDERS.map((r) => <option key={r.label} value={r.value ?? ""}>{r.label}</option>)}
          </select>
        </label>
        <label>Notes<textarea rows={3} maxLength={2000} value={notes} onChange={(ev) => setNotes(ev.target.value)} /></label>
        {err && <div className="sk-cal-error">{err}</div>}
        <div className="sk-cal-modal-actions">
          {initial && <button className="danger" onClick={() => void remove()} disabled={busy}>Delete</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onClose} disabled={busy}>Cancel</button>
          <button className="primary" onClick={() => void save()} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}