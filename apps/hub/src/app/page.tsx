import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/hub/HeroSection";
import { AppGrid } from "@/components/hub/AppGrid";
import { AppItemData } from "@/components/hub/AppCard";

export const revalidate = 0; // Dynamic server rendering

export default async function HomePage() {
  const user = await getCurrentUser();

  // Fetch all active or visible apps
  const rawApps = await prisma.appItem.findMany({
    where: {
      status: { not: "DISABLED" },
    },
    orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }],
  });

  // Fetch user favorites if logged in
  const userFavorites = user
    ? await prisma.userFavorite.findMany({
        where: { userId: user.id },
        select: { appId: true },
      })
    : [];

  const favoriteAppIds = new Set(userFavorites.map((f) => f.appId));

  const apps: AppItemData[] = rawApps.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    category: a.category,
    status: a.status,
    url: a.url,
    icon: a.icon,
    color: a.color,
    minRole: a.minRole,
    isFeatured: a.isFeatured,
    isFavorite: favoriteAppIds.has(a.id),
  }));

  // Fetch notifications for the user
  const rawNotifications = user
    ? await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
    : [];

  const notifications = rawNotifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    sourceApp: n.sourceApp,
    linkUrl: n.linkUrl,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  const onlineCount = apps.filter((a) => a.status === "ONLINE" || a.status === "BETA").length;

  return (
    <main className="min-h-screen pb-16">
      {/* Liquid Floating Navbar */}
      <Navbar
        user={user}
        apps={apps}
        notifications={notifications}
      />

      {/* Hero Welcome & Telemetry */}
      <HeroSection
        userName={user?.name || (user ? user.email.split("@")[0] : null)}
        totalApps={apps.length}
        onlineApps={onlineCount}
      />

      {/* Categorized Apps & Favorites Grid */}
      <div className="mt-4">
        <AppGrid initialApps={apps} />
      </div>
    </main>
  );
}
