"use client";

import React, { useState, useEffect } from "react";
import { Search, X, ArrowRight, CornerDownLeft, Sparkles } from "lucide-react";
import { IconRenderer } from "../common/IconRenderer";

interface AppItemData {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  icon: string;
  color: string;
  status: string;
}

interface CommandPaletteProps {
  apps: AppItemData[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}

export function CommandPalette({ apps, isOpen, onClose, onSelectCategory }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent if listening, but here we can manage it
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredApps = apps.filter((app) => {
    const q = query.toLowerCase();
    return (
      app.name.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Spotlight Window */}
      <div className="relative w-full max-w-2xl rounded-2xl liquid-glass overflow-hidden shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-indigo-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps, games, workflows, or categories... (Press Esc to exit)"
            className="w-full bg-transparent text-white placeholder-zinc-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-zinc-400 hover:text-white mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-zinc-400 bg-white/10 rounded border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Quick Category Filters */}
        <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Jump:
          </span>
          {["GAME", "WORK", "LIFESTYLE"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                if (onSelectCategory) onSelectCategory(cat);
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg liquid-pill text-zinc-300 hover:text-white font-medium"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredApps.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No matching applications found for &quot;{query}&quot;
            </div>
          ) : (
            filteredApps.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target={app.url.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                onClick={onClose}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/10 group transition-all duration-150 border border-transparent hover:border-white/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center text-white shrink-0 shadow group-hover:scale-105 transition-transform`}
                  >
                    <IconRenderer name={app.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {app.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 uppercase">
                        {app.category}
                      </span>
                      {app.status === "MAINTENANCE" && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Maintenance
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate">{app.description}</p>
                  </div>
                </div>

                <div className="flex items-center text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-3">
                  <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Launch</span>
                  <CornerDownLeft className="w-4 h-4" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
