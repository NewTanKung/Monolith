import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getServiceSession,
  createHubLoginUrl,
  HubAuthError,
} from "../packages/auth-client/src/server";
import {
  randomToken,
  tokenHash,
  validToken,
} from "../apps/hub/src/lib/security";
test("opaque tokens are random, fixed-size, hash-only candidates", () => {
  const a = randomToken(),
    b = randomToken();
  assert.notEqual(a, b);
  assert.equal(validToken(a), true);
  assert.equal(validToken("old.jwt.token"), false);
  assert.equal(tokenHash(a).length, 64);
  assert.notEqual(tokenHash(a), a);
});
test("service client forwards only the Hub cookie and fails closed", async (t) => {
  const original = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = original;
  });
  let supplied: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => {
    supplied = init;
    return Response.json({
      user: null,
      service: { id: "s", slug: "service" },
      access: { role: "GUEST" },
    });
  };
  const options = {
    hubUrl: "http://localhost:3000",
    serviceToken: "private-token",
  };
  const result = await getServiceSession(
    "other=secret; monolith_session=session-value",
    options,
  );
  assert.equal(result.user, null);
  assert.deepEqual(supplied?.headers, {
    Authorization: "Bearer private-token",
    Cookie: "monolith_session=session-value",
  });
  assert.equal(supplied?.redirect, "error");
  globalThis.fetch = async () =>
    Response.json({ code: "FORBIDDEN" }, { status: 403 });
  await assert.rejects(
    getServiceSession(null, options),
    (e: unknown) => e instanceof HubAuthError && e.status === 403,
  );
  globalThis.fetch = async () => {
    throw new Error("private network details");
  };
  await assert.rejects(
    getServiceSession(null, options),
    (e: unknown) =>
      e instanceof HubAuthError &&
      e.code === "HUB_UNAVAILABLE" &&
      !e.message.includes("private network"),
  );
  globalThis.fetch = async () => Response.json({ user: null });
  await assert.rejects(getServiceSession(null, options), HubAuthError);
});
test("login URL carries service and return destination for Hub-side validation", () => {
  const url = new URL(
    createHubLoginUrl({
      hubUrl: "https://hub.example.com",
      serviceId: "service-1",
      returnTo: "https://tasks.example.com/work?q=1",
    }),
  );
  assert.equal(url.pathname, "/auth/continue");
  assert.equal(url.searchParams.get("service"), "service-1");
  assert.equal(
    url.searchParams.get("returnTo"),
    "https://tasks.example.com/work?q=1",
  );
});
