import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { parse, registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    if (process.env.ALLOW_REGISTRATION === "false")
      throw new HttpError(403, "Registration is currently closed.");
    const { email, password, name } = parse(
      registerSchema,
      await jsonBody(req),
    );
    await rateLimit("registration-traffic", "shared", 60, 60000);
    await rateLimit("register", email, 5);
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash: await bcrypt.hash(password, 12),
        role: "MEMBER",
      },
      select: { id: true, email: true, name: true, image: true, role: true },
    });
    await setSessionCookie(user);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError(
        new HttpError(409, "Unable to create an account with these details."),
      );
    }
    return apiError(error);
  }
}
