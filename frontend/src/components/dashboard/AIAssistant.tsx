
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUpRight, RotateCcw, Send, Sparkles } from "lucide-react";
import { createAIConversation, sendAIConversationMessage } from "../../services/api";
import { getErrorMessage } from "../../services/errors";
import { useToast } from "../Toast";
import { Mascot } from "./Art";

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Explain today's important national news.",
  "Summarize the latest government policies.",
  "Explain the Union Budget.",
  "What are the important UPSC current affairs?",
  "Explain this topic in simple language.",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { toast } = useToast();

  const nextId = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();

    if (!message || loading) return;

    setError("");
    setInput("");
    setLoading(true);

    setMessages((current) => [
      ...current,
      {
        id: nextId.current++,
        role: "user",
        content: message,
      },
    ]);

    try {
      let id = conversationId;

      if (id === null) {
        const conversation = await createAIConversation(
          message.slice(0, 60)
        );

        id = conversation.id;
        setConversationId(id);
      }

      const response = await sendAIConversationMessage(id, message);

      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (err) {
      const message = getErrorMessage(err);

      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void send(input);
  }

  function clearChat() {
    setMessages([]);
    setConversationId(null);
    setError("");
    setInput("");
  }

  return (
    <section className="db-card db-ai" aria-label="Ask Statskill AI">
      <div className="db-head">
        <h2 className="db-title">
          <Sparkles size={20} className="gold" />
          Ask Statskill AI
        </h2>

        <div className="db-ai-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="db-pill-btn"
              onClick={clearChat}
            >
              <RotateCcw size={14} />
              Clear
            </button>
          )}

          <button
            type="button"
            className="db-pill-btn"
            onClick={() => inputRef.current?.focus()}
          >
            Try Ask
          </button>
        </div>
      </div>

      {messages.length === 0 ? (
        <>
          <div className="db-ai-intro">
            <div className="db-ai-mascot">
              <Mascot />
            </div>

            <div className="db-bubble">
              Ask me anything about current affairs, government policies or exams!
            </div>
          </div>

          <div className="db-chips">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="db-chip-btn"
                disabled={loading}
                onClick={() => void send(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div
          className="db-msgs"
          ref={listRef}
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`db-msg ${message.role}`}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          ))}

          {loading && (
            <div className="db-msg assistant db-thinking">
              Thinking…
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="db-ai-error" role="alert">
          {error}
        </p>
      )}

      <form className="db-ai-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          aria-label="Ask Statskill AI"
          disabled={loading}
        />

        <button
          className="db-send"
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </form>

      {messages.length > 0 && (
        <Link to="/ai-tutor" className="db-link db-ai-foot">
          Open full AI Tutor
          <ArrowUpRight size={15} />
        </Link>
      )}
    </section>
  );
}
