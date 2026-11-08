"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Shield, LogOut, UserRound, ChevronDown } from "lucide-react";
import { Avatar } from "../common/Avatar";
import { MonolithMark } from "../common/MonolithMark";
import { Popover } from "../common/Popover";
import { ThemeToggle } from "../common/Providers";
import { WaffleMenu } from "./WaffleMenu";
import {
  NotificationDropdown,
  type NotificationItem,
} from "./NotificationDropdown";
import { CommandPalette } from "../search/CommandPalette";
import { roleLabels } from "@/lib/display";
interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  icon: string;
  color: string;
  status: string;
}
interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MEMBER" | "GUEST";
  image?: string | null;
}
export function Navbar({
  user,
  apps,
  notifications,
  unreadCount,
  nextCursor,
  onSelectCategory,
}: {
  user: User | null;
  apps: App[];
  notifications: NotificationItem[];
  unreadCount: number;
  nextCursor: string | null;
  onSelectCategory?: (category: string) => void;
}) {
  const [search, setSearch] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    function keys(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((p) => !p);
      }
    }
    document.addEventListener("keydown", keys);
    return () => document.removeEventListener("keydown", keys);
  }, []);
  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/auth/logout", { method: "POST" });
      if (!r.ok) throw Error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
      window.location.assign("/login");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <header className="launcher-nav">
        <div className="launcher-nav-inner">
          <Link href="/" aria-label="หน้าแรก Monolith" className="brand-link">
            <MonolithMark className="brand-mark" />
          </Link>
          <div className="nav-controls">
            <ThemeToggle />
            <button
              className="icon-button"
              aria-label="ค้นหาแอป"
              onClick={() => setSearch(true)}
            >
              <Search size={20} aria-hidden="true" />
            </button>
            <div className="desktop-only">
              <WaffleMenu apps={apps} />
            </div>
            {user && (
              <NotificationDropdown
                initialNotifications={notifications}
                initialUnreadCount={unreadCount}
                initialNextCursor={nextCursor}
              />
            )}
            {user ? (
              <Popover
                label="เมนูบัญชี"
                profile
                trigger={
                  <span className="profile-trigger">
                    <Avatar name={user.name || user.email} />
                    <span className="profile-copy">
                      <span className="block max-w-[120px] truncate">
                        {user.name || user.email.split("@")[0]}
                      </span>
                      <small>{roleLabels[user.role]}</small>
                    </span>
                    <ChevronDown
                      size={14}
                      aria-hidden="true"
                      className="desktop-only"
                    />
                  </span>
                }
              >
                {(close) => (
                  <>
                    <div className="popover-title">
                      <div className="min-w-0">
                        <p className="font-medium break-words">
                          {user.name || "บัญชีของคุณ"}
                        </p>
                        <p className="text-muted text-xs break-all">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Link className="menu-link" href="/account" onClick={close}>
                      <UserRound size={18} aria-hidden="true" />
                      บัญชีและความปลอดภัย
                    </Link>
                    {user.role === "ADMIN" && (
                      <Link className="menu-link" href="/admin" onClick={close}>
                        <Shield size={18} aria-hidden="true" />
                        จัดการระบบ
                      </Link>
                    )}
                    <button
                      className="menu-link"
                      disabled={busy}
                      onClick={logout}
                    >
                      <LogOut size={18} aria-hidden="true" />
                      {busy ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
                    </button>
                    {error && (
                      <p role="alert" className="form-error">
                        {error}
                      </p>
                    )}
                  </>
                )}
              </Popover>
            ) : (
              <Link className="secondary-button" href="/login">
                เข้าสู่ระบบ
              </Link>
            )}
          </div>
        </div>
      </header>
      <CommandPalette
        apps={apps}
        isOpen={search}
        onClose={() => setSearch(false)}
        onSelectCategory={onSelectCategory}
      />
    </>
  );
}
