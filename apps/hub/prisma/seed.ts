import { Role, AppCategory, AppStatus } from "@prisma/client";

import { createDatabaseClient } from "../src/lib/database-client";

const prisma = createDatabaseClient();

async function main() {
  console.log("🌱 Seeding database...");

  const apps = [
    // Game Apps
    {
      slug: "cyber-arena",
      name: "Cyber Arena",
      description:
        "Live tournament battles, competitive matchmaking, and game replays (Demo Sub-App)",
      category: AppCategory.GAME,
      status: AppStatus.ONLINE,
      url: "http://localhost:3001",
      icon: "Gamepad2",
      color: "from-cyan-500 to-blue-600",
      minRole: Role.GUEST,
      orderIndex: 1,
      isFeatured: true,
    },
    {
      slug: "guild-hq",
      name: "Guild HQ",
      description:
        "Manage raid squads, Discord voice channels, and shared guild loot",
      category: AppCategory.GAME,
      status: AppStatus.ONLINE,
      url: "/apps/guild-hq",
      icon: "Shield",
      color: "from-purple-500 to-indigo-600",
      minRole: Role.GUEST,
      orderIndex: 2,
      isFeatured: false,
    },
    {
      slug: "loot-vault",
      name: "Loot Vault",
      description:
        "In-game inventory assets, trading cards, and cosmetic rewards",
      category: AppCategory.GAME,
      status: AppStatus.BETA,
      url: "/apps/loot-vault",
      icon: "Trophy",
      color: "from-amber-400 to-orange-500",
      minRole: Role.MEMBER,
      orderIndex: 3,
      isFeatured: false,
    },

    // Work Apps
    {
      slug: "task-studio",
      name: "Task Studio",
      description:
        "Agile boards, automated sprint workflows, and project roadmap tracking",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "/apps/task-studio",
      icon: "KanbanSquare",
      color: "from-blue-500 to-indigo-600",
      minRole: Role.GUEST,
      orderIndex: 4,
      isFeatured: true,
    },
    {
      slug: "docs-notes",
      name: "Docs & Notes",
      description:
        "Real-time collaborative Markdown workspace and architectural docs",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "/apps/docs-notes",
      icon: "FileText",
      color: "from-emerald-500 to-teal-600",
      minRole: Role.GUEST,
      orderIndex: 5,
      isFeatured: false,
    },
    {
      slug: "metrics-deck",
      name: "Metrics Deck",
      description:
        "Live cluster metrics, performance telemetry, and system health status",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "/apps/metrics-deck",
      icon: "BarChart3",
      color: "from-violet-500 to-purple-600",
      minRole: Role.ADMIN,
      orderIndex: 6,
      isFeatured: false,
    },

    // Lifestyle Apps
    {
      slug: "flow-habits",
      name: "Flow Habits",
      description:
        "Daily mindfulness routines, hydration logs, and focus timers",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "/apps/flow-habits",
      icon: "HeartPulse",
      color: "from-rose-500 to-pink-600",
      minRole: Role.GUEST,
      orderIndex: 7,
      isFeatured: true,
    },
    {
      slug: "lounge-audio",
      name: "Lounge Audio",
      description:
        "Curated Lo-Fi beats, chillroom ambient sounds, and sync'd playlist",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "/apps/lounge-audio",
      icon: "Headphones",
      color: "from-amber-500 to-orange-600",
      minRole: Role.GUEST,
      orderIndex: 8,
      isFeatured: false,
    },
    {
      slug: "community-feed",
      name: "Community Feed",
      description:
        "Events calendar, lifestyle photo shares, and creator highlights",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "/apps/community-feed",
      icon: "Sparkles",
      color: "from-pink-500 to-purple-500",
      minRole: Role.GUEST,
      orderIndex: 9,
      isFeatured: false,
    },
  ];

  for (const app of apps) {
    await prisma.appItem.upsert({
      where: { slug: app.slug },
      create: app,
      update: {},
    });
  }
  console.log(
    "Seeded application registry. Existing records and user data were preserved.",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
