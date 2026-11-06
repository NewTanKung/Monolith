import { test } from "node:test";
import assert from "node:assert/strict";
import { getPrisma } from "../apps/hub/src/lib/prisma";
import { hubFetch } from "../apps/demo-sub-app/src/lib/hub-fetch";

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

test("Demo forwards to its Hub service binding and preserves credentials", async () => {
  const previous = platform[symbol];
  let forwarded: Request | undefined;
  try {
    platform[symbol] = {
      ctx: {},
      env: {
        HUB: {
          fetch: async (request: Request) => {
            forwarded = request;
            return Response.json({ success: true });
          },
        },
      },
    };
    const response = await hubFetch("/api/notifications", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-service",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "Victory" }),
    });
    assert.equal(response.status, 200);
    assert.equal(forwarded?.method, "POST");
    assert.equal(
      forwarded?.headers.get("authorization"),
      "Bearer test-service",
    );
    assert.equal(new URL(forwarded!.url).pathname, "/api/notifications");
    assert.deepEqual(await forwarded!.json(), { title: "Victory" });
  } finally {
    platform[symbol] = previous;
  }
});
