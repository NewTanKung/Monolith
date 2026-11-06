import { timingSafeEqual } from "node:crypto";
import { HttpError } from "./http";

export function notificationService(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const configured: Record<string, string> = JSON.parse(
    process.env.MONOLITH_SERVICE_TOKENS || "{}",
  );
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) throw new HttpError(401, "Invalid service credentials.");
  const supplied = Buffer.from(match[1]);
  for (const [app, token] of Object.entries(configured)) {
    if (typeof token !== "string" || Buffer.byteLength(token) < 32) continue;
    const expected = Buffer.from(token);
    if (
      supplied.length === expected.length &&
      timingSafeEqual(supplied, expected)
    )
      return app;
  }
  throw new HttpError(401, "Invalid service credentials.");
}
