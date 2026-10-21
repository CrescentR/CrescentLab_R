const { test, expect } = require("../../../frontend/node_modules/@playwright/test");

test("笔记混排、类型筛选、搜索、合集与加载更多", async ({ page }) => {
  await page.goto("/notes", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".j-feed > li")).toHaveCount(20);
  await page.getByRole("button", { name: "加载更早的记录" }).click();
  await expect(page.locator(".j-feed > li")).toHaveCount(26);
  await expect(page.locator(".j-month h2")).toHaveCount(2);
  await page.getByRole("group", { name: "内容类型" }).getByRole("button", { name: /^长文/ }).click();
  await expect(page.locator(".j-long-entry")).toHaveCount(2);
  await expect(page.locator(".j-short-entry")).toHaveCount(0);
  await page.getByRole("group", { name: "内容类型" }).getByRole("button", { name: /^札记/ }).click();
  await page.getByRole("searchbox", { name: "搜索笔记" }).fill("验收构建");
  await expect(page.locator(".j-short-entry")).toHaveCount(1);
  await page.goto("/notes?collection=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".j-feed > li")).toHaveCount(2);
});

test("日夜主题刷新保留，旧动态路由跳转", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "切换日夜模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/updates", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/notes$/);
  expect(errors).toEqual([]);
});

test("文章目录、字号、进度、修订与合集导航", async ({ page }) => {
  await page.goto("/articles/editorial-preview-note", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".j-revisions")).toContainText("补充验收修订说明");
  await expect(page.locator(".j-article-header h1 .j-mark")).toHaveText("完整的表达");
  await expect(page.locator(".j-toc ol a")).toHaveCount(2);
  const prose = page.locator(".j-prose");
  const before = await prose.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  await page.locator(".j-toc").getByRole("button", { name: "增大正文字号" }).click();
  expect(await prose.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(before);
  await page.locator(".j-toc ol a").last().click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
  await expect(page.locator(".j-reading-progress")).toBeVisible();
  await expect(page.locator(".article-codeblock-copy")).toHaveCount(1);
  await expect(page.locator(".j-neighbors a")).toHaveCount(1);
  await expect(page.locator(".j-collection-trail")).toContainText("验收合集");
});

test("项目阶段与 Waning 原因，RSS 不泄露草稿和私有文章", async ({ page, request }) => {
  await page.goto("/projects", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".j-project-sheet")).toHaveCount(3);
  await expect(page.locator(".j-waning li")).toHaveCount(2);
  await expect(page.locator(".j-waning")).toContainText("投入成本超过收益，停止开发");
  await page.goto("/projects/editorial-test-5", { waitUntil: "domcontentloaded" });
  await expect(page.locator("main")).toContainText("投入成本超过收益，停止开发");
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();
  expect(xml.match(/<item>/g)).toHaveLength(2);
  expect(xml).toContain("&amp;");
  expect(xml).not.toContain("editorial-test-article-3");
  expect(xml).not.toContain("editorial-test-article-4");
});

test("桌面封面预览与减少动画", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".j-index a").first().hover();
  await expect(page.locator(".j-peek")).toHaveClass(/is-visible/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".j-peek")).toBeHidden();
  expect(await page.locator(".j-rise").first().evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
});

for (const width of [320, 390]) {
  test(`${width}px 移动端全站无横向溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const route of ["/", "/notes", "/projects", "/articles/editorial-preview-note", "/projects/editorial-test-2", "/about"]) {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response.status(), route).toBe(200);
      await expect(page.locator(".j-mobile-nav")).toBeVisible();
      const size = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      expect(size.content, route).toBeLessThanOrEqual(width);
      expect(size.viewport, route).toBe(width);
    }
  });
}
