"use client";
import { useEffect, useState } from "react";
import { requestJson } from "@/lib/client-api";
interface Token {
  id: string;
  prefix: string;
  scopes: string[];
  revokedAt: string | null;
  lastUsedAt: string | null;
}
export function ServiceTokens({
  appId,
  name,
}: {
  appId: string;
  name: string;
}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [secret, setSecret] = useState("");
  const [scopes, setScopes] = useState(["session:read"]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const url = `/api/admin/apps/${encodeURIComponent(appId)}/tokens`;
  async function refresh() {
    try {
      setTokens((await requestJson<{ tokens: Token[] }>(url)).tokens);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh(); /* component is keyed by appId */
  }, [appId]);
  async function create(rotate = false) {
    if (
      busy ||
      (rotate &&
        !confirm(
          "หมุน token และยกเลิก token เดิมทั้งหมด? บริการต้องเปลี่ยนค่าใหม่ทันที",
        ))
    )
      return;
    setBusy(true);
    setError("");
    setSecret("");
    setNotice("");
    try {
      const result = await requestJson<{ token: string }>(url, "POST", {
        scopes,
        rotate,
      });
      setSecret(result.token);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    if (
      busy ||
      !confirm("ยกเลิก token นี้? บริการที่ใช้ token จะติดต่อ Hub ไม่ได้")
    )
      return;
    setBusy(true);
    setError("");
    try {
      await requestJson(url + "?id=" + encodeURIComponent(id), "DELETE");
      setSecret("");
      await refresh();
      setNotice("ยกเลิก token แล้ว");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-section" aria-label={"การเชื่อมต่อ " + name}>
      <h3 className="font-semibold">การเชื่อมต่อ {name}</h3>
      <p className="mt-2 text-sm text-zinc-400">
        เก็บ token ไว้ที่ server ของบริการ จะแสดงรหัสเต็มเพียงครั้งเดียว
      </p>
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
      <fieldset className="my-4 flex flex-wrap gap-4" disabled={busy}>
        <legend className="sr-only">สิทธิ์ token</legend>
        {["session:read", "notifications:write"].map((scope) => (
          <label key={scope} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={scopes.includes(scope)}
              onChange={(e) =>
                setScopes((p) =>
                  e.target.checked
                    ? [...p, scope]
                    : p.filter((s) => s !== scope),
                )
              }
            />
            {scope === "session:read"
              ? "ตรวจ session ผู้ใช้"
              : "ส่งการแจ้งเตือน"}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button
          className="primary-button"
          disabled={busy || !scopes.length}
          onClick={() => create()}
        >
          สร้าง token
        </button>
        <button
          className="secondary-button"
          disabled={busy || !scopes.length}
          onClick={() => create(true)}
        >
          หมุน token ทั้งหมด
        </button>
      </div>
      {secret && (
        <div className="my-4 rounded-xl border border-amber-200/30 bg-amber-200/5 p-4">
          <p className="mb-2 text-sm text-amber-100">
            คัดลอกเก็บตอนนี้ เมื่อปิดส่วนนี้จะดูรหัสเต็มอีกไม่ได้
          </p>
          <code
            className="block break-all text-sm"
            aria-label="Service Token ใหม่"
          >
            {secret}
          </code>
          <button
            className="secondary-button mt-3"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(secret);
                setNotice("คัดลอก token แล้ว");
              } catch {
                setError(
                  "คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกและคัดลอกข้อความด้านบน",
                );
              }
            }}
          >
            คัดลอก token
          </button>
        </div>
      )}
      {loading ? (
        <p role="status" className="mt-4">
          กำลังโหลด token…
        </p>
      ) : !tokens.length ? (
        <p className="mt-4 text-sm text-zinc-400">ยังไม่มี token</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10">
          {tokens.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <code className="text-sm">{t.prefix}…</code>
                <p className="mt-1 text-xs text-zinc-400">
                  {t.revokedAt
                    ? "ยกเลิกแล้ว"
                    : t.lastUsedAt
                      ? "ใช้งานล่าสุด " +
                        new Date(t.lastUsedAt).toLocaleString("th-TH", {
                          timeZone: "Asia/Bangkok",
                        })
                      : "ยังไม่มีการเรียกใช้งาน"}
                </p>
                <p className="text-xs text-zinc-400">{t.scopes.join(", ")}</p>
              </div>
              <button
                disabled={busy || !!t.revokedAt}
                className="secondary-button"
                onClick={() => revoke(t.id)}
              >
                ยกเลิก token
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
