import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import {
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Plus, Send, Sparkles, Trash2 } from "lucide-react";

import {
  createAIConversation,
  getAIConversations,
  getAIConversation,
  sendAIConversationMessage,
  deleteAIConversation,
  type AIConversation,
  type AIMessage,
} from "../services/api";
import "../tools.css";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Explain the Union Budget in simple words",
  "What is the difference between mean and median?",
  "Summarize key government schemes for UPSC",
  "Explain Python functions with examples",
];

const models = ["qwen2.5:3b"];
const subjects = ["General", "Statistics", "Current Affairs", "Government Exams", "Programming"];
const difficulties = ["Beginner", "Intermediate", "Advanced"];
const modes = ["Explain", "Step by step", "Quiz me", "Summarize"];

function toChatMessage(message: AIMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  };
}

// Pulls plain text out of rendered markdown children (for the copy button).
function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    return getNodeText(element.props.children);
  }
  return "";
}

function getErrorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    ?.response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function Picker({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="tl-label">{label}</label>
      <select
        className="tl-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

function AITutor() {
  // An empty list means a fresh chat; the welcome screen is shown instead.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deletingConversationId, setDeletingConversationId] = useState<number | null>(null);

  const [model, setModel] = useState(models[0]);
  const [subject, setSubject] = useState(subjects[0]);
  const [difficulty, setDifficulty] = useState(difficulties[0]);
  const [mode, setMode] = useState(modes[0]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const loadConversations = useCallback(async () => {
    try {
      setConversations(await getAIConversations());
    } catch {
      setError("Unable to load saved conversations. Please refresh the page.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setInput("");
    setError("");
  };

  const openConversation = async (conversationId: number) => {
    if (loading || conversationId === activeConversationId) return;

    try {
      setError("");
      const conversation = await getAIConversation(conversationId);
      setActiveConversationId(conversationId);
      setMessages((conversation.messages ?? []).map(toChatMessage));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to open this conversation."));
    }
  };

  const removeConversation = async (conversationId: number) => {
    if (!window.confirm("Delete this conversation?")) return;

    try {
      setDeletingConversationId(conversationId);
      await deleteAIConversation(conversationId);
      setConversations((current) => current.filter((c) => c.id !== conversationId));
      if (conversationId === activeConversationId) startNewChat();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete this conversation."));
    } finally {
      setDeletingConversationId(null);
    }
  };

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    setError("");
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content }]);

    try {
      let conversationId = activeConversationId;

      if (conversationId === null) {
        const created = await createAIConversation(content.slice(0, 50));
        conversationId = created.id;
        setActiveConversationId(created.id);
        setConversations((current) => [created, ...current]);
      }

      const result = await sendAIConversationMessage(conversationId, content, {
        model,
        subject,
        difficulty,
        mode,
      });

      setMessages((current) => [
        ...current,
        {
          id: result.assistant_message?.id,
          role: "assistant",
          content:
            result.reply ||
            result.assistant_message?.content ||
            "Sorry, I didn't get a response. Please try again.",
        },
      ]);
    } catch (err) {
      setError(getErrorMessage(err, "The AI tutor could not respond. Please try again."));
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  // Enter sends, Shift+Enter adds a new line.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setError("Unable to copy to clipboard.");
    }
  };

  return (
    <div className="tl-page tl-tutor">
      {/* ---------- saved conversations ---------- */}
      <aside className="tl-card tl-history">
        <button type="button" className="tl-btn" onClick={startNewChat} disabled={loading}>
          <Plus size={16} /> New chat
        </button>

        <h3>History</h3>

        {historyLoading ? (
          <p className="tl-note">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="tl-note">No conversations yet.</p>
        ) : (
          <ul className="tl-convos">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className={
                  conversation.id === activeConversationId ? "tl-convo active" : "tl-convo"
                }
              >
                <button
                  type="button"
                  className="tl-convo-title"
                  onClick={() => void openConversation(conversation.id)}
                >
                  {conversation.title || "New conversation"}
                </button>
                <button
                  type="button"
                  className="tl-convo-del"
                  aria-label="Delete conversation"
                  onClick={() => void removeConversation(conversation.id)}
                  disabled={deletingConversationId === conversation.id}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ---------- chat ---------- */}
      <section className="tl-card tl-chat">
        <header className="tl-chat-head">
          <div>
            <h1 className="tl-h1">
              <Sparkles size={24} className="tl-gold" /> AI Tutor
            </h1>
            <p className="tl-sub">Ask questions and learn step by step.</p>
          </div>

          <div className="tl-selects">
            <Picker label="Subject" value={subject} options={subjects} onChange={setSubject} disabled={loading} />
            <Picker label="Difficulty" value={difficulty} options={difficulties} onChange={setDifficulty} disabled={loading} />
            <Picker label="Mode" value={mode} options={modes} onChange={setMode} disabled={loading} />
            <Picker label="Model" value={model} options={models} onChange={setModel} disabled={loading} />
          </div>
        </header>

        <div className="tl-messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="tl-welcome">
              <Sparkles size={34} />
              <h2>Hello! I&apos;m your Statskill AI Tutor</h2>
              <p className="tl-sub">
                Ask me about statistics, current affairs, government exams or programming.
                I&apos;ll explain it step by step.
              </p>
              <div className="tl-chips">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="tl-chip"
                    onClick={() => void sendMessage(suggestion)}
                    disabled={loading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.id ?? "new"}-${index}`} className={`tl-msg ${message.role}`}>
              {message.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre({ children }) {
                      const code = getNodeText(children);
                      return (
                        <div className="tl-code">
                          <button type="button" className="tl-copy" onClick={() => void copyCode(code)}>
                            {copiedCode === code ? (
                              <><Check size={13} /> Copied</>
                            ) : (
                              <><Copy size={13} /> Copy</>
                            )}
                          </button>
                          <pre>{children}</pre>
                        </div>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          ))}

          {loading && <div className="tl-msg assistant tl-thinking">Thinking...</div>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="tl-error" role="alert">{error}</p>}

        <form className="tl-composer" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={loading}
          />
          <button className="tl-send" type="submit" disabled={loading || !input.trim()} aria-label="Send">
            <Send size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

export default AITutor;