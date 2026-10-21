import { listPublicArticles } from "@/lib/api/articles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const first = await listPublicArticles({ page: 1, page_size: 50 });
  const articles = [...first.items];
  for (let page = 2; page <= first.total_pages; page += 1) {
    articles.push(...(await listPublicArticles({ page, page_size: 50 })).items);
  }
  const items = articles.map((article) => {
    const url = `${origin}/articles/${encodeURIComponent(article.slug)}`;
    return `<item><title>${xml(article.title)}</title><link>${xml(url)}</link><guid isPermaLink="true">${xml(url)}</guid><description>${xml(article.excerpt)}</description><pubDate>${new Date(article.published_at || article.created_at).toUTCString()}</pubDate></item>`;
  }).join("");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Crescent Index</title><link>${xml(origin)}</link><description>长文、札记与项目。记录进展，整理方法，分享成果。</description><language>zh-CN</language><atom:link href="${xml(`${origin}/rss.xml`)}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
