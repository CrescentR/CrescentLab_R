"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Feather,
  Grid2X2,
  LayoutList,
  LoaderCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ArticleListItem } from "@/lib/api/articles";
import { listPublicArticles } from "@/lib/api/articles";
import {
  NotesFeaturedCard,
  NotesMosaicCard,
  NotesStreamCard,
} from "@/components/notes/notesCard";
import {
  filterNotes,
  pickFeatured,
  summarizeNotes,
  type NotesFilter,
  type NotesView,
} from "@/components/notes/notesUtils";

const PAGE_SIZE = 12;

const shellStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] as const },
  },
};

type NotesExperienceProps = {
  initialArticles: ArticleListItem[];
  initialPage: number;
  total: number;
  totalPages: number;
};

export function NotesExperience({
  initialArticles,
  initialPage,
  total,
  totalPages,
}: NotesExperienceProps) {
  const reduceMotion = useReducedMotion();
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(initialPage);
  const [pages, setPages] = useState(totalPages);
  const [totalCount, setTotalCount] = useState(total);
  const [filter, setFilter] = useState<NotesFilter>("all");
  const [view, setView] = useState<NotesView>("mosaic");
  const [query, setQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  const summary = useMemo(() => summarizeNotes(articles), [articles]);
  const featured = useMemo(() => {
    if (query.trim() || filter === "pinned") return null;
    return pickFeatured(articles);
  }, [articles, filter, query]);

  const collection = useMemo(() => {
    const filtered = filterNotes(articles, filter, query);
    if (!featured) return filtered;
    return filtered.filter((article) => article.id !== featured.id);
  }, [articles, featured, filter, query]);

  const hasMore = page < pages && !query.trim() && filter === "all";

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      const nextPage = page + 1;
      const result = await listPublicArticles({ page: nextPage, page_size: PAGE_SIZE });
      setArticles((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setPage(result.page);
      setPages(result.total_pages);
      setTotalCount(result.total);
    } catch {
      setLoadError("加载失败，请稍后再试");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <motion.section
      animate="visible"
      className="nl-page"
      initial={reduceMotion ? false : "hidden"}
      variants={shellStagger}
    >
      <div className="nl-atmosphere" aria-hidden="true">
        <span className="nl-orb nl-orb-a" />
        <span className="nl-orb nl-orb-b" />
        <span className="nl-orb nl-orb-c" />
        <span className="nl-grain" />
      </div>

      <div className="nl-shell">
        <NotesHero total={totalCount} summary={summary} />

        <motion.div className="nl-toolbar" variants={fadeUp}>
          <label className="nl-search">
            <Search aria-hidden="true" size={16} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题或摘要…"
              type="search"
              value={query}
            />
          </label>

          <div className="nl-toolbar-group" role="group" aria-label="筛选">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              全部
            </FilterButton>
            <FilterButton active={filter === "pinned"} onClick={() => setFilter("pinned")}>
              <Sparkles aria-hidden="true" size={13} />
              精选
            </FilterButton>
          </div>

          <div className="nl-toolbar-group" role="group" aria-label="视图">
            <ViewButton
              active={view === "mosaic"}
              label="杂志视图"
              onClick={() => setView("mosaic")}
            >
              <Grid2X2 aria-hidden="true" size={15} />
            </ViewButton>
            <ViewButton
              active={view === "stream"}
              label="列表视图"
              onClick={() => setView("stream")}
            >
              <LayoutList aria-hidden="true" size={15} />
            </ViewButton>
          </div>
        </motion.div>

        {articles.length === 0 ? (
          <motion.div className="nl-empty" variants={fadeUp}>
            <Feather aria-hidden="true" size={28} />
            <h2>还没有笔记</h2>
            <p>去后台写下第一篇，这里会变成一座安静的阅读花园。</p>
          </motion.div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {featured && (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  initial={{ opacity: 0, y: 16 }}
                  key={featured.id}
                  layout
                >
                  <NotesFeaturedCard article={featured} />
                </motion.div>
              )}
            </AnimatePresence>

            {collection.length === 0 ? (
              <motion.div className="nl-empty nl-empty-soft" variants={fadeUp}>
                <Search aria-hidden="true" size={22} />
                <h2>没有匹配的笔记</h2>
                <p>试试别的关键词，或切换回「全部」。</p>
              </motion.div>
            ) : view === "mosaic" ? (
              <motion.div className="nl-mosaic" variants={shellStagger}>
                {collection.map((article, index) => (
                  <NotesMosaicCard
                    article={article}
                    key={article.id}
                    size={mosaicSize(index, Boolean(article.cover_url))}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div className="nl-stream" variants={shellStagger}>
                {collection.map((article) => (
                  <NotesStreamCard article={article} key={article.id} />
                ))}
              </motion.div>
            )}

            {(hasMore || loadError) && (
              <motion.div className="nl-more" variants={fadeUp}>
                {loadError && <p className="nl-more-error">{loadError}</p>}
                {hasMore && (
                  <button
                    className="nl-more-btn"
                    disabled={loadingMore}
                    onClick={loadMore}
                    type="button"
                  >
                    {loadingMore ? (
                      <>
                        <LoaderCircle aria-hidden="true" className="nl-spin" size={16} />
                        正在展开
                      </>
                    ) : (
                      <>
                        <BookOpen aria-hidden="true" size={16} />
                        加载更多笔记
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.section>
  );
}

function NotesHero({
  total,
  summary,
}: {
  total: number;
  summary: ReturnType<typeof summarizeNotes>;
}) {
  return (
    <motion.header className="nl-hero" variants={fadeUp}>
      <div className="nl-hero-copy">
        <p className="nl-eyebrow">
          <span className="nl-eyebrow-pulse" aria-hidden="true" />
          Crescent Lab · Notes Archive
        </p>
        <h1>
          <span className="nl-hero-title-line">写下来的</span>
          <span className="nl-hero-title-accent">思考</span>
        </h1>
        <p className="nl-hero-lead">
          开发实践、产品判断，以及那些值得被完整保留的过程。像翻开一本持续增厚的实验室手记。
        </p>
      </div>

      <div className="nl-stats">
        <StatCard label="笔记" value={String(total)} hint="篇已发布" />
        <StatCard
          label="阅读"
          value={summary.views > 0 ? summary.views.toLocaleString("zh-CN") : "—"}
          hint="累计浏览"
        />
        <StatCard label="时长" value={`${summary.minutes}`} hint="分钟可读" />
        <StatCard label="精选" value={String(summary.pinned)} hint="置顶篇章" />
      </div>
    </motion.header>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="nl-stat">
      <span className="nl-stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="nl-stat-hint">{hint}</span>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`nl-pill${active ? " is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ViewButton({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={`nl-icon-btn${active ? " is-active" : ""}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function mosaicSize(index: number, hasCover: boolean): "regular" | "wide" | "tall" {
  if (!hasCover) return "regular";
  if (index % 7 === 0) return "wide";
  if (index % 5 === 2) return "tall";
  return "regular";
}
