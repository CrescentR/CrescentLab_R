import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="article-detail article-reading">
      <div className="article-shell">
        <div aria-hidden="true" className="article-rail" />
        <div className="article-main" style={{ paddingBlock: "4rem", textAlign: "center" }}>
          <h1 style={{
            margin: "0 0 1rem",
            color: "var(--text-strong)",
            fontFamily: "var(--article-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 650,
          }}>
            文章未找到
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", marginBottom: "1.75rem" }}>
            这篇文章可能尚未发布或已被删除。
          </p>
          <Link className="article-footer-back" href="/notes">
            返回全部笔记
          </Link>
        </div>
      </div>
    </div>
  );
}
