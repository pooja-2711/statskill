import { useState, type FormEvent } from "react";
import { Bookmark, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { EmptyState } from "../components/StateViews";
import "../components/modulePage.css";

interface Saved {
  id: string;
  title: string;
  url: string;
  note: string;
}

function safeUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [items, setItems] = useLocalStorage<Saved[]>(
    `statskill:${user?.email ?? "guest"}:bookmarks`,
    []
  );
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState("");

  function add(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    let clean = "";
    if (url.trim()) {
      const ok = safeUrl(url);
      if (!ok) {
        setFormError("Enter a full link starting with http:// or https://");
        return;
      }
      clean = ok;
    }
    setFormError("");
    setItems((prev) => [{ id: crypto.randomUUID(), title: t, url: clean, note: note.trim() }, ...prev]);
    setTitle(""); setUrl(""); setNote("");
  }

  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (i) => !q || i.title.toLowerCase().includes(q) || i.note.toLowerCase().includes(q)
  );

  return (
    <div className="mp">
      <header className="mp-header">
        <span className="mp-icon"><Bookmark size={24} /></span>
        <div className="mp-heading">
          <h1>Bookmarks</h1>
          <p>Save links and notes for later. Stored in this browser only.</p>
        </div>
      </header>

      <form className="mp-form mp-form-col" onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Bookmark title" maxLength={150} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link (optional)" aria-label="Link" inputMode="url" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Note" maxLength={300} />
        {formError && <p className="mp-form-error" role="alert">{formError}</p>}
        <button type="submit" className="mp-btn" disabled={!title.trim()}>
          <Plus size={16} /> Save bookmark
        </button>
      </form>

      {items.length > 0 && (
        <label className="mp-search" style={{ marginBottom: 16 }}>
          <Search size={17} aria-hidden="true" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bookmarks…" aria-label="Search bookmarks" />
        </label>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Bookmark} title="No bookmarks yet" description="Save your first link or note above." />
      ) : visible.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search." />
      ) : (
        <div className="mp-list">
          {visible.map((i) => (
            <div className="mp-card mp-card-static" key={i.id}>
              <strong>{i.title}</strong>
              {i.note && <p>{i.note}</p>}
              <div className="mp-card-top">
                {i.url ? (
                  <a className="mp-link" style={{ marginTop: 0 }} href={i.url} target="_blank" rel="noopener noreferrer">
                    Open <ExternalLink size={14} />
                  </a>
                ) : <span />}
                <button type="button" className="mp-icon-btn" onClick={() => setItems((p) => p.filter((x) => x.id !== i.id))} aria-label={`Delete ${i.title}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}