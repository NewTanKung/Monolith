import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

const hubUrl = "http://localhost:18787";
const demoUrl = "http://localhost:18788";
process.env.E2E_HUB_URL = hubUrl;
process.env.E2E_DEMO_URL = demoUrl;
const runtimeVars = `--var HUB_URL:${hubUrl} --var DEMO_URL:${demoUrl} --var HUB_REQUEST_TIMEOUT_MS:30000`;

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
      url: hubUrl + "/login",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: `npm run preview:worker --workspace=@monolith/demo-sub-app -- --port 18788 ${runtimeVars}`,
      url: demoUrl,
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
