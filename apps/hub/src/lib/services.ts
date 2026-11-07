import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./http";
import { appEnvironment, tokenHash } from "./security";
import { configuredCookieDomain } from "./domains";

export const tokenMetadata = {
  id: true,
  prefix: true,
  scopes: true,
  createdAt: true,
  lastUsedAt: true,
  revokedAt: true,
} as const;
export function validateSsoUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(
      400,
      "SSO ต้องใช้ URL เต็มของบริการ",
      "INVALID_SERVICE_URL",
    );
  }
  const domain = configuredCookieDomain();
  const local =
    appEnvironment() !== "production" &&
    (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      (appEnvironment() === "test" &&
        domain === "monolith.test" &&
        url.hostname.endsWith(".monolith.test")));
  if (
    url.username ||
    url.password ||
    (!local &&
      (url.protocol !== "https:" ||
        !domain ||
        !url.hostname.endsWith("." + domain)))
  )
    throw new HttpError(
      400,
      "บริการ SSO ต้องใช้ HTTPS และอยู่ใต้โดเมนที่ตั้งค่าไว้",
      "INVALID_SERVICE_URL",
    );
  if (local && !["http:", "https:"].includes(url.protocol))
    throw new HttpError(400, "URL ไม่ถูกต้อง");
}
export async function authenticatedService(req: Request, scope: string) {
  const header = req.headers.get("authorization");
  const token = /^Bearer (mst_[A-Za-z0-9_-]{43})$/.exec(header || "")?.[1];
  if (!token)
    throw new HttpError(
      401,
      "Service Token ไม่ถูกต้อง",
      "INVALID_SERVICE_TOKEN",
    );
  const credential = await prisma.serviceToken.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { app: true },
  });
  if (!credential || credential.revokedAt)
    throw new HttpError(
      401,
      "Service Token ถูกยกเลิกหรือไม่ถูกต้อง",
      "INVALID_SERVICE_TOKEN",
    );
  if (credential.app.status === "DISABLED" || credential.app.mode !== "SSO")
    throw new HttpError(403, "บริการนี้ไม่เปิดใช้งาน SSO", "SERVICE_DISABLED");
  if (credential.app.status === "MAINTENANCE")
    throw new HttpError(
      503,
      "บริการอยู่ระหว่างปรับปรุง",
      "SERVICE_MAINTENANCE",
    );
  if (!credential.scopes.includes(scope))
    throw new HttpError(
      403,
      "Service Token ไม่มีสิทธิ์นี้",
      "INSUFFICIENT_SCOPE",
    );
  // Validate again after config changes; never allow stale credentials to bypass the domain policy.
  validateSsoUrl(credential.app.url);
  await prisma.serviceToken.update({
    where: { id: credential.id },
    data: { lastUsedAt: new Date() },
  });
  return credential;
}
export async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  targetId: string,
) {
  await tx.auditLog.create({ data: { actorId, action, targetId } });
}
export async function safeReturnTo(
  serviceId: string | null,
  returnTo: string | null,
) {
  if (!serviceId || !returnTo) return "/";
  const app = await prisma.appItem.findUnique({ where: { id: serviceId } });
  if (
    !app ||
    app.mode !== "SSO" ||
    app.status === "DISABLED" ||
    app.status === "MAINTENANCE"
  )
    return "/";
  try {
    validateSsoUrl(app.url);
    const target = new URL(returnTo);
    const registered = new URL(app.url);
    if (
      target.origin !== registered.origin ||
      target.username ||
      target.password
    )
      return "/";
    // Bind return URLs to the configured application's path, not just its hostname.
    const base = registered.pathname.replace(/\/$/, "");
    if (
      base &&
      target.pathname !== base &&
      !target.pathname.startsWith(base + "/")
    )
      return "/";
    return target.href;
  } catch {
    return "/";
  }
}
