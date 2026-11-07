import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { notificationSchema, parse, safeUrl } from "@/lib/validation";
import { notificationService } from "@/lib/notification-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบเพื่อดูการแจ้งเตือน");
    const cursor = new URL(req.url).searchParams.get("cursor");
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 31,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return NextResponse.json(
      {
        nextCursor: notifications.length > 30 ? notifications[29].id : null,
        unreadCount: await prisma.notification.count({
          where: { userId: user.id, isRead: false },
        }),
        notifications: notifications.slice(0, 30).map((n) => ({
          ...n,
          linkUrl:
            n.linkUrl && safeUrl.safeParse(n.linkUrl).success
              ? n.linkUrl
              : null,
        })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
export async function POST(req: Request) {
  try {
    const service = await notificationService(req);
    if (!service) assertSameOrigin(req);
    const currentUser = service ? null : await getCurrentUser();
    if (!service && !currentUser) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
    const body = parse(notificationSchema, await jsonBody(req));
    let userId: string;
    if (service) {
      const target = body.userId
        ? await prisma.user.findUnique({
            where: { id: body.userId },
            select: { id: true, status: true, emailVerifiedAt: true },
          })
        : body.email
          ? await prisma.user.findUnique({
              where: { email: body.email },
              select: { id: true, status: true, emailVerifiedAt: true },
            })
          : null;
      if (!target || target.status !== "ACTIVE" || !target.emailVerifiedAt)
        throw new HttpError(404, "ไม่พบผู้รับที่ใช้งานได้");
      userId = target.id;
    } else {
      if (
        (body.userId && body.userId !== currentUser!.id) ||
        (body.email && body.email !== currentUser!.email)
      ) {
        throw new HttpError(403, "ส่งแจ้งเตือนได้เฉพาะบัญชีของคุณ");
      }
      userId = currentUser!.id;
    }
    await rateLimit(
      "notification",
      service?.id || userId,
      service ? 120 : 20,
      60000,
    );
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: body.title,
        message: body.message,
        sourceApp: service?.app.name || "Monolith",
        linkUrl: body.linkUrl || null,
      },
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
export async function PUT(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
export async function PATCH(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "กรุณาเข้าสู่ระบบ");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "ต้องระบุการแจ้งเตือน");
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    if (!result.count) throw new HttpError(404, "ไม่พบการแจ้งเตือน");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
