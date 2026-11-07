import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { appSchema, appUpdateSchema, parse } from "@/lib/validation";
import { audit, validateSsoUrl } from "@/lib/services";

async function requireAdmin(req?: Request) {
  if (req) assertSameOrigin(req);
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
  if (user.role !== "ADMIN")
    throw new HttpError(403, "ผู้ดูแล privileges are required.");
  return user;
}
function handleError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiError(new HttpError(409, "ชื่อ URL นี้ถูกใช้แล้ว"));
    if (error.code === "P2025")
      return apiError(new HttpError(404, "บริการ not found."));
  }
  return apiError(error);
}
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({
      apps: await prisma.appItem.findMany({ orderBy: { orderIndex: "asc" } }),
    });
  } catch (error) {
    return handleError(error);
  }
}
export async function POST(req: Request) {
  try {
    const actor = await requireAdmin(req);
    const data = parse(appSchema, await jsonBody(req));
    if (data.mode === "SSO") validateSsoUrl(data.url);
    const app = await prisma.$transaction(async (tx) => {
      const saved = await tx.appItem.create({ data });
      await audit(tx, actor.id, "service.created", saved.id);
      return saved;
    });
    return NextResponse.json({ app }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
export async function PUT(req: Request) {
  try {
    const actor = await requireAdmin(req);
    const { id, ...data } = parse(appUpdateSchema, await jsonBody(req));
    if (!Object.keys(data).length)
      throw new HttpError(400, "ไม่ได้ระบุการเปลี่ยนแปลง");
    const app = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "AppItem" WHERE id = ${id} FOR UPDATE`;
      const previous = await tx.appItem.findUniqueOrThrow({ where: { id } });
      if ((data.mode || previous.mode) === "SSO")
        validateSsoUrl(data.url || previous.url);
      const saved = await tx.appItem.update({ where: { id }, data });
      if (
        (data.url && data.url !== previous.url) ||
        data.mode === "LINK" ||
        data.status === "DISABLED"
      )
        await tx.serviceToken.updateMany({
          where: { appId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      await audit(tx, actor.id, "service.updated", id);
      return saved;
    });
    return NextResponse.json({ app });
  } catch (error) {
    return handleError(error);
  }
}
export async function DELETE(req: Request) {
  try {
    const actor = await requireAdmin(req);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "ต้องระบุบริการ");
    await prisma.$transaction(async (tx) => {
      await tx.appItem.delete({ where: { id } });
      await audit(tx, actor.id, "service.deleted", id);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
