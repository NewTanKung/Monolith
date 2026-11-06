import { createHash } from "node:crypto";
import { prisma } from "./prisma";
import { HttpError } from "./http";

// Stored in Postgres so concurrent workers share the same counters.
export async function rateLimit(
  scope: string,
  identity: string,
  limit = 10,
  windowMs = 900000,
) {
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const key = createHash("sha256")
    .update(scope + ":" + identity + ":" + bucket)
    .digest("hex");
  const result = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt: new Date((bucket + 1) * windowMs) },
    update: { count: { increment: 1 } },
  });
  if (result.count > limit)
    throw new HttpError(429, "Too many requests. Please try again later.");
  // Expired buckets are disposable and contain no original identifiers.
  await prisma.rateLimit.deleteMany({
    where: { expiresAt: { lt: new Date(now - windowMs) } },
  });
}
