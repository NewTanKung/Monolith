import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { loadEnvFile } from "node:process";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { createDatabaseClient } from "../../apps/hub/src/lib/database-client";
import { tokenHash } from "../../apps/hub/src/lib/security";
import { execFileSync } from "node:child_process";
loadEnvFile("apps/hub/.env.local");
const db = createDatabaseClient();
const hub = process.env.E2E_HUB_URL!;
const run = "e2e-" + Date.now() + "-" + randomBytes(3).toString("hex");
const memberEmail = run + "@example.test";
const adminEmail = run + "-admin@example.test";
const password = "Testing-password-42";
const name = "บริการทดสอบ " + run;
let memberId = "",
  adminId = "",
  publicId = "",
  ssoId = "",
  maintenanceId = "",
  privateId = "";
let serviceToken = "";
const createdEmail = (suffix: string) => run + "-" + suffix + "@example.test";
async function apiLogin(
  request: APIRequestContext,
  email = memberEmail,
  secret = password,
) {
  const response = await request.post("/api/auth/login", {
    data: { email, password: secret },
  });
  expect(response.status()).toBe(200);
}
async function login(page: Page, admin = false) {
  await page.goto("/login");
  await page
    .getByLabel("อีเมล", { exact: true })
    .fill(admin ? adminEmail : memberEmail);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(hub + "/");
  await expect(page.getByRole("button", { name: "เมนูบัญชี" })).toBeVisible();
}
async function emailLink(email: string, reset = false) {
  let link = "";
  await expect
    .poll(
      async () => {
        const search = await fetch(
          "http://127.0.0.1:8025/api/v1/search?query=" +
            encodeURIComponent("to:" + email),
        );
        const result = await search.json();
        for (const message of result.messages || []) {
          const mail = await (
            await fetch("http://127.0.0.1:8025/api/v1/message/" + message.ID)
          ).json();
          const candidate = String(mail.Text).match(
            /https?:\/\/\S+\/(?:verify-email|reset-password)#token=[A-Za-z0-9_-]+/,
          )?.[0];
          if (
            candidate &&
            candidate.includes(reset ? "/reset-password" : "/verify-email")
          ) {
            link = candidate;
            break;
          }
        }
        return !!link;
      },
      { timeout: 15000 },
    )
    .toBe(true);
  return link;
}
function tokenFrom(link: string) {
  return new URLSearchParams(new URL(link).hash.slice(1)).get("token")!;
}
test.beforeAll(async () => {
  const hash = await bcrypt.hash(password, 12);
  memberId = (
    await db.user.create({
      data: {
        email: memberEmail,
        name: "สมาชิกทดสอบ",
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      },
    })
  ).id;
  adminId = (
    await db.user.create({
      data: {
        email: adminEmail,
        name: "ผู้ดูแลทดสอบ",
        role: "ADMIN",
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      },
    })
  ).id;
  publicId = (
    await db.appItem.create({
      data: {
        icon: "LayoutGrid",
        name,
        slug: run + "-public",
        description: "บริการสาธารณะ",
        category: "GAME",
        minRole: "GUEST",
        url: "https://example.test/",
      },
    })
  ).id;
  privateId = (
    await db.appItem.create({
      data: {
        icon: "Shield",
        name: run + " private",
        slug: run + "-private",
        category: "WORK",
        description: "ส่วนตัว",
        minRole: "ADMIN",
        url: "https://example.test/private",
      },
    })
  ).id;
  maintenanceId = (
    await db.appItem.create({
      data: {
        icon: "Wrench",
        name: run + " maintenance",
        slug: run + "-maintenance",
        category: "WORK",
        description: "ปรับปรุง",
        status: "MAINTENANCE",
        url: "https://example.test/maintenance",
      },
    })
  ).id;
  ssoId = (
    await db.appItem.create({
      data: {
        icon: "LayoutGrid",
        name: run + " sso",
        slug: run + "-sso",
        category: "WORK",
        description: "SSO",
        minRole: "MEMBER",
        mode: "SSO",
        url: "http://service.monolith.test:19001/",
      },
    })
  ).id;
  serviceToken = "mst_" + randomBytes(32).toString("base64url");
  await db.serviceToken.create({
    data: {
      appId: ssoId,
      tokenHash: tokenHash(serviceToken),
      prefix: serviceToken.slice(0, 12),
      scopes: ["session:read", "notifications:write"],
    },
  });
  const configured = await fetch("http://127.0.0.1:19001/__configure", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fixture-key": process.env.FIXTURE_CONTROL_KEY!,
    },
    body: JSON.stringify({ serviceId: ssoId, token: serviceToken }),
  });
  expect(configured.status).toBe(200);
});
test.afterAll(async () => {
  await db.appItem.deleteMany({ where: { slug: { startsWith: run } } });
  await db.user.deleteMany({ where: { email: { startsWith: run } } });
  await db.auditLog.deleteMany({
    where: {
      OR: [
        { actorId: adminId },
        { targetId: { in: [publicId, ssoId, maintenanceId, privateId] } },
      ],
    },
  });
  await db.hubSettings.upsert({
    where: { id: "hub" },
    create: { id: "hub" },
    update: { registrationEnabled: true },
  });
  await db.$disconnect();
});
test("anonymous writes and private launch paths remain protected", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/notifications", {
        data: { title: "x", message: "x" },
      })
    ).status(),
  ).toBe(401);
  expect((await request.get("/api/admin/apps")).status()).toBe(401);
  expect((await request.get("/apps/" + run + "-private/launch")).status()).toBe(
    404,
  );
  await page.goto("/");
  await expect(page.getByText(run + " private", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/apps/" + run + "-maintenance");
  await expect(page.getByRole("status")).toContainText("ปรับปรุง");
  const unsafe = await request.post("/api/auth/login", {
    headers: { Origin: "https://attacker.test" },
    data: { email: memberEmail, password },
  });
  expect(unsafe.status()).toBe(403);
});
test("Thai launcher search, categories, keyboard dialog and favorites work", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "ปักหมุด " + name, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "เลิกปักหมุด " + name, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "รายการโปรด", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "เลิกปักหมุด " + name, exact: true })
    .click();
  await expect(
    page.getByText("ยังไม่มีรายการโปรด กดดาวบนบริการเพื่อบันทึกไว้ที่นี่"),
  ).toBeVisible();
  await page.getByRole("button", { name: "ทั้งหมด", exact: true }).click();
  const search = page.getByRole("searchbox", { name: "ค้นหาบริการ" });
  await search.fill(name.toUpperCase());
  await expect(page.locator(".service-tile")).toHaveCount(1);
  await search.fill("missing-service-with-no-match");
  await expect(page.getByText(/ไม่พบบริการที่ตรงกับ/)).toBeVisible();
  await page.getByRole("button", { name: "ล้างคำค้นหา" }).first().click();
  const dialog = page.getByRole("dialog", { name: "ค้นหาแอป" });
  await page.getByRole("button", { name: "ค้นหาแอป", exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Control+k");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("registration requires single-use email verification before login", async ({
  page,
  request,
}) => {
  const email = createdEmail("signup");
  await page.goto("/login");
  await page.getByRole("button", { name: "สมัครสมาชิก", exact: true }).click();
  await page.getByLabel("ชื่อที่แสดง").fill("สมาชิกใหม่");
  await page.getByLabel("อีเมล", { exact: true }).fill(email);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
  await page.getByRole("button", { name: "สมัครและรับอีเมลยืนยัน" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  expect(
    (
      await request.post("/api/auth/login", { data: { email, password } })
    ).status(),
  ).toBe(403);
  const link = await emailLink(email);
  const token = tokenFrom(link);
  await page.goto(link);
  expect(
    (
      await db.emailToken.findUniqueOrThrow({
        where: { tokenHash: tokenHash(token) },
      })
    ).usedAt,
  ).toBeNull();
  await page.getByRole("button", { name: "ยืนยันอีเมลนี้" }).click();
  await expect(page.getByRole("status")).toContainText("ยืนยันอีเมลแล้ว");
  expect(
    (
      await request.post("/api/auth/verify-email", { data: { token } })
    ).status(),
  ).toBe(400);
  await apiLogin(request, email);
  const me = await (await request.get("/api/auth/me")).json();
  expect(me.user.role).toBe("MEMBER");
});
test("verification can be resent and expired links fail", async ({
  request,
}) => {
  const email = createdEmail("resend");
  await db.user.create({
    data: {
      email,
      name: "รอยืนยัน",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  expect(
    (
      await request.post("/api/auth/resend-verification", { data: { email } })
    ).status(),
  ).toBe(200);
  const token = tokenFrom(await emailLink(email));
  await db.emailToken.update({
    where: { tokenHash: tokenHash(token) },
    data: { expiresAt: new Date(0) },
  });
  expect(
    (
      await request.post("/api/auth/verify-email", { data: { token } })
    ).status(),
  ).toBe(400);
  const known = await (
    await request.post("/api/auth/forgot-password", { data: { email } })
  ).json();
  const unknown = await (
    await request.post("/api/auth/forgot-password", {
      data: { email: createdEmail("unknown") },
    })
  ).json();
  expect(known).toEqual(unknown);
});
test("password reset revokes sessions and cannot be replayed", async ({
  page,
  request,
}) => {
  const email = createdEmail("reset");
  const user = await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: new Date(),
    },
  });
  await apiLogin(request, email);
  const reset = await request.post("/api/auth/forgot-password", {
    data: { email },
  });
  expect(reset.status()).toBe(200);
  const link = await emailLink(email, true);
  const token = tokenFrom(link);
  await page.goto(link);
  await page.getByLabel("รหัสผ่านใหม่").fill(password + "-new");
  await page.getByRole("button", { name: "บันทึกรหัสผ่านใหม่" }).click();
  await expect(page.getByRole("status")).toContainText("ตั้งรหัสผ่านใหม่แล้ว");
  expect((await (await request.get("/api/auth/me")).json()).user).toBeNull();
  expect(
    (
      await request.post("/api/auth/reset-password", {
        data: { token, password },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/auth/login", { data: { email, password } })
    ).status(),
  ).toBe(401);
  await apiLogin(request, email, password + "-new");
  expect(
    await db.session.count({ where: { userId: user.id, revokedAt: null } }),
  ).toBe(1);
});
test("account profile and verified email changes preserve ownership", async ({
  page,
  request,
}) => {
  const email = createdEmail("emailchange"),
    nextEmail = createdEmail("changed");
  const u = await db.user.create({
    data: {
      email,
      name: "ชื่อเดิม",
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: new Date(),
    },
  });
  await apiLogin(request, email);
  expect(
    (
      await request.post("/api/auth/profile", { data: { name: "ชื่อใหม่" } })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/auth/change-email", {
        data: { email: nextEmail, currentPassword: "wrong" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/auth/change-email", {
        data: { email: nextEmail, currentPassword: password },
      })
    ).status(),
  ).toBe(200);
  expect((await db.user.findUniqueOrThrow({ where: { id: u.id } })).email).toBe(
    email,
  );
  await page.goto(await emailLink(nextEmail));
  await page.getByRole("button", { name: "ยืนยันอีเมลนี้" }).click();
  await expect(page.getByRole("status")).toContainText("ยืนยันอีเมลแล้ว");
  expect((await (await request.get("/api/auth/me")).json()).user).toBeNull();
  await apiLogin(request, nextEmail);
  expect((await (await request.get("/api/auth/me")).json()).user.name).toBe(
    "ชื่อใหม่",
  );
});
test("account screen lists and revokes sessions", async ({ page }) => {
  await login(page);
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "บัญชีและความปลอดภัย" }),
  ).toBeVisible();
  await page.getByLabel("ชื่อที่แสดง", { exact: true }).fill("สมาชิกทดสอบใหม่");
  await page.getByRole("button", { name: "บันทึกชื่อ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("บันทึกข้อมูลแล้ว");
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "ออกทุกอุปกรณ์", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login$/);
});
test("subdomain SSO redirects to login and returns with a shared cookie", async ({
  page,
}) => {
  await page.goto(`http://service.monolith.test:19001/?app=${ssoId}`);
  await expect(page).toHaveURL(/\/login\?/);
  await page.getByLabel("อีเมล", { exact: true }).fill(memberEmail);
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "เชื่อมต่อ Monolith แล้ว" }),
  ).toBeVisible();
  await expect(page.locator("pre")).toContainText(memberId);
  const cookies = await page.context().cookies();
  const cookie = cookies.find((c) => c.name === "monolith_session")!;
  expect(cookie.domain).toBe(".monolith.test");
  expect(cookie.httpOnly).toBe(true);
  expect(cookie.value).not.toContain(".");
  await db.user.update({
    where: { id: memberId },
    data: { status: "SUSPENDED" },
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login\?/);
  await db.user.update({ where: { id: memberId }, data: { status: "ACTIVE" } });
});
test("SSO refuses revoked credentials, maintenance and role changes", async ({
  request,
}) => {
  await apiLogin(request);
  const headers = { Authorization: "Bearer " + serviceToken };
  expect(
    (await request.get("/api/integrations/session", { headers })).status(),
  ).toBe(200);
  await db.appItem.update({ where: { id: ssoId }, data: { minRole: "ADMIN" } });
  expect(
    (await request.get("/api/integrations/session", { headers })).status(),
  ).toBe(403);
  await db.appItem.update({
    where: { id: ssoId },
    data: { minRole: "MEMBER", status: "MAINTENANCE" },
  });
  expect(
    (await request.get("/api/integrations/session", { headers })).status(),
  ).toBe(503);
  await db.appItem.update({ where: { id: ssoId }, data: { status: "ONLINE" } });
  await db.serviceToken.updateMany({
    where: { appId: ssoId },
    data: { revokedAt: new Date() },
  });
  expect(
    (await request.get("/api/integrations/session", { headers })).status(),
  ).toBe(401);
  await db.serviceToken.updateMany({
    where: { appId: ssoId },
    data: { revokedAt: null },
  });
  expect(
    (
      await request.get("/api/integrations/session", {
        headers: { Authorization: "Bearer old-shared-secret" },
      })
    ).status(),
  ).toBe(401);
});
test("admin creates services, previews icons and manages service tokens", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin");
  await page.getByRole("button", { name: "เพิ่มบริการ", exact: true }).click();
  await page.getByLabel("ชื่อบริการ", { exact: true }).fill(run + " created");
  await page.getByLabel("ชื่อใน URL (slug)").fill(run + "-created");
  await page
    .getByLabel("URL หรือ path ภายใน")
    .fill("http://service.monolith.test:19001/");
  await page.getByLabel("รูปแบบบริการ").selectOption("SSO");
  await page.getByRole("button", { name: "FileText", exact: true }).click();
  await page.getByRole("button", { name: "บันทึกบริการ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("บันทึกบริการแล้ว");
  await page
    .getByRole("button", { name: "เชื่อมต่อ " + run + " created", exact: true })
    .click();
  const section = page.getByRole("region", {
    name: "การเชื่อมต่อ " + run + " created",
  });
  await section
    .getByRole("button", { name: "สร้าง token", exact: true })
    .click();
  await expect(section.getByLabel("Service Token ใหม่")).toContainText("mst_");
  const secret = await section.getByLabel("Service Token ใหม่").innerText();
  page.once("dialog", (d) => d.accept());
  await section
    .getByRole("button", { name: "หมุน token ทั้งหมด", exact: true })
    .click();
  await expect(section.getByLabel("Service Token ใหม่")).not.toHaveText(secret);
  const app = await db.appItem.findUniqueOrThrow({
    where: { slug: run + "-created" },
  });
  expect(app.icon).toBe("FileText");
  expect(
    await db.serviceToken.count({ where: { appId: app.id, revokedAt: null } }),
  ).toBe(1);
  await expect(
    section.getByText("ยังไม่มีการเรียกใช้งาน").first(),
  ).toBeVisible();
});
test("admin member controls apply immediately and protect the last admin", async ({
  request,
}) => {
  await apiLogin(request, adminEmail);
  expect(
    (
      await request.post("/api/admin/users", {
        data: { id: memberId, status: "SUSPENDED" },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await db.user.findUniqueOrThrow({ where: { id: memberId } })).status,
  ).toBe("SUSPENDED");
  expect(
    (
      await request.post("/api/admin/users", {
        data: { id: memberId, status: "ACTIVE" },
      })
    ).status(),
  ).toBe(200);
  // Isolated test DB contains exactly this active admin; this is never run on production data.
  expect(
    await db.user.count({ where: { role: "ADMIN", status: "ACTIVE" } }),
  ).toBe(1);
  const last = await request.post("/api/admin/users", {
    data: { id: adminId, role: "MEMBER" },
  });
  expect(last.status()).toBe(409);
  expect((await last.json()).code).toBe("LAST_ADMIN");
  const settings = await request.get("/api/admin/settings");
  expect(settings.status()).toBe(200);
  const text = await settings.text();
  expect(text).not.toContain("DATABASE_URL");
  expect(text).not.toContain("RESEND_API_KEY");
  expect(
    (
      await request.post("/api/admin/settings", {
        data: { registrationEnabled: false },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post("/api/auth/register", {
        data: { email: createdEmail("closed"), password },
      })
    ).status(),
  ).toBe(403);
  await request.post("/api/admin/settings", {
    data: { registrationEnabled: true },
  });
});
test("notification pagination and unread counts include all records", async ({
  page,
}) => {
  await db.notification.createMany({
    data: Array.from({ length: 35 }, (_, i) => ({
      userId: memberId,
      title: "แจ้งเตือน " + i,
      message: "ข้อมูล",
      sourceApp: "Monolith",
    })),
  });
  await login(page);
  const result = await page.request.get("/api/notifications");
  const first = await result.json();
  expect(first.notifications).toHaveLength(30);
  expect(first.unreadCount).toBeGreaterThanOrEqual(35);
  expect(first.nextCursor).toBeTruthy();
  const second = await (
    await page.request.get("/api/notifications?cursor=" + first.nextCursor)
  ).json();
  expect(second.notifications.length).toBeGreaterThanOrEqual(5);
  expect(
    second.notifications.some((n: { id: string }) =>
      first.notifications.some((p: { id: string }) => p.id === n.id),
    ),
  ).toBe(false);
  await page.locator('summary[aria-label^="การแจ้งเตือน"]').click();
  await expect(
    page.getByRole("button", { name: "โหลดแจ้งเตือนเพิ่มเติม" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "โหลดแจ้งเตือนเพิ่มเติม" }).click();
  await page.getByRole("button", { name: "อ่านทั้งหมด", exact: true }).click();
  await expect
    .poll(() =>
      db.notification.count({ where: { userId: memberId, isRead: false } }),
    )
    .toBe(0);
  const notification = await page.request.post("/api/notifications", {
    headers: { Authorization: "Bearer " + serviceToken },
    data: {
      userId: memberId,
      title: "จากบริการ",
      message: "สำเร็จ",
      sourceApp: "FORGED",
    },
  });
  expect(notification.status()).toBe(201);
  expect((await notification.json()).notification.sourceApp).toBe(run + " sso");
  expect(
    (
      await page.request.post("/api/notifications", {
        data: { userId: adminId, title: "ปลอม", message: "ไม่ได้" },
      })
    ).status(),
  ).toBe(403);
});
test("unsafe return URLs never redirect off the registered service", async ({
  request,
}) => {
  await apiLogin(request);
  const response = await request.get(
    `/auth/continue?service=${ssoId}&returnTo=${encodeURIComponent("https://attacker.test/")}`,
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location).pathname).toBe("/");
  expect((await request.get("/api/health/live")).status()).toBe(200);
  expect((await request.get("/api/health/ready")).status()).toBe(200);
});

test("password change revokes sessions and cannot revoke another user's session", async ({
  request,
}) => {
  const email = createdEmail("password-change");
  const user = await db.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      emailVerifiedAt: new Date(),
    },
  });
  const foreign = await db.session.create({
    data: {
      tokenHash: tokenHash(randomBytes(32).toString("base64url")),
      userId: memberId,
      device: "foreign fixture",
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  await apiLogin(request, email);
  expect(
    (await request.delete("/api/auth/sessions?id=" + foreign.id)).status(),
  ).toBe(200);
  expect(
    (await db.session.findUniqueOrThrow({ where: { id: foreign.id } }))
      .revokedAt,
  ).toBeNull();
  expect(
    (
      await request.post("/api/auth/change-password", {
        data: { currentPassword: "wrong", password: password + "-new" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/auth/change-password", {
        data: { currentPassword: password, password: password + "-new" },
      })
    ).status(),
  ).toBe(200);
  expect(
    await db.session.count({ where: { userId: user.id, revokedAt: null } }),
  ).toBe(0);
  expect((await (await request.get("/api/auth/me")).json()).user).toBeNull();
  await apiLogin(request, email, password + "-new");
});

test("service scopes and disabled status are enforced for notifications", async ({
  request,
}) => {
  await apiLogin(request);
  for (const scopes of [["session:read"], ["notifications:write"]]) {
    const raw = "mst_" + randomBytes(32).toString("base64url");
    await db.serviceToken.create({
      data: {
        appId: ssoId,
        tokenHash: tokenHash(raw),
        prefix: raw.slice(0, 12),
        scopes,
      },
    });
    const headers = { Authorization: "Bearer " + raw };
    if (scopes[0] === "session:read")
      expect(
        (
          await request.post("/api/notifications", {
            headers,
            data: { userId: memberId, title: "x", message: "x" },
          })
        ).status(),
      ).toBe(403);
    else
      expect(
        (await request.get("/api/integrations/session", { headers })).status(),
      ).toBe(403);
  }
  await db.appItem.update({
    where: { id: ssoId },
    data: { status: "DISABLED" },
  });
  expect(
    (
      await request.post("/api/notifications", {
        headers: { Authorization: "Bearer " + serviceToken },
        data: { userId: memberId, title: "x", message: "x" },
      })
    ).status(),
  ).toBe(403);
  await db.appItem.update({ where: { id: ssoId }, data: { status: "ONLINE" } });
});

test("administrator verification CLI sends an ownership link", async () => {
  execFileSync(
    process.execPath,
    [
      "--env-file=apps/hub/.env.local",
      "--import",
      "tsx",
      "scripts/verify-admin.ts",
    ],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_EMAIL: adminEmail,
        HUB_URL: hub,
        APP_ENV: "test",
        SESSION_COOKIE_DOMAIN: ".monolith.test",
        MAIL_PROVIDER: "mailpit",
      },
      stdio: "pipe",
      timeout: 30000,
    },
  );
  expect((await emailLink(adminEmail)).includes("#token=")).toBe(true);
});
