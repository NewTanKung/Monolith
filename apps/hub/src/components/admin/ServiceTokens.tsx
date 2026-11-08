"use client";
import { useEffect, useState } from "react";
import { Copy, KeyRound, ArrowLeft, Check } from "lucide-react";
import { requestJson } from "@/lib/client-api";
import { useConfirm } from "../common/Dialog";
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
  serviceUrl,
  hubUrl,
  onClose,
  onUncopiedSecretChange,
}: {
  appId: string;
  name: string;
  serviceUrl: string;
  hubUrl: string;
  onClose: () => void;
  onUncopiedSecretChange?: (value: boolean) => void;
}) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [secret, setSecret] = useState("");
  const [scopes, setScopes] = useState(["session:read"]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const confirm = useConfirm();
  const url = "/api/admin/apps/" + encodeURIComponent(appId) + "/tokens";
  useEffect(() => {
    onUncopiedSecretChange?.(!!secret && !copied);
  }, [secret, copied, onUncopiedSecretChange]);
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
    void refresh();
  }, [appId]);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (secret && !copied) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [secret, copied]);
  async function close() {
    if (
      secret &&
      !copied &&
      !(await confirm({
        title: "คัดลอก token แล้วหรือยัง?",
        description:
          "เมื่อปิดส่วนนี้จะเปิดดูรหัสเต็มอีกไม่ได้ หากยังไม่ได้เก็บ ให้กลับไปคัดลอกก่อน",
        confirmLabel: "ปิดการเชื่อมต่อ",
      }))
    )
      return;
    onClose();
  }
  async function create(rotate = false) {
    if (busy) return;
    if (
      rotate &&
      !(await confirm({
        title: "หมุน token ทั้งหมด?",
        description:
          "token เดิมของบริการนี้จะใช้ไม่ได้ทันที คุณต้องนำรหัสใหม่ไปตั้งค่าที่ server ของบริการ",
        confirmLabel: "หมุน token ทั้งหมด",
        danger: true,
      }))
    )
      return;
    if (
      !rotate &&
      secret &&
      !copied &&
      !(await confirm({
        title: "สร้างรหัสใหม่อีกครั้ง?",
        description: "รหัสเต็มที่ยังไม่ได้คัดลอกจะหายจากหน้านี้",
        confirmLabel: "สร้าง token ใหม่",
      }))
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson<{ token: string }>(url, "POST", {
        scopes,
        rotate,
      });
      setSecret(result.token);
      setCopied(false);
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
      !(await confirm({
        title: "ยกเลิก token นี้?",
        description:
          "บริการที่ใช้ token นี้จะติดต่อ Hub ไม่ได้ ต้องเปลี่ยนไปใช้ token ที่ยังใช้งานได้",
        confirmLabel: "ยกเลิก token",
        danger: true,
      }))
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
  async function copy(value: string, message: string, containsSecret = false) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
      if (containsSecret) setCopied(true);
    } catch {
      setError("คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกด้วยตัวเอง");
    }
  }
  const env = `HUB_URL=${hubUrl}\nMONOLITH_SERVICE_TOKEN=YOUR_SERVICE_TOKEN\nMONOLITH_SERVICE_ID=${appId}\nSERVICE_URL=${serviceUrl}`;
  return (
    <section className="surface-panel" aria-label={"การเชื่อมต่อ " + name}>
      <div className="section-header">
        <div>
          <h3 className="text-lg font-semibold">การเชื่อมต่อ {name}</h3>
          <p className="section-copy">
            ตั้งค่าครั้งแรกบน server ของบริการ แล้วใช้บัญชี Monolith ร่วมกัน
          </p>
        </div>
        <button className="secondary-button" disabled={busy} onClick={close}>
          <ArrowLeft size={16} />
          ปิดการเชื่อมต่อ
        </button>
      </div>
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
      <ol className="connection-steps">
        <li>
          <h4 className="font-medium text-foreground">
            สร้าง token สำหรับบริการ
          </h4>
          <p>เลือกสิทธิ์เท่าที่บริการต้องใช้ เก็บรหัสไว้เฉพาะฝั่ง server</p>
          <fieldset className="my-4 flex flex-wrap gap-4" disabled={busy}>
            <legend className="sr-only">สิทธิ์ token</legend>
            {["session:read", "notifications:write"].map((scope) => (
              <label key={scope} className="flex items-center gap-2">
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
              <KeyRound size={17} />
              {busy ? "กำลังดำเนินการ…" : "สร้าง token"}
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
            <div className="secret-panel">
              <p className="font-medium mb-2">
                คัดลอกตอนนี้ รหัสเต็มจะแสดงเพียงครั้งเดียว
              </p>
              <code
                className="block break-all"
                aria-label="Service Token ใหม่"
                translate="no"
              >
                {secret}
              </code>
              <button
                className="secondary-button mt-3"
                onClick={() => copy(secret, "คัดลอก token แล้ว", true)}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}คัดลอก token
              </button>
            </div>
          )}
        </li>
        <li>
          <h4 className="font-medium text-foreground">
            ตั้งค่าที่ server ของ {name}
          </h4>
          <p>
            คัดลอกตัวอย่างนี้ไปยังไฟล์ .env ของบริการ ใส่ token เต็มแทน
            YOUR_SERVICE_TOKEN และเริ่ม server ของบริการใหม่
          </p>
          <pre className="code-block my-3" translate="no">
            {env}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              className="secondary-button"
              onClick={() => copy(appId, "คัดลอก Service ID แล้ว")}
            >
              <Copy size={16} />
              คัดลอก Service ID
            </button>
            <button
              className="secondary-button"
              onClick={() =>
                copy(
                  secret ? env.replace("YOUR_SERVICE_TOKEN", secret) : env,
                  "คัดลอกตัวอย่าง env แล้ว",
                  !!secret,
                )
              }
            >
              <Copy size={16} />
              คัดลอกตัวอย่าง env
            </button>
          </div>
          <p className="field-help mt-3">
            อย่าใส่ token ในตัวแปร NEXT_PUBLIC_* หรือในโค้ดที่ส่งไปยัง browser
          </p>
        </li>
        <li>
          <h4 className="font-medium text-foreground">
            เรียกตรวจ session ผ่าน SDK
          </h4>
          <p>
            ให้ server ของบริการใช้ getServiceSession จาก
            @monolith/auth-client/server ส่ง cookie ของผู้ใช้ไปตรวจที่ Hub
            หลังมีการเรียกจริง จะแสดงเวลาใช้งานล่าสุดด้านล่าง
          </p>
          <p className="field-help mt-2">
            การสร้าง token อย่างเดียวยังไม่ได้เชื่อมโค้ดฝั่งบริการ ดูตัวอย่างที่
            <a
              className="text-accent underline ml-1"
              href="https://github.com/NewTanKung/Monolith/blob/main/docs/integrations.md"
              target="_blank"
              rel="noreferrer"
            >
              คู่มือเชื่อม Service
            </a>
          </p>
        </li>
      </ol>
      <div className="mt-8 border-t border-line pt-6">
        <h4 className="font-medium">Token ของบริการ</h4>
        {loading ? (
          <p role="status" className="text-muted mt-3">
            กำลังโหลด token…
          </p>
        ) : !tokens.length ? (
          <p className="text-muted mt-3">
            ยังไม่มี token เริ่มสร้างด้านบนเพื่อเชื่อมบริการ
          </p>
        ) : (
          <ul>
            {tokens.map((t) => (
              <li key={t.id} className="session-row">
                <div className="min-w-0">
                  <code translate="no">{t.prefix}…</code>
                  <p className="text-muted text-xs mt-1">
                    {t.revokedAt
                      ? "ยกเลิกแล้ว"
                      : t.lastUsedAt
                        ? "ใช้งานล่าสุด " +
                          new Date(t.lastUsedAt).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                          })
                        : "ยังไม่มีการเรียกใช้งาน"}
                  </p>
                  <p className="text-muted text-xs">
                    {t.scopes
                      .map((s) =>
                        s === "session:read" ? "ตรวจผู้ใช้" : "ส่งแจ้งเตือน",
                      )
                      .join(" · ")}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  disabled={busy || !!t.revokedAt}
                  onClick={() => revoke(t.id)}
                >
                  ยกเลิก token
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          className="text-accent mt-4"
          disabled={loading || busy}
          onClick={refresh}
        >
          โหลดข้อมูลใหม่
        </button>
      </div>
    </section>
  );
}
