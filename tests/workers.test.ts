import { test } from "node:test";
import assert from "node:assert/strict";
import { getPrisma } from "../apps/hub/src/lib/prisma";

// OpenNext exposes the current platform context through this well-known symbol.
const symbol = Symbol.for("__cloudflare-context__");
const platform = globalThis as typeof globalThis & { [symbol]?: unknown };

test("Worker Prisma clients are reused only inside the same execution context", async () => {
  const previous = platform[symbol];
  const env = { DATABASE_URL: "postgresql://test:test@localhost:55432/test" };
  let first: ReturnType<typeof getPrisma> | undefined;
  let second: ReturnType<typeof getPrisma> | undefined;
  try {
    platform[symbol] = { env, ctx: {} };
    first = getPrisma();
    assert.equal(getPrisma(), first);
    platform[symbol] = { env, ctx: {} };
    second = getPrisma();
    assert.notEqual(first, second);
    assert.equal(getPrisma(), second);
  } finally {
    platform[symbol] = previous;
    await first?.$disconnect();
    await second?.$disconnect();
  }
});
