import { z } from "zod";
import { prisma } from "./prisma";
import { requireAdmin } from "./session";
import { assertSameOrigin, HttpError, jsonBody, apiError } from "./http";
import { parse } from "./validation";
import { audit, tokenMetadata, validateSsoUrl } from "./services";
import { randomToken, tokenHash } from "./security";
import { readiness } from "./readiness";

export async function adminGet(req: Request, resource: string) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const page = Math.max(
      1,
      Math.min(10000, Number(url.searchParams.get("page")) || 1),
    );
    if (!Number.isInteger(page)) throw new HttpError(400, "หน้าไม่ถูกต้อง");
    if (resource === "users") {
      const q = (url.searchParams.get("q") || "").trim().slice(0, 100);
      const where = q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip: (page - 1) * 20,
          take: 20,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);
      return Response.json({ users, total, page });
    }
    if (resource === "settings")
      return Response.json({
        registrationEnabled:
          (await prisma.hubSettings.findUnique({ where: { id: "hub" } }))
            ?.registrationEnabled ?? true,
        environmentAllowsRegistration:
          process.env.ALLOW_REGISTRATION !== "false",
        readiness: await readiness(),
      });
    if (resource === "audit")
      return Response.json({
        entries: await prisma.auditLog.findMany({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (page - 1) * 30,
          take: 30,
        }),
        page,
      });
    throw new HttpError(404, "ไม่พบรายการ");
  } catch (error) {
    return apiError(error);
  }
}
export async function adminPost(req: Request, resource: string) {
  try {
    assertSameOrigin(req);
    const actor = await requireAdmin();
    const body = await jsonBody(req);
    if (resource === "users") {
      const input = parse(
        z
          .object({
            id: z.string().min(1),
            role: z.enum(["GUEST", "MEMBER", "ADMIN"]).optional(),
            status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
            revokeSessions: z.boolean().optional(),
          })
          .strict()
          .refine(
            (v) => v.role || v.status || v.revokeSessions,
            "ไม่ได้ระบุการเปลี่ยนแปลง",
          ),
        body,
      );
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(707011)::text`;
        const admin = await tx.user.findUnique({ where: { id: actor.id } });
        if (admin?.role !== "ADMIN" || admin.status !== "ACTIVE")
          throw new HttpError(403, "ไม่มีสิทธิ์จัดการสมาชิก");
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${input.id} FOR UPDATE`;
        const target = await tx.user.findUnique({ where: { id: input.id } });
        if (!target) throw new HttpError(404, "ไม่พบสมาชิก");
        const removesAdmin =
          (input.role && input.role !== "ADMIN") ||
          input.status === "SUSPENDED";
        if (
          target.role === "ADMIN" &&
          target.status === "ACTIVE" &&
          target.emailVerifiedAt &&
          removesAdmin &&
          (await tx.user.count({
            where: {
              role: "ADMIN",
              status: "ACTIVE",
              emailVerifiedAt: { not: null },
            },
          })) <= 1
        )
          throw new HttpError(
            409,
            "ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อยหนึ่งคน",
            "LAST_ADMIN",
          );
        await tx.user.update({
          where: { id: input.id },
          data: {
            ...(input.role ? { role: input.role } : {}),
            ...(input.status ? { status: input.status } : {}),
          },
        });
        if (input.revokeSessions || input.status === "SUSPENDED")
          await tx.session.updateMany({
            where: { userId: input.id, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        await audit(
          tx,
          actor.id,
          input.revokeSessions ? "user.sessions_revoked" : "user.updated",
          input.id,
        );
      });
      return Response.json({ success: true });
    }
    if (resource === "settings") {
      const input = parse(
        z.object({ registrationEnabled: z.boolean() }).strict(),
        body,
      );
      await prisma.$transaction(async (tx) => {
        await tx.hubSettings.upsert({
          where: { id: "hub" },
          create: { id: "hub", ...input },
          update: input,
        });
        await audit(tx, actor.id, "settings.updated", "hub");
      });
      return Response.json({ success: true });
    }
    throw new HttpError(404, "ไม่พบรายการ");
  } catch (error) {
    return apiError(error);
  }
}
export async function serviceTokens(req: Request, appId: string) {
  try {
    if (req.method !== "GET") assertSameOrigin(req);
    const actor = await requireAdmin();
    const app = await prisma.appItem.findUnique({ where: { id: appId } });
    if (!app) throw new HttpError(404, "ไม่พบบริการ");
    if (req.method === "GET")
      return Response.json({
        tokens: await prisma.serviceToken.findMany({
          where: { appId },
          select: tokenMetadata,
          orderBy: { createdAt: "desc" },
        }),
      });
    if (req.method === "DELETE") {
      const id = new URL(req.url).searchParams.get("id");
      if (!id) throw new HttpError(400, "ต้องระบุ token");
      await prisma.$transaction(async (tx) => {
        const result = await tx.serviceToken.updateMany({
          where: { id, appId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (!result.count) throw new HttpError(404, "ไม่พบ token ที่ใช้งานได้");
        await audit(tx, actor.id, "service_token.revoked", appId);
      });
      return Response.json({ success: true });
    }
    if (app.mode !== "SSO" || app.status === "DISABLED")
      throw new HttpError(400, "เปิด SSO ให้บริการก่อนสร้าง token");
    validateSsoUrl(app.url);
    const input = parse(
      z
        .object({
          scopes: z
            .array(z.enum(["session:read", "notifications:write"]))
            .min(1)
            .max(2),
          rotate: z.boolean().default(false),
        })
        .strict(),
      await jsonBody(req),
    );
    const token = "mst_" + randomToken();
    const credential = await prisma.$transaction(async (tx) => {
      if (input.rotate)
        await tx.serviceToken.updateMany({
          where: { appId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      const saved = await tx.serviceToken.create({
        data: {
          appId,
          tokenHash: tokenHash(token),
          prefix: token.slice(0, 12),
          scopes: [...new Set(input.scopes)],
        },
        select: tokenMetadata,
      });
      await audit(
        tx,
        actor.id,
        input.rotate ? "service_token.rotated" : "service_token.created",
        appId,
      );
      return saved;
    });
    return Response.json(
      { token, credential },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
