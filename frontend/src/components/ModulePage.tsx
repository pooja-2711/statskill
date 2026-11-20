
import { useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ExternalLink,
  FileQuestion,
  Inbox,
  Search,
  X,
} from "lucide-react";
import { EmptyState, ErrorState, Skeleton } from "./StateViews";
import "./modulePage.css";

export interface ModuleItem {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  date?: string;
  source?: string;
  url?: string;
  tags?: string[];
  body?: string;
  documents?: string[];
  eligibility?: string[];
  applicationSteps?: string[];
  faqs?: {
    question: string;
    answer: string;
  }[];
}

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  basePath: string;
  items: ModuleItem[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  categories?: string[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actions?: ReactNode;
  renderDetail?: (item: ModuleItem) => ReactNode;
}

/* ---------- Format body into separate sections ---------- */

function formatBodySections(body: string) {
  return body
    .split(
      /(?=^[A-Z][A-Z0-9 &'’()/,-]*\??\s*$)/m
    )
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const lines = section.split(/\r?\n/);
      const heading = lines.shift()?.trim() ?? "";
      const content = lines.join(" ").replace(/\s+/g, " ").trim();

      return {
        heading,
        content,
      };
    });
}

export default function ModulePage({
  title,
  description,
  icon: Icon,
  basePath,
  items,
  loading = false,
  error = null,
  onRetry,
  categories,
  searchPlaceholder = "Search…",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  actions,
  renderDetail,
}: ModulePageProps) {
  const { id } = useParams();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const chips = useMemo(() => {
    const list =
      categories ??
      Array.from(
        new Set(items.map((i) => i.category).filter(Boolean) as string[])
      );

    return list.length ? ["All", ...list] : [];
  }, [categories, items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (
        category !== "All" &&
        item.category !== category &&
        !(item.tags ?? []).includes(category)
      ) {
        return false;
      }

      if (!q) return true;

      return [item.title, item.summary, item.source, ...(item.tags ?? [])]
        .filter(Boolean)
        .some((text) => String(text).toLowerCase().includes(q));
    });
  }, [items, query, category]);

  const filtersActive = query.trim() !== "" || category !== "All";

  /* ---------- Detail view ---------- */

  if (id) {
    const selected = items.find((i) => i.id === id) ?? null;

    const back = (
      <Link className="mp-back" to={basePath}>
        <ArrowLeft size={16} />
        Back to {title}
      </Link>
    );

    if (loading) {
      return (
        <div className="mp" aria-busy="true">
          {back}
          <div className="mp-detail">
            <Skeleton height={14} width="25%" />
            <Skeleton height={28} width="70%" />
            <Skeleton height={14} />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="mp">
          {back}
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      );
    }

    if (!selected) {
      return (
        <div className="mp">
          {back}
          <EmptyState
            icon={FileQuestion}
            title="Item not found"
            description="It may have been removed, or the link is wrong."
          />
        </div>
      );
    }

    const bodySections = selected.body
      ? formatBodySections(selected.body)
      : [];

    return (
      <div className="mp">
        {back}

        <article className="mp-detail">
          <header>
            {selected.category && (
              <span className="mp-badge">{selected.category}</span>
            )}

            <h1>{selected.title}</h1>

            <p className="mp-meta">
              {[selected.source, selected.date].filter(Boolean).join(" · ")}
            </p>
          </header>

          {selected.summary && (
            <p className="mp-lead">{selected.summary}</p>
          )}

          {/* Overview and other body sections */}

          {bodySections.length > 0 && (
            <div className="mp-body">
              {bodySections.map((section, index) => (
                <section className="mp-body-section" key={index}>
                  <h2>{section.heading}</h2>
                  <p>{section.content}</p>
                </section>
              ))}
            </div>
          )}

          {/* Eligibility Criteria */}

          {selected.eligibility &&
            selected.eligibility.length > 0 && (
              <section className="mp-documents">
                <h2>Eligibility Criteria</h2>

                <ul>
                  {selected.eligibility.map((criterion) => (
                    <li key={criterion}>{criterion}</li>
                  ))}
                </ul>

                <p className="mp-document-note">
                  Eligibility conditions may change. Confirm the latest rules
                  on the official scheme portal.
                </p>
              </section>
            )}

          {/* Application Guide */}

          {selected.applicationSteps &&
            selected.applicationSteps.length > 0 && (
              <section className="mp-documents">
                <h2>How to Apply / Access the Scheme</h2>

                <ol>
                  {selected.applicationSteps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>

                <p className="mp-document-note">
                  Follow the latest instructions on the official government
                  portal.
                </p>
              </section>
            )}

          {/* Required Documents */}

          {selected.documents &&
            selected.documents.length > 0 && (
              <section className="mp-documents">
                <h2>Required Documents</h2>

                <ul>
                  {selected.documents.map((document) => (
                    <li key={document}>{document}</li>
                  ))}
                </ul>

                <p className="mp-document-note">
                  Document requirements may vary. Confirm the latest list on
                  the official scheme portal.
                </p>
              </section>
            )}

          {/* Frequently Asked Questions */}

          {selected.faqs && selected.faqs.length > 0 && (
            <section className="mp-documents mp-faq">
              <h2>Frequently Asked Questions</h2>

              <div className="mp-faq-list">
                {selected.faqs.map((faq, index) => (
                  <details className="mp-faq-item" key={index}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>

              <p className="mp-document-note">
                For the latest information, always refer to the official
                government scheme portal.
              </p>
            </section>
          )}

          {renderDetail?.(selected)}

          {/* Tags */}

          {selected.tags && selected.tags.length > 0 && (
            <div className="mp-tags">
              {selected.tags.map((tag) => (
                <span key={tag} className="mp-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Official Source */}

          {selected.url && (
            <a
              className="mp-link"
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open official source
              <ExternalLink size={15} />
            </a>
          )}
        </article>
      </div>
    );
  }

  /* ---------- List view ---------- */

  return (
    <div className="mp">
      <header className="mp-header">
        <span className="mp-icon">
          <Icon size={24} />
        </span>

        <div className="mp-heading">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>

        {actions && <div className="mp-actions">{actions}</div>}
      </header>

      <div className="mp-toolbar">
        <label className="mp-search">
          <Search size={17} aria-hidden="true" />

          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={`Search ${title}`}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </label>

        {chips.length > 0 && (
          <div
            className="mp-chips"
            role="group"
            aria-label="Filter by category"
          >
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`mp-chip ${
                  category === chip ? "is-active" : ""
                }`}
                aria-pressed={category === chip}
                onClick={() => setCategory(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="mp-list" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((n) => (
            <div className="mp-card mp-card-skel" key={n}>
              <Skeleton height={14} width="30%" />
              <Skeleton height={20} width="80%" />
              <Skeleton height={14} />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : filtered.length === 0 ? (
        <div>
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try a different search or category."
          />

          {filtersActive && (
            <button
              className="mp-clear"
              onClick={() => {
                setQuery("");
                setCategory("All");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mp-count" aria-live="polite">
            {filtered.length}{" "}
            {filtered.length === 1 ? "result" : "results"}
          </p>

          <div className="mp-list">
            {filtered.map((item) => (
              <Link
                key={item.id}
                to={`${basePath}/${item.id}`}
                className="mp-card"
              >
                <div className="mp-card-top">
                  {item.category && (
                    <span className="mp-badge">{item.category}</span>
                  )}

                  {(item.tags ?? []).some(
                    (tag) => tag === "Central" || tag === "State"
                  ) && (
                    <span className="mp-badge">
                      {
                        (item.tags ?? []).find(
                          (tag) => tag === "Central" || tag === "State"
                        )
                      }{" "}
                      Government
                    </span>
                  )}

                  {item.date && (
                    <span className="mp-date">{item.date}</span>
                  )}
                </div>

                <strong>{item.title}</strong>

                {item.summary && <p>{item.summary}</p>}

                {item.source && <small>{item.source}</small>}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
