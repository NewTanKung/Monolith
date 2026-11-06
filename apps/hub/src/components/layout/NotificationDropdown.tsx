"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, ExternalLink, X } from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  sourceApp: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationDropdownProps {
  initialNotifications: NotificationItem[];
}

export function NotificationDropdown({ initialNotifications }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className={`relative p-2.5 rounded-full transition-all duration-200 ${
          isOpen
            ? "bg-white/20 text-white"
            : "text-zinc-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl liquid-glass p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="Mark all as read"
                  className="text-xs text-zinc-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Read all
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markSingleAsRead(item.id)}
                  className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                    item.isRead
                      ? "bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100"
                      : "bg-indigo-950/20 border-indigo-500/20 hover:bg-indigo-950/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                      {item.sourceApp}
                    </span>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-white mt-1">{item.title}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{item.message}</p>
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-300 hover:text-indigo-200 mt-2 font-medium"
                    >
                      Open in {item.sourceApp}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
