import { apiFetch } from "./apiClient";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  note: string | null;
  created_at: string;
}

export const bookmarkService = {
  list: () => apiFetch<Bookmark[]>("/bookmarks"),
  create: (title: string, url: string, note?: string) =>
    apiFetch<Bookmark>("/bookmarks", { method: "POST", body: JSON.stringify({ title, url, note: note || null }) }),
  update: (id: string, patch: { title?: string; note?: string | null }) =>
    apiFetch<Bookmark>(`/bookmarks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  remove: (id: string) => apiFetch<void>(`/bookmarks/${id}`, { method: "DELETE" }),
};