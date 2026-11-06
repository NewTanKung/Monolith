import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { accessibleApp } from "@/lib/access";
import { apiError, assertSameOrigin, HttpError, jsonBody } from "@/lib/http";
import { favoriteSchema, parse } from "@/lib/validation";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Sign in to save favorites.");
    const { appId, favorite } = parse(favoriteSchema, await jsonBody(req));
    await accessibleApp(appId, user);
    if (favorite) {
      await prisma.userFavorite.upsert({
        where: { userId_appId: { userId: user.id, appId } },
        create: { userId: user.id, appId },
        update: {},
      });
    } else {
      await prisma.userFavorite.deleteMany({
        where: { userId: user.id, appId },
      });
    }
    return NextResponse.json({ isFavorite: favorite });
  } catch (error) {
    return apiError(error);
  }
}
