import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { EmptyState } from "../StateViews";

export type EventCategory = "Exam" | "Deadline" | "Notification" | "Practice";

export interface EventItem {
  id: string;
  date: string; // ISO date string
  title: string;
  subtitle?: string;
  category: EventCategory;
}

export default function EventsPanel({ items }: { items: EventItem[] }) {
  return (
    <section className="db-card" aria-label="Upcoming events">
      <div className="db-head">
        <h2 className="db-title"><CalendarDays size={20} className="gold" /> Upcoming Events</h2>
        <Link to="/study-plans" className="db-link">View Calendar <ArrowRight size={15} /></Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events to show"
          description="Official exam dates and notifications need a backend source. None are invented here."
        />
      ) : (
        <div className="db-events">
          {items.map((e) => {
            const d = new Date(e.date);
            return (
              <div className="db-event" key={e.id}>
                <span className="db-date">
                  <strong>{d.getDate()}</strong>
                  <small>{d.toLocaleString("en-IN", { month: "short" })}</small>
                </span>
                <span className="db-event-text">
                  {e.title}
                  {e.subtitle && <small>{e.subtitle}</small>}
                </span>
                <span className={`db-tag ${e.category}`}>{e.category}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}