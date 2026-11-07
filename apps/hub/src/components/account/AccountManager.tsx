"use client";
import { useEffect, useState } from "react";
import type { HubUser } from "@monolith/auth-client";
import { requestJson } from "@/lib/client-api";
interface SessionInfo {
  id: string;
  device: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}
export function AccountManager({ user }: { user: HubUser }) {
  const [name, setName] = useState(user.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function refresh() {
    try {
      setSessions(
        (await requestJson<{ sessions: SessionInfo[] }>("/api/auth/sessions"))
          .sessions,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function submit(event: React.FormEvent, action: string, body: unknown) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson<{ message?: string }>(
        "/api/auth/" + action,
        "POST",
        body,
      );
      if (action === "change-password") {
        window.location.assign("/login");
        return;
      }
      setNotice(result.message || "บันทึกข้อมูลแล้ว");
      setCurrentPassword("");
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id?: string) {
    if (
      busy ||
      !window.confirm(
        id ? "ออกจากระบบอุปกรณ์นี้?" : "ออกจากระบบทุกอุปกรณ์ รวมเครื่องนี้?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const data = await requestJson<{ signedOut: boolean }>(
        "/api/auth/sessions" + (id ? "?id=" + encodeURIComponent(id) : ""),
        "DELETE",
      );
      if (data.signedOut) window.location.assign("/login");
      else {
        await refresh();
        setNotice("ออกจากระบบอุปกรณ์ที่เลือกแล้ว");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="form-success">
          {notice}
        </p>
      )}
      <section className="account-section">
        <h2>ข้อมูลบัญชี</h2>
        <p className="text-sm text-zinc-400">
          {user.email} · {user.role}
        </p>
        <form
          onSubmit={(e) => submit(e, "profile", { name })}
          className="mt-4 space-y-4"
        >
          <label className="form-label">
            ชื่อที่แสดง
            <input
              className="admin-input"
              value={name}
              required
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button disabled={busy} className="primary-button">
            บันทึกชื่อ
          </button>
        </form>
      </section>
      <section className="account-section">
        <h2>เปลี่ยนอีเมล</h2>
        <p className="text-sm text-zinc-400">
          ยืนยันอีเมลใหม่ก่อนเปลี่ยน จากนั้นต้องเข้าสู่ระบบใหม่
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) =>
            submit(e, "change-email", { email, currentPassword })
          }
        >
          <label className="form-label">
            อีเมลใหม่
            <input
              className="admin-input"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="form-label">
            รหัสผ่านปัจจุบันสำหรับเปลี่ยนอีเมล
            <input
              className="admin-input"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <button disabled={busy} className="primary-button">
            ส่งอีเมลยืนยัน
          </button>
        </form>
      </section>
      <section className="account-section">
        <h2>เปลี่ยนรหัสผ่าน</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) =>
            submit(e, "change-password", { currentPassword, password })
          }
        >
          <label className="form-label">
            รหัสผ่านปัจจุบัน
            <input
              className="admin-input"
              type="password"
              autoComplete="current-password"
              required
              maxLength={72}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="form-label">
            รหัสผ่านใหม่
            <input
              className="admin-input"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button disabled={busy} className="primary-button">
            เปลี่ยนรหัสผ่านและออกทุกอุปกรณ์
          </button>
        </form>
      </section>
      <section className="account-section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2>อุปกรณ์ที่เข้าสู่ระบบ</h2>
          <button
            className="secondary-button"
            disabled={busy}
            onClick={() => revoke()}
          >
            ออกทุกอุปกรณ์
          </button>
        </div>
        {loading ? (
          <p role="status">กำลังโหลด…</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm">
                    {s.current ? "เครื่องนี้" : "อุปกรณ์อื่น"}
                  </p>
                  <p
                    className="mt-1 truncate text-xs text-zinc-400"
                    title={s.device}
                  >
                    {s.device}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    หมดอายุ{" "}
                    {new Date(s.expiresAt).toLocaleString("th-TH", {
                      timeZone: "Asia/Bangkok",
                    })}
                  </p>
                </div>
                <button
                  disabled={busy}
                  className="secondary-button shrink-0"
                  onClick={() => revoke(s.id)}
                >
                  ออกจากระบบ
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="mt-3 text-sm text-teal-200" onClick={refresh}>
          โหลดรายการใหม่
        </button>
      </section>
    </div>
  );
}
