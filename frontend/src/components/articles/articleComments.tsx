"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { createComment, listComments, type CommentItem } from "@/lib/api/comments";
import { getAuthUser, isAuthenticated, type AuthUser } from "@/lib/api/client";

export function ArticleComments({ articleId, allowComment }: { articleId: number; allowComment: boolean }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => setUser(isAuthenticated() ? getAuthUser() : null));
    void listComments(articleId).then((result) => setComments(result.items)).catch(() => setMessage("评论加载失败"));
  }, [articleId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setMessage("");
    try {
      await createComment(articleId, content.trim());
      setContent("");
      setMessage("评论已提交，审核通过后将公开显示。");
    } catch (err) {
      setMessage(typeof err === "object" && err && "message" in err ? String(err.message) : "评论提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="article-comments" aria-labelledby="comments-title">
      <div className="article-comments-heading">
        <MessageSquare aria-hidden="true" size={20} />
        <h2 id="comments-title">评论</h2>
        <span>{comments.length}</span>
      </div>

      {allowComment && (user ? (
        <form className="article-comment-form" onSubmit={handleSubmit}>
          <label htmlFor="comment-content">以 {user.nickname || user.username} 的身份发表评论</label>
          <textarea id="comment-content" maxLength={1000} onChange={(event) => setContent(event.target.value)} placeholder="写下你的想法…" required rows={5} value={content} />
          <div><span>{content.length} / 1000</span><button disabled={submitting} type="submit">{submitting && <Loader2 className="animate-spin" size={15} />}提交评论</button></div>
        </form>
      ) : (
        <p className="article-comment-login"><Link href="/login">登录</Link> 或 <Link href="/register">注册</Link> 后参与评论。</p>
      ))}

      {message && <p className="article-comment-message">{message}</p>}
      <div className="article-comment-list">
        {comments.length === 0 ? <p className="article-comment-empty">还没有公开评论。</p> : comments.map((comment) => (
          <article key={comment.id}>
            <header><strong>{comment.nickname}</strong><time dateTime={comment.created_at}>{new Date(comment.created_at).toLocaleDateString("zh-CN")}</time></header>
            <p dangerouslySetInnerHTML={{ __html: comment.content_html }} />
          </article>
        ))}
      </div>
    </section>
  );
}
