import { cookies } from "next/headers";
import {
  DEFAULT_COOKIE_NAME,
  DEFAULT_JWT_SECRET,
  HubUser,
  signHubToken,
  verifyHubToken,
} from "@monolith/auth-client";

export async function getCurrentUser(): Promise<HubUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(DEFAULT_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    return await verifyHubToken(sessionCookie.value, process.env.MONOLITH_JWT_SECRET || DEFAULT_JWT_SECRET);
  } catch (err) {
    console.error("Failed to get current user session:", err);
    return null;
  }
}

export async function setSessionCookie(user: HubUser): Promise<string> {
  const token = await signHubToken(user, process.env.MONOLITH_JWT_SECRET || DEFAULT_JWT_SECRET);
  const cookieStore = await cookies();
  
  const domain = process.env.SESSION_COOKIE_DOMAIN ? process.env.SESSION_COOKIE_DOMAIN.trim() : undefined;

  cookieStore.set(DEFAULT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain: domain || undefined,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const domain = process.env.SESSION_COOKIE_DOMAIN ? process.env.SESSION_COOKIE_DOMAIN.trim() : undefined;

  cookieStore.delete({
    name: DEFAULT_COOKIE_NAME,
    path: "/",
    domain: domain || undefined,
  });
}
