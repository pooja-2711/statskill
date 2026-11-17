
import { apiFetch } from "./apiClient";

export interface ContentItem {
  id: string;
  source_name: string;
  source_key: string | null;
  title: string;
  category: string;
  published_at: string | null;
  summary: string | null;
  url: string;
  label: string;
  section: string;
  fetched_at: string;
}

export interface ContentListResponse {
  items: ContentItem[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
}

export interface ContentSource {
  key: string;
  name: string;
  kind: string;
  homepage_url: string | null;
  item_count: number;
  last_fetched_at: string | null;
  last_status: string | null;
}

export interface ContentSourcesResponse {
  sources: ContentSource[];
  categories: string[];
}

export interface ContentFilters {
  page?: number;
  page_size?: number;
  category?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
}

function buildQuery(filters: ContentFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export function getNewspapers(
  filters: ContentFilters = {},
): Promise<ContentListResponse> {
  return apiFetch(`/newspapers?${buildQuery(filters)}`);
}

export function getCurrentAffairs(
  filters: ContentFilters = {},
): Promise<ContentListResponse> {
  return apiFetch(`/current-affairs?${buildQuery(filters)}`);
}

export function getContentSources(): Promise<ContentSourcesResponse> {
  return apiFetch("/content/sources?include_empty=false");
}
