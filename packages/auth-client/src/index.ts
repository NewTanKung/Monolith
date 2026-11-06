import { jwtVerify, SignJWT } from "jose";

export interface HubUser {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MEMBER" | "GUEST";
  image?: string | null;
}

export interface HubSessionPayload {
  sub: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "MEMBER" | "GUEST";
  image?: string | null;
  iat?: number;
  exp?: number;
}

export const DEFAULT_COOKIE_NAME = "monolith_session";
export const DEFAULT_JWT_SECRET = "monolith_super_secret_jwt_key_change_in_production_2026";

function getSecretKey(customSecret?: string): Uint8Array {
  const secret = customSecret || process.env.MONOLITH_JWT_SECRET || DEFAULT_JWT_SECRET;
  return new TextEncoder().encode(secret);
}

/**
 * Sign a new Hub JWT token with standard claims
 */
export async function signHubToken(user: HubUser, customSecret?: string, expiresIn: string = "7d"): Promise<string> {
  const secretKey = getSecretKey(customSecret);
  return await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    image: user.image,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

/**
 * Verify a Hub JWT token
 */
export async function verifyHubToken(token: string, customSecret?: string): Promise<HubUser | null> {
  try {
    const secretKey = getSecretKey(customSecret);
    const { payload } = await jwtVerify(token, secretKey);
    
    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: (payload.name as string) || null,
      role: (payload.role as "ADMIN" | "MEMBER" | "GUEST") || "MEMBER",
      image: (payload.image as string) || null,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Extract the session cookie value from a raw Cookie header
 */
export function extractHubSessionFromCookie(
  cookieHeader: string | null | undefined,
  cookieName: string = DEFAULT_COOKIE_NAME
): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const c of cookies) {
    if (c.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(c.substring(cookieName.length + 1));
    }
  }
  return null;
}

/**
 * Verify the user session directly from a raw Cookie header (e.g. In Next.js middleware, Express, Fastify)
 */
export async function verifyHubSession(
  cookieHeader: string | null | undefined,
  customSecret?: string,
  cookieName: string = DEFAULT_COOKIE_NAME
): Promise<HubUser | null> {
  const token = extractHubSessionFromCookie(cookieHeader, cookieName);
  if (!token) return null;
  return await verifyHubToken(token, customSecret);
}
