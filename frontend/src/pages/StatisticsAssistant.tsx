
import { useEffect, useState, type FormEvent } from "react";

import {
  searchStatistics,
  uploadPDF,
  getPDFDocuments,
  askPDFQuestion,
  generatePDFQuiz,
  type StatisticsPassage,
  type PDFUploadResponse,
  type PDFDocumentInfo,
  type PDFAskResponse,
  type PDFQuizResponse,
} from "../services/api";

export default function StatisticsAssistant() {
  // PDF upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] =
    useState<PDFUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState("");

  // PDF documents state
  const [pdfDocuments, setPdfDocuments] = useState<PDFDocumentInfo[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | "">("");
  const [loadingPDFs, setLoadingPDFs] = useState(false);

  // PDF AI state
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfAnswer, setPdfAnswer] = useState<PDFAskResponse | null>(null);
  const [askingPDF, setAskingPDF] = useState(false);
  const [pdfAIError, setPdfAIError] = useState("");

  // PDF Quiz state
  const [quiz, setQuiz] = useState<PDFQuizResponse | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [selectedAnswers, setSelectedAnswers] =
    useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // EnviStats state
  const [question, setQuestion] = useState("");
  const [passages, setPassages] = useState<StatisticsPassage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  // Load uploaded PDFs
  async function loadPDFDocuments() {
    try {
      setLoadingPDFs(true);

      const documents = await getPDFDocuments();
      setPdfDocuments(documents);

      if (documents.length > 0) {
        setSelectedPdfId((current) =>
          documents.some((doc) => doc.id === current)
            ? current
            : documents[0].id
        );
      } else {
        setSelectedPdfId("");
      }
    } catch {
      setPdfAIError("Unable to load your uploaded PDFs.");
    } finally {
      setLoadingPDFs(false);
    }
  }

  useEffect(() => {
    loadPDFDocuments();
  }, []);

  // Ask AI about PDF
  async function handleAskPDF(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPdfId) {
      setPdfAIError("Please select an uploaded PDF.");
      return;
    }

    if (pdfQuestion.trim().length < 3) {
      setPdfAIError("Please enter a question with at least 3 characters.");
      return;
    }

    try {
      setAskingPDF(true);
      setPdfAIError("");
      setPdfAnswer(null);

      const response = await askPDFQuestion(
        selectedPdfId,
        pdfQuestion.trim()
      );

      setPdfAnswer(response);
    } catch (err) {
      const message = (
        err as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setPdfAIError(message || "Unable to get an answer from Gemini.");
    } finally {
      setAskingPDF(false);
    }
  }

  // Generate PDF quiz
  async function handleGenerateQuiz() {
    if (!selectedPdfId) {
      setQuizError("Please select an uploaded PDF first.");
      return;
    }

    try {
      setGeneratingQuiz(true);
      setQuizError("");
      setQuiz(null);
      setSelectedAnswers({});
      setQuizSubmitted(false);

      const response = await generatePDFQuiz(selectedPdfId);

      setQuiz(response);
    } catch (err) {
      const message = (
        err as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setQuizError(message || "Unable to generate the quiz. Please try again.");
    } finally {
      setGeneratingQuiz(false);
    }
  }

  // Submit quiz
  function handleSubmitQuiz() {
    if (!quiz) return;

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      setQuizError("Please answer all 10 questions before submitting.");
      return;
    }

    setQuizError("");
    setQuizSubmitted(true);
  }

  // Calculate quiz score
  const quizScore = quiz
    ? quiz.questions.reduce(
        (score, item, index) =>
          score +
          (selectedAnswers[index] === item.correct_answer ? 1 : 0),
        0
      )
    : 0;

  // Upload PDF
  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setUploadError("Please select a PDF first.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadResult(null);

      const response = await uploadPDF(file);

      setUploadResult(response);
      setFile(null);

      await loadPDFDocuments();

      setSelectedPdfId(response.document.id);
      setPdfAnswer(null);
      setQuiz(null);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizError("");

      const input = document.getElementById(
        "pdf-upload"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (err) {
      const message = (
        err as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setUploadError(message || "Unable to upload this PDF.");
    } finally {
      setUploading(false);
    }
  }

  // Search EnviStats
  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (question.trim().length < 3) {
      setError("Please enter a question with at least 3 characters.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSearched(false);
      setPassages([]);

      const response = await searchStatistics(question.trim(), 5);

      setPassages(response.results);
      setSearched(true);
    } catch (err) {
      const message = (
        err as {
          response?: { data?: { detail?: string } };
        }
      )?.response?.data?.detail;

      setError(message || "Unable to search the statistics database.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1>PDF Learning Assistant</h1>

      <p>
        Upload your own PDF documents and use AI-powered learning tools.
      </p>

      {/* PDF UPLOAD */}
      <section
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Upload your PDF</h2>

        <p>
          Upload textbooks, newspapers, study notes, reports or other PDF
          documents.
        </p>

        <form onSubmit={handleUpload}>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) =>
              setFile(event.target.files?.[0] || null)
            }
            disabled={uploading}
          />

          {file && <p>Selected: {file.name}</p>}

          <button
            type="submit"
            disabled={uploading || !file}
            style={{
              marginTop: "12px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: uploading || !file ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading and processing..." : "Upload PDF"}
          </button>
        </form>

        {uploadError && (
          <p style={{ color: "red", marginTop: "16px" }}>
            {uploadError}
          </p>
        )}

        {uploadResult && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px solid #4caf50",
              borderRadius: "8px",
            }}
          >
            <h3>PDF uploaded successfully!</h3>
            <p>File: {uploadResult.document.filename}</p>
            <p>Pages: {uploadResult.document.page_count}</p>
            <p>Processed text chunks: {uploadResult.document.chunk_count}</p>
            <p>Status: {uploadResult.document.status}</p>
            <p>Your document is now stored in your account.</p>
          </div>
        )}
      </section>

      {/* PDF AI ASSISTANT */}
      <section
        style={{
          marginTop: "28px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Ask AI about your PDF</h2>

        <p>
          Select one of your uploaded PDFs and ask questions about its content.
        </p>

        <form onSubmit={handleAskPDF}>
          <label htmlFor="pdf-select">Select your PDF</label>

          <select
            id="pdf-select"
            value={selectedPdfId}
            onChange={(event) => {
              setSelectedPdfId(
                event.target.value ? Number(event.target.value) : ""
              );
              setPdfAnswer(null);
              setPdfAIError("");
              setQuiz(null);
              setQuizError("");
              setSelectedAnswers({});
              setQuizSubmitted(false);
            }}
            disabled={loadingPDFs || askingPDF || generatingQuiz}
            style={{
              display: "block",
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          >
            <option value="">
              {loadingPDFs ? "Loading PDFs..." : "Choose an uploaded PDF"}
            </option>

            {pdfDocuments
              .filter((doc) => doc.status === "completed")
              .map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} ({doc.page_count} pages)
                </option>
              ))}
          </select>

          <textarea
            value={pdfQuestion}
            onChange={(event) => setPdfQuestion(event.target.value)}
            placeholder="Ask something about your PDF..."
            rows={4}
            maxLength={2000}
            style={{
              display: "block",
              width: "100%",
              padding: "12px",
              marginTop: "14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={
              askingPDF ||
              !selectedPdfId ||
              pdfQuestion.trim().length < 3
            }
            style={{
              marginTop: "12px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: askingPDF ? "wait" : "pointer",
            }}
          >
            {askingPDF ? "Gemini is thinking..." : "Ask AI"}
          </button>
        </form>

        {pdfAIError && (
          <p style={{ color: "red", marginTop: "16px" }}>
            {pdfAIError}
          </p>
        )}

        {pdfAnswer && (
          <article
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <h3>AI Answer</h3>

            <p>
              <strong>Document:</strong> {pdfAnswer.filename}
            </p>

            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              {pdfAnswer.answer}
            </div>

            <p style={{ marginTop: "16px", fontSize: "13px" }}>
              <strong>Source pages:</strong>{" "}
              {pdfAnswer.source_pages.length > 0
                ? pdfAnswer.source_pages.join(", ")
                : "Not available"}
            </p>

            <p style={{ fontSize: "12px", color: "#777" }}>
              Powered by {pdfAnswer.model}
            </p>
          </article>
        )}

        {!loadingPDFs &&
          pdfDocuments.filter((doc) => doc.status === "completed").length ===
            0 && (
            <p style={{ marginTop: "14px" }}>
              Upload a PDF first to start asking questions.
            </p>
          )}
      </section>

      {/* PDF QUIZ */}
      <section
        style={{
          marginTop: "28px",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Generate Quiz from PDF</h2>

        <p>
          Test your understanding with 10 medium-difficulty questions
          generated from your selected PDF. Questions include academic
          concepts and practical job-assessment scenarios.
        </p>

        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={!selectedPdfId || generatingQuiz || loadingPDFs}
          style={{
            marginTop: "8px",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor:
              !selectedPdfId || generatingQuiz ? "not-allowed" : "pointer",
          }}
        >
          {generatingQuiz
            ? "Generating your quiz..."
            : quiz
              ? "Generate New Quiz"
              : "Generate Quiz"}
        </button>

        {quizError && (
          <p style={{ color: "red", marginTop: "16px" }}>
            {quizError}
          </p>
        )}

        {quiz && (
          <div style={{ marginTop: "24px" }}>
            <h3>{quiz.filename}</h3>

            <p>
              {quiz.question_count} Questions | {quiz.difficulty} Difficulty
            </p>

            <p style={{ fontSize: "13px", color: "#777" }}>
              Powered by {quiz.model}
            </p>

            {quizSubmitted && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  border: "1px solid #4caf50",
                  borderRadius: "8px",
                }}
              >
                <h3>Quiz Result</h3>

                <p>
                  Your score:{" "}
                  <strong>
                    {quizScore} / {quiz.questions.length}
                  </strong>
                </p>

                <p>
                  Percentage:{" "}
                  <strong>
                    {Math.round(
                      (quizScore / quiz.questions.length) * 100
                    )}%
                  </strong>
                </p>
              </div>
            )}

            {quiz.questions.map((item, index) => {
              const isCorrect =
                selectedAnswers[index] === item.correct_answer;

              return (
                <article
                  key={index}
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <h4>
                    Question {index + 1}: {item.question}
                  </h4>

                  <p style={{ fontSize: "13px", color: "#777" }}>
                    {item.type === "academic"
                      ? "Academic"
                      : "Job Assessment"}
                    {item.page ? ` | PDF Page ${item.page}` : ""}
                  </p>

                  {item.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                        padding: "10px",
                        marginTop: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        cursor: quizSubmitted ? "default" : "pointer",
                        backgroundColor:
                          quizSubmitted && option === item.correct_answer
                            ? "#e8f5e9"
                            : quizSubmitted &&
                                selectedAnswers[index] === option &&
                                !isCorrect
                              ? "#ffebee"
                              : "transparent",
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={option}
                        checked={selectedAnswers[index] === option}
                        disabled={quizSubmitted}
                        onChange={() => {
                          setSelectedAnswers((previous) => ({
                            ...previous,
                            [index]: option,
                          }));
                          setQuizError("");
                        }}
                      />

                      <span>{option}</span>
                    </label>
                  ))}

                  {quizSubmitted && (
                    <div style={{ marginTop: "14px" }}>
                      <p
                        style={{
                          color: isCorrect ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>

                      <p>
                        <strong>Correct answer:</strong>{" "}
                        {item.correct_answer}
                      </p>

                      <p>
                        <strong>Explanation:</strong> {item.explanation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}

            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                style={{
                  marginTop: "20px",
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Submit Quiz
              </button>
            ) : (
              <p style={{ marginTop: "20px", fontWeight: "bold" }}>
                Quiz submitted. Generate a new quiz whenever you are ready.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ENVISTATS INDIA 2024 */}
      <section style={{ marginTop: "36px" }}>
        <h2>EnviStats India 2024 Assistant</h2>

        <p>
          Search the official environmental statistics report and retrieve
          relevant information with source references.
        </p>

        <form onSubmit={handleSearch}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: What are environmental accounts in India?"
            rows={4}
            maxLength={1000}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "12px",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Searching..." : "Search Statistics"}
          </button>
        </form>

        {error && (
          <p style={{ color: "red", marginTop: "16px" }}>
            {error}
          </p>
        )}

        {searched && (
          <section style={{ marginTop: "28px" }}>
            <h3>Retrieved information</h3>

            {passages.length === 0 ? (
              <p>No relevant passages were found.</p>
            ) : (
              passages.map((passage, index) => (
                <article
                  key={index}
                  style={{
                    padding: "16px",
                    marginBottom: "16px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                  }}
                >
                  <h4>Source passage {index + 1}</h4>

                  <p
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      marginBottom: "10px",
                    }}
                  >
                    <strong>Source:</strong>{" "}
                    {passage.source || "EnviStats India 2024"}
                    {" | "}
                    <strong>Page:</strong>{" "}
                    {passage.page ?? "Not available"}
                  </p>

                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {passage.content}
                  </p>
                </article>
              ))
            )}
          </section>
        )}
      </section>
    </div>
  );
}
