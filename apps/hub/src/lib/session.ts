import { cookies } from "next/headers";
import {
  DEFAULT_COOKIE_NAME,
  HubUser,
  signHubToken,
  verifyHubToken,
} from "@monolith/auth-client";
import { prisma } from "./prisma";

export async function getCurrentUser(): Promise<HubUser | null> {
  const token = (await cookies()).get(DEFAULT_COOKIE_NAME)?.value;
  if (!token) return null;
  const claims = await verifyHubToken(token);
  if (!claims) return null;
  // Deleted users and role changes take effect immediately in the Hub.
  return prisma.user.findUnique({
    where: { id: claims.id },
    select: { id: true, email: true, name: true, role: true, image: true },
  });
}
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: process.env.SESSION_COOKIE_DOMAIN?.trim() || undefined,
  };
}
export async function setSessionCookie(user: HubUser): Promise<void> {
  const token = await signHubToken(user);
  (await cookies()).set(DEFAULT_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: 604800,
  });
}
export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(DEFAULT_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}
