import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
export function fillEnvironment(file, defaults) {
  const original = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const existing = parseEnv(original);
  const missing = Object.entries(defaults).filter(
    ([key]) => !(key in existing),
  );
  if (missing.length) {
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.appendFileSync(
      file,
      (original && !original.endsWith("\n") ? "\n" : "") +
        missing
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join("\n") +
        "\n",
    );
  }
  return { ...defaults, ...existing };
}
const database = fillEnvironment(".env", {
  DATABASE_URL:
    "postgresql://monolith:monolith_local_dev@localhost:55432/monolith",
});
fillEnvironment("apps/hub/.env.local", {
  DATABASE_URL: database.DATABASE_URL,
  APP_ENV: "development",
  HUB_URL: "http://localhost:3000",
  SESSION_COOKIE_DOMAIN: "",
  ALLOW_REGISTRATION: "true",
  MAIL_PROVIDER: "mailpit",
  MAILPIT_URL: "http://127.0.0.1:8025",
  MAIL_FROM: "Monolith <noreply@monolith.test>",
});
console.log(
  "เติมค่า local ที่ขาดแล้ว เก็บค่าเดิมทั้งหมดไว้ เริ่มฐานข้อมูลและอีเมลด้วย docker compose up -d --wait",
);
