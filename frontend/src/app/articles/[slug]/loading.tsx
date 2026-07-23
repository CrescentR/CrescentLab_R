export default function ArticleLoading() {
  return (
    <div className="article-detail">
      <div className="article-detail-shell">
        <div className="animate-pulse">
          <div className="mb-8 h-4 w-24 rounded bg-[var(--surface-field)]" />
          <div className="mb-4 h-12 w-3/4 rounded bg-[var(--surface-field)]" />
          <div className="mb-2 h-6 w-1/2 rounded bg-[var(--surface-field)]" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded bg-[var(--surface-field)]" />
            <div className="h-4 w-full rounded bg-[var(--surface-field)]" />
            <div className="h-4 w-4/5 rounded bg-[var(--surface-field)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
