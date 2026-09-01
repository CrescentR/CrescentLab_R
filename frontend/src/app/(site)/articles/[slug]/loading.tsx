export default function ArticleLoading() {
  return (
    <div className="article-detail article-reading article-zine article-loading">
      <div className="article-zine-wide animate-pulse">
        <div className="mb-16 h-px bg-white/20" />
        <div className="mb-6 h-3 w-40 bg-white/15" />
        <div className="article-loading-title mb-8" />
        <div className="mb-3 h-5 w-3/5 bg-white/10" />
        <div className="mb-16 h-5 w-2/5 bg-white/10" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-64 bg-white/10" />
          <div className="h-64 bg-white/10" />
        </div>
      </div>
    </div>
  );
}
