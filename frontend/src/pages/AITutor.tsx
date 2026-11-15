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

import {
  createAIConversation,
  getAIConversations,
  getAIConversation,
  sendAIConversationMessage,
  deleteAIConversation,
  type AIConversation,
  type AIMessage,
} from "../services/api";

interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Explain Python functions with examples",
  "What is object-oriented programming?",
  "Explain SQL joins simply",
  "Help me understand data structures",
];

const models = ["qwen2.5:3b"];

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content:
    "Hello! I'm your Statskill AI Tutor. 👋\n\nI'm here to help you understand programming, computer science, and technical concepts. Ask me anything, and I'll explain it step by step!",
};

/* ---------- helpers ---------- */

// Turns an API message into the shape the UI uses.
function toChatMessage(message: AIMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
  };
}

// Pulls the plain text out of rendered markdown children (for the copy button).
function getNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getNodeText).join("");
  }
  if (isValidElement(node)) {
    const element = node as ReactElement<{ children?: ReactNode }>;
    return getNodeText(element.props.children);
  }
  return "";
}

// ASSUMPTION: the backend reply can come back in a few different shapes.
// Adjust this if your sendAIConversationMessage returns something else.
function extractReply(result: unknown): string {
  const r = result as {
    assistant_message?: { content?: string };
    message?: { content?: string };
    reply?: string;
    response?: string;
    content?: string;
  } | null;

  return (
    r?.assistant_message?.content ??
    r?.message?.content ??
    r?.reply ??
    r?.response ??
    r?.content ??
    ""
  );
}

function getErrorMessage(err: unknown, fallback: string): string {
  const detail = (
    err as { response?: { data?: { detail?: unknown } } }
  )?.response?.data?.detail;

  return typeof detail === "string" ? detail : fallback;
}

/* ---------- component ---------- */

function AITutor() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    welcomeMessage,
  ]);

  const [conversations, setConversations] = useState<
    AIConversation[]
  >([]);

  const [activeConversationId, setActiveConversationId] =
    useState<number | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [model, setModel] = useState("qwen2.5:3b");
  const [copiedCode, setCopiedCode] = useState<string | null>(
    null
  );
  const [deletingConversationId, setDeletingConversationId] =
    useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Grow the textarea as the user types.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getAIConversations();
      setConversations(data);
    } catch {
      setError(
        "Unable to load saved conversations. Please refresh the page."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Load saved conversations when the page opens.
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([welcomeMessage]);
    setInput("");
    setError("");
  };

  const openConversation = async (conversationId: number) => {
    if (loading || conversationId === activeConversationId) return;

    try {
      setError("");

      // ASSUMPTION: getAIConversation returns the conversation with a
      // `messages` array inside it.
      const conversation = (await getAIConversation(
        conversationId
      )) as { messages?: AIMessage[] };

      const loaded = (conversation.messages ?? []).map(toChatMessage);

      setActiveConversationId(conversationId);
      setMessages(loaded.length > 0 ? loaded : [welcomeMessage]);
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to open this conversation.")
      );
    }
  };

  const removeConversation = async (conversationId: number) => {
    if (!window.confirm("Delete this conversation?")) return;

    try {
      setDeletingConversationId(conversationId);
      await deleteAIConversation(conversationId);

      setConversations((current) =>
        current.filter((c) => c.id !== conversationId)
      );

      if (conversationId === activeConversationId) {
        startNewChat();
      }
    } catch (err) {
      setError(
        getErrorMessage(err, "Unable to delete this conversation.")
      );
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

    // Show the user's message right away. If this is the first message,
    // drop the welcome text so it isn't saved as part of the chat.
    setMessages((current) => [
      ...current.filter((m) => m !== welcomeMessage),
      { role: "user", content },
    ]);

    try {
      let conversationId = activeConversationId;

      // First message of a new chat: create the conversation.
      // ASSUMPTION: createAIConversation(title) returns the new conversation.
      if (conversationId === null) {
        const created = await createAIConversation(
          content.slice(0, 50)
        );
        conversationId = created.id;
        setActiveConversationId(created.id);
        setConversations((current) => [created, ...current]);
      }

      // ASSUMPTION: sendAIConversationMessage(conversationId, content, model).
      // If your function takes an object instead, change this one call.
      const result = await sendAIConversationMessage(
        conversationId,
        content,
      );

      const reply = extractReply(result);

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            reply || "Sorry, I didn't get a response. Please try again.",
        },
      ]);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "The AI tutor could not respond. Please try again."
        )
      );
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendMessage(input);
  };

  // Enter sends, Shift+Enter adds a new line.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
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
    <div className="ai-tutor-page">
      {/* ---------- sidebar: saved conversations ---------- */}
      <aside className="ai-tutor-sidebar">
        <button
          type="button"
          className="new-chat-button"
          onClick={startNewChat}
          disabled={loading}
        >
          + New chat
        </button>

        <h3>History</h3>

        {historyLoading ? (
          <p className="history-empty">Loading...</p>
        ) : conversations.length === 0 ? (
          <p className="history-empty">No conversations yet.</p>
        ) : (
          <ul className="conversation-list">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className={
                  conversation.id === activeConversationId
                    ? "conversation-item active"
                    : "conversation-item"
                }
              >
                <button
                  type="button"
                  className="conversation-title"
                  onClick={() => openConversation(conversation.id)}
                >
                  {conversation.title || "New conversation"}
                </button>

                <button
                  type="button"
                  className="conversation-delete"
                  aria-label="Delete conversation"
                  onClick={() => removeConversation(conversation.id)}
                  disabled={deletingConversationId === conversation.id}
                >
                  {deletingConversationId === conversation.id
                    ? "..."
                    : "✕"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ---------- main chat area ---------- */}
      <section className="ai-tutor-chat">
        <header className="ai-tutor-header">
          <div>
            <h1>AI Tutor</h1>
            <p>Ask questions and learn step by step.</p>
          </div>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loading}
            aria-label="Model"
          >
            {models.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </header>

        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={message.id ?? index}
              className={`chat-message ${message.role}`}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre({ children }) {
                      const code = getNodeText(children);

                      return (
                        <div className="code-block">
                          <button
                            type="button"
                            className="copy-button"
                            onClick={() => copyCode(code)}
                          >
                            {copiedCode === code ? "Copied!" : "Copy"}
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
                <p>{message.content}</p>
              )}
            </div>
          ))}

          {/* Suggestions show only on a fresh chat. */}
          {messages.length === 1 && messages[0] === welcomeMessage && (
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => sendMessage(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="chat-message assistant typing">
              Thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && <p className="chat-error">{error}</p>}

        <form className="chat-input" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={loading}
          />

          <button type="submit" disabled={loading || !input.trim()}>
            {loading ? "..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default AITutor;
