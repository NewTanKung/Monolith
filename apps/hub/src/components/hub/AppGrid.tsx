"use client";

import React, { useState } from "react";
import { AppCard, AppItemData } from "./AppCard";
import { CategoryTabs } from "./CategoryTabs";
import { Star } from "lucide-react";

interface AppGridProps {
  initialApps: AppItemData[];
  selectedCategory?: string;
}

export function AppGrid({ initialApps, selectedCategory = "ALL" }: AppGridProps) {
  const [apps, setApps] = useState<AppItemData[]>(initialApps);
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory);

  const handleToggleFavorite = (appId: string) => {
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, isFavorite: !app.isFavorite } : app))
    );
  };

  const favoriteApps = apps.filter((a) => a.isFavorite);

  // Filter based on active category
  const filteredApps = apps.filter((app) => {
    if (activeCategory === "FAVORITES") return app.isFavorite;
    if (activeCategory === "ALL") return true;
    return app.category === activeCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
      {/* Category Tabs */}
      <div className="flex items-center justify-between">
        <CategoryTabs
          currentCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          favoritesCount={favoriteApps.length}
        />
      </div>

      {/* Pinned / Favorites Section (Only when viewing "ALL" and there are favorites) */}
      {activeCategory === "ALL" && favoriteApps.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Pinned Favorites
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {favoriteApps.map((app) => (
              <AppCard key={`fav-${app.id}`} app={app} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* Main Apps Grid */}
      <section className="space-y-4">
        {activeCategory === "ALL" && favoriteApps.length > 0 && (
          <div className="flex items-center gap-2 pt-4 border-t border-white/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              All Applications
            </h2>
          </div>
        )}

        {filteredApps.length === 0 ? (
          <div className="rounded-2xl liquid-glass py-16 px-4 text-center">
            <p className="text-zinc-400 text-sm">
              {activeCategory === "FAVORITES"
                ? "No favorite apps pinned yet. Click the star icon on any app to pin it here."
                : `No applications found in the ${activeCategory} category.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
