import { cookies } from "next/headers";
import { DEFAULT_COOKIE_NAME, type HubUser } from "@monolith/auth-client";
import { prisma } from "./prisma";
import {
  profileSelect,
  tokenHash,
  randomToken,
  validToken,
  appEnvironment,
} from "./security";
import { HttpError } from "./http";
import { configuredCookieDomain, hubDomainReady } from "./domains";

export async function findSession(token: string | undefined) {
  if (!token || !validToken(token)) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { user: true },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== "ACTIVE" ||
    !session.user.emailVerifiedAt
  )
    return null;
  return session;
}
export async function getCurrentSession() {
  return findSession((await cookies()).get(DEFAULT_COOKIE_NAME)?.value);
}
export async function getCurrentUser(): Promise<HubUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const { id, email, name, role, image } = session.user;
  return { id, email, name, role, image };
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHENTICATED");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    throw new HttpError(403, "เฉพาะผู้ดูแลระบบ", "FORBIDDEN");
  return user;
}
function cookieOptions() {
  if (appEnvironment() === "production" && !hubDomainReady())
    throw new HttpError(
      503,
      "โดเมนสำหรับเข้าสู่ระบบยังไม่พร้อม",
      "DOMAIN_CONFIGURATION",
    );
  return {
    httpOnly: true,
    secure: appEnvironment() === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: configuredCookieDomain(),
  };
}
export async function setSessionCookie(
  user: HubUser,
  device = "อุปกรณ์ไม่ระบุ",
  expectedPasswordHash?: string,
) {
  const token = randomToken();
  // Share the user lock with password changes and suspension. A stale login must
  // not create a new session after those transactions have revoked sessions.
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
    const current = await tx.user.findUnique({
      where: { id: user.id },
      select: {
        ...profileSelect,
        status: true,
        emailVerifiedAt: true,
        passwordHash: true,
      },
    });
    if (
      !current ||
      current.status !== "ACTIVE" ||
      !current.emailVerifiedAt ||
      (expectedPasswordHash && expectedPasswordHash !== current.passwordHash)
    )
      throw new HttpError(401, "กรุณาเข้าสู่ระบบใหม่", "UNAUTHENTICATED");
    await tx.session.create({
      data: {
        tokenHash: tokenHash(token),
        userId: user.id,
        device: device.slice(0, 200),
        expiresAt,
      },
    });
  });
  (await cookies()).set(DEFAULT_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: 604800,
  });
}
export async function clearSessionCookie() {
  const token = (await cookies()).get(DEFAULT_COOKIE_NAME)?.value;
  if (token && validToken(token))
    await prisma.session.updateMany({
      where: { tokenHash: tokenHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  (await cookies()).set(DEFAULT_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
