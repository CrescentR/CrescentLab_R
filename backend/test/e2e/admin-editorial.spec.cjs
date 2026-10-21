const { test, expect } = require("../../../frontend/node_modules/@playwright/test");
const fs = require("node:fs");

test.use({ baseURL: process.env.EDITORIAL_ADMIN_TEST_URL || "http://127.0.0.1:3004", trace: "off" });
test.skip(!process.env.EDITORIAL_TEST_LOGIN_FILE, "需要隔离库管理员的本地凭据文件");

let headers;
test.beforeEach(async ({ page, request }) => {
  const credentials = JSON.parse(fs.readFileSync(process.env.EDITORIAL_TEST_LOGIN_FILE, "utf8"));
  const response = await request.post("/api/auth/login", { data: credentials });
  expect(response.status()).toBe(200);
  const auth = await response.json();
  expect(auth.user.is_admin).toBe(true);
  headers = { Authorization: `Bearer ${auth.access_token}` };
  await page.addInitScript((value) => {
    localStorage.setItem("crescentlab-access-token", value.access_token);
    localStorage.setItem("crescentlab-refresh-token", value.refresh_token);
    localStorage.setItem("crescentlab-user", JSON.stringify(value.user));
  }, auth);
});

test("后台项目阶段、边界、进度与退出原因保存", async ({ page, request }) => {
  let id;
  try {
    await page.goto("/admin/projects");
    await page.getByRole("button", { name: "新建项目", exact: true }).click();
    await page.getByLabel("项目名称", { exact: true }).fill("后台验收项目");
    await page.getByLabel("项目月相").selectOption("waning");
    await page.getByLabel("目标", { exact: true }).fill("验证持久化");
    await page.getByLabel("边界 · 不做", { exact: true }).fill("不扩大范围");
    await page.getByLabel("现在", { exact: true }).fill("验收结束");
    await page.getByLabel(/路线进度/).fill("73");
    await page.getByLabel("退出类型").selectOption("abandoned");
    await page.getByLabel("归档／放弃原因").fill("隔离环境验证完成");
    const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/admin/projects" && response.request().method() === "POST");
    await page.getByRole("button", { name: "保存项目", exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const project = await response.json();
    id = project.id;
    const detail = await (await request.get(`/api/admin/projects/detail?id=${id}`, { headers })).json();
    expect(detail).toMatchObject({ phase: "waning", goal: "验证持久化", boundary: "不扩大范围", current_work: "验收结束", progress_percent: 73, closure_kind: "abandoned", closure_reason: "隔离环境验证完成" });
  } finally {
    if (id) await request.post("/api/admin/projects/delete", { headers, data: { id } });
  }
});

test("后台文章关联、标题强调与修订保存", async ({ page, request }) => {
  let id;
  try {
    await page.goto("/admin/postManagement");
    await page.getByRole("button", { name: "新建文章", exact: true }).click();
    await page.getByLabel("标题", { exact: true }).fill("后台验收：公开修订");
    await page.getByRole("combobox", { name: "关联项目", exact: true }).selectOption("2");
    await page.getByLabel("标题划重点", { exact: true }).fill("公开修订");
    await page.getByRole("button", { name: "添加修订记录" }).click();
    await page.getByLabel("修订日期 1", { exact: true }).fill("2026-10-21");
    await page.getByLabel("修订说明 1", { exact: true }).fill("补充验收结论");
    const saved = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/admin/articles" && response.request().method() === "POST");
    await page.getByRole("button", { name: "保存草稿", exact: true }).click();
    const response = await saved;
    expect(response.status()).toBe(201);
    const article = await response.json();
    id = article.id;
    const detail = await (await request.get(`/api/admin/articles/detail?id=${id}`, { headers })).json();
    expect(detail).toMatchObject({ project_id: 2, title_emphasis: "公开修订", revisions: [{ date: "2026-10-21", summary: "补充验收结论" }] });
  } finally {
    if (id) await request.post("/api/admin/articles/delete", { headers, data: { id } });
  }
});

test("后台札记与构建提供真实项目关联选项", async ({ page }) => {
  for (const [route, button] of [["/admin/observatory", "记录一条"], ["/admin/builds", "新增构建项"]]) {
    await page.goto(route);
    await page.getByRole("button", { name: button, exact: true }).click();
    const field = page.getByRole("combobox", { name: "关联项目", exact: true });
    await expect(field.locator('option[value="2"]')).toHaveText("验收项目 2");
    await field.selectOption("2");
    await expect(field).toHaveValue("2");
  }
});
