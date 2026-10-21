import Link from "next/link";
export function AboutSection() {
  return <section className="j-about j-wrap j-rise"><header><p className="j-mono">Independent digital practice</p><h1>关于<em>About</em></h1><p>Crescent Index 是一份持续更新的个人刊物，记录项目、技术实践与想法逐渐成形的过程。</p></header><div className="j-about-body"><section><h2>记录进展，整理方法，分享成果。</h2><p>长文保留完整的推理与结论；札记留下途中的进展、修订与放弃。两者按时间排在一起，允许一个问题慢慢长成一篇文章。</p><Link className="j-text-link" href="/notes">翻开长文与札记 →</Link></section><section><h2>月有盈亏，项目也是。</h2><p>新月是研究，上弦是构建，满月是上线，下弦是收尾。归档或放弃的项目保留在 Waning 区，说明原因，留下可回看的判断。</p><Link className="j-text-link" href="/projects">查看项目月相 →</Link></section><section><h2>修订，而不是悄悄删除。</h2><p>每条内容优先给出事实、状态和结论。允许公开失败、放弃和限制；发现原来的判断不再成立时，补充修订说明。</p></section></div></section>;
}
