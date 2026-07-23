import { apiJson } from "@/lib/api/client";

export type NoteType = "fragment" | "failure" | "idea" | "tool_idea" | "tech_debt";
export type NoteStatus = "active" | "resolved" | "abandoned";

export type ObservatoryNoteItem = {
  id: number;
  title: string;
  tags: string[];
  note_type: NoteType;
  status: NoteStatus;
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
  title: string;
  content_md?: string;
  tags?: string[];
  note_type?: NoteType;
  status?: NoteStatus;
};

export type ObservatoryListParams = {
  page?: number;
  page_size?: number;
  status?: NoteStatus;
  note_type?: NoteType;
  search?: string;
};

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
