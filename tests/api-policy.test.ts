import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appSchema,
  appUpdateSchema,
  notificationSchema,
  registerSchema,
  safeUrl,
} from "../apps/hub/src/lib/validation";
import { assertSameOrigin, jsonBody } from "../apps/hub/src/lib/http";
import { notificationService } from "../apps/hub/src/lib/notification-auth";
import { getPrisma } from "../apps/hub/src/lib/prisma";
test("unsafe URLs, malformed passwords and privilege mass assignment are rejected", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "//attacker.test",
    "/\\attacker.test",
    "https://user:pass@example.test",
  ])
    assert.equal(safeUrl.safeParse(url).success, false, url);
  for (const url of ["/apps/notes", "https://app.example.test/path"])
    assert.equal(safeUrl.safeParse(url).success, true);
  assert.equal(
    registerSchema.safeParse({
      email: "a@example.test",
      password: "123",
      role: "ADMIN",
    }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({
      email: "a@example.test",
      password: "🙂".repeat(30),
    }).success,
    false,
  );
  assert.equal(
    appSchema.safeParse({
      name: "App",
      slug: "app",
      category: "WORK",
      url: "/apps/app",
      favorites: { create: { userId: "victim" } },
    }).success,
    false,
  );
  assert.equal(
    notificationSchema.safeParse({
      title: "x",
      message: "x",
      linkUrl: "javascript:alert(1)",
    }).success,
    false,
  );
});
test("partial updates do not reset existing access or status defaults", () => {
  assert.deepEqual(
    appUpdateSchema.parse({ id: "app", status: "MAINTENANCE" }),
    { id: "app", status: "MAINTENANCE" },
  );
});
test("cross-site browser writes are rejected", () => {
  assert.throws(
    () =>
      assertSameOrigin(
        new Request("http://localhost:3000/api/apps/favorite", {
          headers: { origin: "https://attacker.test" },
        }),
      ),
    /origin/,
  );
  assert.doesNotThrow(() =>
    assertSameOrigin(
      new Request("http://localhost:3000/api/apps/favorite", {
        headers: { origin: "http://localhost:3000" },
      }),
    ),
  );
});
test("invalid JSON and oversized bodies have controlled failures", async () => {
  await assert.rejects(
    jsonBody(
      new Request("http://local.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      }),
    ),
    /Invalid JSON/,
  );
  await assert.rejects(
    jsonBody(
      new Request("http://local.test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "x".repeat(17000),
      }),
    ),
    /too large/,
  );
});
test("service identity comes from configured credentials, never the submitted app name", () => {
  process.env.MONOLITH_SERVICE_TOKENS = JSON.stringify({
    "Cyber Arena": "s".repeat(40),
  });
  assert.equal(notificationService(new Request("http://local.test")), null);
  assert.throws(
    () =>
      notificationService(
        new Request("http://local.test", {
          headers: { authorization: "Bearer invalid" },
        }),
      ),
    /credentials/,
  );
  assert.equal(
    notificationService(
      new Request("http://local.test", {
        headers: { authorization: "Bearer " + "s".repeat(40) },
      }),
    ),
    "Cyber Arena",
  );
  delete process.env.MONOLITH_SERVICE_TOKENS;
});
test("Prisma is reused for repeated production accesses", async () => {
  const previous = process.env.NODE_ENV;
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL ||= "postgresql://test:test@localhost:55432/test";
  process.env.NODE_ENV = "production";
  try {
    const a = getPrisma();
    assert.equal(getPrisma(), a);
    await a.$disconnect();
  } finally {
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
