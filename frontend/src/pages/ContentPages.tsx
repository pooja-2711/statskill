
import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, Globe, RefreshCw } from "lucide-react";
import {
  getContentSources,
  getCurrentAffairs,
  getNewspapers,
} from "../services/contentService";
import type {
  ContentItem,
  ContentSource,
} from "../services/contentService";
import "./ContentPages.css";

type PageKind = "newspapers" | "current-affairs";

function ContentPage({ kind }: { kind: PageKind }) {
  const isNewspapers = kind === "newspapers";

  const [items, setItems] = useState<ContentItem[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
    if (!isNewspapers) return;

    getContentSources()
      .then((data) => {
        setSources(data.sources);
        setCategories(data.categories);
      })
      .catch(() => {
        setError("Could not load newspaper sources. Please refresh.");
      });
  }, [isNewspapers]);

  useEffect(() => {
    let active = true;

    async function loadArticles() {
      setLoading(true);
      setError("");

      try {
        const filters = {
          page,
          page_size: 20,
          ...(category ? { category } : {}),
          ...(source && isNewspapers ? { source } : {}),
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        };

        const result = isNewspapers
          ? await getNewspapers(filters)
          : await getCurrentAffairs(filters);

        if (!active) return;

        setItems(result.items);
        setTotal(result.total);
        setTotalPages(result.total_pages);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load articles. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticles();

    return () => {
      active = false;
    };
  }, [kind, isNewspapers, page, category, source, dateFrom, dateTo]);

  function resetFilters() {
    setCategory("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  function changeSource(value: string) {
    setSource(value);
    setPage(1);
  }

  function formatDate(value: string | null, fallback: string) {
    const date = value || fallback;

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="content-page">
      <header className="content-heading">
        <div className="content-heading-icon">
          {isNewspapers ? <Newspaper size={25} /> : <Globe size={25} />}
        </div>

        <div>
          <h1>{isNewspapers ? "Newspapers" : "Current Affairs"}</h1>
          <p>
            {isNewspapers
              ? "Read the latest headlines from India's leading newspapers."
              : "Stay updated with AI-summarised news for your exam preparation."}
          </p>
        </div>
      </header>

      <section className="content-filters">
        <div className="content-filter">
          <label htmlFor={`${kind}-category`}>Category</label>
          <select
            id={`${kind}-category`}
            value={category}
            onChange={(event) => changeCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {isNewspapers && (
          <div className="content-filter">
            <label htmlFor="newspaper-source">Newspaper</label>
            <select
              id="newspaper-source"
              value={source}
              onChange={(event) => changeSource(event.target.value)}
            >
              <option value="">All newspapers</option>
              {sources.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="content-filter">
          <label htmlFor={`${kind}-from`}>From date</label>
          <input
            id={`${kind}-from`}
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="content-filter">
          <label htmlFor={`${kind}-to`}>To date</label>
          <input
            id={`${kind}-to`}
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
          />
        </div>

        <button
          className="content-reset"
          type="button"
          onClick={resetFilters}
        >
          Reset filters
        </button>
      </section>

      <div className="content-results-bar">
        <span>{total} articles found</span>
        <button
          className="content-refresh"
          type="button"
          onClick={() => setPage((current) => current)}
          disabled={loading}
          aria-label="Refresh articles"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && <div className="content-error">{error}</div>}

      {loading ? (
        <div className="content-state">Loading articles...</div>
      ) : items.length === 0 ? (
        <div className="content-state">
          <h2>No articles found</h2>
          <p>Try changing your filters or check again later.</p>
        </div>
      ) : (
        <section className="content-article-list">
          {items.map((item) => (
            <article className="content-article" key={item.id}>
              <div className="content-source-name">{item.source_name}</div>

              <h2>{item.title}</h2>

              <div className="content-article-meta">
                <span className="content-category">{item.category}</span>
                <span>
                  {formatDate(item.published_at, item.fetched_at)}
                </span>
                {item.label === "AI-summarised" && (
                  <span className="content-ai-label">AI summarised</span>
                )}
              </div>

              {item.summary && (
                <p className="content-summary">{item.summary}</p>
              )}

              <a
                className="content-original-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read original article <ExternalLink size={15} />
              </a>
            </article>
          ))}
        </section>
      )}

      {!loading && totalPages > 1 && (
        <nav className="content-pagination" aria-label="Article pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

export function CurrentAffairsContentPage() {
  return <ContentPage kind="current-affairs" />;
}

export function NewspapersContentPage() {
  return <ContentPage kind="newspapers" />;
}
