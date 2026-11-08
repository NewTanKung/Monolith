"use client";
import { useEffect, useState } from "react";
import type { HubUser } from "@monolith/auth-client";
import { requestJson } from "@/lib/client-api";
import Link from "next/link";
import { UserRound, ShieldCheck, Monitor } from "lucide-react";
import { useSection } from "@/lib/use-section";
import { useConfirm } from "../common/Dialog";
import { roleLabels, deviceLabel } from "@/lib/display";
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
  const [emailPassword, setEmailPassword] = useState("");
  const [section] = useSection(["profile", "security", "devices"], "profile");
  const confirm = useConfirm();
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
      if (action === "change-email") setEmailPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id?: string) {
    if (
      busy ||
      !(await confirm({
        title: id ? "ออกจากระบบอุปกรณ์นี้?" : "ออกจากระบบทุกอุปกรณ์?",
        description: id
          ? "อุปกรณ์นี้จะต้องเข้าสู่ระบบใหม่เพื่อใช้งานต่อ"
          : "ทุกอุปกรณ์รวมเครื่องนี้จะต้องเข้าสู่ระบบใหม่",
        confirmLabel: "ออกจากระบบ",
        danger: true,
      }))
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
    <div className="workspace-layout">
      <nav className="workspace-sidebar" aria-label="ส่วนบัญชี">
        <p className="sidebar-label">บัญชีของคุณ</p>
        {[
          ["profile", "ข้อมูลส่วนตัว", UserRound],
          ["security", "ความปลอดภัย", ShieldCheck],
          ["devices", "อุปกรณ์", Monitor],
        ].map(([key, label, Icon]) => {
          const Glyph = Icon as typeof UserRound;
          return (
            <Link
              key={String(key)}
              href={"?section=" + key}
              aria-current={section === key ? "page" : undefined}
            >
              <Glyph size={18} aria-hidden="true" />
              {String(label)}
            </Link>
          );
        })}
      </nav>
      <div className="workspace-content space-y-6">
        <header className="page-heading">
          <h1>บัญชีและความปลอดภัย</h1>
          <p>จัดการข้อมูลและการเข้าสู่ระบบของคุณ</p>
        </header>
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
        <section className="account-section" hidden={section !== "profile"}>
          <h2>ข้อมูลบัญชี</h2>
          <p className="text-sm text-muted">
            {user.email} · {roleLabels[user.role]}
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
                name="name"
                autoComplete="name"
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
        <section className="account-section" hidden={section !== "security"}>
          <h2>เปลี่ยนอีเมล</h2>
          <p className="text-sm text-muted">
            ยืนยันอีเมลใหม่ก่อนเปลี่ยน จากนั้นต้องเข้าสู่ระบบใหม่
          </p>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) =>
              submit(e, "change-email", {
                email,
                currentPassword: emailPassword,
              })
            }
          >
            <label className="form-label">
              อีเมลใหม่
              <input
                className="admin-input"
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
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
                value={emailPassword}
                name="current-email-password"
                onChange={(e) => setEmailPassword(e.target.value)}
              />
            </label>
            <button disabled={busy} className="primary-button">
              ส่งอีเมลยืนยัน
            </button>
          </form>
        </section>
        <section className="account-section" hidden={section !== "security"}>
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
                name="current-password"
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="form-label">
              รหัสผ่านใหม่
              <input
                className="admin-input"
                type="password"
                autoComplete="new-password"
                name="new-password"
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
        <section className="account-section" hidden={section !== "devices"}>
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
          ) : !sessions.length ? (
            <p className="text-muted mt-4">ไม่มีอุปกรณ์ที่ใช้งานอยู่</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
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
                      className="mt-1 truncate text-xs text-muted"
                      title={s.device}
                    >
                      {deviceLabel(s.device)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
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
          <button className="mt-3 text-sm text-accent" onClick={refresh}>
            โหลดรายการใหม่
          </button>
        </section>
      </div>
    </div>
  );
}
