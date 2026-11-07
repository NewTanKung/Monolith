"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Avatar } from "../common/Avatar";
import { MonolithMark } from "../common/MonolithMark";
import { Search, ShieldAlert, LogOut } from "lucide-react";
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
  unreadCount: number;
  nextCursor: string | null;
  onSelectCategory?: (category: string) => void;
}

export function Navbar({
  user,
  apps,
  notifications,
  onSelectCategory,
  unreadCount,
  nextCursor,
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
      if (!response.ok) throw new Error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
      window.location.href = "/login";
    } catch (e) {
      setLogoutError(e instanceof Error ? e.message : "กรุณาลองใหม่");
    }
  };

  return (
    <>
      <header className="launcher-nav relative z-40 px-4 sm:px-8">
        <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-4">
          {/* Home logo */}
          <Link
            href="/"
            aria-label="หน้าแรก Monolith"
            className="brand-link flex items-center shrink-0"
          >
            <MonolithMark className="brand-mark" />
          </Link>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
              aria-label="ค้นหาแอป"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Waffle App Launcher */}
            <WaffleMenu apps={apps} />

            {/* Notifications Dropdown */}
            {user && (
              <NotificationDropdown
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
                initialNextCursor={nextCursor}
              />
            )}

            {/* จัดการระบบ Link (For ผู้ดูแลs) */}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-pill text-xs font-semibold text-amber-300 border-amber-500/30 hover:bg-amber-500/10 transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>ผู้ดูแล</span>
              </Link>
            )}

            {/* User Profile Pill & Dropdown */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  aria-expanded={isUserMenuOpen}
                  aria-label="เมนูบัญชี"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full liquid-pill group hover:border-white/20 transition-all"
                >
                  <Avatar name={user.name || user.email} />
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

                    <Link
                      href="/account"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm hover:bg-white/10"
                    >
                      บัญชีและความปลอดภัย
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        จัดการระบบ
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
                      ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl liquid-glass text-white text-xs font-semibold shadow-liquid-glow-indigo hover:brightness-110 transition-all"
              >
                เข้าสู่ระบบ
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
