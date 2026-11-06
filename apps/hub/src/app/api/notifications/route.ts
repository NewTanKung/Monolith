import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// GET: fetch notifications for current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// POST: API endpoint for child apps to push notifications to a user
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, title, message, sourceApp, linkUrl } = body;

    let targetUserId = userId;

    if (!targetUserId && email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) targetUserId = user.id;
    }

    if (!targetUserId) {
      // Fallback: if user is logged in, send to self
      const currentUser = await getCurrentUser();
      if (currentUser) targetUserId = currentUser.id;
    }

    if (!targetUserId || !title || !message) {
      return NextResponse.json({ error: "Missing required fields (target user, title, message)" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title,
        message,
        sourceApp: sourceApp || "Monolith App",
        linkUrl: linkUrl || null,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    console.error("Create notification error:", err);
    return NextResponse.json({ error: "Failed to push notification" }, { status: 500 });
  }
}

// PUT: Mark all as read
export async function PUT() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

// PATCH: Mark single notification as read
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });

    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
