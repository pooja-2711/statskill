
import { useEffect, useState } from "react";
import api from "../services/api";

interface LearningPath {
  id: number;
  title: string;
  description: string | null;
  instructor_id: number;
  target_level: string;
  is_published: boolean;
}

interface Enrollment {
  id: number;
  learning_path_id: number;
  user_id: number;
  is_completed: boolean;
  enrolled_at: string;
  completed_at: string | null;
}

interface PathCourse {
  id: number;
  course_id: number;
  order_index: number;
}

interface Course {
  id: number;
  title?: string;
  name?: string;
}

interface PathProgress {
  learning_path_id: number;
  learning_path_title: string;
  total_courses: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  is_completed: boolean;
}

export default function LearningPathPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [pathCourses, setPathCourses] = useState<PathCourse[]>([]);
  const [progress, setProgress] = useState<PathProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [pathsResponse, enrollmentsResponse, coursesResponse] =
        await Promise.all([
          api.get("/learning-paths/"),
          api.get("/learning-paths/me/enrollments"),
          api.get("/courses"),
        ]);

      setPaths(pathsResponse.data);
      setEnrollments(enrollmentsResponse.data);
      setCourses(coursesResponse.data);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to load learning paths."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function viewPath(path: LearningPath) {
    try {
      setSelectedPath(path);
      setPathCourses([]);
      setProgress(null);
      setMessage("");
      setError("");

      const courseResponse = await api.get(
        `/learning-paths/${path.id}/courses`
      );

      setPathCourses(courseResponse.data);

      const enrolled = enrollments.some(
        (item) => item.learning_path_id === path.id
      );

      if (enrolled) {
        const progressResponse = await api.get(
          `/learning-paths/${path.id}/progress`
        );
        setProgress(progressResponse.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to load path details."
      );
    }
  }

  async function enroll(pathId: number) {
    try {
      setBusy(true);
      setError("");
      setMessage("");

      await api.post(`/learning-paths/${pathId}/enroll`);

      setMessage("Successfully enrolled in this learning path!");
      await loadData();

      const updatedPath = paths.find((path) => path.id === pathId);
      if (updatedPath) {
        await viewPath(updatedPath);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Enrollment failed."
      );
    } finally {
      setBusy(false);
    }
  }

  function getCourseTitle(courseId: number) {
    const course = courses.find((item) => item.id === courseId);
    return course?.title || course?.name || `Course #${courseId}`;
  }

  function isEnrolled(pathId: number) {
    return enrollments.some(
      (item) => item.learning_path_id === pathId
    );
  }

  if (loading) {
    return <div className="learning-path-page"><p>Loading learning paths...</p></div>;
  }

  return (
    <div className="learning-path-page">
      <div className="learning-path-header">
        <div>
          <h1>Learning Paths</h1>
          <p className="muted">
            Follow structured learning journeys and track your progress.
          </p>
        </div>
        <div className="learning-path-count">
          {enrollments.length} Enrolled
        </div>
      </div>

      {error && <div className="learning-error">{error}</div>}
      {message && <div className="learning-success">{message}</div>}

      <section className="learning-path-section">
        <h2>Available Learning Paths</h2>

        {paths.filter((path) => path.is_published).length === 0 ? (
          <div className="panel">
            No published learning paths are available yet.
          </div>
        ) : (
          <div className="learning-path-grid">
            {paths
              .filter((path) => path.is_published)
              .map((path) => (
                <article className="learning-path-card" key={path.id}>
                  <div className="learning-path-card-top">
                    <span className="learning-level">
                      {path.target_level}
                    </span>
                    {isEnrolled(path.id) && (
                      <span className="learning-enrolled">Enrolled</span>
                    )}
                  </div>

                  <h3>{path.title}</h3>

                  <p className="muted">
                    {path.description || "A structured learning journey."}
                  </p>

                  <div className="learning-path-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => viewPath(path)}
                    >
                      View Details
                    </button>

                    {isEnrolled(path.id) ? (
                      <button
                        className="btn"
                        onClick={() => viewPath(path)}
                      >
                        View Progress
                      </button>
                    ) : (
                      <button
                        className="btn"
                        disabled={busy}
                        onClick={() => enroll(path.id)}
                      >
                        {busy ? "Please wait..." : "Enroll Now"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>

      <section className="learning-path-section">
        <h2>My Enrollments</h2>

        {enrollments.length === 0 ? (
          <div className="panel">
            You haven't enrolled in any learning paths yet.
          </div>
        ) : (
          <div className="learning-enrollment-list">
            {enrollments.map((item) => {
              const path = paths.find(
                (entry) => entry.id === item.learning_path_id
              );

              return (
                <div className="learning-enrollment" key={item.id}>
                  <div>
                    <strong>{path?.title || `Learning Path #${item.learning_path_id}`}</strong>
                    <p className="muted">
                      Enrolled: {new Date(item.enrolled_at).toLocaleDateString()}
                    </p>
                    <span className={item.is_completed ? "learning-completed" : "learning-in-progress"}>
                      {item.is_completed ? "Completed" : "In Progress"}
                    </span>
                  </div>

                  <button
                    className="btn"
                    onClick={() => path && viewPath(path)}
                  >
                    View Progress
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedPath && (
        <section className="learning-path-details panel">
          <div className="learning-detail-heading">
            <div>
              <h2>{selectedPath.title}</h2>
              <p className="muted">{selectedPath.description}</p>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSelectedPath(null);
                setProgress(null);
              }}
            >
              Close
            </button>
          </div>

          <h3>Courses in this Learning Path</h3>

          {pathCourses.length === 0 ? (
            <p className="muted">No courses have been added to this path yet.</p>
          ) : (
            <div className="learning-course-list">
              {pathCourses.map((item) => (
                <div className="learning-course-item" key={item.id}>
                  <span className="learning-course-number">
                    {item.order_index}
                  </span>
                  <span>{getCourseTitle(item.course_id)}</span>
                </div>
              ))}
            </div>
          )}

          {progress && (
            <div className="learning-progress-box">
              <h3>Your Learning Progress</h3>
              <div className="learning-progress-track">
                <div
                  className="learning-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress.progress_percentage))}%`,
                  }}
                />
              </div>

              <strong>{progress.progress_percentage}% completed</strong>

              <div className="learning-progress-stats">
                <span>Courses: {progress.total_courses}</span>
                <span>Lessons: {progress.completed_lessons}/{progress.total_lessons}</span>
              </div>

              {progress.is_completed && (
                <p className="learning-completed">
                  Congratulations! Learning path completed.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
