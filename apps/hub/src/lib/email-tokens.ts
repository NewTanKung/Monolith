import type { EmailPurpose } from "@prisma/client";
import { prisma } from "./prisma";
import { randomToken, tokenHash } from "./security";
import { HttpError } from "./http";
import { sendAccountMail } from "./mail";
export async function issueEmailToken(
  userId: string,
  email: string,
  purpose: EmailPurpose,
  expectedPasswordHash?: string,
) {
  const token = randomToken();
  const row = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const current = await tx.user.findUnique({ where: { id: userId } });
    if (
      !current ||
      current.status !== "ACTIVE" ||
      (expectedPasswordHash && current.passwordHash !== expectedPasswordHash)
    )
      throw new HttpError(409, "ข้อมูลบัญชีเปลี่ยนแล้ว กรุณาลองใหม่");
    return tx.emailToken.create({
      data: {
        userId,
        email,
        purpose,
        tokenHash: tokenHash(token),
        expiresAt: new Date(
          Date.now() + (purpose === "RESET_PASSWORD" ? 30 * 60000 : 86400000),
        ),
      },
    });
  });
  const link = new URL(
    purpose === "RESET_PASSWORD" ? "/reset-password" : "/verify-email",
    process.env.HUB_URL,
  );
  // Fragments never reach access logs or referrer headers.
  link.hash = new URLSearchParams({ token }).toString();
  try {
    await sendAccountMail(email, link.href, purpose === "RESET_PASSWORD");
  } catch (error) {
    await prisma.emailToken.delete({ where: { id: row.id } });
    throw error;
  }
}
