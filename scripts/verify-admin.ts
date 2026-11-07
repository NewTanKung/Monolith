import { prisma } from "../apps/hub/src/lib/prisma";
import { issueEmailToken } from "../apps/hub/src/lib/email-tokens";
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("Set ADMIN_EMAIL.");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE")
    throw new Error("Active administrator not found.");
  await issueEmailToken(user.id, user.email, "VERIFY_EMAIL");
  console.log("ส่งลิงก์ยืนยันบัญชี Admin แล้ว");
}
main()
  .catch(() => {
    console.error("ส่งอีเมลไม่ได้ ตรวจอีเมล Admin และการตั้งค่าอีเมล");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
