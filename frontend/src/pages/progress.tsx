
import { useEffect, useState } from "react";
import api from "../services/api";
import { getErrorMessage } from "../services/errors";

interface OverallProgress {
  total_courses: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

interface Course {
  id: number;
  title: string;
  category?: string | null;
  level?: string | null;
}

interface CourseProgress {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

interface CourseProgressItem extends Course {
  progress: CourseProgress;
}

export default function Progress() {
  const [summary, setSummary] = useState<OverallProgress | null>(null);
  const [courses, setCourses] = useState<CourseProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      setLoading(true);
      setError("");
      setPartialError("");

      try {
        const summaryResponse = await api.get<OverallProgress>(
          "/progress/me"
        );

        if (!active) return;
        setSummary(summaryResponse.data);

        try {
          const coursesResponse = await api.get<Course[]>("/courses");
          const availableCourses = coursesResponse.data;

          if (!Array.isArray(availableCourses)) {
            throw new Error("Invalid courses response.");
          }

          const results = await Promise.allSettled(
            availableCourses.map(async (course) => {
              const response = await api.get<CourseProgress>(
                `/progress/courses/${course.id}`
              );

              return {
                ...course,
                progress: response.data,
              };
            })
          );

          if (!active) return;

          const successful = results
            .filter(
              (
                result
              ): result is PromiseFulfilledResult<CourseProgressItem> =>
                result.status === "fulfilled"
            )
            .map((result) => result.value);

          setCourses(successful);

          if (successful.length !== availableCourses.length) {
            setPartialError(
              "Some course progress details could not be loaded."
            );
          }
        } catch {
          if (active) {
            setPartialError(
              "Overall progress loaded, but course details are unavailable."
            );
          }
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="progress-page">
        <h1>My Learning Progress</h1>
        <p className="muted">Loading your learning statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-page">
        <h1>My Learning Progress</h1>
        <p className="error">{error}</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    { label: "Courses started", value: summary.total_courses },
    { label: "Total lessons", value: summary.total_lessons },
    { label: "Lessons completed", value: summary.completed_lessons },
    {
      label: "Overall completion",
      value: `${summary.completion_percentage.toFixed(1)}%`,
    },
  ];

  return (
    <div className="progress-page">
      <div className="progress-header">
        <div>
          <h1>My Learning Progress</h1>
          <p className="muted">
            Track your learning journey and course completion.
          </p>
        </div>
      </div>

      <section className="progress-stats">
        {stats.map((stat) => (
          <article className="progress-stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="progress-overview panel">
        <div className="progress-overview-heading">
          <div>
            <h2>Overall learning completion</h2>
            <p className="muted">
              Based on courses where you have recorded learning progress.
            </p>
          </div>
          <strong>{summary.completion_percentage.toFixed(1)}%</strong>
        </div>

        <div
          className="progress-track"
          role="progressbar"
          aria-label="Overall learning completion"
          aria-valuenow={summary.completion_percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-track-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, summary.completion_percentage)
              )}%`,
            }}
          />
        </div>

        <p className="muted">
          {summary.completed_lessons} of {summary.total_lessons} lessons
          completed
        </p>
      </section>

      <section className="course-progress-section">
        <div className="section-heading">
          <h2>Course-wise progress</h2>
          <span className="muted">{courses.length} courses</span>
        </div>

        {partialError && <p className="error">{partialError}</p>}

        {courses.length === 0 ? (
          <div className="panel progress-empty">
            <h3>No course details available</h3>
            <p className="muted">
              Visit your courses and start learning to track your progress.
            </p>
          </div>
        ) : (
          <div className="progress-course-list">
            {courses.map((course) => {
              const percentage =
                course.progress.completion_percentage ?? 0;

              return (
                <article className="progress-course-card" key={course.id}>
                  <div className="progress-course-top">
                    <div>
                      <h3>{course.title}</h3>
                      <p className="muted">
                        {course.category || "General"}
                        {course.level ? ` - ${course.level}` : ""}
                      </p>
                    </div>
                    <strong>{percentage.toFixed(1)}%</strong>
                  </div>

                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`${course.title} completion`}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="progress-track-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, percentage)
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="muted">
                    {course.progress.completed_lessons} of{" "}
                    {course.progress.total_lessons} lessons completed
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
