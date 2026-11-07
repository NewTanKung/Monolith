import { parse } from "tldts";
import { appEnvironment } from "./security";
import { HttpError } from "./http";
export function configuredCookieDomain() {
  const raw = process.env.SESSION_COOKIE_DOMAIN?.trim().toLowerCase();
  if (!raw) return undefined;
  const domain = raw.replace(/^\./, "");
  try {
    const url = new URL("https://" + domain);
    const info = parse(domain, { allowPrivateDomains: true });
    if (
      url.hostname !== domain ||
      url.pathname !== "/" ||
      url.port ||
      url.search ||
      url.hash ||
      url.username ||
      url.password ||
      domain.endsWith(".") ||
      !info.domain ||
      info.publicSuffix === domain ||
      (appEnvironment() === "production" && !info.isIcann && !info.isPrivate)
    )
      throw new Error();
    if (domain.endsWith("workers.dev") || domain.endsWith("pages.dev"))
      throw new Error();
    return domain;
  } catch {
    throw new HttpError(
      503,
      "ตั้งค่า cookie domain ไม่ถูกต้อง กรุณาติดต่อผู้ดูแล",
      "DOMAIN_CONFIGURATION",
    );
  }
}
export function hubDomainReady() {
  try {
    const url = new URL(process.env.HUB_URL || "");
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return false;
    const domain = configuredCookieDomain();
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      appEnvironment() !== "production" &&
      local &&
      ["http:", "https:"].includes(url.protocol)
    )
      return true;
    if (
      appEnvironment() === "test" &&
      domain === "monolith.test" &&
      url.hostname.endsWith(".monolith.test") &&
      url.protocol === "http:"
    )
      return true;
    return (
      url.protocol === "https:" &&
      !!domain &&
      (url.hostname === domain || url.hostname.endsWith("." + domain))
    );
  } catch {
    return false;
  }
}
