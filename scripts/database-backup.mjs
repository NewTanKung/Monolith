import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { execFileSync } from "node:child_process";
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Supply an output/input SQL path.");
  const url = new URL(process.env.DATABASE_URL);
  const target = process.argv
    .find((v) => v.startsWith("--restore-to="))
    ?.slice(13);
  if (
    target &&
    (!/^[a-z][a-z0-9_]{0,62}$/.test(target) || target === url.pathname.slice(1))
  )
    throw new Error(
      "Restore target must be a different, explicitly named empty database.",
    );
  const docker =
    ["localhost", "127.0.0.1"].includes(url.hostname) && url.port === "55432";
  const connection = {
    PGHOST: url.hostname,
    PGPORT: url.port || "5432",
    PGDATABASE: target || decodeURIComponent(url.pathname.slice(1)),
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    ...(url.searchParams.get("sslmode")
      ? { PGSSLMODE: url.searchParams.get("sslmode") }
      : {}),
  };
  function command(program, args, input) {
    return docker
      ? execFileSync(
          "docker",
          [
            "exec",
            ...(input ? ["-i"] : []),
            "monolith-db-1",
            program,
            "-U",
            connection.PGUSER,
            "-d",
            connection.PGDATABASE,
            ...args,
          ],
          {
            input,
            maxBuffer: 100 * 1024 * 1024,
            stdio: ["pipe", "pipe", "pipe"],
          },
        )
      : execFileSync(program, args, {
          env: { ...process.env, ...connection },
          input,
          maxBuffer: 100 * 1024 * 1024,
          stdio: ["pipe", "pipe", "pipe"],
        });
  }
  if (target) {
    const targetUrl = new URL(url);
    targetUrl.pathname = "/" + target;
    const client = new pg.Client({ connectionString: targetUrl.href });
    await client.connect();
    try {
      if (
        Number(
          (
            await client.query(
              "SELECT count(*) AS n FROM information_schema.tables WHERE table_schema='public'",
            )
          ).rows[0].n,
        )
      )
        throw new Error("Restore target is not empty. No changes made.");
    } finally {
      await client.end();
    }
    command(
      "psql",
      ["-v", "ON_ERROR_STOP=1", "--single-transaction"],
      fs.readFileSync(file),
    );
    console.log("Restore completed into the named empty database.");
  } else {
    if (fs.existsSync(file))
      throw new Error("Backup file already exists; choose a new filename.");
    const result = command("pg_dump", ["--no-owner", "--no-privileges"]);
    fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    fs.writeFileSync(file, result, { flag: "wx" });
    console.log("Backup saved. Keep it private and outside Git.");
  }
}
main().catch(() => {
  console.error(
    "Backup/restore failed. Check the database, tool availability, output path, and that the restore database is empty. No automatic overwrite or reset is performed.",
  );
  process.exitCode = 1;
});
