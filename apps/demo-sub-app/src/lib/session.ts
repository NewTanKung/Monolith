import { cookies } from "next/headers";
import {
  DEFAULT_COOKIE_NAME,
  verifyHubToken,
  HubUser,
} from "@monolith/auth-client";

import { hubFetch } from "./hub-fetch";
export { hubUrl } from "./hub-fetch";
export async function demoUser(): Promise<HubUser | null> {
  const token = (await cookies()).get(DEFAULT_COOKIE_NAME)?.value;
  if (!token || !(await verifyHubToken(token))) return null;
  // Hub is authoritative: deleted accounts and changed roles are reflected immediately.
  const response = await hubFetch("/api/auth/me", {
    headers: { cookie: DEFAULT_COOKIE_NAME + "=" + encodeURIComponent(token) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to validate the Hub session.");
  const data = await response.json();
  return data.user as HubUser | null;
}
