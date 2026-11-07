import { createHash, randomBytes } from "node:crypto";
export const randomToken = () => randomBytes(32).toString("base64url");
export const tokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const validToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);
export const profileSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  role: true,
} as const;
export function appEnvironment() {
  const value =
    process.env.APP_ENV ||
    (process.env.NODE_ENV === "production" ? "production" : "development");
  if (!["development", "test", "production"].includes(value))
    throw new Error("Invalid APP_ENV");
  return value;
}
