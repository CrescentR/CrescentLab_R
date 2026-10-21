import Link from "next/link";
export default function ArticleNotFound() { return <section className="j-wrap j-error"><div className="j-state"><h1>文章未找到</h1><p>这篇文章可能尚未发布或已被删除。</p><Link className="j-btn j-btn-ghost" href="/notes">返回笔记 →</Link></div></section>; }
