import { defineConfig } from "@playwright/test";
import config, { fixtureServers, testEnvironment } from "./playwright.config";

const hubUrl = "http://hub.monolith.test:19788";
process.env.E2E_HUB_URL = hubUrl;

// Development replays effects in React Strict Mode; production alone cannot catch this regression.
export default defineConfig({
  ...config,
  grep: /registration requires|password reset revokes/,
  use: { ...config.use, baseURL: hubUrl, actionTimeout: 10000 },
  outputDir: "test-results/development",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report/development" }],
  ],
  webServer: [
    {
      command:
        "node ../../node_modules/next/dist/bin/next dev --webpack --port 19788",
      cwd: "apps/hub",
      env: { ...testEnvironment, HUB_URL: hubUrl },
      url: "http://127.0.0.1:19788/api/health/live",
      reuseExistingServer: false,
      timeout: 60000,
    },
    ...fixtureServers(hubUrl),
  ],
});
