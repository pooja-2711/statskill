
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
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

export const createAIConversation = async (
  title = "New conversation"
): Promise<AIConversation> => {
  const response = await api.post("/ai-tutor/conversations", {
    title,
  });

  return response.data;
};

export const getAIConversations = async (): Promise<AIConversation[]> => {
  const response = await api.get("/ai-tutor/conversations");
  return response.data;
};

export const getAIConversation = async (
  conversationId: number
): Promise<AIConversationDetail> => {
  const response = await api.get(
    `/ai-tutor/conversations/${conversationId}`
  );

  return response.data;
};
export type TutorOptions = {
  model?: string;
  subject?: string;
  difficulty?: string;
  mode?: string;
};
export const sendAIConversationMessage = async (
  conversationId: number,
  message: string,
  options: TutorOptions = {}
): Promise<AIChatResponse> => {
  const response = await api.post(
    `/ai-tutor/conversations/${conversationId}/messages`,
    {
      message,
      ...options,
    }
  );

  return response.data;
};

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

export const chatWithAITutor = async (
  message: string,
  _history: TutorHistoryMessage[] = []
): Promise<AIChatResponse> => {
  const response = await api.post("/ai-tutor/chat", {
    message,
  });

  return response.data;
};

// =========================
// STATISTICS ASSISTANT TYPES
// =========================

export interface StatisticsPassage {
  content: string;
  distance: number | null;
}

export interface StatisticsSearchResponse {
  question: string;
  results: StatisticsPassage[];
  count: number;
}

// =========================
// STATISTICS ASSISTANT API
// =========================

export const searchStatistics = async (
  question: string,
  limit = 5
): Promise<StatisticsSearchResponse> => {
  const response = await api.post(
    "/statistics-assistant/search",
    { question, limit }
  );

  return response.data;
};

// =========================
// PDF LEARNING ASSISTANT TYPES
// =========================

export interface PDFUploadResponse {
  message: string;
  document: {
    id: number;
    filename: string;
    page_count: number;
    chunk_count: number;
    status: string;
  };
}

export interface PDFDocumentInfo {
  id: number;
  filename: string;
  page_count: number;
  status: string;
  created_at: string | null;
}

export interface PDFAskResponse {
  document_id: number;
  filename: string;
  question: string;
  answer: string;
  source_pages: number[];
  model: string;
}

export interface PDFQuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  page: number | null;
  type: "academic" | "job_assessment";
}

export interface PDFQuizResponse {
  document_id: number;
  filename: string;
  question_count: number;
  difficulty: string;
  model: string;
  questions: PDFQuizQuestion[];
}

// =========================
// PDF LEARNING ASSISTANT API
// =========================

export const uploadPDF = async (
  file: File
): Promise<PDFUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/pdf-learning/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getPDFDocuments = async (): Promise<PDFDocumentInfo[]> => {
  const response = await api.get("/pdf-learning/documents");
  return response.data;
};

export const askPDFQuestion = async (
  documentId: number,
  question: string
): Promise<PDFAskResponse> => {
  const response = await api.post("/pdf-learning/ask", {
    document_id: documentId,
    question,
  });

  return response.data;
};

export const generatePDFQuiz = async (
  documentId: number
): Promise<PDFQuizResponse> => {
  const response = await api.post("/pdf-learning/quiz", {
    document_id: documentId,
  });

  return response.data;
};

// Export the configured Axios instance.
export default api;
