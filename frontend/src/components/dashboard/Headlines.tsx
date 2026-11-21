
import { Link } from "react-router-dom";
import { ArrowRight, Flame, Newspaper } from "lucide-react";
import { EmptyState } from "../StateViews";

export type NewsCategory = string;

export interface NewsItem {
  id: string;
  title: string;
  category: NewsCategory;
  publishedAt: string;
  thumbnailUrl?: string;
}

const goldCategories = new Set(["National", "Economy"]);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();

  if (Number.isNaN(diff)) return "";
  if (diff < 0) return "Just now";

  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs}h ago`;

  return `${Math.floor(hrs / 24)}d ago`;
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <Link
      to={`/current-affairs/${item.id}`}
      className="db-news"
    >
      {item.thumbnailUrl ? (
        <img
          className="db-thumb"
          src={item.thumbnailUrl}
          alt=""
          loading="lazy"
        />
      ) : (
        <span className="db-thumb">
          <Newspaper size={22} />
        </span>
      )}

      <span>
        <span
          className={`db-chip ${
            goldCategories.has(item.category) ? "" : "purple"
          }`}
        >
          {item.category}
        </span>

        <strong>{item.title}</strong>
      </span>

      <time dateTime={item.publishedAt}>
        {timeAgo(item.publishedAt)}
      </time>
    </Link>
  );
}

interface HeadlinesPanelProps {
  items: NewsItem[];
  loading?: boolean;
  error?: string;
}

export default function HeadlinesPanel({
  items,
  loading = false,
  error = "",
}: HeadlinesPanelProps) {
  return (
    <section className="db-card" aria-label="Top headlines">
      <div className="db-head">
        <h2 className="db-title">
          <Flame size={20} className="purple" />
          Top Headlines Today
        </h2>

        <Link to="/current-affairs" className="db-link">
          View All <ArrowRight size={15} />
        </Link>
      </div>

      {loading ? (
        <div className="content-state">
          Loading latest headlines...
        </div>
      ) : error ? (
        <div className="content-error">
          {error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No headlines available"
          description="New Current Affairs articles will appear here when available."
        />
      ) : (
        <div className="db-news-list">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
