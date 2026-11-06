import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { notificationSchema, parse, safeUrl } from "@/lib/validation";
import { notificationService } from "@/lib/notification-auth";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Sign in to view notifications.");
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json(
      {
        notifications: notifications.map((n) => ({
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
    const service = notificationService(req);
    if (!service) assertSameOrigin(req);
    const currentUser = service ? null : await getCurrentUser();
    if (!service && !currentUser)
      throw new HttpError(401, "Authentication required.");
    const body = parse(notificationSchema, await jsonBody(req));
    let userId: string;
    if (service) {
      const target = body.userId
        ? await prisma.user.findUnique({
            where: { id: body.userId },
            select: { id: true },
          })
        : body.email
          ? await prisma.user.findUnique({
              where: { email: body.email },
              select: { id: true },
            })
          : null;
      if (!target) throw new HttpError(404, "Recipient not found.");
      userId = target.id;
    } else {
      if (
        (body.userId && body.userId !== currentUser!.id) ||
        (body.email && body.email !== currentUser!.email)
      ) {
        throw new HttpError(403, "You can only notify your own account.");
      }
      userId = currentUser!.id;
    }
    await rateLimit(
      "notification",
      service || userId,
      service ? 120 : 20,
      60000,
    );
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: body.title,
        message: body.message,
        sourceApp: service || "Monolith",
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
    if (!user) throw new HttpError(401, "Authentication required.");
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
    if (!user) throw new HttpError(401, "Authentication required.");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new HttpError(400, "Notification ID is required.");
    const result = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    if (!result.count) throw new HttpError(404, "Notification not found.");
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
