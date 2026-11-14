import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../services/api";

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
}

export default function Lessons() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("course_id");

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchLessons() {
      if (!courseId) {
        setError("Please select a course to view its lessons.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setLessons([]);
      setSelectedLesson(null);

      try {
        const response = await api.get(`/lessons/courses/${courseId}`);

        if (!Array.isArray(response.data)) {
          throw new Error("Invalid lessons response from server.");
        }

        const sortedLessons: Lesson[] = [...response.data].sort(
          (a, b) => a.order_index - b.order_index
        );

        if (active) {
          setLessons(sortedLessons);

          // Automatically select the first lesson.
          setSelectedLesson(sortedLessons[0] ?? null);
        }
      } catch (err) {
        console.error("Failed to load lessons:", err);

        if (active) {
          setError("Unable to load lessons. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchLessons();

    return () => {
      active = false;
    };
  }, [courseId]);

  async function markLessonComplete() {
    if (!selectedLesson) return;

    setCompleting(true);
    setSuccessMessage("");
    setError("");

    try {
      await api.post(
        `/progress/lessons/${selectedLesson.id}/complete`
      );

      setCompleted((previous) =>
        previous.includes(selectedLesson.id)
          ? previous
          : [...previous, selectedLesson.id]
      );

      setSuccessMessage("Lesson marked as completed successfully!");
    } catch (err) {
      console.error("Failed to update lesson progress:", err);
      setError("Could not update lesson progress. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="lessons-page">
        <h1>Course Lessons</h1>
        <p>Loading lessons...</p>
      </div>
    );
  }

  if (error && lessons.length === 0) {
    return (
      <div className="lessons-page">
        <h1>Course Lessons</h1>
        <p className="error">{error}</p>
      </div>
    );
  }

  return (
    <div className="lessons-page">
      <h1>Course Lessons</h1>

      <p className="muted">
        Explore the lessons in this course and start learning.
      </p>

      {lessons.length === 0 ? (
        <div className="panel">
          <h2>No lessons available</h2>
          <p className="muted">
            There are currently no lessons for this course.
          </p>
        </div>
      ) : (
        <div className="lessons-layout">
          <section className="lessons-list">
            <h2>All Lessons ({lessons.length})</h2>

            {lessons.map((lesson) => (
              <button
                type="button"
                key={lesson.id}
                className={`lesson-item ${
                  selectedLesson?.id === lesson.id ? "active" : ""
                }`}
                onClick={() => {
                  setSelectedLesson(lesson);
                  setSuccessMessage("");
                  setError("");
                }}
              >
                <span>
                  {lesson.order_index}. {lesson.title}
                </span>

                <small>
                  {lesson.duration_minutes} min
                  {lesson.is_preview ? " • Preview" : ""}
                  {completed.includes(lesson.id) ? " • Completed" : ""}
                </small>
              </button>
            ))}
          </section>

          <section className="lesson-content panel">
            {selectedLesson ? (
              <>
                <h2>{selectedLesson.title}</h2>

                <p className="muted">
                  {selectedLesson.description ||
                    "No description available."}
                </p>

                {selectedLesson.video_url && (
                  <p>
                    <a
                      href={selectedLesson.video_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch lesson video
                    </a>
                  </p>
                )}

                <div className="lesson-text">
                  {selectedLesson.content ||
                    "No lesson content available."}
                </div>

                <p className="muted">
                  Duration: {selectedLesson.duration_minutes} minutes
                </p>

                {completed.includes(selectedLesson.id) ? (
                  <p className="success">
                    <strong>Completed!</strong> You have finished this lesson.
                  </p>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    onClick={markLessonComplete}
                    disabled={completing}
                  >
                    {completing
                      ? "Saving progress..."
                      : "Mark as Complete"}
                  </button>
                )}

                {successMessage && (
                  <p className="success">{successMessage}</p>
                )}

                {error && <p className="error">{error}</p>}
              </>
            ) : (
              <p>No lesson selected.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}