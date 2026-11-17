import { apiFetch, downloadFile } from "./apiClient";

export type EventType = "exam" | "deadline" | "study" | "assignment" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  start_at: string; // ISO, UTC
  end_at: string | null;
  all_day: boolean;
  notes: string | null;
  remind_minutes_before: number | null;
  source_ref: string | null;
  created_at: string;
}

export type NewCalendarEvent = Omit<CalendarEvent, "id" | "created_at" | "source_ref"> & { source_ref?: string | null };

export const calendarService = {
  list: (start: Date, end: Date) =>
    apiFetch<CalendarEvent[]>(`/calendar/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`),
  create: (ev: NewCalendarEvent) => apiFetch<CalendarEvent>("/calendar/events", { method: "POST", body: JSON.stringify(ev) }),
  update: (id: string, patch: Partial<NewCalendarEvent>) =>
    apiFetch<CalendarEvent>(`/calendar/events/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<void>(`/calendar/events/${id}`, { method: "DELETE" }),
  upcoming: (days = 14, limit = 10) => apiFetch<CalendarEvent[]>(`/calendar/upcoming?days=${days}&limit=${limit}`),
  remindersDue: () => apiFetch<CalendarEvent[]>("/calendar/reminders/due"),
  exportIcs: () => downloadFile("/calendar/export.ics", "statskill.ics"),
};