import { defineConfig } from "@playwright/test";
import config, { fixtureServers } from "./playwright.config";
const hubUrl = "http://hub.monolith.test:18787";
process.env.E2E_HUB_URL = hubUrl;
const runtimeVars = `--var HUB_URL:${hubUrl} --var APP_ENV:test --var SESSION_COOKIE_DOMAIN:.monolith.test --var MAIL_PROVIDER:mailpit --var MAILPIT_URL:http://127.0.0.1:8025`;
export default defineConfig({
  ...config,
  timeout: 90000,
  expect: { timeout: 20000 },
  use: { ...config.use, baseURL: hubUrl },
  outputDir: "test-results/workers",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/workers" }],
  ],
  webServer: [
    {
      command: `npm run preview:worker --workspace=@monolith/hub -- --port 18787 ${runtimeVars}`,
      url: "http://127.0.0.1:18787/api/health/live",
      reuseExistingServer: false,
      timeout: 120000,
    },
    ...fixtureServers(hubUrl),
  ],
});
