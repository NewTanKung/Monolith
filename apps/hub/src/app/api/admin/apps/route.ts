import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { appSchema, appUpdateSchema, parse } from "@/lib/validation";

async function requireAdmin(req?: Request) {
  if (req) assertSameOrigin(req);
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sign in to continue.");
  if (user.role !== "ADMIN")
    throw new HttpError(403, "Admin privileges are required.");
}
function handleError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return apiError(new HttpError(409, "This app slug already exists."));
    if (error.code === "P2025")
      return apiError(new HttpError(404, "Application not found."));
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
    await requireAdmin(req);
    const data = parse(appSchema, await jsonBody(req));
    return NextResponse.json(
      { app: await prisma.appItem.create({ data }) },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
export async function PUT(req: Request) {
  try {
    await requireAdmin(req);
    const { id, ...data } = parse(appUpdateSchema, await jsonBody(req));
    if (!Object.keys(data).length)
      throw new HttpError(400, "No changes supplied.");
    return NextResponse.json({
      app: await prisma.appItem.update({ where: { id }, data }),
    });
  } catch (error) {
    return handleError(error);
  }
}
export async function DELETE(req: Request) {
  try {
    await requireAdmin(req);
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "App ID is required.");
    await prisma.appItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
