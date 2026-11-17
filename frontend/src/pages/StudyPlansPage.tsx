import { useState, type FormEvent } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { EmptyState } from "../components/StateViews";
import "../components/modulePage.css";

interface Task {
  id: string;
  title: string;
  due: string; // yyyy-mm-dd, may be empty
  done: boolean;
}

type Filter = "All" | "Pending" | "Done";

export default function StudyPlansPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    `statskill:${user?.email ?? "guest"}:study-plans`,
    []
  );
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  function addTask(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [{ id: crypto.randomUUID(), title: t, due, done: false }, ...prev]);
    setTitle("");
    setDue("");
  }

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const visible = tasks.filter((t) =>
    filter === "All" ? true : filter === "Done" ? t.done : !t.done
  );
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="mp">
      <header className="mp-header">
        <span className="mp-icon"><CalendarDays size={24} /></span>
        <div className="mp-heading">
          <h1>Study Plans</h1>
          <p>Plan your daily and weekly study tasks. Saved in this browser only.</p>
        </div>
      </header>

      <form className="mp-form" onSubmit={addTask}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task, e.g. Revise Indian Polity ch. 4"
          aria-label="Task title"
          maxLength={200}
        />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" />
        <button type="submit" className="mp-btn" disabled={!title.trim()}>
          <Plus size={16} /> Add
        </button>
      </form>

      {tasks.length > 0 && (
        <div className="mp-toolbar">
          <div className="mp-chips" role="group" aria-label="Filter tasks">
            {(["All", "Pending", "Done"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`mp-chip ${filter === f ? "is-active" : ""}`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="mp-count" aria-live="polite">{doneCount} of {tasks.length} done</p>
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No tasks yet" description="Add your first study task above." />
      ) : visible.length === 0 ? (
        <EmptyState title="Nothing in this view" description="Try another filter." />
      ) : (
        <ul className="mp-tasks">
          {visible.map((t) => (
            <li key={t.id} className={t.done ? "is-done" : ""}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
                <span>{t.title}</span>
              </label>
              {t.due && <small>{t.due}</small>}
              <button type="button" className="mp-icon-btn" onClick={() => remove(t.id)} aria-label={`Delete ${t.title}`}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}