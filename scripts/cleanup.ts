import { createDatabaseClient } from "../apps/hub/src/lib/database-client";
const prisma = createDatabaseClient();
async function main() {
  try {
    const now = new Date();
    const result = await prisma.$transaction([
      prisma.session.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { revokedAt: { lt: new Date(Date.now() - 86400000) } },
          ],
        },
      }),
      prisma.emailToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    ]);
    console.log(
      "Removed expired records:",
      result.map((r) => r.count).join(", "),
    );
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error("Cleanup failed; check database configuration.");
  process.exitCode = 1;
});
