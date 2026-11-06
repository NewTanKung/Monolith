"use client";

import React, { useState, useRef, useEffect } from "react";
import { Grid, X } from "lucide-react";
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

interface WaffleMenuProps {
  apps: AppItemData[];
}

export function WaffleMenu({ apps }: WaffleMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", keys);
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", keys);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Group apps by category
  const categories = ["GAME", "WORK", "LIFESTYLE"] as const;

  return (
    <div className="relative" ref={menuRef}>
      {/* 9-Dot Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="App Launcher"
        aria-expanded={isOpen}
        className={`p-2.5 rounded-full transition-all duration-200 ${
          isOpen
            ? "bg-white/20 text-white shadow-liquid-glow-indigo"
            : "text-zinc-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <Grid className="w-5 h-5" />
      </button>

      {/* Floating Glass Popover */}
      {isOpen && (
        <div className="fixed left-4 right-4 top-24 sm:absolute sm:left-auto sm:top-auto sm:mt-3 sm:w-96 rounded-2xl liquid-glass p-5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold tracking-wide text-white uppercase">
                Monolith Suite
              </span>
            </div>
            <button
              aria-label="Close app launcher"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const catApps = apps.filter((a) => a.category === cat);
              if (catApps.length === 0) return null;

              return (
                <div key={cat}>
                  <div className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase mb-2">
                    {cat}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {catApps.map((app) => (
                      <a
                        key={app.id}
                        href={app.url}
                        target={app.url.startsWith("http") ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-200 group text-center"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200 mb-2`}
                        >
                          <IconRenderer name={app.icon} className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-zinc-200 truncate w-full group-hover:text-white">
                          {app.name}
                        </span>
                        {app.status === "MAINTENANCE" && (
                          <span className="text-[9px] text-amber-400 font-medium">
                            Maint.
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <span className="text-[11px] text-zinc-400">
              All internal services unified by Monolith SSO
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
