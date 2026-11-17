import { useState, type FormEvent } from "react";
import { Leaf } from "lucide-react";
import { searchStatistics, type StatisticsPassage } from "../services/api";
import "../tools.css";
export default function EnviStats() {
  const [question, setQuestion] = useState("");
  const [passages, setPassages] = useState<StatisticsPassage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

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
      const detail = (err as { response?: { data?: { detail?: unknown } } })
        ?.response?.data?.detail;
      setError(
        typeof detail === "string" ? detail : "Unable to search the statistics database."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tl-page">
      <div>
        <h1 className="tl-h1">
          <Leaf size={26} className="tl-gold" /> EnviStats India 2024
        </h1>
        <p className="tl-sub">Search the existing environmental statistics report.</p>
      </div>

      <section className="tl-card">
        <form className="tl-stack" onSubmit={handleSearch}>
          <textarea
            className="tl-field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Example: What are environmental accounts in India?"
            rows={4}
            maxLength={1000}
          />
          <div>
            <button type="submit" className="tl-btn" disabled={loading}>
              {loading ? "Searching..." : "Search Statistics"}
            </button>
          </div>
        </form>

        {error && <p className="tl-error" style={{ marginTop: 14 }}>{error}</p>}
      </section>

      {searched && (
        <section className="tl-card tl-stack">
          <h2 className="tl-h2">Retrieved information</h2>

          {passages.length === 0 ? (
            <p className="tl-note">No relevant passages were found.</p>
          ) : (
            passages.map((passage, index) => (
              <article key={index} className="tl-passage">
                <h4>Source passage {index + 1}</h4>
                <p>{passage.content}</p>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}