import { NextResponse } from "next/server";
import { hasRequiredRole } from "@monolith/auth-client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, HttpError } from "@/lib/http";
import { parse, safeUrl } from "@/lib/validation";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const app = await prisma.appItem.findUnique({ where: { slug } });
    const user = await getCurrentUser();
    if (
      !app ||
      app.status === "DISABLED" ||
      !hasRequiredRole(user?.role, app.minRole)
    ) {
      throw new HttpError(404, "ไม่พบบริการ");
    }
    if (app.status === "MAINTENANCE") {
      return NextResponse.redirect(
        new URL("/apps/" + app.slug, process.env.HUB_URL || req.url),
      );
    }
    const target = new URL(
      parse(safeUrl, app.url),
      process.env.HUB_URL || req.url,
    );
    const ownPath = "/apps/" + app.slug;
    if (
      target.origin === new URL(process.env.HUB_URL || req.url).origin &&
      target.pathname === ownPath + "/launch"
    ) {
      throw new HttpError(400, "URL นี้ชี้กลับมาที่ปุ่มเปิดบริการของตัวเอง");
    }
    return NextResponse.redirect(target, {
      status: 303,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
