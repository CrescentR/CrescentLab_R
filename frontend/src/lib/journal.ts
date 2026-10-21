import { listPublicArticles, listPublicCollections, type ArticleListItem } from "@/lib/api/articles";
import { listPublicObservatoryNotes, type ObservatoryNoteItem } from "@/lib/api/observatory";
import { listPublicBuilds, type BuildItem } from "@/lib/api/builds";
import { listPublicProjects, type ProjectPhase } from "@/lib/api/projects";

export type JournalEntry = { key: string; date: string } & (
  | { kind: "article"; item: ArticleListItem }
  | { kind: "note"; item: ObservatoryNoteItem }
  | { kind: "build"; item: BuildItem }
);
export type JournalData = Awaited<ReturnType<typeof loadJournal>>;

export async function loadJournal() {
  const [articles, notes, builds, projects, collections] = await Promise.all([
    readPages((page) => listPublicArticles({ page, page_size: 50 })),
    readPages((page) => listPublicObservatoryNotes({ page, page_size: 50 })),
    readPages((page) => listPublicBuilds({ page, page_size: 50 })),
    readPages((page) => listPublicProjects({ page, page_size: 50 })),
    listPublicCollections(),
  ]);
  const entries: JournalEntry[] = [
    ...articles.map((item): JournalEntry => ({ key: `article-${item.id}`, kind: "article", date: item.published_at || item.created_at, item })),
    ...notes.map((item): JournalEntry => ({ key: `note-${item.id}`, kind: "note", date: item.created_at, item })),
    ...builds.map((item): JournalEntry => ({ key: `build-${item.id}`, kind: "build", date: item.progressed_at || item.created_at, item })),
  ];
  entries.sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || a.key.localeCompare(b.key));
  return { articles: entries.filter((entry) => entry.kind === "article").map((entry) => entry.item), entries, projects, collections: collections.items };
}

async function readPages<T>(read: (page: number) => Promise<{ items: T[]; total_pages: number }>): Promise<T[]> {
  const first = await read(1);
  const items = [...first.items];
  for (let page = 2; page <= first.total_pages; page += 1) items.push(...(await read(page)).items);
  return items;
}

export const projectPhases: Record<Exclude<ProjectPhase, "">, { phase: number; name: string; label: string; description: string }> = {
  research: { phase: 0, name: "新月", label: "研究中", description: "验证问题是否值得做" },
  building: { phase: .25, name: "上弦", label: "构建中", description: "边界确定，持续开发" },
  live: { phase: .5, name: "满月", label: "已上线", description: "稳定可用，按反馈迭代" },
  waning: { phase: .75, name: "下弦", label: "收尾", description: "维护、归档或放弃" },
};

export function journalDate(value: string, mode: "short" | "full" | "month" = "short") {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  const day = parts.find((part) => part.type === "day")!.value;
  return mode === "full" ? `${year}.${month}.${day}` : mode === "month" ? `${year}-${month}` : `${month}.${day}`;
}

export function entryText(entry: JournalEntry) {
  if (entry.kind === "article") return `${entry.item.title} ${entry.item.excerpt}`;
  if (entry.kind === "note") return [entry.item.title, entry.item.question, entry.item.observation, entry.item.conclusion, entry.item.next_step].filter(Boolean).join("\n");
  return [entry.item.name, entry.item.one_liner, entry.item.latest_progress, entry.item.next_step].filter(Boolean).join("\n");
}

export function entryLabel(entry: JournalEntry) {
  if (entry.kind === "article") return "长文";
  if (entry.kind === "note") return entry.item.status === "abandoned" ? "放弃" : entry.item.tags[0] || "札记";
  return { prototype: "原型", development: "开发", validating: "验证", beta: "内测", paused: "暂停" }[entry.item.stage];
}
