import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ArticleNotFound() {
  return (
    <div className="article-detail">
      <div className="article-detail-shell">
        <Link className="article-back-link" href="/">
          <ArrowLeft size={16} />
          返回首页
        </Link>
        <div style={{ padding: "4rem 0", textAlign: "center" }}>
          <h1 className="article-title" style={{ marginBottom: "1rem" }}>
            文章未找到
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.125rem" }}>
            这篇文章可能尚未发布或已被删除。
          </p>
        </div>
      </div>
    </div>
  );
}
