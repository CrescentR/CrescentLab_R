import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

test("RSS 使用隔离 API，正确转义并排除私有文章及草稿", async () => {
  assert.ok(process.env.EDITORIAL_TEST_BACKEND_URL, "需要先准备隔离库，并设置 EDITORIAL_TEST_BACKEND_URL");
  process.env.BACKEND_URL = process.env.EDITORIAL_TEST_BACKEND_URL;
  const require = createRequire(import.meta.url);
  const { routeModule } = require("../../../frontend/.next/server/app/rss.xml/route.js");
  const response = await routeModule.userland.GET(new Request("https://editorial.example/rss.xml"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /application\/rss\+xml/);
  const xml = await response.text();
  assert.equal((xml.match(/<item>/g) || []).length, 2);
  assert.ok(xml.includes("验收文章 2 &amp; 过程"));
  assert.ok(xml.includes("https://editorial.example/articles/editorial-preview-note"));
  assert.ok(!xml.includes("editorial-test-article-3"));
  assert.ok(!xml.includes("editorial-test-article-4"));
});
