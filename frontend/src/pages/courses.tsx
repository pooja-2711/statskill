
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  instructor_id: number;
  thumbnail_url?: string | null;
  price: number | string;
  level: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/courses");

      console.log("COURSES API RESPONSE:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid courses response from server.");
      }

      setCourses(response.data);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setError("Unable to load courses. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="courses-page">
        <h1>Explore Courses</h1>
        <p className="muted">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="courses-page">
        <h1>Explore Courses</h1>
        <p className="error">{error}</p>
        <button type="button" onClick={fetchCourses}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="courses-header">
        <div>
          <h1>Explore Courses</h1>
          <p className="muted">
            Discover courses and continue your learning journey.
          </p>
        </div>

        <span>{courses.length} courses available</span>
      </div>

      {courses.length === 0 ? (
        <div className="empty-courses panel">
          <h2>No courses available yet</h2>
          <p className="muted">
            Published courses will appear here when they are added.
          </p>
        </div>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <article className="course-card" key={course.id}>
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="course-thumbnail"
                />
              ) : (
                <div className="course-thumbnail-placeholder">
                  {course.category}
                </div>
              )}

              <div className="course-card-content">
                <span className="badge">{course.level}</span>

                <h2>{course.title}</h2>

                <p className="muted">
                  {course.description || "No description available."}
                </p>

                <div className="course-meta">
                  <span>{course.category}</span>

                  <strong>
                    {Number(course.price) === 0
                      ? "Free"
                      : `₹${Number(course.price).toFixed(2)}`}
                  </strong>
                </div>

                <Link
                  to={`/lessons?course_id=${course.id}`}
                  className="btn"
                >
                  View Lessons
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
