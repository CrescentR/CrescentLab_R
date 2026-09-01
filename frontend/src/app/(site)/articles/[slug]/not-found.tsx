import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ArticleNotFound() {
  return (
    <div className="article-detail article-reading">
      <div className="article-not-found">
        <h1>文章未找到</h1>
        <p>这篇文章可能尚未发布或已被删除。</p>
        <Link href="/notes">
          <ArrowLeft aria-hidden="true" size={16} />
          返回全部笔记
        </Link>
      </div>
    </div>
  );
}
