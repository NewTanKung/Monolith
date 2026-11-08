"use client";
import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";
import { AdminAppManager } from "@/app/admin/AdminAppManager";
import type { ComponentProps } from "react";
import Link from "next/link";
import { LayoutGrid, UsersRound, Settings2 } from "lucide-react";
import { useSection } from "@/lib/use-section";
import { roleLabels } from "@/lib/display";
import { useConfirm } from "../common/Dialog";
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
  hubUrl,
}: {
  apps: ComponentProps<typeof AdminAppManager>["initialApps"];
  hubUrl: string;
}) {
  const [section] = useSection(["services", "members", "settings"], "services");
  const tab =
    section === "services"
      ? "apps"
      : section === "members"
        ? "users"
        : "settings";
  return (
    <div className="workspace-layout">
      <nav aria-label="ส่วนผู้ดูแลระบบ" className="workspace-sidebar">
        <p className="sidebar-label">จัดการ Monolith</p>
        {[
          ["services", "บริการ", LayoutGrid],
          ["members", "สมาชิก", UsersRound],
          ["settings", "การตั้งค่า", Settings2],
        ].map(([key, label, Glyph]) => {
          const Icon = Glyph as typeof LayoutGrid;
          return (
            <Link
              key={String(key)}
              href={"?section=" + key}
              aria-current={section === key ? "page" : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {String(label)}
            </Link>
          );
        })}
      </nav>
      <div className="workspace-content">
        <header className="page-heading">
          <h1>
            {tab === "apps"
              ? "บริการของคุณ"
              : tab === "users"
                ? "สมาชิก"
                : "การตั้งค่า"}
          </h1>
          <p>
            {tab === "apps"
              ? "รวมทุกบริการไว้ในพื้นที่เดียว จัดการปลายทางและสิทธิ์ได้จากที่นี่"
              : tab === "users"
                ? "ดูแลบัญชีและสิทธิ์การเข้าถึงบริการ"
                : "การรับสมัคร ความพร้อมของระบบ และประวัติการเปลี่ยนแปลง"}
          </p>
        </header>
        {tab === "apps" ? (
          <AdminAppManager initialApps={apps} hubUrl={hubUrl} />
        ) : (
          <AdminData key={tab} kind={tab} />
        )}
      </div>
    </div>
  );
}
function AdminData({ kind }: { kind: string }) {
  const confirm = useConfirm();
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
    if (
      busy ||
      !(await confirm({
        title:
          kind === "users" ? "เปลี่ยนแปลงบัญชีสมาชิก?" : "เปลี่ยนการรับสมัคร?",
        description:
          kind === "users"
            ? "การเปลี่ยนสิทธิ์ ระงับบัญชี หรือยกเลิก session มีผลต่อการเข้าใช้บริการทันที"
            : "การตั้งค่านี้มีผลกับการสมัครสมาชิกใหม่",
        confirmLabel: "บันทึกการเปลี่ยนแปลง",
      }))
    )
      return;
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
          <p className="text-sm text-muted">
            สมาชิก {total} คน · หน้า {page}
          </p>
          {!users.length ? (
            <p className="account-section">ไม่พบสมาชิกที่ตรงกับการค้นหา</p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table members-table">
                <caption className="sr-only">สมาชิกและสิทธิ์</caption>
                <thead>
                  <tr>
                    <th scope="col">สมาชิก</th>
                    <th scope="col">สิทธิ์</th>
                    <th scope="col">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="min-w-0">
                          <h3 className="break-words font-medium">
                            {u.name || u.email}
                          </h3>
                          <p className="break-all text-sm text-muted">
                            {u.email}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {u.status === "ACTIVE" ? "ใช้งานได้" : "ระงับบัญชี"}{" "}
                            ·{" "}
                            {u.emailVerifiedAt
                              ? "ยืนยันอีเมลแล้ว"
                              : "รอยืนยันอีเมล"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <form
                          className="flex items-end gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const role = new FormData(e.currentTarget).get(
                              "role",
                            );
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
                                <option key={v} value={v}>
                                  {roleLabels[v]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button className="secondary-button" disabled={busy}>
                            บันทึกสิทธิ์
                          </button>
                        </form>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="secondary-button"
                            disabled={busy}
                            onClick={() =>
                              change("users", {
                                id: u.id,
                                status:
                                  u.status === "ACTIVE"
                                    ? "SUSPENDED"
                                    : "ACTIVE",
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
                              change("users", {
                                id: u.id,
                                revokeSessions: true,
                              })
                            }
                          >
                            ออกจากระบบทุกอุปกรณ์
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <p className="my-3 text-sm text-muted">
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
                        settings.readiness[k] ? "text-success" : "text-warning"
                      }
                    >
                      {settings.readiness[k]
                        ? "ตั้งค่าพร้อม"
                        : "ต้องตรวจการตั้งค่า"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                ผลนี้ตรวจการตั้งค่า
                ไม่ได้ยืนยันการส่งถึงกล่องจดหมายหรือสถานะบริการปลายทาง
              </p>
            </section>
            <section className="account-section">
              <h3 className="font-semibold">ประวัติการจัดการ</h3>
              {!entries.length ? (
                <p className="mt-3 text-sm text-muted">ยังไม่มีประวัติ</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {entries.map((e) => (
                    <li className="py-3 text-sm" key={e.id}>
                      <p>{auditLabel(e.action)}</p>
                      <p className="mt-1 break-all text-xs text-muted">
                        ผู้ดำเนินการ {e.actorId} · รายการ {e.targetId}
                      </p>
                      <p className="mt-1 text-xs text-muted">
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
        className="text-sm text-accent"
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
