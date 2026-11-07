import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parseEnv } from "node:util";
test("partial local setup preserves secrets and is idempotent", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "monolith-setup-"));
  assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep));
  try {
    fs.mkdirSync(path.join(dir, "apps/hub"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, ".env"),
      'DATABASE_URL="postgresql://existing/example"\n',
    );
    fs.writeFileSync(
      path.join(dir, "apps/hub/.env.local"),
      'MONOLITH_JWT_SECRET="keep-this-value"\n',
    );
    const script = path.resolve("scripts/setup.mjs");
    execFileSync(process.execPath, [script], { cwd: dir, stdio: "pipe" });
    const first = fs.readFileSync(
      path.join(dir, "apps/hub/.env.local"),
      "utf8",
    );
    const env = parseEnv(first);
    assert.equal(env.MONOLITH_JWT_SECRET, "keep-this-value");
    assert.equal(env.DATABASE_URL, "postgresql://existing/example");
    assert.equal(env.MAIL_PROVIDER, "mailpit");
    execFileSync(process.execPath, [script], { cwd: dir, stdio: "pipe" });
    assert.equal(
      fs.readFileSync(path.join(dir, "apps/hub/.env.local"), "utf8"),
      first,
    );
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});
