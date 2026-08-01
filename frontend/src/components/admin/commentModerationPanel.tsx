"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { listPendingComments, reviewComment, type CommentItem } from "@/lib/api/comments";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

export function CommentModerationPanel() {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void listPendingComments()
      .then((result) => setItems(result.items))
      .catch((err) => setError(typeof err === "object" && err && "message" in err ? String(err.message) : "评论加载失败"))
      .finally(() => setLoading(false));
  }, []);

  async function review(id: number, status: "approved" | "rejected") {
    try {
      await reviewComment(id, status);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(typeof err === "object" && err && "message" in err ? String(err.message) : "审核失败");
    }
  }

  return (
    <section className="space-y-5">
      <header><p className="font-lab-mono text-xs text-[var(--muted)]">内容治理</p><h1 className="mt-2 text-3xl font-semibold text-[var(--text-strong)]">评论审核</h1></header>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? <p className="flex items-center gap-2 text-[var(--muted)]"><Loader2 className="animate-spin" size={16} />正在加载…</p> : items.length === 0 ? <Panel className="p-6"><p className="text-[var(--muted)]">暂无待审核评论。</p></Panel> : (
        <div className="grid gap-3">{items.map((item) => <Panel className="p-5" key={item.id}><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-[var(--text-strong)]">{item.nickname}</strong><span className="ml-3 font-lab-mono text-xs text-[var(--muted)]">文章 #{item.article_id}</span></div><div className="flex gap-2"><Button icon={<Check size={15} />} onClick={() => review(item.id, "approved")} variant="primary">通过</Button><Button icon={<X size={15} />} onClick={() => review(item.id, "rejected")}>拒绝</Button></div></div><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text)]">{item.content_html.replaceAll("<br>", "\n")}</p></Panel>)}</div>
      )}
    </section>
  );
}
