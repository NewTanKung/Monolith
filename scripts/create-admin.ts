import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
const prisma = new PrismaClient();
const prompt = createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function main() {
  try {
    const email = (
      process.env.ADMIN_EMAIL || (await prompt.question("Admin email: "))
    )
      .trim()
      .toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Supply a valid ADMIN_EMAIL.");
    if (!password || password.length < 12 || Buffer.byteLength(password) > 72) {
      throw new Error(
        "Set ADMIN_PASSWORD to a unique password between 12 characters and 72 bytes.",
      );
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      throw new Error(
        "This email already exists. Existing accounts are not promoted automatically.",
      );
    await prisma.user.create({
      data: {
        email,
        name: "Administrator",
        role: "ADMIN",
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log("Administrator created.");
  } finally {
    prompt.close();
    await prisma.$disconnect();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
