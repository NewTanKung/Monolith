"use client";

import React, { useState } from "react";
import { Star, ExternalLink, AlertTriangle, Sparkles } from "lucide-react";
import { IconRenderer } from "../common/IconRenderer";

export interface AppItemData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "GAME" | "WORK" | "LIFESTYLE";
  status: "ONLINE" | "BETA" | "MAINTENANCE" | "DISABLED";
  url: string;
  icon: string;
  color: string;
  minRole: string;
  isFeatured: boolean;
  isFavorite?: boolean;
}

interface AppCardProps {
  app: AppItemData;
  onToggleFavorite?: (appId: string) => void;
}

export function AppCard({ app, onToggleFavorite }: AppCardProps) {
  const [isFav, setIsFav] = useState(app.isFavorite || false);
  const [isMaintenanceAlert, setIsMaintenanceAlert] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFav = !isFav;
    setIsFav(newFav);
    if (onToggleFavorite) onToggleFavorite(app.id);

    try {
      await fetch("/api/apps/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: app.id, favorite: newFav }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunch = (e: React.MouseEvent) => {
    if (app.status === "MAINTENANCE") {
      e.preventDefault();
      setIsMaintenanceAlert(true);
      setTimeout(() => setIsMaintenanceAlert(false), 3000);
      return;
    }
  };

  return (
    <div className="group relative rounded-2xl liquid-card p-5 flex flex-col justify-between overflow-hidden">
      {/* Background Ambient Glow on Hover */}
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full bg-gradient-to-br ${app.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 pointer-events-none`}
      />

      <div>
        {/* Top Header: Icon + Category Badge + Favorite Star */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-liquid-sm group-hover:scale-105 group-hover:shadow-liquid-glow-indigo transition-all duration-300`}
          >
            <IconRenderer name={app.icon} className="w-6 h-6" />
          </div>

          <div className="flex items-center gap-1.5">
            {/* Status Pill */}
            {app.status === "ONLINE" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            )}
            {app.status === "BETA" && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
                Beta
              </span>
            )}
            {app.status === "MAINTENANCE" && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-semibold text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                Maint.
              </span>
            )}

            {/* Favorite Pin Button */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              title={isFav ? "Unpin favorite" : "Pin as favorite"}
              aria-label="Pin as favorite"
              className={`p-1.5 rounded-lg transition-colors ${
                isFav
                  ? "text-amber-400 hover:text-amber-300 bg-amber-400/10"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
              {app.name}
            </h3>
            {app.isFeatured && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                <Sparkles className="w-2.5 h-2.5" /> Featured
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {app.description}
          </p>
        </div>
      </div>

      {/* Maintenance alert warning toast if clicked */}
      {isMaintenanceAlert && (
        <div className="mt-3 p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This app is currently undergoing scheduled maintenance.</span>
        </div>
      )}

      {/* Card Footer: Category tag + Launch Link */}
      <div className="mt-5 pt-3.5 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          {app.category}
        </span>

        <a
          href={app.url}
          onClick={handleLaunch}
          target={app.url.startsWith("http") ? "_blank" : "_self"}
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-xs font-medium text-white transition-all group-hover:bg-gradient-to-r group-hover:from-indigo-500/20 group-hover:to-purple-500/20"
        >
          <span>Open</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
        </a>
      </div>
    </div>
  );
}
