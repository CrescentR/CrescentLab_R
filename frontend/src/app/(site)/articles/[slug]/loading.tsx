export default function ArticleLoading() {
  return (
    <div className="article-detail article-reading">
      <div className="article-shell">
        <div aria-hidden="true" className="article-rail" />
        <div className="article-main">
          <div className="animate-pulse">
            <div className="mb-8 h-3 w-48 rounded bg-[var(--surface-field)]" />
            <div className="mb-4 h-12 w-4/5 rounded bg-[var(--surface-field)]" />
            <div className="mb-2 h-5 w-1/2 rounded bg-[var(--surface-field)]" />
            <div className="mt-10 aspect-video rounded-[24px] bg-[var(--surface-field)]" />
            <div className="mt-10 space-y-3">
              <div className="h-4 w-full rounded bg-[var(--surface-field)]" />
              <div className="h-4 w-full rounded bg-[var(--surface-field)]" />
              <div className="h-4 w-4/5 rounded bg-[var(--surface-field)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
