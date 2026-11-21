
import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { getErrorMessage } from "../services/errors";

interface Course {
  id: number;
  title: string;
}

interface Quiz {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  passing_score: number;
  is_published: boolean;
}

interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: "MCQ" | "TRUE_FALSE";
  options: string[] | null;
  points: number;
  order_index: number;
}

interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  total_points: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at: string | null;
}

interface QuizResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  total_points: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string | null;
}

const ACTIVE_QUIZ_ANSWERS_PREFIX = "statskill_quiz_answers_";

export default function Quiz() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const submissionLock = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Load courses, attempt history, and recover an unfinished quiz.
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);
      setError("");

      try {
        const [coursesResponse, attemptsResponse] =
          await Promise.allSettled([
            api.get<Course[]>("/courses"),
            api.get<QuizAttempt[]>("/attempts/me"),
          ]);

        if (!active) return;

        let attemptData: QuizAttempt[] = [];

        if (coursesResponse.status === "fulfilled") {
          const courseData = coursesResponse.value.data;

          if (Array.isArray(courseData)) {
            setCourses(courseData);
          } else {
            setError("The courses response was invalid.");
          }
        } else {
          setError(getErrorMessage(coursesResponse.reason));
        }

        if (attemptsResponse.status === "fulfilled") {
          const data = attemptsResponse.value.data;

          if (Array.isArray(data)) {
            attemptData = data;
            setAttempts(data);
          }
        } else {
          setError((previous) =>
            previous ||
            getErrorMessage(attemptsResponse.reason)
          );
        }

        // Find the most recent unfinished attempt.
        const unfinishedAttempt = attemptData
          .filter((attempt) => attempt.submitted_at === null)
          .sort(
            (a, b) =>
              new Date(b.started_at).getTime() -
              new Date(a.started_at).getTime()
          )[0];

        if (unfinishedAttempt && active) {
          try {
            // Retrieve the original quiz.
            const quizResponse = await api.get<Quiz>(
              `/quizzes/${unfinishedAttempt.quiz_id}`
            );

            if (!active) return;

            const quiz = quizResponse.data;

            // Retrieve quiz questions and its course quizzes.
            const [questionsResponse, quizzesResponse] =
              await Promise.all([
                api.get<QuizQuestion[]>(
                  `/quizzes/${quiz.id}/questions`
                ),
                api.get<Quiz[]>(
                  `/quizzes/courses/${quiz.course_id}`
                ),
              ]);

            if (!active) return;

            // Restore saved answers from browser storage.
            let restoredAnswers: Record<number, string> = {};

            try {
              const savedAnswers = localStorage.getItem(
                `${ACTIVE_QUIZ_ANSWERS_PREFIX}${unfinishedAttempt.id}`
              );

              if (savedAnswers) {
                const parsed: unknown = JSON.parse(savedAnswers);

                if (
                  parsed !== null &&
                  typeof parsed === "object" &&
                  !Array.isArray(parsed)
                ) {
                  restoredAnswers = parsed as Record<number, string>;
                }
              }
            } catch {
              restoredAnswers = {};
            }

            // Calculate remaining time using the server's start time.
            let remaining: number | null = null;

            if (
              quiz.time_limit_minutes !== null &&
              quiz.time_limit_minutes > 0
            ) {
              const startedAt = new Date(
                unfinishedAttempt.started_at
              ).getTime();

              if (!Number.isFinite(startedAt)) {
                throw new Error("Invalid attempt start time.");
              }

              const deadline =
                startedAt + quiz.time_limit_minutes * 60 * 1000;

              remaining = Math.max(
                0,
                Math.ceil((deadline - Date.now()) / 1000)
              );
            }

            // Restore quiz state.
            setSelectedCourse(String(quiz.course_id));
            setQuizzes(
              quizzesResponse.data.filter((item) => item.is_published)
            );
            setSelectedQuiz(quiz);
            setQuestions(questionsResponse.data);
            setAnswers(restoredAnswers);
            setResult(null);

            submissionLock.current = false;

            setTimeRemaining(remaining);
            setActiveAttemptId(unfinishedAttempt.id);

            setNotice(
              remaining === 0
                ? "Your quiz time has expired. Submitting your attempt..."
                : "Your unfinished quiz has been restored."
            );
          } catch (recoveryError) {
            if (active) {
              setNotice(
                "An unfinished quiz was found, but it could not be restored. " +
                  getErrorMessage(recoveryError)
              );
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Countdown timer.
  useEffect(() => {
    if (
      activeAttemptId === null ||
      timeRemaining === null ||
      timeRemaining <= 0
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTimeRemaining((previous) =>
        previous === null ? null : Math.max(0, previous - 1)
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeAttemptId, timeRemaining]);

  // Automatically submit when time expires.
  useEffect(() => {
    if (
      activeAttemptId !== null &&
      timeRemaining === 0 &&
      !submissionLock.current
    ) {
      void submitQuiz(true);
    }
  }, [activeAttemptId, timeRemaining]);

  // Persist answers whenever they change.
  useEffect(() => {
    if (activeAttemptId === null) return;

    try {
      localStorage.setItem(
        `${ACTIVE_QUIZ_ANSWERS_PREFIX}${activeAttemptId}`,
        JSON.stringify(answers)
      );
    } catch {
      setNotice("Your answers could not be saved in this browser.");
    }
  }, [activeAttemptId, answers]);

  async function handleCourseChange(courseId: string) {
    setSelectedCourse(courseId);
    setQuizzes([]);
    setSelectedQuiz(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setActiveAttemptId(null);
    setTimeRemaining(null);

    submissionLock.current = false;
    setError("");
    setNotice("");

    if (!courseId) return;

    setLoadingQuizzes(true);

    try {
      const response = await api.get<Quiz[]>(
        `/quizzes/courses/${courseId}`
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid quiz response.");
      }

      setQuizzes(response.data.filter((quiz) => quiz.is_published));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingQuizzes(false);
    }
  }

  async function handleQuizSelect(quiz: Quiz) {
    setSelectedQuiz(quiz);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setActiveAttemptId(null);
    setTimeRemaining(null);

    submissionLock.current = false;
    setError("");
    setNotice("");
    setLoadingQuestions(true);

    try {
      const response = await api.get<QuizQuestion[]>(
        `/quizzes/${quiz.id}/questions`
      );

      if (!Array.isArray(response.data)) {
        throw new Error("Invalid questions response.");
      }

      setQuestions(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
      setSelectedQuiz(null);
    } finally {
      setLoadingQuestions(false);
    }
  }

  // Start a new quiz attempt.
  async function startQuiz() {
    if (!selectedQuiz || starting) return;

    setStarting(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post<{ id: number; started_at?: string }>(
        "/attempts/start",
        { quiz_id: selectedQuiz.id }
      );

      submissionLock.current = false;

      setActiveAttemptId(response.data.id);
      setAnswers({});
      setResult(null);

      setTimeRemaining(
        selectedQuiz.time_limit_minutes &&
          selectedQuiz.time_limit_minutes > 0
          ? selectedQuiz.time_limit_minutes * 60
          : null
      );

      setNotice("Your quiz has started. Good luck!");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  // Save selected answer.
  function handleAnswer(questionId: number, answer: string) {
    if (submissionLock.current) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  }

  // Submit quiz manually or automatically.
  async function submitQuiz(autoSubmit = false) {
    if (
      !activeAttemptId ||
      !selectedQuiz ||
      submissionLock.current
    ) {
      return;
    }

    const attemptId = activeAttemptId;

    submissionLock.current = true;
    setSubmitting(true);
    setError("");

    setNotice(
      autoSubmit
        ? "Time is up! Submitting your answers..."
        : ""
    );

    try {
      const response = await api.post<QuizResult>(
        `/attempts/${attemptId}/submit`,
        {
          answers: questions.map((question) => ({
            question_id: question.id,
            selected_answer: answers[question.id] ?? null,
          })),
        }
      );

      localStorage.removeItem(
        `${ACTIVE_QUIZ_ANSWERS_PREFIX}${attemptId}`
      );

      setResult(response.data);
      setActiveAttemptId(null);
      setTimeRemaining(null);

      try {
        const historyResponse = await api.get<QuizAttempt[]>(
          "/attempts/me"
        );

        if (Array.isArray(historyResponse.data)) {
          setAttempts(historyResponse.data);
        }
      } catch {
        setNotice(
          "Your quiz was submitted, but attempt history could not be refreshed."
        );
      }
    } catch (err) {
      submissionLock.current = false;
      setError(getErrorMessage(err));

      setNotice(
        autoSubmit
          ? "Automatic submission failed. Please try submitting your quiz again."
          : ""
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Format remaining time as MM:SS.
  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="quiz-page">
        <h1>Quizzes & Assessments</h1>
        <p className="muted">Loading your quizzes...</p>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <header className="quiz-header">
        <div>
          <h1>Quizzes & Assessments</h1>
          <p className="muted">
            Test your knowledge and track your learning performance.
          </p>
        </div>
      </header>

      {error && <p className="error">{error}</p>}
      {notice && <p className="muted">{notice}</p>}

      {/* Course selection */}
      <section className="panel quiz-selection">
        <h2>Select a course</h2>

        {courses.length === 0 ? (
          <p className="muted">
            No published courses are currently available.
          </p>
        ) : (
          <select
            className="quiz-select"
            value={selectedCourse}
            onChange={(event) =>
              handleCourseChange(event.target.value)
            }
            disabled={activeAttemptId !== null}
          >
            <option value="">Choose a course</option>

            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Available quizzes */}
      {selectedCourse && (
        <section className="panel">
          <h2>Available quizzes</h2>

          {loadingQuizzes ? (
            <p className="muted">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <p className="muted">
              No quizzes are available for this course yet.
            </p>
          ) : (
            <div className="quiz-list">
              {quizzes.map((quiz) => (
                <article className="quiz-card" key={quiz.id}>
                  <div>
                    <h3>{quiz.title}</h3>

                    <p className="muted">
                      {quiz.description || "Test your understanding."}
                    </p>

                    <div className="quiz-meta">
                      <span>
                        Passing score: {quiz.passing_score}%
                      </span>

                      <span>
                        {quiz.time_limit_minutes
                          ? `${quiz.time_limit_minutes} minutes`
                          : "No time limit"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn"
                    onClick={() => handleQuizSelect(quiz)}
                    disabled={
                      loadingQuestions || activeAttemptId !== null
                    }
                  >
                    View quiz
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Active quiz */}
      {selectedQuiz && !result && (
        <section className="panel active-quiz">
          <h2>{selectedQuiz.title}</h2>

          {loadingQuestions ? (
            <p className="muted">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="muted">
              This quiz does not contain any questions yet.
            </p>
          ) : activeAttemptId === null ? (
            <>
              <p className="muted">
                This quiz contains {questions.length} questions.
                {" "}Passing score: {selectedQuiz.passing_score}%.
              </p>

              <button
                className="btn"
                onClick={startQuiz}
                disabled={starting}
              >
                {starting ? "Starting..." : "Start quiz"}
              </button>
            </>
          ) : (
            <>
              <div className="quiz-progress-label">
                <span>
                  {Object.keys(answers).length} of{" "}
                  {questions.length} answered
                </span>

                <span>Attempt #{activeAttemptId}</span>
              </div>

              {/* Countdown timer */}
              {timeRemaining !== null && (
                <div
                  className="quiz-timer"
                  role="timer"
                  aria-live="off"
                  style={{
                    color:
                      timeRemaining <= 60 ? "#dc2626" : "inherit",
                    fontWeight: "bold",
                    fontSize: "18px",
                    margin: "16px 0",
                  }}
                >
                  Time remaining: {formatTime(timeRemaining)}
                  {timeRemaining <= 60 && " — Hurry up!"}
                </div>
              )}

              {/* Questions */}
              {questions.map((question, index) => {
                const options =
                  question.question_type === "TRUE_FALSE"
                    ? ["True", "False"]
                    : question.options || [];

                return (
                  <article
                    className="quiz-question"
                    key={question.id}
                  >
                    <h3>
                      {index + 1}. {question.question_text}
                    </h3>

                    <p className="muted">
                      {question.points}{" "}
                      {question.points === 1 ? "point" : "points"}
                    </p>

                    <div className="quiz-options">
                      {options.map((option) => (
                        <label
                          className={`quiz-option ${
                            answers[question.id] === option
                              ? "selected"
                              : ""
                          }`}
                          key={option}
                        >
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            value={option}
                            checked={
                              answers[question.id] === option
                            }
                            disabled={
                              submitting ||
                              submissionLock.current ||
                              timeRemaining === 0
                            }
                            onChange={() =>
                              handleAnswer(question.id, option)
                            }
                          />

                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </article>
                );
              })}

              {/* Submit button */}
              <div className="quiz-submit-area">
                <p className="muted">
                  Unanswered questions will be submitted as blank.
                </p>

                <button
                  className="btn"
                  onClick={() => submitQuiz(false)}
                  disabled={submitting || timeRemaining === 0}
                >
                  {submitting ? "Submitting..." : "Submit quiz"}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Quiz result */}
      {result && (
        <section className="panel quiz-result">
          <h2>Quiz Result</h2>

          <strong className="quiz-result-score">
            {result.percentage}%
          </strong>

          <h3>
            {result.is_passed
              ? "Congratulations! You passed."
              : "Keep practising! You did not pass this time."}
          </h3>

          <p className="muted">
            Score: {result.score} out of {result.total_points}
          </p>

          <p>
            <span
              className={`quiz-result-status ${
                result.is_passed ? "passed" : "failed"
              }`}
            >
              {result.is_passed ? "PASSED" : "NOT PASSED"}
            </span>
          </p>

          <button
            className="btn"
            onClick={() => {
              setResult(null);
              setSelectedQuiz(null);
              setQuestions([]);
              setAnswers({});
              setActiveAttemptId(null);
              setTimeRemaining(null);
              submissionLock.current = false;
              setNotice("");
              setError("");
            }}
          >
            Back to quizzes
          </button>
        </section>
      )}

      {/* Previous quiz attempts */}
      <section className="panel quiz-history">
        <h2>Previous quiz attempts</h2>

        {attempts.filter(
          (attempt) => attempt.submitted_at !== null
        ).length === 0 ? (
          <p className="muted">
            You haven't submitted any quizzes yet.
          </p>
        ) : (
          <div className="quiz-history-list">
            {attempts
              .filter(
                (attempt) => attempt.submitted_at !== null
              )
              .map((attempt) => (
                <article
                  className="quiz-history-item"
                  key={attempt.id}
                >
                  <div>
                    <strong>Quiz #{attempt.quiz_id}</strong>

                    <p className="muted">
                      {new Date(
                        attempt.submitted_at!
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div className="quiz-history-score">
                    <strong>{attempt.percentage}%</strong>

                    <span
                      className={
                        attempt.is_passed ? "passed" : "failed"
                      }
                    >
                      {attempt.is_passed ? "Passed" : "Not passed"}
                    </span>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
