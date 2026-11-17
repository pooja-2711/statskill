import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import {
  uploadPDF,
  getPDFDocuments,
  askPDFQuestion,
  generatePDFQuiz,
  type PDFUploadResponse,
  type PDFDocumentInfo,
  type PDFAskResponse,
  type PDFQuizResponse,
} from "../services/api";
import "../tools.css";

function apiError(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export default function StatisticsAssistant() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<PDFUploadResponse | null>(null);
  const [uploadError, setUploadError] = useState("");

  const [pdfDocuments, setPdfDocuments] = useState<PDFDocumentInfo[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState<number | "">("");
  const [pdfQuestion, setPdfQuestion] = useState("");
  const [pdfAnswer, setPdfAnswer] = useState<PDFAskResponse | null>(null);
  const [askingPDF, setAskingPDF] = useState(false);
  const [pdfAIError, setPdfAIError] = useState("");
  const [loadingPDFs, setLoadingPDFs] = useState(false);

  const [quiz, setQuiz] = useState<PDFQuizResponse | null>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  async function loadPDFDocuments() {
    try {
      setLoadingPDFs(true);
      const documents = await getPDFDocuments();
      setPdfDocuments(documents);

      if (documents.length > 0) {
        setSelectedPdfId((current) =>
          documents.some((doc) => doc.id === current) ? current : documents[0].id
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
    void loadPDFDocuments();
  }, []);

  function chooseFile(candidate: File | null | undefined) {
    if (!candidate) return;
    if (!isPdf(candidate)) {
      setUploadError("Only PDF files are supported.");
      return;
    }
    setUploadError("");
    setUploadResult(null);
    setFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    chooseFile(event.dataTransfer.files?.[0]);
  }

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
      if (fileInputRef.current) fileInputRef.current.value = "";

      await loadPDFDocuments();

      setSelectedPdfId(response.document.id);
      setPdfAnswer(null);
      setQuiz(null);
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizError("");
    } catch (err) {
      setUploadError(apiError(err, "Unable to upload this PDF."));
    } finally {
      setUploading(false);
    }
  }

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
      setPdfAnswer(await askPDFQuestion(selectedPdfId, pdfQuestion.trim()));
    } catch (err) {
      setPdfAIError(apiError(err, "Unable to get an answer from Gemini."));
    } finally {
      setAskingPDF(false);
    }
  }

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
      setQuiz(await generatePDFQuiz(selectedPdfId));
    } catch (err) {
      setQuizError(apiError(err, "Unable to generate the quiz. Please try again."));
    } finally {
      setGeneratingQuiz(false);
    }
  }

  function handleSubmitQuiz() {
    if (!quiz) return;

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      setQuizError(`Please answer all ${quiz.questions.length} questions before submitting.`);
      return;
    }

    setQuizError("");
    setQuizSubmitted(true);
  }

  const quizScore = quiz
    ? quiz.questions.reduce(
        (score, item, index) => score + (selectedAnswers[index] === item.correct_answer ? 1 : 0),
        0
      )
    : 0;

  const completedDocs = pdfDocuments.filter((doc) => doc.status === "completed");

  return (
    <div className="tl-page">
      <div>
        <h1 className="tl-h1">
          <FileText size={26} className="tl-gold" /> PDF Learning Assistant
        </h1>
        <p className="tl-sub">Upload your own PDF documents and use AI-powered learning tools.</p>
      </div>

      {/* ---------- upload ---------- */}
      <section className="tl-card">
        <h2 className="tl-h2">Upload your PDF</h2>
        <p className="tl-sub" style={{ marginBottom: 14 }}>
          Textbooks, newspapers, study notes, reports or other PDF documents.
        </p>

        <form className="tl-stack" onSubmit={handleUpload}>
          <div
            className={`tl-drop${dragging ? " active" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!uploading) fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <UploadCloud size={36} />
            <strong>Drag and drop your PDF here</strong>
            <span>or click to browse your files</span>
          </div>

          <input
            ref={fileInputRef}
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(event) => chooseFile(event.target.files?.[0])}
            disabled={uploading}
          />

          {file && (
            <div className="tl-file">
              <FileText size={18} className="tl-gold" />
              <span>{file.name}</span>
              <button
                type="button"
                aria-label="Remove file"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={uploading}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <button type="submit" className="tl-btn" disabled={uploading || !file}>
              {uploading ? "Uploading and processing..." : "Upload PDF"}
            </button>
          </div>
        </form>

        {uploadError && <p className="tl-error" style={{ marginTop: 14 }}>{uploadError}</p>}

        {uploadResult && (
          <div className="tl-success" style={{ marginTop: 16 }}>
            <strong>PDF uploaded successfully!</strong>
            <p>File: {uploadResult.document.filename}</p>
            <p>Pages: {uploadResult.document.page_count} | Text chunks: {uploadResult.document.chunk_count}</p>
            <p>Status: {uploadResult.document.status}</p>
          </div>
        )}
      </section>

      {/* ---------- ask ---------- */}
      <section className="tl-card">
        <h2 className="tl-h2">Ask AI about your PDF</h2>
        <p className="tl-sub" style={{ marginBottom: 14 }}>
          Select one of your uploaded PDFs and ask questions about its content.
        </p>

        <form className="tl-stack" onSubmit={handleAskPDF}>
          <div>
            <label className="tl-label" htmlFor="pdf-select">Select your PDF</label>
            <select
              id="pdf-select"
              className="tl-select"
              value={selectedPdfId}
              onChange={(event) => {
                setSelectedPdfId(event.target.value ? Number(event.target.value) : "");
                setPdfAnswer(null);
                setPdfAIError("");
                setQuiz(null);
                setQuizError("");
                setSelectedAnswers({});
                setQuizSubmitted(false);
              }}
              disabled={loadingPDFs || askingPDF || generatingQuiz}
            >
              <option value="">{loadingPDFs ? "Loading PDFs..." : "Choose an uploaded PDF"}</option>
              {completedDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} ({doc.page_count} pages)
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="tl-field"
            value={pdfQuestion}
            onChange={(event) => setPdfQuestion(event.target.value)}
            placeholder="Ask something about your PDF..."
            rows={4}
            maxLength={2000}
          />

          <div>
            <button
              type="submit"
              className="tl-btn"
              disabled={askingPDF || !selectedPdfId || pdfQuestion.trim().length < 3}
            >
              {askingPDF ? "Gemini is thinking..." : "Ask AI"}
            </button>
          </div>
        </form>

        {pdfAIError && <p className="tl-error" style={{ marginTop: 14 }}>{pdfAIError}</p>}

        {pdfAnswer && (
          <article className="tl-answer" style={{ marginTop: 16 }}>
            <h3>AI Answer</h3>
            <p className="tl-note" style={{ margin: "0 0 10px" }}>Document: {pdfAnswer.filename}</p>
            <div className="body">{pdfAnswer.answer}</div>
            <p className="tl-meta">
              Source pages:{" "}
              {pdfAnswer.source_pages.length > 0 ? pdfAnswer.source_pages.join(", ") : "Not available"}
              {" | "}Powered by {pdfAnswer.model}
            </p>
          </article>
        )}

        {!loadingPDFs && completedDocs.length === 0 && (
          <p className="tl-note" style={{ marginTop: 14 }}>Upload a PDF first to start asking questions.</p>
        )}
      </section>

      {/* ---------- quiz ---------- */}
      <section className="tl-card">
        <h2 className="tl-h2">Generate Quiz from PDF</h2>
        <p className="tl-sub" style={{ marginBottom: 14 }}>
          Test your understanding with 10 medium-difficulty questions generated from your selected
          PDF, covering academic concepts and practical job-assessment scenarios.
        </p>

        <button
          type="button"
          className="tl-btn"
          onClick={() => void handleGenerateQuiz()}
          disabled={!selectedPdfId || generatingQuiz || loadingPDFs}
        >
          {generatingQuiz ? "Generating your quiz..." : quiz ? "Generate New Quiz" : "Generate Quiz"}
        </button>

        {quizError && <p className="tl-error" style={{ marginTop: 14 }}>{quizError}</p>}

        {quiz && (
          <div className="tl-stack" style={{ marginTop: 20 }}>
            <div>
              <h3 className="tl-h2">{quiz.filename}</h3>
              <p className="tl-note">
                {quiz.question_count} questions | {quiz.difficulty} difficulty | Powered by {quiz.model}
              </p>
            </div>

            {quizSubmitted && (
              <div className="tl-success">
                <strong>Quiz Result</strong>
                <p>
                  Your score: <strong>{quizScore} / {quiz.questions.length}</strong>
                  {" "}({Math.round((quizScore / quiz.questions.length) * 100)}%)
                </p>
              </div>
            )}

            {quiz.questions.map((item, index) => {
              const isCorrect = selectedAnswers[index] === item.correct_answer;

              return (
                <article key={index} className="tl-q">
                  <h4>Question {index + 1}: {item.question}</h4>
                  <p className="tl-note" style={{ margin: "0 0 4px" }}>
                    {item.type === "academic" ? "Academic" : "Job Assessment"}
                    {item.page ? ` | PDF Page ${item.page}` : ""}
                  </p>

                  {item.options.map((option, optionIndex) => {
                    let state = "";
                    if (quizSubmitted && option === item.correct_answer) state = " right";
                    else if (quizSubmitted && selectedAnswers[index] === option && !isCorrect) state = " wrong";

                    return (
                      <label key={optionIndex} className={`tl-opt${state}`}>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={selectedAnswers[index] === option}
                          disabled={quizSubmitted}
                          onChange={() => {
                            setSelectedAnswers((previous) => ({ ...previous, [index]: option }));
                            setQuizError("");
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}

                  {quizSubmitted && (
                    <div>
                      <p className={`tl-verdict ${isCorrect ? "ok" : "bad"}`}>
                        {isCorrect ? "Correct!" : "Incorrect"}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>
                        <strong>Correct answer:</strong> {item.correct_answer}
                      </p>
                      <p style={{ margin: "4px 0", fontSize: 14 }}>
                        <strong>Explanation:</strong> {item.explanation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}

            {!quizSubmitted ? (
              <div>
                <button type="button" className="tl-btn" onClick={handleSubmitQuiz}>
                  Submit Quiz
                </button>
              </div>
            ) : (
              <p className="tl-note">Quiz submitted. Generate a new quiz whenever you are ready.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}