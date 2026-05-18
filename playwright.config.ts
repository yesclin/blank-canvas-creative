import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e/specs",
  fullyParallel: false, // multi-tenant seed is shared — keep serial for safety
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  globalSetup: "./e2e/global-setup.ts",
});
