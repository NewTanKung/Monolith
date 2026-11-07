"use client";
import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";
import { AdminAppManager } from "@/app/admin/AdminAppManager";
import type { ComponentProps } from "react";
interface UserRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
}
interface Settings {
  registrationEnabled: boolean;
  environmentAllowsRegistration: boolean;
  readiness: {
    ok: boolean;
    database: boolean;
    email: boolean;
    domain: boolean;
  };
}
interface Entry {
  id: string;
  action: string;
  actorId: string;
  targetId: string;
  createdAt: string;
}
export function AdminConsole({
  apps,
}: {
  apps: ComponentProps<typeof AdminAppManager>["initialApps"];
}) {
  const [tab, setTab] = useState("apps");
  return (
    <>
      <nav aria-label="ส่วนผู้ดูแลระบบ" className="mb-7 flex flex-wrap gap-2">
        {[
          ["apps", "บริการ"],
          ["users", "สมาชิก"],
          ["settings", "การตั้งค่า"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={"category-pill " + (tab === key ? "is-active" : "")}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "apps" ? (
        <AdminAppManager initialApps={apps} />
      ) : (
        <AdminData key={tab} kind={tab} />
      )}
    </>
  );
}
function AdminData({ kind }: { kind: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  async function load() {
    setLoading(true);
    setError("");
    try {
      if (kind === "users") {
        const data = await requestJson<{ users: UserRow[]; total: number }>(
          `/api/admin/users?page=${page}&q=${encodeURIComponent(appliedQuery)}`,
        );
        setUsers(data.users);
        setTotal(data.total);
      } else {
        setSettings(await requestJson<Settings>("/api/admin/settings"));
        setEntries(
          (
            await requestJson<{ entries: Entry[] }>(
              "/api/admin/audit?page=" + auditPage,
            )
          ).entries,
        );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [page, appliedQuery, auditPage]);
  async function change(resource: string, body: unknown) {
    if (busy || !confirm("ยืนยันการเปลี่ยนแปลงนี้?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestJson("/api/admin/" + resource, "POST", body);
      await load();
      setNotice("บันทึกการเปลี่ยนแปลงแล้ว");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <h2 className="text-xl font-semibold">
        {kind === "users" ? "จัดการสมาชิก" : "การตั้งค่าและประวัติ"}
      </h2>
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
      {kind === "users" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setAppliedQuery(q);
          }}
          className="flex flex-wrap gap-3"
        >
          <label className="form-label flex-1">
            ค้นหาสมาชิก
            <input
              className="admin-input"
              value={q}
              maxLength={100}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ชื่อหรืออีเมล"
            />
          </label>
          <button className="secondary-button self-end" disabled={loading}>
            ค้นหา
          </button>
        </form>
      )}
      {loading ? (
        <p role="status">กำลังโหลดข้อมูล…</p>
      ) : kind === "users" ? (
        <>
          <p className="text-sm text-zinc-400">
            สมาชิก {total} คน · หน้า {page}
          </p>
          {!users.length ? (
            <p className="account-section">ไม่พบสมาชิกที่ตรงกับการค้นหา</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <article className="account-section" key={u.id}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-medium">
                        {u.name || u.email}
                      </h3>
                      <p className="break-all text-sm text-zinc-400">
                        {u.email}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {u.status === "ACTIVE" ? "ใช้งานได้" : "ระงับบัญชี"} ·{" "}
                        {u.emailVerifiedAt
                          ? "ยืนยันอีเมลแล้ว"
                          : "รอยืนยันอีเมล"}
                      </p>
                    </div>
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const role = new FormData(e.currentTarget).get("role");
                        void change("users", { id: u.id, role });
                      }}
                    >
                      <label className="form-label">
                        สิทธิ์ของ {u.email}
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="admin-input"
                          disabled={busy}
                        >
                          {["GUEST", "MEMBER", "ADMIN"].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <button className="secondary-button" disabled={busy}>
                        บันทึกสิทธิ์
                      </button>
                    </form>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() =>
                        change("users", {
                          id: u.id,
                          status:
                            u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                        })
                      }
                    >
                      {u.status === "ACTIVE"
                        ? "ระงับบัญชี"
                        : "เปิดบัญชีอีกครั้ง"}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={busy}
                      onClick={() =>
                        change("users", { id: u.id, revokeSessions: true })
                      }
                    >
                      ออกจากระบบทุกอุปกรณ์
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              className="secondary-button"
              disabled={page === 1 || busy}
              onClick={() => setPage((p) => p - 1)}
            >
              ก่อนหน้า
            </button>
            <button
              className="secondary-button"
              disabled={page * 20 >= total || busy}
              onClick={() => setPage((p) => p + 1)}
            >
              ถัดไป
            </button>
          </div>
        </>
      ) : (
        settings && (
          <>
            <section className="account-section">
              <h3 className="font-semibold">การสมัครสมาชิก</h3>
              <p className="my-3 text-sm text-zinc-400">
                {!settings.environmentAllowsRegistration
                  ? "ปิดจากการตั้งค่า server ต้องเปลี่ยน ALLOW_REGISTRATION ก่อน"
                  : settings.registrationEnabled
                    ? "เปิดให้บุคคลทั่วไปสมัคร"
                    : "ปิดรับสมัครสมาชิกใหม่"}
              </p>
              <button
                disabled={busy || !settings.environmentAllowsRegistration}
                className="secondary-button"
                onClick={() =>
                  change("settings", {
                    registrationEnabled: !settings.registrationEnabled,
                  })
                }
              >
                {settings.registrationEnabled ? "ปิดรับสมัคร" : "เปิดรับสมัคร"}
              </button>
            </section>
            <section className="account-section">
              <h3 className="font-semibold">ความพร้อมของระบบ</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {(
                  [
                    ["database", "ฐานข้อมูลและ migration"],
                    ["email", "การตั้งค่าส่งอีเมล"],
                    ["domain", "โดเมนและ cookie"],
                  ] as const
                ).map(([k, label]) => (
                  <li key={k}>
                    {label}:{" "}
                    <span
                      className={
                        settings.readiness[k]
                          ? "text-emerald-200"
                          : "text-amber-200"
                      }
                    >
                      {settings.readiness[k]
                        ? "ตั้งค่าพร้อม"
                        : "ต้องตรวจการตั้งค่า"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-400">
                ผลนี้ตรวจการตั้งค่า
                ไม่ได้ยืนยันการส่งถึงกล่องจดหมายหรือสถานะบริการปลายทาง
              </p>
            </section>
            <section className="account-section">
              <h3 className="font-semibold">ประวัติการจัดการ</h3>
              {!entries.length ? (
                <p className="mt-3 text-sm text-zinc-400">ยังไม่มีประวัติ</p>
              ) : (
                <ul className="mt-3 divide-y divide-white/10">
                  {entries.map((e) => (
                    <li className="py-3 text-sm" key={e.id}>
                      <p>{auditLabel(e.action)}</p>
                      <p className="mt-1 break-all text-xs text-zinc-400">
                        ผู้ดำเนินการ {e.actorId} · รายการ {e.targetId}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(e.createdAt).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  className="secondary-button"
                  disabled={auditPage === 1 || busy}
                  onClick={() => setAuditPage((p) => p - 1)}
                >
                  ประวัติก่อนหน้า
                </button>
                <button
                  className="secondary-button"
                  disabled={entries.length < 30 || busy}
                  onClick={() => setAuditPage((p) => p + 1)}
                >
                  ประวัติถัดไป
                </button>
              </div>
            </section>
          </>
        )
      )}
      <button
        className="text-sm text-teal-200"
        disabled={loading || busy}
        onClick={load}
      >
        โหลดข้อมูลใหม่
      </button>
    </section>
  );
}
function auditLabel(action: string) {
  return (
    (
      {
        "user.updated": "เปลี่ยนสิทธิ์หรือสถานะสมาชิก",
        "user.sessions_revoked": "ยกเลิก session สมาชิก",
        "settings.updated": "เปลี่ยนการตั้งค่า",
        "service.created": "เพิ่มบริการ",
        "service.updated": "แก้ไขบริการ",
        "service.deleted": "ลบบริการ",
        "service_token.created": "สร้าง Service Token",
        "service_token.rotated": "หมุน Service Token",
        "service_token.revoked": "ยกเลิก Service Token",
      } as Record<string, string>
    )[action] || action
  );
}
