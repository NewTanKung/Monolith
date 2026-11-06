import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Navbar } from "@/components/layout/Navbar";
import { HeroSection } from "@/components/hub/HeroSection";
import { AppGrid } from "@/components/hub/AppGrid";
import { AppItemData } from "@/components/hub/AppCard";

export const revalidate = 0; // Dynamic server rendering

const DEFAULT_APPS: AppItemData[] = [
  {
    id: "cyber-arena",
    slug: "cyber-arena",
    name: "Cyber Arena",
    description: "Live tournament battles, competitive matchmaking, and game replays (Demo Sub-App)",
    category: "GAME",
    status: "ONLINE",
    url: "http://localhost:3001",
    icon: "Gamepad2",
    color: "from-cyan-500 to-blue-600",
    minRole: "GUEST",
    isFeatured: true,
    isFavorite: true,
  },
  {
    id: "guild-hq",
    slug: "guild-hq",
    name: "Guild HQ",
    description: "Manage raid squads, Discord voice channels, and shared guild loot",
    category: "GAME",
    status: "ONLINE",
    url: "/apps/guild-hq",
    icon: "Shield",
    color: "from-purple-500 to-indigo-600",
    minRole: "GUEST",
    isFeatured: false,
    isFavorite: false,
  },
  {
    id: "loot-vault",
    slug: "loot-vault",
    name: "Loot Vault",
    description: "In-game inventory assets, trading cards, and cosmetic rewards",
    category: "GAME",
    status: "BETA",
    url: "/apps/loot-vault",
    icon: "Trophy",
    color: "from-amber-400 to-orange-500",
    minRole: "MEMBER",
    isFeatured: false,
    isFavorite: false,
  },
  {
    id: "task-studio",
    slug: "task-studio",
    name: "Task Studio",
    description: "Agile boards, automated sprint workflows, and project roadmap tracking",
    category: "WORK",
    status: "ONLINE",
    url: "/apps/task-studio",
    icon: "KanbanSquare",
    color: "from-blue-500 to-indigo-600",
    minRole: "GUEST",
    isFeatured: true,
    isFavorite: true,
  },
  {
    id: "docs-notes",
    slug: "docs-notes",
    name: "Docs & Notes",
    description: "Real-time collaborative Markdown workspace and architectural docs",
    category: "WORK",
    status: "ONLINE",
    url: "/apps/docs-notes",
    icon: "FileText",
    color: "from-emerald-500 to-teal-600",
    minRole: "GUEST",
    isFeatured: false,
    isFavorite: false,
  },
  {
    id: "metrics-deck",
    slug: "metrics-deck",
    name: "Metrics Deck",
    description: "Live cluster metrics, performance telemetry, and system health status",
    category: "WORK",
    status: "ONLINE",
    url: "/apps/metrics-deck",
    icon: "BarChart3",
    color: "from-violet-500 to-purple-600",
    minRole: "ADMIN",
    isFeatured: false,
    isFavorite: false,
  },
  {
    id: "flow-habits",
    slug: "flow-habits",
    name: "Flow Habits",
    description: "Daily mindfulness routines, hydration logs, and focus timers",
    category: "LIFESTYLE",
    status: "ONLINE",
    url: "/apps/flow-habits",
    icon: "HeartPulse",
    color: "from-rose-500 to-pink-600",
    minRole: "GUEST",
    isFeatured: true,
    isFavorite: false,
  },
  {
    id: "lounge-audio",
    slug: "lounge-audio",
    name: "Lounge Audio",
    description: "Curated Lo-Fi beats, chillroom ambient sounds, and sync'd playlist",
    category: "LIFESTYLE",
    status: "ONLINE",
    url: "/apps/lounge-audio",
    icon: "Headphones",
    color: "from-amber-500 to-orange-600",
    minRole: "GUEST",
    isFeatured: false,
    isFavorite: false,
  },
  {
    id: "community-feed",
    slug: "community-feed",
    name: "Community Feed",
    description: "Events calendar, lifestyle photo shares, and creator highlights",
    category: "LIFESTYLE",
    status: "ONLINE",
    url: "/apps/community-feed",
    icon: "Sparkles",
    color: "from-pink-500 to-purple-500",
    minRole: "GUEST",
    isFeatured: false,
    isFavorite: false,
  },
];

export default async function HomePage() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch (e) {
    console.warn("Session check fallback:", e);
  }

  let apps: AppItemData[] = DEFAULT_APPS;
  let notifications: any[] = [];

  try {
    // Attempt database query
    const rawApps = await prisma.appItem.findMany({
      where: {
        status: { not: "DISABLED" },
      },
      orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }],
    });

    if (rawApps.length > 0) {
      const userFavorites = user
        ? await prisma.userFavorite.findMany({
            where: { userId: user.id },
            select: { appId: true },
          })
        : [];

      const favoriteAppIds = new Set(userFavorites.map((f) => f.appId));

      apps = rawApps.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        description: a.description,
        category: a.category as any,
        status: a.status as any,
        url: a.url,
        icon: a.icon,
        color: a.color,
        minRole: a.minRole,
        isFeatured: a.isFeatured,
        isFavorite: favoriteAppIds.has(a.id),
      }));
    }

    if (user) {
      const rawNotifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 15,
      });

      notifications = rawNotifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        sourceApp: n.sourceApp,
        linkUrl: n.linkUrl,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      }));
    }
  } catch (dbErr) {
    // Database connection failed (e.g. Postgres not started yet locally), graceful fallback
    console.warn("PostgreSQL not reached, loading default in-memory apps");
    notifications = [
      {
        id: "demo-1",
        title: "Welcome to Monolith Hub",
        message: "Your centralized portal for Lifestyle, Work & Game networks.",
        sourceApp: "Monolith System",
        linkUrl: null,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];
  }

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
