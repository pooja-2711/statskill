import { apiFetch } from "./apiClient";

export interface StudyTask {
  id: string;
  title: string;
  due_date: string | null; // YYYY-MM-DD
  done: boolean;
  created_at: string;
}

export const studyPlanService = {
  list: () => apiFetch<StudyTask[]>("/study-plans"),
  create: (title: string, due_date?: string | null) =>
    apiFetch<StudyTask>("/study-plans", { method: "POST", body: JSON.stringify({ title, due_date: due_date || null }) }),
  update: (id: string, patch: Partial<Pick<StudyTask, "title" | "due_date" | "done">>) =>
    apiFetch<StudyTask>(`/study-plans/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<void>(`/study-plans/${id}`, { method: "DELETE" }),
};