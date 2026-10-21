import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "../backend/test/e2e",
  outputDir: "../data/editorial-e2e-results",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: process.env.EDITORIAL_TEST_URL || "http://127.0.0.1:3003",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
});
