import { appEnvironment } from "./security";
import { HttpError } from "./http";
import { hubDomainReady } from "./domains";
export function mailConfiguration() {
  const provider = process.env.MAIL_PROVIDER || "resend";
  const production = appEnvironment() === "production";
  if (production && !hubDomainReady())
    throw new HttpError(
      503,
      "โดเมนสำหรับอีเมลยังไม่พร้อม",
      "DOMAIN_CONFIGURATION",
    );
  if (provider === "mailpit" && !production) {
    const base = new URL(process.env.MAILPIT_URL || "http://127.0.0.1:8025");
    if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))
      throw new Error("MAILPIT_URL must be loopback.");
    return { provider, endpoint: new URL("/api/v1/send", base).href };
  }
  if (
    provider !== "resend" ||
    !process.env.RESEND_API_KEY ||
    !process.env.MAIL_FROM
  )
    throw new Error(
      "Configure Resend and MAIL_FROM before enabling account emails.",
    );
  return { provider, endpoint: "https://api.resend.com/emails" };
}
export async function sendAccountMail(
  email: string,
  link: string,
  reset: boolean,
) {
  const config = mailConfiguration();
  const subject = reset
    ? "ตั้งรหัสผ่าน Monolith ใหม่"
    : "ยืนยันอีเมลสำหรับ Monolith";
  const text = `${subject}\n\nเปิดลิงก์แล้วกดยืนยัน: ${link}\n\nลิงก์ใช้ได้ครั้งเดียว หากคุณไม่ได้ทำรายการนี้ สามารถละเว้นอีเมลนี้ได้`;
  const from = process.env.MAIL_FROM || "Monolith <noreply@monolith.test>";
  try {
    const result = await fetch(config.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        ...(config.provider === "resend"
          ? { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(
        config.provider === "resend"
          ? { from, to: [email], subject, text }
          : {
              From: { Email: "noreply@monolith.test", Name: "Monolith" },
              To: [{ Email: email }],
              Subject: subject,
              Text: text,
            },
      ),
    });
    if (!result.ok) throw new Error("delivery rejected");
  } catch {
    throw new HttpError(
      503,
      "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่",
      "MAIL_UNAVAILABLE",
    );
  }
}
