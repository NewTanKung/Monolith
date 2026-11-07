import { defineConfig, devices } from "@playwright/test";
import { loadEnvFile } from "node:process";
import { randomBytes } from "node:crypto";
loadEnvFile(".env");
process.env.FIXTURE_CONTROL_KEY ||= randomBytes(24).toString("hex");
const hubUrl = process.env.E2E_HUB_URL || "http://hub.monolith.test:3000";
const port = new URL(hubUrl).port || "3000";
process.env.E2E_HUB_URL = hubUrl;
export function fixtureServers(url: string) {
  return [
    {
      command: "node tests/fixtures/proxy.mjs",
      url: "http://127.0.0.1:19002/livez",
      reuseExistingServer: false,
    },
    {
      command: "node --import tsx tests/fixtures/service.ts",
      env: {
        E2E_HUB_URL: url,
        FIXTURE_CONTROL_KEY: process.env.FIXTURE_CONTROL_KEY!,
      },
      url: "http://127.0.0.1:19001/livez",
      reuseExistingServer: false,
    },
  ];
}
export const testEnvironment = {
  APP_ENV: "test",
  SESSION_COOKIE_DOMAIN: ".monolith.test",
  MAIL_PROVIDER: "mailpit",
  MAILPIT_URL: "http://127.0.0.1:8025",
};
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: hubUrl,
    proxy: { server: "http://127.0.0.1:19002" },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: [
    {
      command: `node node_modules/next/dist/bin/next start apps/hub --port ${port}`,
      env: { ...testEnvironment, HUB_URL: hubUrl },
      url: `http://127.0.0.1:${port}/api/health/live`,
      reuseExistingServer: false,
      timeout: 60000,
    },
    ...fixtureServers(hubUrl),
  ],
});
