"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  sourceApp: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string | Date;
}
export function NotificationDropdown({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(
    () => setNotifications(initialNotifications),
    [initialNotifications],
  );
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/notifications", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Unable to refresh notifications.");
        setNotifications((await res.json()).notifications);
        setError("");
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
      }
    }
    const interval = setInterval(refresh, 30000);
    const details = menu.current;
    function toggle() {
      if (details?.open) void refresh();
    }
    function outside(e: MouseEvent) {
      if (details && !details.contains(e.target as Node)) details.open = false;
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape" && details?.open) {
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    }
    details?.addEventListener("toggle", toggle);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      clearInterval(interval);
      controller.abort();
      details?.removeEventListener("toggle", toggle);
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  async function markRead(id?: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        "/api/notifications" + (id ? "?id=" + encodeURIComponent(id) : ""),
        { method: id ? "PATCH" : "PUT" },
      );
      if (!res.ok) throw new Error("Unable to mark notifications as read.");
      setNotifications((prev) =>
        prev.map((n) => (!id || n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const unread = notifications.filter((n) => !n.isRead).length;
  return (
    <details ref={menu} className="relative">
      <summary
        className="relative cursor-pointer list-none rounded-full p-2.5 text-zinc-300"
        aria-label={"Notifications" + (unread ? ", " + unread + " unread" : "")}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-rose-500 px-1 text-[10px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </summary>
      <section
        aria-label="Notifications"
        className="fixed left-4 right-4 top-24 z-50 sm:absolute sm:left-auto sm:top-auto sm:mt-3 sm:w-96 rounded-2xl border border-white/10 bg-[#111522] p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">Notifications</h2>
          <div className="flex gap-2">
            <button
              disabled={busy || !unread}
              onClick={() => markRead()}
              className="rounded-lg p-2 text-xs text-indigo-300 disabled:opacity-40"
            >
              <CheckCheck className="inline h-4 w-4" /> Read all
            </button>
            <button
              aria-label="Close notifications"
              className="rounded-lg p-2"
              onClick={() => {
                if (menu.current) menu.current.open = false;
                menu.current?.querySelector("summary")?.focus();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="mb-3 text-sm text-rose-300">
            {error}
          </p>
        )}
        <div className="max-h-[60dvh] space-y-2 overflow-y-auto">
          {!notifications.length && (
            <p className="py-8 text-center text-sm text-zinc-400">
              You are all caught up.
            </p>
          )}
          {notifications.map((n) => (
            <article
              key={n.id}
              className={
                "rounded-xl border p-3 " +
                (n.isRead
                  ? "border-white/5"
                  : "border-indigo-400/20 bg-indigo-400/5")
              }
            >
              <p className="text-[10px] uppercase tracking-wider text-indigo-300">
                {n.sourceApp}
              </p>
              <h3 className="mt-1 break-words text-sm font-medium">
                {n.title}
              </h3>
              <p className="mt-1 break-words text-xs leading-relaxed text-zinc-400">
                {n.message}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                {n.linkUrl && (
                  <a
                    href={n.linkUrl}
                    rel="noreferrer"
                    target="_blank"
                    className="text-xs text-indigo-300"
                  >
                    Open app ↗
                  </a>
                )}
                {!n.isRead && (
                  <button
                    disabled={busy}
                    onClick={() => markRead(n.id)}
                    className="rounded px-2 py-1 text-xs text-zinc-300 disabled:opacity-40"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </details>
  );
}
