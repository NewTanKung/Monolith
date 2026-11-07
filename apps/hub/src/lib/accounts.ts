import { issueEmailToken } from "./email-tokens";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { HttpError, assertSameOrigin, jsonBody, apiError } from "./http";
import { parse, loginSchema, registerSchema } from "./validation";
import {
  requireUser,
  setSessionCookie,
  clearSessionCookie,
  getCurrentSession,
} from "./session";
import { profileSelect, tokenHash, validToken } from "./security";
import { mailConfiguration } from "./mail";
import { rateLimit } from "./rate-limit";

const emailSchema = z
  .object({ email: z.string().trim().toLowerCase().email().max(254) })
  .strict();
const password = registerSchema.shape.password;
const tokenSchema = z.string().refine(validToken, "ลิงก์ไม่ถูกต้อง");
const genericMail = {
  message: "หากอีเมลนี้ใช้งานได้ ระบบจะส่งลิงก์ให้ กรุณาตรวจกล่องจดหมาย",
  requiresEmailVerification: true,
};
async function consumeToken(
  token: string,
  action: "verify" | "reset",
  nextPassword?: string,
) {
  const hashed = nextPassword ? await bcrypt.hash(nextPassword, 12) : undefined;
  await prisma.$transaction(async (tx) => {
    const row = await tx.emailToken.findUnique({
      where: { tokenHash: tokenHash(token) },
    });
    if (
      !row ||
      row.usedAt ||
      row.expiresAt <= new Date() ||
      (action === "reset"
        ? row.purpose !== "RESET_PASSWORD"
        : row.purpose === "RESET_PASSWORD")
    )
      throw new HttpError(
        400,
        "ลิงก์หมดอายุหรือถูกใช้แล้ว กรุณาขอลิงก์ใหม่",
        "INVALID_TOKEN",
      );
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${row.userId} FOR UPDATE`;
    const user = await tx.user.findUniqueOrThrow({ where: { id: row.userId } });
    if (
      user.status !== "ACTIVE" ||
      (row.purpose !== "CHANGE_EMAIL" && row.email !== user.email)
    )
      throw new HttpError(400, "ลิงก์นี้ใช้ไม่ได้", "INVALID_TOKEN");
    const used = await tx.emailToken.updateMany({
      where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (used.count !== 1)
      throw new HttpError(400, "ลิงก์ถูกใช้แล้ว", "INVALID_TOKEN");
    if (action === "reset") {
      await tx.user.update({
        where: { id: row.userId },
        data: { passwordHash: hashed },
      });
      await tx.session.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.emailToken.updateMany({
        where: { userId: row.userId, usedAt: null },
        data: { usedAt: new Date() },
      });
    } else {
      await tx.user.update({
        where: { id: row.userId },
        data: {
          emailVerifiedAt: new Date(),
          ...(row.purpose === "CHANGE_EMAIL" ? { email: row.email } : {}),
        },
      });
      await tx.emailToken.updateMany({
        where: {
          userId: row.userId,
          purpose: { in: ["VERIFY_EMAIL", "CHANGE_EMAIL"] },
          usedAt: null,
        },
        data: { usedAt: new Date() },
      });
      if (row.purpose === "CHANGE_EMAIL") {
        await tx.session.updateMany({
          where: { userId: row.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.emailToken.updateMany({
          where: {
            userId: row.userId,
            purpose: "RESET_PASSWORD",
            usedAt: null,
          },
          data: { usedAt: new Date() },
        });
      }
    }
  });
}
export async function accountPost(req: Request, action: string) {
  try {
    assertSameOrigin(req);
    if (action === "logout") {
      await clearSessionCookie();
      return Response.json({ success: true });
    }
    const body = await jsonBody(req);
    if (action === "register") {
      const input = parse(registerSchema, body);
      const settings = await prisma.hubSettings.findUnique({
        where: { id: "hub" },
      });
      if (
        process.env.ALLOW_REGISTRATION === "false" ||
        settings?.registrationEnabled === false
      )
        throw new HttpError(
          403,
          "ขณะนี้ปิดรับสมัครสมาชิก",
          "REGISTRATION_CLOSED",
        );
      await rateLimit("register", input.email, 5);
      await rateLimit("registration-traffic", "shared", 60, 60000);
      mailConfiguration();
      let user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user) {
        try {
          user = await prisma.user.create({
            data: {
              email: input.email,
              name: input.name || input.email.split("@")[0],
              passwordHash: await bcrypt.hash(input.password, 12),
              role: "MEMBER",
            },
          });
        } catch (error) {
          if (!(
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ))
            throw error;
        }
      }
      if (user && user.status === "ACTIVE" && !user.emailVerifiedAt)
        await issueEmailToken(user.id, user.email, "VERIFY_EMAIL");
      return Response.json(genericMail, { status: 201 });
    }
    if (action === "login") {
      const input = parse(loginSchema, body);
      await rateLimit("login", input.email);
      await rateLimit("login-traffic", "shared", 300, 60000);
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });
      const hash =
        user?.passwordHash ||
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
      if (
        !(await bcrypt.compare(input.password, hash)) ||
        !user ||
        !user.passwordHash ||
        user.status !== "ACTIVE"
      )
        throw new HttpError(
          401,
          "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          "INVALID_CREDENTIALS",
        );
      if (!user.emailVerifiedAt)
        throw new HttpError(
          403,
          "กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ",
          "EMAIL_UNVERIFIED",
        );
      await setSessionCookie(
        user,
        req.headers.get("user-agent") || undefined,
        user.passwordHash,
      );
      return Response.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image,
        },
      });
    }
    if (action === "resend-verification" || action === "forgot-password") {
      const { email } = parse(emailSchema, body);
      await rateLimit(action, email, 3);
      await rateLimit("mail-traffic", "shared", 60, 60000);
      mailConfiguration();
      const user = await prisma.user.findUnique({ where: { email } });
      if (
        user?.status === "ACTIVE" &&
        (action === "forgot-password" || !user.emailVerifiedAt)
      )
        await issueEmailToken(
          user.id,
          user.email,
          action === "forgot-password" ? "RESET_PASSWORD" : "VERIFY_EMAIL",
        );
      return Response.json(genericMail);
    }
    if (action === "verify-email" || action === "reset-password") {
      const data =
        action === "reset-password"
          ? parse(z.object({ token: tokenSchema, password }).strict(), body)
          : parse(z.object({ token: tokenSchema }).strict(), body);
      await rateLimit("token-consume", tokenHash(data.token), 5);
      await consumeToken(
        data.token,
        action === "reset-password" ? "reset" : "verify",
        "password" in data && typeof data.password === "string"
          ? data.password
          : undefined,
      );
      return Response.json({
        message:
          action === "reset-password"
            ? "ตั้งรหัสผ่านใหม่แล้ว กรุณาเข้าสู่ระบบ"
            : "ยืนยันอีเมลแล้ว กรุณาเข้าสู่ระบบ",
      });
    }
    const user = await requireUser();
    if (action === "profile") {
      const { name } = parse(
        z.object({ name: z.string().trim().min(1).max(80) }).strict(),
        body,
      );
      return Response.json({
        user: await prisma.user.update({
          where: { id: user.id },
          data: { name },
          select: profileSelect,
        }),
      });
    }
    if (action === "change-password" || action === "change-email") {
      await rateLimit(action, user.id, 5);
      const data =
        action === "change-password"
          ? parse(
              z
                .object({
                  currentPassword: z.string().min(1).max(72),
                  password,
                })
                .strict(),
              body,
            )
          : parse(
              z
                .object({
                  currentPassword: z.string().min(1).max(72),
                  email: emailSchema.shape.email,
                })
                .strict(),
              body,
            );
      const current = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      if (
        !current.passwordHash ||
        !(await bcrypt.compare(data.currentPassword, current.passwordHash))
      )
        throw new HttpError(
          400,
          "รหัสผ่านปัจจุบันไม่ถูกต้อง",
          "INVALID_CREDENTIALS",
        );
      if ("email" in data) {
        if (
          data.email === user.email ||
          (await prisma.user.findUnique({ where: { email: data.email } }))
        )
          throw new HttpError(
            409,
            "ไม่สามารถใช้อีเมลนี้ได้",
            "EMAIL_UNAVAILABLE",
          );
        await issueEmailToken(
          user.id,
          data.email,
          "CHANGE_EMAIL",
          current.passwordHash,
        );
        return Response.json({
          message:
            "ส่งลิงก์ยืนยันไปยังอีเมลใหม่แล้ว อีเมลเดิมยังใช้ได้จนกว่าจะยืนยัน",
        });
      }
      const hashed = await bcrypt.hash(data.password, 12);
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`;
        const updated = await tx.user.updateMany({
          where: {
            id: user.id,
            passwordHash: current.passwordHash,
            status: "ACTIVE",
          },
          data: { passwordHash: hashed },
        });
        if (updated.count !== 1)
          throw new HttpError(
            409,
            "ข้อมูลบัญชีเปลี่ยนแล้ว กรุณาเข้าสู่ระบบใหม่",
          );
        await tx.session.updateMany({
          where: { userId: user.id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await tx.emailToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        });
      });
      await clearSessionCookie();
      return Response.json({
        message: "เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบใหม่",
      });
    }
    throw new HttpError(404, "ไม่พบรายการ");
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return apiError(new HttpError(409, "ข้อมูลนี้ถูกใช้งานแล้ว", "CONFLICT"));
    return apiError(error);
  }
}
export async function sessionGet() {
  try {
    const current = await getCurrentSession();
    if (!current) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
    const sessions = await prisma.session.findMany({
      where: {
        userId: current.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, device: true, createdAt: true, expiresAt: true },
    });
    return Response.json({
      sessions: sessions.map((s) => ({ ...s, current: s.id === current.id })),
    });
  } catch (error) {
    return apiError(error);
  }
}
export async function sessionDelete(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireUser();
    const id = new URL(req.url).searchParams.get("id");
    await prisma.session.updateMany({
      where: { userId: user.id, ...(id ? { id } : {}), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const current = await getCurrentSession();
    if (!current) await clearSessionCookie();
    return Response.json({ success: true, signedOut: !current });
  } catch (error) {
    return apiError(error);
  }
}
