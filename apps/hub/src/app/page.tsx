import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { ROLES } from "@monolith/auth-client";
import { safeUrl } from "@/lib/validation";
import { HubDashboard } from "@/components/hub/HubDashboard";
export const dynamic = "force-dynamic";
export default async function HomePage() {
  const user = await getCurrentUser();
  const allowedRoles = ROLES.slice(0, ROLES.indexOf(user?.role || "GUEST") + 1);
  const [apps, favorites, notifications] = await Promise.all([
    prisma.appItem.findMany({
      where: {
        status: { not: "DISABLED" },
        minRole: { in: [...allowedRoles] },
      },
      orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }, { name: "asc" }],
    }),
    user
      ? prisma.userFavorite.findMany({
          where: { userId: user.id },
          select: { appId: true },
        })
      : [],
    user
      ? prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : [],
  ]);
  const pinned = new Set(favorites.map((f) => f.appId));
  // Do not serialize raw external URLs into every client-side launcher.
  const visibleApps = apps.map(
    ({ createdAt: _created, updatedAt: _updated, url: _url, ...app }) => ({
      ...app,
      url: "/apps/" + app.slug + "/launch",
      isFavorite: pinned.has(app.id),
    }),
  );
  return (
    <HubDashboard
      user={user}
      apps={visibleApps}
      notifications={notifications.map((n) => ({
        ...n,
        linkUrl:
          n.linkUrl && safeUrl.safeParse(n.linkUrl).success ? n.linkUrl : null,
        createdAt: n.createdAt.toISOString(),
      }))}
    />
  );
}
