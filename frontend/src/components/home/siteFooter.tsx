import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="j-footer"><div className="j-wrap">
      <div><h2>CRESCENT INDEX</h2><p>一个自托管的个人索引：记录进展、整理方法、分享成果。<br />每条内容优先给出事实、状态和结论；失效时补修订说明，而不是悄悄删除。</p><a className="j-btn j-footer-subscribe" href="/rss.xml">通过 RSS 订阅新文章 ↗</a></div>
      <div><h2>栏目</h2><ul><li><Link href="/notes">笔记 · 长文与札记</Link></li><li><Link href="/projects">项目 · 月相索引</Link></li><li><Link href="/about">关于这个站点</Link></li></ul></div>
      <div><h2>其他</h2><ul><li><a href="/rss.xml">RSS</a></li><li><a href="https://github.com/CrescentR" target="_blank" rel="noreferrer">GitHub ↗</a></li><li><Link href="/notes#archive">归档</Link></li></ul></div>
    </div></footer>
  );
}
