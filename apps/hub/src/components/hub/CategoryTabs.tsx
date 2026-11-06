"use client";

import React from "react";
import { LayoutGrid, Gamepad2, Briefcase, HeartPulse, Star } from "lucide-react";

interface CategoryTabsProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  favoritesCount: number;
}

export function CategoryTabs({ currentCategory, onSelectCategory, favoritesCount }: CategoryTabsProps) {
  const tabs = [
    { id: "ALL", label: "All Apps", icon: LayoutGrid },
    { id: "GAME", label: "Gaming", icon: Gamepad2, color: "text-cyan-400" },
    { id: "WORK", label: "Work & Tools", icon: Briefcase, color: "text-indigo-400" },
    { id: "LIFESTYLE", label: "Lifestyle", icon: HeartPulse, color: "text-rose-400" },
    { id: "FAVORITES", label: "Favorites", icon: Star, color: "text-amber-400", count: favoritesCount },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentCategory === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectCategory(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 ${
              isActive
                ? "bg-white/20 text-white shadow-liquid-sm border border-white/25"
                : "liquid-pill text-zinc-400 hover:text-white"
            }`}
          >
            <Icon className={`w-4 h-4 ${tab.color || ""}`} />
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
