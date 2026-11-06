import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import {
  signHubToken,
  verifyHubToken,
  extractHubSessionFromCookie,
  verifyHubSession,
  hasRequiredRole,
} from "../packages/auth-client/src/index";
const secret = "test-secret-".repeat(5);
const user = {
  id: "user-1",
  email: "member@example.test",
  name: "Member",
  role: "MEMBER" as const,
};
test("session roundtrip, tampering, and key isolation", async () => {
  const token = await signHubToken(user, secret);
  assert.equal((await verifyHubToken(token, secret))?.id, user.id);
  const pieces = token.split(".");
  pieces[1] = Buffer.from(
    JSON.stringify({ sub: "user-1", email: user.email, role: "ADMIN" }),
  ).toString("base64url");
  assert.equal(await verifyHubToken(pieces.join("."), secret), null);
  assert.equal(await verifyHubToken(token, secret + "other"), null);
});
test("expired tokens and tokens without required claims are rejected", async () => {
  assert.equal(
    await verifyHubToken(await signHubToken(user, secret, "-1s"), secret),
    null,
  );
  const incomplete = await new SignJWT({ email: user.email, role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .sign(new TextEncoder().encode(secret));
  assert.equal(await verifyHubToken(incomplete, secret), null);
});
test("missing or short keys fail closed, including production", async () => {
  const previous = process.env.MONOLITH_JWT_SECRET;
  delete process.env.MONOLITH_JWT_SECRET;
  try {
    await assert.rejects(signHubToken(user), /32 bytes/);
  } finally {
    if (previous !== undefined) process.env.MONOLITH_JWT_SECRET = previous;
  }
  await assert.rejects(signHubToken(user, "short"), /32 bytes/);
});
test("malformed cookies do not throw and cookie prefixes are not accepted", async () => {
  assert.equal(extractHubSessionFromCookie("monolith_session=%ZZ"), null);
  assert.equal(extractHubSessionFromCookie("not_monolith_session=abc"), null);
  assert.equal(await verifyHubSession("monolith_session=%ZZ", secret), null);
  assert.equal(
    extractHubSessionFromCookie("other=x; monolith_session=abc%3D"),
    "abc=",
  );
});
test("guest/member/admin hierarchy is enforced", () => {
  assert.equal(hasRequiredRole(undefined, "GUEST"), true);
  assert.equal(hasRequiredRole(undefined, "MEMBER"), false);
  assert.equal(hasRequiredRole("MEMBER", "ADMIN"), false);
  assert.equal(hasRequiredRole("ADMIN", "MEMBER"), true);
});
