"use client";
import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wrench,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import { ServiceTokens } from "@/components/admin/ServiceTokens";
import { Dialog, useConfirm } from "@/components/common/Dialog";
import { IconRenderer } from "@/components/common/IconRenderer";
import { ApiError } from "@/lib/client-api";
import { categoryLabels, roleLabels, statusLabels } from "@/lib/display";
export interface AppRecord {
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
const colors = [
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
];
export function AdminAppManager({
  initialApps,
  hubUrl,
}: {
  initialApps: AppRecord[];
  hubUrl: string;
}) {
  const [apps, setApps] = useState(initialApps);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const initial = useRef<Form>(blank);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [tokenApp, setTokenApp] = useState<AppRecord | null>(null);
  const [uncopiedToken, setUncopiedToken] = useState(false);
  const confirm = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(hubUrl);
  const dirty =
    open && JSON.stringify(form) !== JSON.stringify(initial.current);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function field<K extends keyof Form>(key: K, value: Form[K]) {
    setFields((p) => ({ ...p, [key]: "" }));
    setForm((p) => ({ ...p, [key]: value }));
  }
  async function canLeaveConnection() {
    return (
      !uncopiedToken ||
      (await confirm({
        title: "คัดลอก token แล้วหรือยัง?",
        description: "เมื่อเปลี่ยนส่วนที่กำลังเปิด จะดูรหัสเต็มเดิมอีกไม่ได้",
        confirmLabel: "เปลี่ยนส่วนที่เปิด",
      }))
    );
  }
  async function edit(app?: AppRecord) {
    if (!(await canLeaveConnection())) return;
    setUncopiedToken(false);
    const value = app ? { ...app } : { ...blank };
    setEditing(app?.id || null);
    setForm(value);
    initial.current = value;
    setFields({});
    setStep(0);
    setError("");
    setNotice("");
    setTokenApp(null);
    setOpen(true);
  }
  async function close() {
    if (busy) return;
    if (
      dirty &&
      !(await confirm({
        title: "ปิดโดยไม่บันทึก?",
        description: "ข้อมูลที่แก้ไขในฟอร์มนี้จะไม่ถูกบันทึก",
        confirmLabel: "ปิดฟอร์ม",
        danger: true,
      }))
    )
      return;
    setOpen(false);
  }
  function focusField(key: string) {
    requestAnimationFrame(() =>
      document
        .getElementById("app-" + (key === "url" ? "url-or-local-path" : key))
        ?.focus(),
    );
  }
  function next() {
    const errors: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) errors.name = "กรุณากรอกชื่อบริการ";
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
        errors.slug = "ใช้ตัวอังกฤษเล็ก ตัวเลข และขีดกลาง เช่น e-pocket";
    } else {
      let valid: boolean;
      try {
        const u = new URL(form.url);
        valid =
          ["http:", "https:"].includes(u.protocol) &&
          !u.username &&
          !u.password;
      } catch {
        valid =
          form.mode === "LINK" &&
          form.url.startsWith("/") &&
          !form.url.startsWith("//") &&
          !form.url.includes("\\");
      }
      if (!valid)
        errors.url =
          form.mode === "SSO"
            ? "กรุณากรอก URL เต็ม เช่น http://localhost:3001"
            : "กรุณากรอก URL หรือ path ที่ถูกต้อง";
    }
    setFields(errors);
    if (Object.keys(errors).length) {
      focusField(Object.keys(errors)[0]);
      return;
    }
    setStep((p) => Math.min(p + 1, 2));
  }
  async function request(method: string, body?: unknown, id?: string) {
    const r = await fetch(
      "/api/admin/apps" + (id ? "?id=" + encodeURIComponent(id) : ""),
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const data = await r.json();
    if (!r.ok)
      throw new ApiError(
        data.error || "บันทึกไม่สำเร็จ กรุณาลองใหม่",
        data.code,
        data.fields,
      );
    return data;
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (step < 2) {
      next();
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload: Form = {
        mode: form.mode,
        name: form.name,
        slug: form.slug,
        description: form.description,
        category: form.category,
        status: form.status,
        url: form.url,
        icon: form.icon,
        color: form.color,
        minRole: form.minRole,
        isFeatured: form.isFeatured,
        orderIndex: form.orderIndex,
      };
      const { app } = await request(
        editing ? "PUT" : "POST",
        editing ? { id: editing, ...payload } : payload,
      );
      setApps((p) =>
        (editing
          ? p.map((a) => (a.id === editing ? app : a))
          : [...p, app]
        ).sort((a, b) => a.orderIndex - b.orderIndex),
      );
      setOpen(false);
      setNotice("บันทึกบริการแล้ว");
      if (app.mode === "SSO") setTokenApp(app);
    } catch (e) {
      const errors =
        e instanceof ApiError
          ? Object.keys(e.fields).length
            ? e.fields
            : e.code === "INVALID_SERVICE_URL"
              ? { url: e.message }
              : {}
          : {};
      if (Object.keys(errors).length) {
        setFields(errors);
        const key = Object.keys(errors)[0];
        setStep(
          ["name", "slug", "description", "icon", "color", "category"].includes(
            key,
          )
            ? 0
            : 1,
        );
        focusField(key);
      }
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function change(app: AppRecord, remove = false) {
    if (busy) return;
    if (
      remove &&
      !(await confirm({
        title: "ลบ " + app.name + "?",
        description: "บริการจะหายจาก Hub และ token ของบริการนี้จะใช้ไม่ได้",
        confirmLabel: "ลบบริการ",
        danger: true,
      }))
    )
      return;
    setBusy(true);
    setError("");
    try {
      if (remove) {
        await request("DELETE", undefined, app.id);
        setApps((p) => p.filter((a) => a.id !== app.id));
        setNotice("ลบบริการแล้ว");
        if (tokenApp?.id === app.id) setTokenApp(null);
      } else {
        const { app: updated } = await request("PUT", {
          id: app.id,
          status: app.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE",
        });
        setApps((p) => p.map((a) => (a.id === app.id ? updated : a)));
        setNotice("เปลี่ยนสถานะบริการแล้ว");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function input(
    key: "name" | "slug" | "url" | "description",
    label: string,
    help?: string,
  ) {
    const id = "app-" + (key === "url" ? "url-or-local-path" : key);
    return (
      <label
        className={
          "form-label " +
          (key === "description" || key === "url" ? "field-full" : "")
        }
        htmlFor={id}
      >
        {label}
        {key === "description" ? (
          <textarea
            id={id}
            aria-label={label}
            name={key}
            className="admin-input"
            value={form[key]}
            rows={3}
            maxLength={1000}
            onChange={(e) => field(key, e.target.value)}
          />
        ) : (
          <input
            id={id}
            aria-label={label}
            name={key}
            className="admin-input"
            value={form[key]}
            required
            maxLength={key === "name" ? 100 : key === "slug" ? 80 : 2048}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!fields[key]}
            aria-describedby={fields[key] ? id + "-error" : id + "-help"}
            onChange={(e) => field(key, e.target.value)}
            placeholder={
              key === "slug"
                ? "e-pocket"
                : key === "url"
                  ? local
                    ? "http://localhost:3001"
                    : "https://service.example.com"
                  : undefined
            }
          />
        )}
        <span id={id + "-help"} className="field-help">
          {help}
        </span>
        {fields[key] && (
          <span id={id + "-error"} role="alert" className="field-error">
            {fields[key]}
          </span>
        )}
      </label>
    );
  }
  function actions(app: AppRecord) {
    return (
      <div className="row-actions">
        {app.mode === "SSO" && (
          <button
            className="secondary-button"
            disabled={busy}
            aria-label={"เชื่อมต่อ " + app.name}
            onClick={async () => {
              if (tokenApp?.id !== app.id && !(await canLeaveConnection()))
                return;
              setTokenApp(app);
              setOpen(false);
            }}
          >
            เชื่อมต่อ
          </button>
        )}
        <button
          className="icon-button"
          disabled={busy}
          aria-label={"แก้ไข " + app.name}
          onClick={() => edit(app)}
        >
          <Pencil size={17} />
        </button>
        <button
          className="icon-button"
          disabled={busy || app.status === "DISABLED"}
          aria-label={
            (app.status === "MAINTENANCE" ? "เปิดใช้ " : "ปรับปรุง ") + app.name
          }
          onClick={() => change(app)}
        >
          <Wrench size={17} />
        </button>
        <button
          className="icon-button"
          disabled={busy}
          aria-label={"ลบ " + app.name}
          onClick={() => change(app, true)}
        >
          <Trash2 size={17} />
        </button>
      </div>
    );
  }
  return (
    <section>
      <div className="section-header">
        <div>
          <h2>ทะเบียนบริการ</h2>
          <p className="section-copy">บริการ สิทธิ์ และการเชื่อมต่อของคุณ</p>
        </div>
        <button
          className="primary-button"
          disabled={busy}
          onClick={() => edit()}
        >
          <Plus size={18} aria-hidden="true" />
          เพิ่มบริการ
        </button>
      </div>
      {!open && error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="form-success">
          {notice}
        </p>
      )}
      {tokenApp && (
        <div className="mb-8">
          <ServiceTokens
            key={tokenApp.id}
            appId={tokenApp.id}
            name={tokenApp.name}
            serviceUrl={tokenApp.url}
            hubUrl={hubUrl}
            onUncopiedSecretChange={setUncopiedToken}
            onClose={() => {
              setTokenApp(null);
              setUncopiedToken(false);
            }}
          />
        </div>
      )}
      {!apps.length ? (
        <div className="services-empty">
          <h3>เริ่มจากบริการแรกของคุณ</h3>
          <p>เพิ่มลิงก์เว็บไซต์ หรือเชื่อมบริการที่ใช้บัญชี Monolith ร่วมกัน</p>
          <button className="primary-button mt-5" onClick={() => edit()}>
            เพิ่มบริการแรก
          </button>
        </div>
      ) : (
        <>
          <div className="data-table-wrap desktop-only">
            <table className="data-table">
              <caption className="sr-only">บริการและการตั้งค่าสิทธิ์</caption>
              <thead>
                <tr>
                  {["บริการ", "สิทธิ์", "สถานะ", "จัดการ"].map((s) => (
                    <th key={s} scope="col">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app.id}>
                    <td className="name-cell">
                      <div className="service-identity">
                        <span
                          className={
                            "service-icon-color bg-gradient-to-br " + app.color
                          }
                        >
                          <IconRenderer
                            name={app.icon}
                            className="w-5 h-5 text-white"
                          />
                        </span>
                        <div>
                          <h3>{app.name}</h3>
                          <small>
                            {app.slug} ·{" "}
                            {app.mode === "SSO" ? "เชื่อม SSO" : "ลิงก์ทั่วไป"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{roleLabels[app.minRole]}</td>
                    <td>
                      <span
                        className={
                          "status-badge " +
                          (app.status === "MAINTENANCE"
                            ? "status-warning"
                            : app.status === "DISABLED"
                              ? ""
                              : "status-positive")
                        }
                      >
                        {statusLabels[app.status]}
                      </span>
                    </td>
                    <td>{actions(app)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-only space-y-3">
            {apps.map((app) => (
              <article key={app.id} className="surface-panel">
                <div className="service-identity">
                  <span
                    className={
                      "service-icon-color bg-gradient-to-br " + app.color
                    }
                  >
                    <IconRenderer
                      name={app.icon}
                      className="w-5 h-5 text-white"
                    />
                  </span>
                  <div>
                    <h3>{app.name}</h3>
                    <small>{app.slug}</small>
                  </div>
                </div>
                <p className="my-4 text-muted text-xs">
                  {roleLabels[app.minRole]} · {statusLabels[app.status]}
                </p>
                {actions(app)}
              </article>
            ))}
          </div>
        </>
      )}
      <Dialog
        open={open}
        title={editing ? "แก้ไขบริการ" : "เพิ่มบริการ"}
        onClose={() => void close()}
        wide
      >
        <form
          ref={formRef}
          onSubmit={save}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="dialog-body">
            <ol className="wizard-steps">
              {["ข้อมูลบริการ", "ปลายทางและสิทธิ์", "ตรวจทาน"].map(
                (label, index) => (
                  <li
                    key={label}
                    aria-current={step === index ? "step" : undefined}
                  >
                    <span>
                      {step > index ? <Check size={14} /> : index + 1}
                    </span>
                    {label}
                  </li>
                ),
              )}
            </ol>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <fieldset disabled={busy} className="space-y-6">
              {step === 0 ? (
                <>
                  <div className="field-grid">
                    {input("name", "ชื่อบริการ", "ชื่อที่จะแสดงบนหน้า Hub")}
                    {input(
                      "slug",
                      "ชื่อใน URL (slug)",
                      "ใช้ภาษาอังกฤษตัวเล็ก เช่น e-pocket",
                    )}
                    {input(
                      "description",
                      "รายละเอียด",
                      "บอกสั้น ๆ ว่าบริการนี้ใช้ทำอะไร",
                    )}
                    <label className="form-label">
                      หมวดหมู่
                      <select
                        className="admin-input"
                        value={form.category}
                        onChange={(e) =>
                          field("category", e.target.value as Form["category"])
                        }
                      >
                        {Object.entries(categoryLabels).map(([v, label]) => (
                          <option key={v} value={v}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="form-label">
                      สีไอคอน
                      <select
                        className="admin-input"
                        value={form.color}
                        onChange={(e) => field("color", e.target.value)}
                      >
                        {gradients.map((v, i) => (
                          <option key={v} value={v}>
                            {colors[i]}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div>
                    <p className="form-label mb-2">ไอคอน</p>
                    <div
                      className="icon-picker"
                      role="group"
                      aria-label="เลือกไอคอน"
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
                          key={icon}
                          type="button"
                          aria-label={icon}
                          aria-pressed={form.icon === icon}
                          onClick={() => field("icon", icon)}
                        >
                          <IconRenderer name={icon} className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div
                    className="help-panel service-identity"
                    aria-label="ตัวอย่างไอคอนบริการ"
                  >
                    <span
                      className={
                        "service-icon-color bg-gradient-to-br " + form.color
                      }
                    >
                      <IconRenderer
                        name={form.icon}
                        className="w-6 h-6 text-white"
                      />
                    </span>
                    <div>
                      <h3>{form.name || "บริการของคุณ"}</h3>
                      <p>{categoryLabels[form.category]}</p>
                    </div>
                  </div>
                </>
              ) : step === 1 ? (
                <>
                  <div>
                    <p className="form-label mb-3">รูปแบบบริการ</p>
                    <div className="choice-grid">
                      {[
                        [
                          "LINK",
                          "ลิงก์ทั่วไป",
                          "เปิดเว็บไซต์ ไม่ต้องเชื่อมบัญชี",
                        ],
                        [
                          "SSO",
                          "เชื่อม SSO",
                          "ใช้บัญชี Monolith กับบริการของคุณ",
                        ],
                      ].map(([v, label, help]) => (
                        <label key={v} className="choice-option">
                          <input
                            type="radio"
                            name="service-mode"
                            value={v}
                            checked={form.mode === v}
                            onChange={() => field("mode", v as Form["mode"])}
                          />
                          <span>
                            {label}
                            <small>{help}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {input(
                    "url",
                    "URL หรือ path ภายใน",
                    local
                      ? "ใส่ URL ที่บริการรันอยู่ เช่น http://localhost:3001 เปลี่ยนพอร์ตให้ตรงกับบริการของคุณ"
                      : form.mode === "SSO"
                        ? "ใช้ HTTPS และ subdomain ภายใต้โดเมนที่ตั้งไว้"
                        : "ใช้ URL เต็ม หรือ path ภายในเว็บ",
                  )}
                  <label className="form-label">
                    สิทธิ์ขั้นต่ำ
                    <select
                      className="admin-input"
                      value={form.minRole}
                      onChange={(e) =>
                        field("minRole", e.target.value as Form["minRole"])
                      }
                    >
                      {Object.entries(roleLabels).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label} ({v})
                        </option>
                      ))}
                    </select>
                  </label>
                  {form.mode === "SSO" && (
                    <div className="help-panel">
                      <h3>เพิ่มรายการแล้ว ต้องเชื่อมฝั่งบริการด้วย</h3>
                      <p>
                        หลังบันทึก จะมีขั้นตอนสร้าง token และนำไปตั้งค่าใน
                        server ของบริการ เช่น E-Pocket
                      </p>
                    </div>
                  )}
                  <details>
                    <summary className="text-accent py-2">
                      ตัวเลือกเพิ่มเติม
                    </summary>
                    <div className="field-grid mt-3">
                      <label className="form-label">
                        สถานะ
                        <select
                          className="admin-input"
                          value={form.status}
                          onChange={(e) =>
                            field("status", e.target.value as Form["status"])
                          }
                        >
                          {Object.entries(statusLabels).map(([v, label]) => (
                            <option key={v} value={v}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-label">
                        ลำดับการแสดง
                        <input
                          className="admin-input"
                          type="number"
                          min={0}
                          max={10000}
                          value={form.orderIndex}
                          onChange={(e) =>
                            field("orderIndex", Number(e.target.value))
                          }
                        />
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.isFeatured}
                          onChange={(e) =>
                            field("isFeatured", e.target.checked)
                          }
                        />
                        แสดงเป็นบริการแนะนำ
                      </label>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="service-identity mb-6">
                    <span
                      className={
                        "service-icon-color bg-gradient-to-br " + form.color
                      }
                    >
                      <IconRenderer
                        name={form.icon}
                        className="w-6 h-6 text-white"
                      />
                    </span>
                    <div>
                      <h3>{form.name}</h3>
                      <small>{form.slug}</small>
                    </div>
                  </div>
                  <dl className="review-list">
                    {[
                      [
                        "รูปแบบ",
                        form.mode === "SSO" ? "เชื่อม SSO" : "ลิงก์ทั่วไป",
                      ],
                      ["ปลายทาง", form.url],
                      ["หมวดหมู่", categoryLabels[form.category]],
                      ["สิทธิ์ขั้นต่ำ", roleLabels[form.minRole]],
                      ["สถานะ", statusLabels[form.status]],
                    ].map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {editing &&
                    (form.url !== initial.current.url ||
                      form.mode !== initial.current.mode ||
                      form.status === "DISABLED") && (
                      <p className="help-panel mt-6">
                        การเปลี่ยนปลายทาง รูปแบบ หรือปิดบริการ จะยกเลิก token
                        เดิมที่เชื่อมอยู่
                      </p>
                    )}
                </>
              )}
            </fieldset>
          </div>
          <footer className="dialog-actions">
            <button
              type="button"
              className="secondary-button mr-auto"
              disabled={busy}
              onClick={() => (step ? setStep((p) => p - 1) : void close())}
            >
              {step ? (
                <>
                  <ArrowLeft size={16} />
                  ย้อนกลับ
                </>
              ) : (
                "ยกเลิก"
              )}
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? (
                "กำลังบันทึก…"
              ) : step < 2 ? (
                <>
                  ถัดไป
                  <ArrowRight size={16} />
                </>
              ) : (
                "บันทึกบริการ"
              )}
            </button>
          </footer>
        </form>
      </Dialog>
    </section>
  );
}
