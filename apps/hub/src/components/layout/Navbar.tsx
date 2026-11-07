"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Search, ShieldAlert, LogOut, Layers } from "lucide-react";
import { WaffleMenu } from "./WaffleMenu";
import { NotificationDropdown, NotificationItem } from "./NotificationDropdown";
import { CommandPalette } from "../search/CommandPalette";

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

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MEMBER" | "GUEST";
  image?: string | null;
}

interface NavbarProps {
  user: UserData | null;
  apps: AppItemData[];
  notifications: NotificationItem[];
  onSelectCategory?: (category: string) => void;
}

export function Navbar({
  user,
  apps,
  notifications,
  onSelectCategory,
}: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);
  const [logoutError, setLogoutError] = useState("");
  useEffect(() => {
    function keys(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (event.key === "Escape") setIsUserMenuOpen(false);
    }
    function outside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        setIsUserMenuOpen(false);
    }
    document.addEventListener("keydown", keys);
    document.addEventListener("mousedown", outside);
    return () => {
      document.removeEventListener("keydown", keys);
      document.removeEventListener("mousedown", outside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok)
        throw new Error("Unable to sign out. Please try again.");
      window.location.href = "/login";
    } catch (e) {
      setLogoutError(e instanceof Error ? e.message : "Please try again.");
    }
  };

  return (
    <>
      <header className="launcher-nav relative z-40 px-4 sm:px-8">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link
            href="/"
            aria-label="Monolith home"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-liquid-glow-indigo group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">
                  Monolith
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Hub
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:block tracking-wide">
                YOUR CONNECTED SPACE
              </span>
            </div>
          </Link>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
              aria-label="Search apps"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Waffle App Launcher */}
            <WaffleMenu apps={apps} />

            {/* Notifications Dropdown */}
            {user && (
              <NotificationDropdown initialNotifications={notifications} />
            )}

            {/* Admin Dashboard Link (For Admins) */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-pill text-xs font-semibold text-amber-300 border-amber-500/30 hover:bg-amber-500/10 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </Link>
            )}

            {/* User Profile Pill & Dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  aria-expanded={isUserMenuOpen}
                  aria-label="Account menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full liquid-pill group hover:border-white/20 transition-all"
                >
                  <img
                    src={
                      user.image ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                    }
                    alt={user.name || user.email}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-medium text-white max-w-[100px] truncate leading-tight">
                      {user.name || user.email.split("@")[0]}
                    </div>
                    <div className="text-[9px] font-bold text-indigo-400 uppercase leading-none">
                      {user.role}
                    </div>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl liquid-glass p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.name || "User"}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                        {user.role} Role
                      </span>
                    </div>

                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        Admin Dashboard
                      </Link>
                    )}

                    {logoutError && (
                      <p
                        role="alert"
                        className="px-3 py-2 text-xs text-rose-300"
                      >
                        {logoutError}
                      </p>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl liquid-glass text-white text-xs font-semibold shadow-liquid-glow-indigo hover:brightness-110 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Global Spotlight Palette */}
      <CommandPalette
        apps={apps}
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onSelectCategory={onSelectCategory}
      />
    </>
  );
}
