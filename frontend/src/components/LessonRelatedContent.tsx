import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import api from "../services/api";
import "./LessonRelatedContent.css";

// Change this if your quizzes page uses a different route.
const QUIZ_ROUTE = "/quiz";

interface LessonResource {
  id: number;
  lesson_id: number;
  title: string;
  resource_type: string;
  description: string | null;
  content: string | null;
  resource_url: string | null;
  order_index: number;
}

interface CourseQuiz {
  id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
}

interface LessonRelatedContentProps {
  lessonId: number;
  courseId: number;
}

const typeLabels: Record<string, string> = {
  note: "Notes",
  video: "Video",
  pdf: "PDF",
  exercise: "Exercise",
  link: "Link",
};

/* ---------- helpers ---------- */

// Only allow normal web links (blocks javascript: and similar).
function safeUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (parsed.hostname.endsWith("youtube.com")) {
      videoId = parsed.searchParams.get("v") ?? "";
    }

    return videoId
      ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`
      : null;
  } catch {
    return null;
  }
}

/* ---------- one resource ---------- */

function ResourceItem({ resource }: { resource: LessonResource }) {
  const url = safeUrl(resource.resource_url);
  const embedUrl = url ? getYouTubeEmbedUrl(url) : null;

  return (
    <article className="lesson-resource">
      <span className="lesson-resource-type">
        {typeLabels[resource.resource_type] ?? resource.resource_type}
      </span>

      <h4>{resource.title}</h4>

      {resource.description && (
        <p className="lesson-resource-description">
          {resource.description}
        </p>
      )}

      {resource.content && (
        <div className="lesson-resource-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {resource.content}
          </ReactMarkdown>
        </div>
      )}

      {embedUrl && (
        <iframe
          className="lesson-resource-video"
          src={embedUrl}
          title={resource.title}
          allowFullScreen
        />
      )}

      {url && !embedUrl && (
        <a
          className="lesson-resource-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {resource.resource_type === "pdf"
            ? "Open PDF"
            : resource.resource_type === "video"
              ? "Watch video"
              : "Open link"}
        </a>
      )}
    </article>
  );
}

/* ---------- main component ---------- */

// Use it with key={lesson.id} so it resets when the lesson changes.
function LessonRelatedContent({
  lessonId,
  courseId,
}: LessonRelatedContentProps) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [quizzes, setQuizzes] = useState<CourseQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourcesError, setResourcesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [resourceResult, quizResult] = await Promise.allSettled([
        api.get<LessonResource[]>(`/lesson-resources/lessons/${lessonId}`),
        api.get<CourseQuiz[]>(`/quizzes/courses/${courseId}`),
      ]);

      if (cancelled) return;

      if (resourceResult.status === "fulfilled") {
        setResources(resourceResult.value.data);
      } else {
        setResourcesError("Unable to load resources for this lesson.");
      }

      // A quiz error should never hide the resources, so it is ignored.
      if (quizResult.status === "fulfilled") {
        setQuizzes(quizResult.value.data);
      }

      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [lessonId, courseId]);

  if (loading) {
    return <p className="lesson-related-status">Loading related content...</p>;
  }

  return (
    <div className="lesson-related">
      <section>
        <h3>Related content</h3>

        {resourcesError && (
          <p className="lesson-related-error">{resourcesError}</p>
        )}

        {!resourcesError && resources.length === 0 && (
          <p className="lesson-related-status">
            No extra resources have been added to this lesson yet.
          </p>
        )}

        {resources.map((resource) => (
          <ResourceItem key={resource.id} resource={resource} />
        ))}
      </section>

      {quizzes.length > 0 && (
        <section>
          <h3>Test your knowledge</h3>

          <ul className="lesson-quiz-list">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="lesson-quiz-item">
                <div>
                  <strong>{quiz.title}</strong>
                  <span>
                    Pass mark {quiz.passing_score}%
                    {quiz.time_limit_minutes
                      ? `- ${quiz.time_limit_minutes} min`
                      : ""}
                  </span>
                </div>

                <Link to={`${QUIZ_ROUTE}?quiz_id=${quiz.id}`}>
                  Take quiz
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
export default LessonRelatedContent;
