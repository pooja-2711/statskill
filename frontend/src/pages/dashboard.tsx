import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../services/dashboardServices";
import type { DashboardData } from "../mocks/dashboard";
import ProgressBar from "../components/progressCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard().then(setData).catch(() => setError("Could not load dashboard"));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading dashboard...</p>;

  const stats = [
    { label: "Courses enrolled", value: data.stats.enrolled },
    { label: "Lessons completed", value: data.stats.lessonsDone },
    { label: "Average quiz score", value: `${data.stats.avgScore}%` },
    { label: "Day streak", value: `🔥 ${data.stats.streak}` },
  ];

  return (
    <div className="dashboard">
      <h1>Welcome back, {user?.full_name?.split(" ")[0]} 👋</h1>
      <p className="muted">Here is your learning summary.</p>

      <div className="stats-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label}>
            <div className="stat-value">{s.value}</div>
            <div className="muted">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Your skills</h2>
          {data.skills.map((s) => (
            <div className="skill-row" key={s.name}>
              <div className="skill-head">
                <span>{s.name}</span>
                <span>{s.score}%</span>
              </div>
              <ProgressBar value={s.score} />
            </div>
          ))}
        </section>

        <section className="panel">
          <h2>Weak topics</h2>
          <div className="chips">
            {data.weakTopics.map((t) => (
              <span className="chip" key={t}>{t}</span>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 14 }}>
            We recommend practising these first.
          </p>
        </section>
      </div>

      <section className="panel">
        <h2>Recommended for you</h2>
        <div className="course-grid">
          {data.recommended.map((c) => (
            <div className="course-card" key={c.id}>
              <span className="badge">{c.level}</span>
              <h3>{c.title}</h3>
              <p className="muted">{c.lessons} lessons</p>
              <Link to="/courses" className="btn">Start</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}