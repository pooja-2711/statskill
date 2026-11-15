
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getDashboard,
  type DashboardData,
} from "../services/dashboardServices";

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const dashboardData = await getDashboard();

        if (active) {
          setData(dashboardData);
        }
      } catch {
        if (active) {
          setError("Could not load your dashboard. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Loading your dashboard...</h1>
        <p className="muted">
          Fetching your latest learning information.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <h1>Dashboard</h1>
        <p className="error">{error}</p>
        <button
          className="btn"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const formatValue = (value: number | null) =>
    value === null ? "—" : value;

  const stats = [
    {
      label: "Courses started",
      value: formatValue(data.stats.enrolled),
    },
    {
      label: "Lessons completed",
      value: formatValue(data.stats.lessonsDone),
    },
    {
      label: "Average quiz score",
      value:
        data.stats.avgScore === null
          ? "—"
          : `${data.stats.avgScore}%`,
    },
    {
      label: "Available courses",
      value: data.stats.availableCourses,
    },
  ];

  return (
    <div className="dashboard">
      <h1>
        Welcome back, {user?.full_name?.split(" ")[0] || "Learner"} 👋
      </h1>

      <p className="muted">
        Here is your latest learning summary.
      </p>

      {/* API loading warnings */}
      {data.warnings.length > 0 && (
        <div className="panel">
          <h3>Some information is unavailable</h3>
          {data.warnings.map((warning) => (
            <p className="muted" key={warning}>
              {warning}
            </p>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-value">{stat.value}</div>
            <div className="muted">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Skills and learning activity */}
      <div className="two-col">
        <section className="panel">
          <h2>Your skills</h2>

          {data.skills.length === 0 ? (
            <p className="muted">
              No skills have been added to your profile yet.
            </p>
          ) : (
            data.skills.map((skill) => (
              <div className="skill-row" key={skill.id}>
                <div className="skill-head">
                  <span>{skill.name}</span>
                  <span className="badge">
                    {skill.proficiency}
                  </span>
                </div>
              </div>
            ))
          )}

          <Link to="/profile" className="btn">
            Manage skills
          </Link>
        </section>

        <section className="panel">
          <h2>Quiz activity</h2>

          <div className="skill-row">
            <div className="skill-head">
              <span>Submitted quizzes</span>
              <strong>
                {formatValue(data.insights.submittedAttempts)}
              </strong>
            </div>
          </div>

          <div className="skill-row">
            <div className="skill-head">
              <span>Passed quizzes</span>
              <strong>
                {formatValue(data.insights.passedAttempts)}
              </strong>
            </div>
          </div>

          <p className="muted">
            Keep practising and track your quiz performance here.
          </p>
        </section>
      </div>

      {/* Available courses */}
      <section className="panel">
        <h2>Explore available courses</h2>

        {data.recommended.length === 0 ? (
          <p className="muted">
            No published courses are currently available.
          </p>
        ) : (
          <div className="course-grid">
            {data.recommended.map((course) => (
              <div className="course-card" key={course.id}>
                <span className="badge">{course.level}</span>

                <h3>{course.title}</h3>

                <p className="muted">
                  {course.lessons === null
                    ? "Lesson count unavailable"
                    : `${course.lessons} lessons`}
                </p>

                <Link
                  to={`/lessons?course_id=${course.id}`}
                  className="btn"
                >
                  Start learning
                </Link>
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: 20 }}>
          <Link to="/courses" className="btn">
            View all courses
          </Link>
        </p>
      </section>
    </div>
  );
}
