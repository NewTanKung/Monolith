import { cookies } from "next/headers";
import {
  DEFAULT_COOKIE_NAME,
  verifyHubToken,
  HubUser,
} from "@monolith/auth-client";

export function hubUrl() {
  return process.env.HUB_URL || "http://localhost:3000";
}
export async function demoUser(): Promise<HubUser | null> {
  const token = (await cookies()).get(DEFAULT_COOKIE_NAME)?.value;
  if (!token || !(await verifyHubToken(token))) return null;
  // Hub is authoritative: deleted accounts and changed roles are reflected immediately.
  const response = await fetch(new URL("/api/auth/me", hubUrl()), {
    headers: { cookie: DEFAULT_COOKIE_NAME + "=" + encodeURIComponent(token) },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Unable to validate the Hub session.");
  const data = await response.json();
  return data.user as HubUser | null;
}
