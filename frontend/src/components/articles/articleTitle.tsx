export function ArticleTitle({ title, emphasis }: { title: string; emphasis: string }) {
  const index = emphasis ? title.indexOf(emphasis) : -1;
  if (index < 0) return <>{title}</>;
  return <>{title.slice(0, index)}<span className="j-mark">{emphasis}</span>{title.slice(index + emphasis.length)}</>;
}
