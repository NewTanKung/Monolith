"use client";

import React from "react";
import {
  LayoutGrid,
  Gamepad2,
  Briefcase,
  HeartPulse,
  Star,
} from "lucide-react";

interface CategoryTabsProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  favoritesCount: number;
}

export function CategoryTabs({
  currentCategory,
  onSelectCategory,
  favoritesCount,
}: CategoryTabsProps) {
  const tabs = [
    { id: "ALL", label: "All Apps", icon: LayoutGrid },
    { id: "GAME", label: "Gaming", icon: Gamepad2, color: "text-cyan-400" },
    {
      id: "WORK",
      label: "Work & Tools",
      icon: Briefcase,
      color: "text-indigo-400",
    },
    {
      id: "LIFESTYLE",
      label: "Lifestyle",
      icon: HeartPulse,
      color: "text-rose-400",
    },
    {
      id: "FAVORITES",
      label: "Favorites",
      icon: Star,
      color: "text-amber-400",
      count: favoritesCount,
    },
  ];

  return (
    <div className="launcher-categories" aria-label="Filter services">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentCategory === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectCategory(tab.id)}
            className={`category-pill ${isActive ? "is-active" : ""}`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
