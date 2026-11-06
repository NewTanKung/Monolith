"use client";
import { useState } from "react";
import type { HubUser } from "@monolith/auth-client";
import { Navbar } from "../layout/Navbar";
import { HeroSection } from "./HeroSection";
import { AppGrid } from "./AppGrid";
import type { AppItemData } from "./AppCard";
import type { NotificationItem } from "../layout/NotificationDropdown";
export function HubDashboard({
  user,
  apps,
  notifications,
}: {
  user: HubUser | null;
  apps: AppItemData[];
  notifications: NotificationItem[];
}) {
  const [category, setCategory] = useState("ALL");
  return (
    <main id="main-content" className="min-h-dvh pb-16">
      <Navbar
        user={user}
        apps={apps}
        notifications={notifications}
        onSelectCategory={setCategory}
      />
      <HeroSection
        userName={user?.name || (user ? user.email.split("@")[0] : null)}
        totalApps={apps.length}
        onlineApps={
          apps.filter((a) => a.status === "ONLINE" || a.status === "BETA")
            .length
        }
      />
      <AppGrid
        initialApps={apps}
        selectedCategory={category}
        signedIn={!!user}
      />
    </main>
  );
}
