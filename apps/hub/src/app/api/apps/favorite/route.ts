import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appId, favorite } = await req.json();

    if (!appId) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 });
    }

    if (favorite) {
      await prisma.userFavorite.upsert({
        where: {
          userId_appId: {
            userId: user.id,
            appId,
          },
        },
        create: {
          userId: user.id,
          appId,
        },
        update: {},
      });
    } else {
      await prisma.userFavorite.deleteMany({
        where: {
          userId: user.id,
          appId,
        },
      });
    }

    return NextResponse.json({ success: true, isFavorite: favorite });
  } catch (err: any) {
    console.error("Favorite toggle error:", err);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
