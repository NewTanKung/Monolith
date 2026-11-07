"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { ServiceTokens } from "@/components/admin/ServiceTokens";
import { ApiError } from "@/lib/client-api";
import { IconRenderer } from "@/components/common/IconRenderer";
interface AppRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "GAME" | "WORK" | "LIFESTYLE";
  status: "ONLINE" | "BETA" | "MAINTENANCE" | "DISABLED";
  url: string;
  icon: string;
  color: string;
  minRole: "GUEST" | "MEMBER" | "ADMIN";
  mode: "LINK" | "SSO";
  isFeatured: boolean;
  orderIndex: number;
}
type Form = Omit<AppRecord, "id">;
const blank: Form = {
  mode: "LINK",
  name: "",
  slug: "",
  description: "",
  category: "WORK",
  status: "ONLINE",
  url: "",
  icon: "LayoutGrid",
  color: "from-indigo-500 to-purple-600",
  minRole: "GUEST",
  orderIndex: 0,
  isFeatured: false,
};
const gradients = [
  "from-indigo-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-indigo-600",
  "from-amber-400 to-orange-500",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-purple-500",
];
export function AdminAppManager({ initialApps }: { initialApps: AppRecord[] }) {
  const [apps, setApps] = useState(initialApps);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tokenApp, setTokenApp] = useState<AppRecord | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  function field<K extends keyof Form>(key: K, value: Form[K]) {
    setFieldErrors((p) => ({ ...p, [key]: "" }));
    setForm((f) => ({ ...f, [key]: value }));
  }
  function edit(app?: AppRecord) {
    setEditing(app?.id || null);
    setForm(
      app
        ? {
            mode: app.mode,
            name: app.name,
            slug: app.slug,
            description: app.description,
            category: app.category,
            status: app.status,
            url: app.url,
            icon: app.icon,
            color: app.color,
            minRole: app.minRole,
            orderIndex: app.orderIndex,
            isFeatured: app.isFeatured,
          }
        : { ...blank },
    );
    setTokenApp(null);
    setFieldErrors({});
    setOpen(true);
    setError("");
    setNotice("");
  }
  async function request(method: string, body?: unknown, id?: string) {
    const response = await fetch(
      "/api/admin/apps" + (id ? "?id=" + encodeURIComponent(id) : ""),
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new ApiError(
        result.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่",
        result.code,
        result.fields,
      );
    return result;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request(
        editing ? "PUT" : "POST",
        editing ? { id: editing, ...form } : form,
      );
      setApps((prev) =>
        (editing
          ? prev.map((a) => (a.id === editing ? result.app : a))
          : [...prev, result.app]
        ).sort((a, b) => a.orderIndex - b.orderIndex),
      );
      setOpen(false);
      setNotice("บันทึกบริการแล้ว");
    } catch (e) {
      if (e instanceof ApiError) setFieldErrors(e.fields);
      setError(e instanceof Error ? e.message : "กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }
  async function change(app: AppRecord, remove = false) {
    if (
      busy ||
      (remove && !confirm("ลบ " + app.name + " ออกจากทะเบียนบริการ?"))
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (remove) {
        await request("DELETE", undefined, app.id);
        setApps((p) => p.filter((a) => a.id !== app.id));
        setNotice("ลบบริการแล้ว");
      } else {
        const { app: updated } = await request("PUT", {
          id: app.id,
          status: app.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE",
        });
        setApps((p) => p.map((a) => (a.id === updated.id ? updated : a)));
        setNotice("เปลี่ยนสถานะบริการแล้ว");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">ทะเบียนบริการ</h2>
          <p className="mt-1 text-sm text-zinc-400">
            จัดการบริการ สิทธิ์ และการเชื่อมต่อของคุณ
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => edit()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          เพิ่มบริการ
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {tokenApp && (
        <>
          <button
            className="text-sm text-teal-200"
            onClick={() => setTokenApp(null)}
          >
            ปิดการเชื่อมต่อ
          </button>
          <ServiceTokens
            key={tokenApp.id}
            appId={tokenApp.id}
            name={tokenApp.name}
          />
        </>
      )}
      {open && (
        <form onSubmit={save} className="liquid-glass rounded-2xl p-5 sm:p-7">
          <h3 className="mb-5 text-lg font-semibold">
            {editing ? "แก้ไขบริการ" : "เพิ่มบริการ"}
          </h3>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <label className="form-label">
              รูปแบบบริการ
              <select
                className="admin-input"
                value={form.mode}
                onChange={(e) => field("mode", e.target.value as Form["mode"])}
              >
                <option value="LINK">ลิงก์ทั่วไป</option>
                <option value="SSO">เชื่อม SSO</option>
              </select>
            </label>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-name">ชื่อบริการ</label>
              {fieldErrors.name && (
                <p role="alert" className="text-xs text-rose-200">
                  {fieldErrors.name}
                </p>
              )}
              <input
                id="app-name"
                className="admin-input"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-slug">ชื่อใน URL (slug)</label>
              {fieldErrors.slug && (
                <p role="alert" className="text-xs text-rose-200">
                  {fieldErrors.slug}
                </p>
              )}
              <input
                id="app-slug"
                className="admin-input"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                placeholder="my-application"
                value={form.slug}
                onChange={(e) => field("slug", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
              <label htmlFor="app-url-or-local-path">URL หรือ path ภายใน</label>
              {fieldErrors.url && (
                <p role="alert" className="text-xs text-rose-200">
                  {fieldErrors.url}
                </p>
              )}
              <input
                id="app-url-or-local-path"
                className="admin-input"
                required
                maxLength={2048}
                placeholder="https://app.example.com or /apps/my-app"
                value={form.url}
                onChange={(e) => field("url", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-category">หมวดหมู่</label>
              <select
                id="app-category"
                className="admin-input"
                value={form.category}
                onChange={(e) =>
                  field("category", e.target.value as Form["category"])
                }
              >
                {["WORK", "LIFESTYLE", "GAME"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-minimum-role">สิทธิ์ขั้นต่ำ</label>
              <select
                id="app-minimum-role"
                className="admin-input"
                value={form.minRole}
                onChange={(e) =>
                  field("minRole", e.target.value as Form["minRole"])
                }
              >
                {["GUEST", "MEMBER", "ADMIN"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-status">สถานะ</label>
              <select
                id="app-status"
                className="admin-input"
                value={form.status}
                onChange={(e) =>
                  field("status", e.target.value as Form["status"])
                }
              >
                {["ONLINE", "BETA", "MAINTENANCE", "DISABLED"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-display-order">ลำดับการแสดง</label>
              <input
                id="app-display-order"
                className="admin-input"
                type="number"
                min={0}
                max={10000}
                required
                value={form.orderIndex}
                onChange={(e) => field("orderIndex", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <p id="app-icon-label">ไอคอน</p>
              <div
                role="group"
                aria-label="เลือกไอคอน"
                className="flex flex-wrap gap-2"
              >
                {[
                  "LayoutGrid",
                  "Gamepad2",
                  "Briefcase",
                  "FileText",
                  "HeartPulse",
                  "Shield",
                  "Sparkles",
                  "Headphones",
                  "KanbanSquare",
                  "BarChart3",
                ].map((icon) => (
                  <button
                    type="button"
                    key={icon}
                    aria-label={icon}
                    aria-pressed={form.icon === icon}
                    onClick={() => field("icon", icon)}
                    className={
                      "rounded-xl border p-3 " +
                      (form.icon === icon
                        ? "border-teal-200 bg-teal-200/10"
                        : "border-white/10")
                    }
                  >
                    <IconRenderer name={icon} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-accent">สีไอคอน</label>
              <select
                id="app-accent"
                className="admin-input"
                value={form.color}
                onChange={(e) => field("color", e.target.value)}
              >
                {gradients.map((v, index) => (
                  <option key={v} value={v}>
                    {
                      [
                        "คราม → ม่วง",
                        "ฟ้า → น้ำเงิน",
                        "ชมพู → บานเย็น",
                        "เหลือง → ส้ม",
                        "เขียว → เขียวอมฟ้า",
                        "ม่วง → คราม",
                        "ทอง → ส้ม",
                        "น้ำเงิน → คราม",
                        "ม่วงอ่อน → ม่วง",
                        "ชมพู → ม่วง",
                      ][index]
                    }
                  </option>
                ))}
              </select>
              <div
                className="mt-3 flex items-center gap-3"
                aria-label="ตัวอย่างไอคอนบริการ"
              >
                <span
                  className={"rounded-xl bg-gradient-to-br p-3 " + form.color}
                >
                  <IconRenderer name={form.icon} className="h-6 w-6" />
                </span>
                <span className="text-xs text-zinc-400">
                  {form.name || "บริการของคุณ"}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
              <label htmlFor="app-description">รายละเอียด</label>
              {fieldErrors.description && (
                <p role="alert" className="text-xs text-rose-200">
                  {fieldErrors.description}
                </p>
              )}
              <textarea
                id="app-description"
                className="admin-input"
                maxLength={1000}
                rows={3}
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => field("isFeatured", e.target.checked)}
              />
              แสดงเป็นบริการแนะนำ
            </label>
          </fieldset>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-zinc-300"
            >
              ยกเลิก
            </button>
            <button
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก…" : "บันทึกบริการ"}
            </button>
          </div>
        </form>
      )}

      {!apps.length && (
        <div className="account-section md:hidden">
          <p>ยังไม่มีบริการ เพิ่มบริการแรกของคุณเพื่อเริ่มใช้งาน</p>
        </div>
      )}
      <div className="space-y-3 md:hidden">
        {apps.map((app) => (
          <article
            key={app.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  "shrink-0 rounded-xl bg-gradient-to-br p-2 " + app.color
                }
              >
                <IconRenderer name={app.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="break-words font-medium">{app.name}</h3>
                <p className="mt-1 break-all text-xs text-zinc-500">
                  {app.slug}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
              <p className="text-xs text-zinc-400">
                {app.minRole} / {app.status}
              </p>
              <div className="flex flex-wrap gap-2">
                {app.mode === "SSO" && (
                  <button
                    type="button"
                    disabled={busy}
                    className="secondary-button"
                    aria-label={"เชื่อมต่อ " + app.name}
                    onClick={() => {
                      setOpen(false);
                      setTokenApp(app);
                    }}
                  >
                    เชื่อมต่อ
                  </button>
                )}
                <button
                  disabled={busy}
                  aria-label={"แก้ไข " + app.name}
                  onClick={() => edit(app)}
                  className="rounded-lg bg-white/5 p-3"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  disabled={busy || app.status === "DISABLED"}
                  aria-label={
                    (app.status === "MAINTENANCE" ? "เปิดใช้ " : "ปรับปรุง ") +
                    app.name
                  }
                  onClick={() => change(app)}
                  className="rounded-lg bg-white/5 p-3 text-amber-300 disabled:opacity-40"
                >
                  <Wrench className="h-4 w-4" />
                </button>
                <button
                  disabled={busy}
                  aria-label={"ลบ " + app.name}
                  onClick={() => change(app, true)}
                  className="rounded-lg bg-white/5 p-3 text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">บริการและการตั้งค่าสิทธิ์</caption>
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              {["บริการ", "สิทธิ์", "สถานะ", "จัดการ"].map((v) => (
                <th key={v} scope="col" className="px-5 py-4">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {apps.map((app) => (
              <tr key={app.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "rounded-xl bg-gradient-to-br p-2 " + app.color
                      }
                    >
                      <IconRenderer name={app.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-zinc-400">{app.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-zinc-400">
                  {app.minRole}
                </td>
                <td className="px-5 py-4 text-xs text-zinc-400">
                  {app.status}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {app.mode === "SSO" && (
                      <button
                        type="button"
                        disabled={busy}
                        className="secondary-button"
                        aria-label={"เชื่อมต่อ " + app.name}
                        onClick={() => {
                          setOpen(false);
                          setTokenApp(app);
                        }}
                      >
                        เชื่อมต่อ
                      </button>
                    )}
                    <button
                      disabled={busy}
                      aria-label={"แก้ไข " + app.name}
                      onClick={() => edit(app)}
                      className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      disabled={busy || app.status === "DISABLED"}
                      aria-label={
                        (app.status === "MAINTENANCE"
                          ? "เปิดใช้ "
                          : "ปรับปรุง ") + app.name
                      }
                      onClick={() => change(app)}
                      className="rounded-lg p-2 text-amber-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Wrench className="h-4 w-4" />
                    </button>
                    <button
                      disabled={busy}
                      aria-label={"ลบ " + app.name}
                      onClick={() => change(app, true)}
                      className="rounded-lg p-2 text-rose-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!apps.length && (
          <p className="p-10 text-center text-zinc-400">
            ยังไม่มีบริการ เพิ่มบริการแรกของคุณเพื่อเริ่มใช้งาน
          </p>
        )}
      </div>
    </section>
  );
}
