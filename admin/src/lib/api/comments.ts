import { apiJson } from "./client";

export type CommentItem = {
  id: number;
  article_id: number;
  user_id: number;
  nickname: string;
  content_html: string;
  created_at: string;
};

export function listPendingComments() {
  return apiJson<{ items: CommentItem[] }>("/api/admin/comments");
}

export function reviewComment(id: number, status: "approved" | "rejected") {
  return apiJson<{ success: boolean }>("/api/admin/comments/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
}

