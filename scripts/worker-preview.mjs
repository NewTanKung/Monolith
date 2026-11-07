import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
function main() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const app = path.join(root, "apps/hub");
  const read = (file) =>
    fs.existsSync(file) ? parseEnv(fs.readFileSync(file, "utf8")) : {};
  const env = {
    ...read(path.join(app, ".env.local")),
    ...read(path.join(app, ".dev.vars")),
  };
  if (env.DATABASE_URL) {
    const database = new URL(env.DATABASE_URL);
    // Docker Compose binds this local database only to IPv4. Workerd's IPv6
    // fallback otherwise costs ~2 seconds for every new connection on Windows.
    if (database.hostname === "localhost" && database.port === "55432")
      database.hostname = "127.0.0.1";
    env.DATABASE_URL = database.href;
  }
  const directory = path.join(app, ".wrangler/preview-env");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, `local-${process.pid}-${randomUUID()}.env`);
  fs.writeFileSync(
    file,
    Object.entries(env)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join("\n"),
    { flag: "wx", mode: 0o600 },
  );
  // Run the built OpenNext Worker through Wrangler directly. OpenNext's preview
  // wrapper does not forward --env-file, so credentials must reach Wrangler here.
  const child = spawn(
    process.execPath,
    [
      path.join(root, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--config",
      path.join(app, "wrangler.jsonc"),
      ...process.argv.slice(2),
      "--env-file",
      file,
    ],
    { cwd: app, stdio: "inherit", windowsHide: true },
  );
  const cleanup = () => {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => child.kill("SIGINT"));
  process.on("SIGTERM", () => child.kill("SIGTERM"));
  child.on("error", () => {
    cleanup();
    console.error(
      "เปิด Workers preview ไม่สำเร็จ ตรวจ dependencies และ config",
    );
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    cleanup();
    process.exitCode = code ?? 1;
  });
}
try {
  main();
} catch {
  console.error(
    "ตั้งค่า Workers preview ไม่สำเร็จ ตรวจ env และ dependencies โดยไม่เปิดเผย secret",
  );
  process.exitCode = 1;
}
