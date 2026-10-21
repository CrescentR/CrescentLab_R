import { apiJson } from "@/lib/api/client";

export type NoteType = "fragment" | "failure" | "idea" | "tool_idea" | "tech_debt";
export type NoteStatus = "active" | "resolved" | "abandoned";
export type NoteVisibility = "public" | "private";

export type ObservatoryNoteItem = {
  project_id: number | null;
  id: number;
  title: string;
  question: string;
  observation: string;
  conclusion: string;
  next_step: string;
  tags: string[];
  note_type: NoteType;
  status: NoteStatus;
  visibility: NoteVisibility;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ObservatoryListResponse = {
  items: ObservatoryNoteItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type ObservatoryNoteDetail = ObservatoryNoteItem & {
  content_md: string;
  content_html: string;
};

export type ObservatoryNoteInput = {
  project_id?: number | null;
  title: string;
  content_md?: string;
  question?: string;
  observation?: string;
  conclusion?: string;
  next_step?: string;
  tags?: string[];
  note_type?: NoteType;
  status?: NoteStatus;
  visibility?: NoteVisibility;
  is_featured?: boolean;
};

export type ObservatoryListParams = {
  page?: number;
  page_size?: number;
  status?: NoteStatus;
  note_type?: NoteType;
  visibility?: NoteVisibility;
  search?: string;
};

export function listPublicObservatoryNotes(params: ObservatoryListParams = {}) {
  return apiJson<ObservatoryListResponse>(`/api/observatory${toQueryString(params)}`, {
    cache: "no-store",
  });
}

export function listObservatoryNotes(params: ObservatoryListParams = {}) {
  return apiJson<ObservatoryListResponse>(`/api/admin/observatory${toQueryString(params)}`);
}

export function getObservatoryNote(id: number) {
  return apiJson<ObservatoryNoteDetail>(`/api/admin/observatory/detail?id=${id}`);
}

export function createObservatoryNote(input: ObservatoryNoteInput) {
  return apiJson<ObservatoryNoteDetail>("/api/admin/observatory", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function updateObservatoryNote(id: number, input: ObservatoryNoteInput) {
  return apiJson<ObservatoryNoteDetail>("/api/admin/observatory/update", {
    body: JSON.stringify({ id, ...input }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function deleteObservatoryNote(id: number) {
  return apiJson<{ success: boolean }>("/api/admin/observatory/delete", {
    body: JSON.stringify({ id }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function toQueryString(params: ObservatoryListParams) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}
