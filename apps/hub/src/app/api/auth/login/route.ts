import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { loginSchema, parse } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const { email, password } = parse(loginSchema, await jsonBody(req));
    await rateLimit("login-traffic", "shared", 300, 60000);
    await rateLimit("login", email);
    const user = await prisma.user.findUnique({ where: { email } });
    // Equal-cost password check also for unknown users.
    const hash =
      user?.passwordHash ||
      "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
    const match = await bcrypt.compare(password, hash);
    if (!user || !user.passwordHash || !match)
      throw new HttpError(401, "Invalid email or password.");
    const {
      passwordHash: _hash,
      createdAt: _created,
      updatedAt: _updated,
      ...profile
    } = user;
    await setSessionCookie(profile);
    return NextResponse.json({ user: profile });
  } catch (error) {
    return apiError(error);
  }
}
