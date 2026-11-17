
import { useEffect, useState } from "react";
import {
  GraduationCap,
  Globe,
  Landmark,
  Newspaper,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import ModulePage, { type ModuleItem } from "../components/ModulePage";
import { apiFetch } from "../services/apiClient";

const schemeItems: ModuleItem[] = [];
const examItems: ModuleItem[] = [];

const CONTENT_CATEGORIES = [
  "Polity",
  "Economy",
  "International Relations",
  "Environment",
  "Science & Technology",
  "Defence",
  "Social Issues",
  "Sports",
  "Government Schemes",
  "Miscellaneous",
];

interface ContentItem {
  id: string;
  source_name: string;
  source_key: string | null;
  title: string;
  category: string;
  published_at: string | null;
  summary: string | null;
  url: string;
  label: string;
  section: string;
  fetched_at: string;
}

interface ContentListResponse {
  items: ContentItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
}

interface ContentSource {
  key: string;
  name: string;
  kind: string;
  homepage_url: string | null;
  item_count: number;
  last_fetched_at: string | null;
  last_status: string | null;
}

interface ContentSourcesResponse {
  sources: ContentSource[];
  categories: string[];
}

interface ContentPageProps {
  title: string;
  description: string;
  endpoint: "/current-affairs" | "/newspapers";
  icon: typeof Globe;
  showSourceFilter?: boolean;
}

function formatDate(value: string | null): string {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ContentPage({
  title,
  description,
  endpoint,
  icon: Icon,
  showSourceFilter = false,
}: ContentPageProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [categories, setCategories] = useState<string[]>(CONTENT_CATEGORIES);

  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSources() {
      try {
        const result = await apiFetch<ContentSourcesResponse>(
          "/content/sources"
        );

        if (cancelled) return;

        setCategories(
          result.categories?.length
            ? result.categories
            : CONTENT_CATEGORIES
        );

        setSources(
          (result.sources ?? []).filter(
            (item) => item.kind === "newspaper"
          )
        );
      } catch {
        // The article list can still load if source metadata fails.
      }
    }

    void loadSources();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadArticles() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        page_size: "20",
      });

      if (category) params.set("category", category);
      if (source && showSourceFilter) params.set("source", source);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      try {
        const result = await apiFetch<ContentListResponse>(
          `${endpoint}?${params.toString()}`
        );

        if (cancelled) return;

        setItems(result.items ?? []);
        setTotal(result.total ?? 0);
        setTotalPages(result.total_pages ?? 0);
      } catch (err) {
        if (cancelled) return;

        setItems([]);
        setTotal(0);
        setTotalPages(0);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load articles. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadArticles();

    return () => {
      cancelled = true;
    };
  }, [endpoint, page, category, source, dateFrom, dateTo, showSourceFilter]);

  function clearFilters() {
    setCategory("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  return (
    <div className="tl-page">
      <section className="tl-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <Icon size={28} className="tl-gold" />
          <h1 className="tl-h1">{title}</h1>
        </div>

        <p className="tl-sub">{description}</p>

        <p className="tl-note" style={{ marginTop: 12 }}>
          {total.toLocaleString("en-IN")} articles available
        </p>
      </section>

      <section className="tl-card">
        <h2 className="tl-h2">Filter articles</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          <label>
            <span className="tl-label">Category</span>
            <select
              className="tl-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {showSourceFilter && (
            <label>
              <span className="tl-label">Newspaper</span>
              <select
                className="tl-select"
                value={source}
                onChange={(event) => {
                  setSource(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All newspapers</option>
                {sources.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span className="tl-label">From date</span>
            <input
              className="tl-field"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
            />
          </label>

          <label>
            <span className="tl-label">To date</span>
            <input
              className="tl-field"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <button
          type="button"
          className="tl-btn ghost"
          onClick={clearFilters}
          style={{ marginTop: 14 }}
        >
          Clear filters
        </button>
      </section>

      {error && (
        <div className="tl-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setPage((current) => current)}
            style={{
              marginLeft: 12,
              border: 0,
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <section className="tl-card" style={{ textAlign: "center" }}>
          <RefreshCw
            size={22}
            className="tl-gold"
            style={{ animation: "spin 1s linear infinite" }}
          />
          <p className="tl-sub">Loading articles...</p>
        </section>
      ) : (
        <>
          {items.length === 0 && !error ? (
            <section className="tl-card">
              <h2 className="tl-h2">No articles found</h2>
              <p className="tl-sub">
                There are no articles matching these filters.
              </p>
            </section>
          ) : (
            <div className="tl-stack">
              {items.map((item) => (
                <article className="tl-card" key={item.id}>
                  <p
                    className="tl-gold"
                    style={{
                      fontWeight: 700,
                      fontSize: 13,
                      margin: "0 0 8px",
                    }}
                  >
                    {item.source_name}
                  </p>

                  <h2
                    style={{
                      fontSize: 18,
                      lineHeight: 1.45,
                      margin: "0 0 12px",
                    }}
                  >
                    {item.title}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 12,
                      color: "var(--muted)",
                      fontSize: 12.5,
                      marginBottom: 12,
                    }}
                  >
                    <span>{item.category}</span>
                    <span>{formatDate(item.published_at)}</span>
                  </div>

                  {item.summary && (
                    <p
                      style={{
                        color: "var(--text)",
                        fontSize: 14,
                        lineHeight: 1.7,
                        margin: "0 0 16px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.summary}
                    </p>
                  )}

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tl-btn"
                    style={{
                      textDecoration: "none",
                      width: "fit-content",
                    }}
                  >
                    Read original article
                    <ExternalLink size={15} />
                  </a>
                </article>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <section
              className="tl-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="tl-btn ghost"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="tl-note">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="tl-btn ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export const CurrentAffairsPage = () => (
  <ContentPage
    title="Current Affairs"
    description="Daily current affairs summaries, categorized for exam preparation."
    endpoint="/current-affairs"
    icon={Globe}
  />
);

export const NewspapersPage = () => (
  <ContentPage
    title="Newspapers"
    description="Read recent articles from The Hindu, Indian Express, Times of India and Hindustan Times."
    endpoint="/newspapers"
    icon={Newspaper}
    showSourceFilter
  />
);

export const SchemesPage = () => (
  <ModulePage
    title="Government Schemes"
    description="Central and state schemes with official links."
    icon={Landmark}
    basePath="/schemes"
    items={schemeItems}
    categories={["Central", "State", "Agriculture", "Health", "Education", "Employment"]}
    searchPlaceholder="Search schemes…"
    emptyTitle="No schemes yet"
    emptyDescription="Schemes with official source links will appear here once a dataset is connected."
  />
);

export const ExamsPage = () => (
  <ModulePage
    title="Government Exams"
    description="Exam syllabus, pattern and official notification dates."
    icon={GraduationCap}
    basePath="/exams"
    items={examItems}
    categories={["UPSC", "SSC", "Banking", "Railways", "State PSC", "Defence"]}
    searchPlaceholder="Search exams…"
    emptyTitle="No exams yet"
    emptyDescription="Exam details will appear here once an exams dataset is connected."
  />
);
