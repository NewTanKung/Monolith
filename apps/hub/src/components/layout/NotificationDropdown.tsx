"use client";
import { useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { requestJson } from "@/lib/client-api";
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  sourceApp: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string | Date;
}
interface Page {
  notifications: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}
export function NotificationDropdown({
  initialNotifications,
  initialUnreadCount = 0,
  initialNextCursor = null,
}: {
  initialNotifications: NotificationItem[];
  initialUnreadCount?: number;
  initialNextCursor?: string | null;
}) {
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [cursor, setCursor] = useState<string | null>(initialNextCursor);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const inFlight = useRef(false);
  async function refresh(next?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await requestJson<Page>(
        "/api/notifications" +
          (next ? "?cursor=" + encodeURIComponent(next) : ""),
      );
      setItems((previous) =>
        next
          ? [
              ...previous,
              ...data.notifications.filter(
                (n) => !previous.some((p) => p.id === n.id),
              ),
            ]
          : data.notifications,
      );
      setCursor(data.nextCursor);
      setUnread(data.unreadCount);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
    }
  }
  useEffect(() => {
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
    const interval = setInterval(() => {
      if (!document.hidden && !inFlight.current) void refresh();
    }, 30000);
    details?.addEventListener("toggle", toggle);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      clearInterval(interval);
      details?.removeEventListener("toggle", toggle);
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  async function mark(id?: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(
        "/api/notifications" + (id ? "?id=" + encodeURIComponent(id) : ""),
        id ? "PATCH" : "PUT",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details ref={menu} className="popover" name="workspace-navigation">
      <summary
        role="button"
        aria-label={"การแจ้งเตือน" + (unread ? ` ${unread} ยังไม่อ่าน` : "")}
        className="icon-button relative"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="notification-dot">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </summary>
      <section
        aria-label="รายการแจ้งเตือน"
        className="popover-panel liquid-glass"
      >
        <header className="popover-title">
          <h2 className="font-semibold">การแจ้งเตือน</h2>
          <div className="flex items-center gap-2">
            <button
              disabled={busy || !unread}
              className="text-xs text-accent disabled:opacity-40"
              onClick={() => mark()}
            >
              อ่านทั้งหมด
            </button>
            <button
              aria-label="ปิดการแจ้งเตือน"
              className="icon-button"
              onClick={() => {
                if (menu.current) menu.current.open = false;
                menu.current?.querySelector("summary")?.focus();
              }}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        {error && (
          <p role="alert" className="form-error">
            {error}
            <button className="ml-2 underline" onClick={() => refresh()}>
              ลองใหม่
            </button>
          </p>
        )}
        <div className="max-h-[60dvh] space-y-3 overflow-y-auto">
          {!items.length && (
            <p className="py-8 text-center text-sm text-muted">
              ยังไม่มีการแจ้งเตือน
            </p>
          )}
          {items.map((n) => (
            <article
              key={n.id}
              className={"notification-item " + (n.isRead ? "" : "font-medium")}
            >
              <p className="text-xs text-accent">
                {n.sourceApp}
                {!n.isRead && (
                  <span className="status-badge ml-2">ยังไม่อ่าน</span>
                )}
              </p>
              <h3 className="mt-1 break-words text-sm font-medium">
                {n.title}
              </h3>
              <p className="mt-1 break-words text-sm text-muted">{n.message}</p>
              <p className="mt-2 text-xs text-muted">
                {new Date(n.createdAt).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                })}
              </p>
              <div className="mt-3 flex justify-between gap-3">
                {n.linkUrl && (
                  <a
                    href={n.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-accent"
                  >
                    เปิดบริการ ↗
                  </a>
                )}
                {!n.isRead && (
                  <button
                    className="text-sm text-accent"
                    disabled={busy}
                    onClick={() => mark(n.id)}
                  >
                    อ่านแล้ว
                  </button>
                )}
              </div>
            </article>
          ))}
          {cursor && (
            <button
              className="secondary-button w-full"
              disabled={busy}
              onClick={() => refresh(cursor)}
            >
              โหลดแจ้งเตือนเพิ่มเติม
            </button>
          )}
        </div>
      </section>
    </details>
  );
}
