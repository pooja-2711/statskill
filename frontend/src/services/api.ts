
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach the logged-in user's JWT token.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// =========================
// AI TUTOR TYPES
// =========================

export interface TutorHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIConversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AIConversationDetail extends AIConversation {
  messages: AIMessage[];
}

export interface AIChatResponse {
  conversation_id: number;
  reply: string;
  model: string;
  user_message: AIMessage;
  assistant_message: AIMessage;
}

// =========================
// AI TUTOR API FUNCTIONS
// =========================

// Create a new conversation.
export const createAIConversation = async (
  title = "New conversation"
): Promise<AIConversation> => {
  const response = await api.post("/ai-tutor/conversations", {
    title,
  });

  return response.data;
};

// Get all conversations belonging to the logged-in user.
export const getAIConversations = async (): Promise<
  AIConversation[]
> => {
  const response = await api.get("/ai-tutor/conversations");

  return response.data;
};

// Retrieve one conversation with its complete message history.
export const getAIConversation = async (
  conversationId: number
): Promise<AIConversationDetail> => {
  const response = await api.get(
    `/ai-tutor/conversations/${conversationId}`
  );

  return response.data;
};

// Send a message inside an existing conversation.
export const sendAIConversationMessage = async (
  conversationId: number,
  message: string
): Promise<AIChatResponse> => {
  const response = await api.post(
    `/ai-tutor/conversations/${conversationId}/messages`,
    { message }
  );

  return response.data;
};

// Delete a conversation and its associated messages.
export const deleteAIConversation = async (
  conversationId: number
): Promise<{
  message: string;
  conversation_id: number;
}> => {
  const response = await api.delete(
    `/ai-tutor/conversations/${conversationId}`
  );

  return response.data;
};

// Keep the original non-persistent chat function available.
export const chatWithAITutor = async (
  message: string,
  _history: TutorHistoryMessage[] = []
): Promise<AIChatResponse> => {
  const response = await api.post("/ai-tutor/chat", {
    message,
  });

  return response.data;
};

export default api;
