
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ExternalLink } from "lucide-react";
import { EmptyState } from "../StateViews";

export type EventCategory =
  | "Exam"
  | "Deadline"
  | "Notification"
  | "Practice";

export interface EventItem {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  category: EventCategory;
  url?: string;
}

export default function EventsPanel({
  items,
}: {
  items: EventItem[];
}) {
  return (
    <section className="db-card" aria-label="Upcoming events">
      <div className="db-head">
        <h2 className="db-title">
          <CalendarDays size={20} className="gold" />
          Upcoming Events
        </h2>

        <Link to="/study-plans" className="db-link">
          View Calendar <ArrowRight size={15} />
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events to show"
          description="Official exam dates and notifications will appear here."
        />
      ) : (
        <div className="db-events">
          {items.map((event) => {
            const date = new Date(`${event.date}T00:00:00`);

            const content = (
              <>
                <span className="db-date">
                  <strong>{date.getDate()}</strong>
                  <small>
                    {date.toLocaleString("en-IN", {
                      month: "short",
                    })}
                  </small>
                </span>

                <span className="db-event-text">
                  {event.title}
                  {event.subtitle && <small>{event.subtitle}</small>}
                </span>

                <span className={`db-tag ${event.category}`}>
                  {event.category}
                </span>

                {event.url && (
                  <ExternalLink
                    size={14}
                    aria-label="Open official event page"
                  />
                )}
              </>
            );

            return event.url ? (
              <a
                className="db-event"
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open official information: ${event.title}`}
              >
                {content}
              </a>
            ) : (
              <div className="db-event" key={event.id}>
                {content}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
