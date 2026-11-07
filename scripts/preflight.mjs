import fs from "node:fs";
import { parseEnv } from "node:util";
import pg from "pg";
try {
  if (!fs.existsSync(".env") || !fs.existsSync("apps/hub/.env.local"))
    throw new Error("ไม่พบ env: รัน npm run setup ก่อน");
  const root = parseEnv(fs.readFileSync(".env", "utf8"));
  const app = parseEnv(fs.readFileSync("apps/hub/.env.local", "utf8"));
  if (root.DATABASE_URL !== app.DATABASE_URL)
    throw new Error(
      "DATABASE_URL ใน .env และ apps/hub/.env.local ไม่ตรงกัน กรุณาตรวจโดยไม่เปิดเผยค่า secret",
    );
  if (!app.HUB_URL) throw new Error("ต้องกำหนด HUB_URL");
  const db = new pg.Client({
    connectionString: app.DATABASE_URL,
    connectionTimeoutMillis: 4000,
  });
  try {
    try {
      await db.connect();
    } catch {
      throw new Error(
        "ติดต่อ PostgreSQL ไม่ได้: เปิด Docker Desktop แล้วรัน docker compose up -d --wait",
      );
    }
    let applied;
    try {
      applied = new Set(
        (
          await db.query(
            'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
          )
        ).rows.map((r) => r.migration_name),
      );
    } catch {
      throw new Error(
        "ยังไม่มีประวัติ migration: ฐานข้อมูลใหม่ให้รัน npm run db:migrate; ฐานข้อมูลเดิมให้ทำ baseline ตาม docs/upgrading.md ก่อน",
      );
    }
    const pending = fs
      .readdirSync("apps/hub/prisma/migrations", { withFileTypes: true })
      .filter((e) => e.isDirectory() && !applied.has(e.name));
    if (pending.length)
      throw new Error(
        "มี migration รอใช้งาน: สำรองข้อมูลแล้วรัน npm run db:migrate",
      );
  } finally {
    await db.end();
  }
  if (app.MAIL_PROVIDER === "mailpit") {
    try {
      const result = await fetch(
        new URL("/livez", app.MAILPIT_URL || "http://127.0.0.1:8025"),
        { signal: AbortSignal.timeout(3000) },
      );
      if (!result.ok) throw new Error();
    } catch {
      throw new Error(
        "ติดต่อ Mailpit ไม่ได้: รัน docker compose up -d --wait แล้วเปิด http://localhost:8025 เพื่อตรวจอีเมล",
      );
    }
  }
  console.log("ฐานข้อมูล migration และการตั้งค่า local พร้อม");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
