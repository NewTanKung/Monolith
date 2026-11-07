"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers } from "lucide-react";
import { ApiError, requestJson } from "@/lib/client-api";
type Mode = "login" | "verify" | "reset" | "forgot";
export function AuthForm({
  mode,
  continueUrl = "/",
}: {
  mode: Mode;
  continueUrl?: string;
}) {
  const [register, setRegister] = useState(false);
  const [token, setToken] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unverified, setUnverified] = useState(false);
  useEffect(() => {
    if (mode === "verify" || mode === "reset") {
      setToken(
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
      );
      window.history.replaceState(null, "", window.location.pathname);
    }
    setLoaded(true);
  }, [mode]);
  async function resend() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await requestJson<{ message: string }>(
        "/api/auth/resend-verification",
        "POST",
        { email },
      );
      setNotice(data.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const action =
      mode === "verify"
        ? "verify-email"
        : mode === "reset"
          ? "reset-password"
          : mode === "forgot"
            ? "forgot-password"
            : register
              ? "register"
              : "login";
    const body =
      mode === "verify"
        ? { token }
        : mode === "reset"
          ? { token, password }
          : mode === "forgot"
            ? { email }
            : register
              ? { name, email, password }
              : { email, password };
    try {
      const data = await requestJson<{ message?: string }>(
        "/api/auth/" + action,
        "POST",
        body,
      );
      if (action === "login") {
        window.location.assign(continueUrl);
        return;
      }
      setNotice(data.message || "ทำรายการสำเร็จ");
      setPassword("");
      if (action === "register") setUnverified(true);
      if (mode === "verify" || mode === "reset") setToken("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "ทำรายการไม่สำเร็จ");
      if (e instanceof ApiError && e.code === "EMAIL_UNVERIFIED")
        setUnverified(true);
    } finally {
      setBusy(false);
    }
  }
  const title =
    mode === "verify"
      ? "ยืนยันอีเมล"
      : mode === "reset"
        ? "ตั้งรหัสผ่านใหม่"
        : mode === "forgot"
          ? "ลืมรหัสผ่าน"
          : register
            ? "สร้างบัญชี Monolith"
            : "ยินดีต้อนรับกลับมา";
  return (
    <main id="main-content" className="account-shell">
      <section className="account-panel liquid-glass">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-teal-100"
        >
          <Layers size={22} /> Monolith
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mb-6 mt-3 text-sm leading-relaxed text-zinc-300">
          {mode === "verify"
            ? "กดยืนยันเพื่อใช้งานบัญชี ลิงก์ใช้ได้ครั้งเดียว"
            : mode === "reset"
              ? "ตั้งรหัสใหม่อย่างน้อย 12 ตัวอักษร ระบบจะออกจากบัญชีทุกอุปกรณ์"
              : mode === "forgot"
                ? "รับลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล"
                : "บัญชีเดียวสำหรับทุกบริการของคุณ"}
        </p>
        {mode === "login" && (
          <div className="mb-6 flex gap-2" aria-label="เลือกวิธีเข้าใช้งาน">
            {[false, true].map((value) => (
              <button
                type="button"
                key={String(value)}
                aria-pressed={register === value}
                className={
                  "category-pill " + (register === value ? "is-active" : "")
                }
                onClick={() => {
                  setRegister(value);
                  setError("");
                  setNotice("");
                  setUnverified(false);
                }}
              >
                {value ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              </button>
            ))}
          </div>
        )}
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
        {(mode === "login" || mode === "forgot" || token) && (
          <form onSubmit={submit} className="space-y-4">
            <fieldset disabled={busy} className="space-y-4">
              {register && mode === "login" && (
                <label className="form-label">
                  ชื่อที่แสดง
                  <input
                    className="admin-input"
                    autoComplete="name"
                    required
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              )}
              {(mode === "login" || mode === "forgot") && (
                <label className="form-label">
                  อีเมล
                  <input
                    className="admin-input"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              {(mode === "login" || mode === "reset") && (
                <label className="form-label">
                  {mode === "reset" ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
                  <input
                    aria-label={mode === "reset" ? "รหัสผ่านใหม่" : "รหัสผ่าน"}
                    aria-describedby={
                      register || mode === "reset" ? "password-help" : undefined
                    }
                    className="admin-input"
                    type="password"
                    autoComplete={
                      register || mode === "reset"
                        ? "new-password"
                        : "current-password"
                    }
                    minLength={register || mode === "reset" ? 12 : 1}
                    maxLength={72}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {(register || mode === "reset") && (
                    <span id="password-help" className="text-xs text-zinc-400">
                      อย่างน้อย 12 ตัวอักษร และไม่เกิน 72 bytes
                    </span>
                  )}
                </label>
              )}
              <button className="primary-button w-full" disabled={busy}>
                {busy
                  ? "กำลังดำเนินการ…"
                  : mode === "verify"
                    ? "ยืนยันอีเมลนี้"
                    : mode === "reset"
                      ? "บันทึกรหัสผ่านใหม่"
                      : mode === "forgot"
                        ? "ส่งลิงก์กู้รหัสผ่าน"
                        : register
                          ? "สมัครและรับอีเมลยืนยัน"
                          : "เข้าสู่ระบบ"}
              </button>
            </fieldset>
          </form>
        )}
        {loaded &&
          (mode === "verify" || mode === "reset") &&
          !token &&
          !notice && (
            <p className="form-error">
              ไม่พบลิงก์ที่ใช้ได้ กรุณาขอลิงก์ใหม่จากหน้าเข้าสู่ระบบ
            </p>
          )}
        {unverified && (
          <button
            type="button"
            disabled={busy || !email}
            className="secondary-button mt-4 w-full"
            onClick={resend}
          >
            ส่งอีเมลยืนยันอีกครั้ง
          </button>
        )}
        <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm text-teal-200">
          <Link href="/">กลับหน้า Hub</Link>
          {mode === "login" ? (
            <Link href="/forgot-password">ลืมรหัสผ่าน?</Link>
          ) : (
            <Link href="/login">เข้าสู่ระบบ / ขออีเมลยืนยันใหม่</Link>
          )}
        </div>
      </section>
    </main>
  );
}
