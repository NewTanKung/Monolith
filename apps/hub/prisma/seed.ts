import { PrismaClient, Role, AppCategory, AppStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.userFavorite.deleteMany();
  await prisma.appItem.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("admin1234", 10);
  const userPasswordHash = await bcrypt.hash("user1234", 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@monolith.local",
      name: "Neo Commander",
      passwordHash,
      role: Role.ADMIN,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const member = await prisma.user.create({
    data: {
      email: "user@monolith.local",
      name: "Alex Vance",
      passwordHash: userPasswordHash,
      role: Role.MEMBER,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("✅ Created users: admin@monolith.local and user@monolith.local");

  // 2. Create Apps
  const apps = [
    // Game Apps
    {
      slug: "cyber-arena",
      name: "Cyber Arena",
      description: "Live tournament battles, competitive matchmaking, and game replays (Demo Sub-App)",
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
      description: "Manage raid squads, Discord voice channels, and shared guild loot",
      category: AppCategory.GAME,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/guild-hq",
      icon: "Shield",
      color: "from-purple-500 to-indigo-600",
      minRole: Role.GUEST,
      orderIndex: 2,
      isFeatured: false,
    },
    {
      slug: "loot-vault",
      name: "Loot Vault",
      description: "In-game inventory assets, trading cards, and cosmetic rewards",
      category: AppCategory.GAME,
      status: AppStatus.BETA,
      url: "http://localhost:3000/apps/loot-vault",
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
      description: "Agile boards, automated sprint workflows, and project roadmap tracking",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/task-studio",
      icon: "KanbanSquare",
      color: "from-blue-500 to-indigo-600",
      minRole: Role.GUEST,
      orderIndex: 4,
      isFeatured: true,
    },
    {
      slug: "docs-notes",
      name: "Docs & Notes",
      description: "Real-time collaborative Markdown workspace and architectural docs",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/docs-notes",
      icon: "FileText",
      color: "from-emerald-500 to-teal-600",
      minRole: Role.GUEST,
      orderIndex: 5,
      isFeatured: false,
    },
    {
      slug: "metrics-deck",
      name: "Metrics Deck",
      description: "Live cluster metrics, performance telemetry, and system health status",
      category: AppCategory.WORK,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/metrics-deck",
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
      description: "Daily mindfulness routines, hydration logs, and focus timers",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/flow-habits",
      icon: "HeartPulse",
      color: "from-rose-500 to-pink-600",
      minRole: Role.GUEST,
      orderIndex: 7,
      isFeatured: true,
    },
    {
      slug: "lounge-audio",
      name: "Lounge Audio",
      description: "Curated Lo-Fi beats, chillroom ambient sounds, and sync'd playlist",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/lounge-audio",
      icon: "Headphones",
      color: "from-amber-500 to-orange-600",
      minRole: Role.GUEST,
      orderIndex: 8,
      isFeatured: false,
    },
    {
      slug: "community-feed",
      name: "Community Feed",
      description: "Events calendar, lifestyle photo shares, and creator highlights",
      category: AppCategory.LIFESTYLE,
      status: AppStatus.ONLINE,
      url: "http://localhost:3000/apps/community-feed",
      icon: "Sparkles",
      color: "from-pink-500 to-purple-500",
      minRole: Role.GUEST,
      orderIndex: 9,
      isFeatured: false,
    },
  ];

  for (const app of apps) {
    const createdApp = await prisma.appItem.create({ data: app });
    // Pin cyber arena and task studio for admin
    if (app.slug === "cyber-arena" || app.slug === "task-studio") {
      await prisma.userFavorite.create({
        data: {
          userId: admin.id,
          appId: createdApp.id,
        },
      });
    }
  }

  console.log(`✅ Seeded ${apps.length} applications across Lifestyle, Work, and Game categories.`);

  // 3. Create Sample Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: "Tournament Match Ready",
        message: "Your cyber arena match against PhantomSquad begins in 10 minutes.",
        sourceApp: "Cyber Arena",
        linkUrl: "http://localhost:3001",
        isRead: false,
      },
      {
        userId: admin.id,
        title: "Sprint Review Completed",
        message: "All 12 tickets in Sprint 42 have been reviewed and approved.",
        sourceApp: "Task Studio",
        linkUrl: "http://localhost:3000/apps/task-studio",
        isRead: false,
      },
      {
        userId: admin.id,
        title: "Daily Focus Streak: 7 Days!",
        message: "Congratulations! You have maintained your focus routine for 7 consecutive days.",
        sourceApp: "Flow Habits",
        linkUrl: "http://localhost:3000/apps/flow-habits",
        isRead: true,
      },
    ],
  });

  console.log("✅ Seeded initial notifications.");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
