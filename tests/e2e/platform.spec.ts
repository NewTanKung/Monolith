import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
const run = "e2e-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const email = run + "@example.test";
const adminEmail = "admin-" + email;
const password = "Testing-password-42";
let memberId = "";
let adminId = "";
let restrictedId = "";
let maintenanceId = "";
async function login(page: import("@playwright/test").Page, admin = false) {
  await page.goto("/login");
  await page.getByLabel("Email Address").fill(admin ? adminEmail : email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign In to Ecosystem" }).click();
  await expect(page).toHaveURL("http://localhost:3000/");
  await expect(
    page.getByRole("heading", { name: /Welcome back/ }),
  ).toBeVisible();
}
test.beforeAll(async () => {
  const hash = await bcrypt.hash(password, 12);
  memberId = (
    await prisma.user.create({
      data: { email, passwordHash: hash, name: "Test Member", role: "MEMBER" },
    })
  ).id;
  adminId = (
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: hash,
        name: "Test Admin",
        role: "ADMIN",
      },
    })
  ).id;
  restrictedId = (
    await prisma.appItem.create({
      data: {
        name: run + " private",
        slug: run + "-private",
        description: "Admin-only test application",
        category: "WORK",
        status: "ONLINE",
        minRole: "ADMIN",
        url: "/apps/" + run + "-private",
        icon: "Shield",
      },
    })
  ).id;
  maintenanceId = (
    await prisma.appItem.create({
      data: {
        name: run + " maintenance",
        slug: run + "-maintenance",
        description: "Maintenance test application",
        category: "WORK",
        status: "MAINTENANCE",
        minRole: "GUEST",
        url: "https://example.test/maintenance",
        icon: "Shield",
      },
    })
  ).id;
});
test.afterAll(async () => {
  await prisma.appItem.deleteMany({ where: { slug: { startsWith: run } } });
  await prisma.user.deleteMany({ where: { id: { in: [memberId, adminId] } } });
  await prisma.$disconnect();
});
test("anonymous writes and direct private URLs are blocked", async ({
  page,
  request,
}) => {
  expect(
    (
      await request.post("/api/notifications", {
        data: {
          email,
          title: "forged",
          message: "not allowed",
          sourceApp: "Trusted",
        },
      })
    ).status(),
  ).toBe(401);
  expect((await request.get("/api/admin/apps")).status()).toBe(401);
  await page.goto("/");
  await expect(page.getByText(run + " private", { exact: true })).toHaveCount(
    0,
  );
  await page.goto("/apps/" + run + "-private");
  await expect(
    page.getByRole("heading", { name: "404", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(run + " private", { exact: true })).toHaveCount(
    0,
  );
  expect((await request.get("/apps/" + run + "-private/launch")).status()).toBe(
    404,
  );
  const launch = await request.get("/apps/" + run + "-maintenance/launch", {
    maxRedirects: 0,
  });
  expect(launch.status()).toBe(307);
  expect(launch.headers().location).toContain("/apps/" + run + "-maintenance");
  await page.goto("/apps/" + run + "-maintenance");
  await expect(page.getByRole("status")).toContainText("maintenance");
});
test("member favorites stay synchronized and search controls categories", async ({
  page,
}) => {
  await login(page);
  await expect(page.getByText(run + " private", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Pin Cyber Arena", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Unpin Cyber Arena", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Unpin Cyber Arena", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Pin Cyber Arena", exact: true }),
  ).toHaveCount(1);
  await page.keyboard.press("Control+k");
  const search = page.getByRole("dialog", { name: "Search applications" });
  await expect(search).toBeVisible();
  await search.getByRole("combobox").fill("arena");
  await expect(search.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();
  await page.keyboard.press("Control+k");
  await search.getByRole("button", { name: "WORK", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Work & Tools", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const account = await page
    .getByRole("button", { name: "Account menu", exact: true })
    .boundingBox();
  expect(account).not.toBeNull();
  expect(account!.x + account!.width).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  await page.screenshot({
    path: "test-results/" + test.info().project.name + "-hub.png",
    fullPage: true,
  });
});
test("admin editing preserves the intended access settings", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin");
  await page
    .getByRole("button", { name: "Maintain " + run + " private", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("status updated");
  const app = await prisma.appItem.findUniqueOrThrow({
    where: { id: restrictedId },
  });
  expect(app.status).toBe("MAINTENANCE");
  expect(app.minRole).toBe("ADMIN");
  await page
    .getByRole("button", { name: "Edit " + run + " private", exact: true })
    .click();
  await page.getByLabel("Minimum role", { exact: true }).selectOption("MEMBER");
  await page
    .getByRole("button", { name: "Save application", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("saved");
  expect(
    (await prisma.appItem.findUniqueOrThrow({ where: { id: restrictedId } }))
      .minRole,
  ).toBe("MEMBER");
});
test("member cannot target another account and Demo delivers a server-authenticated event", async ({
  page,
}) => {
  await login(page);
  expect(
    (
      await page.request.post("/api/notifications", {
        data: { userId: adminId, title: "forged", message: "blocked" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.put("/api/admin/apps", {
        data: { id: maintenanceId, status: "ONLINE" },
      })
    ).status(),
  ).toBe(403);
  await page.goto("http://localhost:3001");
  await expect(
    page.getByText("Connected to Monolith", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Simulate victory", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Delivered");
  await page.goto("http://localhost:3000");
  await page.locator('summary[aria-label^="Notifications"]').click();
  await expect(
    page.getByRole("heading", { name: "Victory in Cyber Arena", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mark read", exact: true })
    .first()
    .click();
  await expect
    .poll(async () =>
      prisma.notification.count({ where: { userId: memberId, isRead: false } }),
    )
    .toBe(0);
});
test("registration never grants admin and deleted accounts lose access immediately", async ({
  request,
}) => {
  const fresh = run + "-new@example.test";
  try {
    const response = await request.post("/api/auth/register", {
      data: { email: fresh, name: "New member", password },
    });
    expect(response.status()).toBe(201);
    const user = (await response.json()).user;
    expect(user.role).toBe("MEMBER");
    await prisma.user.delete({ where: { id: user.id } });
    expect(
      (
        await request.post("/api/apps/favorite", {
          data: { appId: maintenanceId, favorite: true },
        })
      ).status(),
    ).toBe(401);
  } finally {
    await prisma.user.deleteMany({ where: { email: fresh } });
  }
});
