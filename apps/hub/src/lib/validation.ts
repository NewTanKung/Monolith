import { z } from "zod";
import { HttpError } from "./http";

export const safeUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !value.includes("\\")
    )
      return true;
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Use an HTTP(S) URL or a local path.");
const email = z.string().trim().toLowerCase().email().max(254);
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(72) })
  .strict();
export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(12)
      .max(72)
      .refine(
        (v) => Buffer.byteLength(v) <= 72,
        "Password must be at most 72 bytes.",
      ),
    name: z.string().trim().min(1).max(80).optional(),
  })
  .strict();
export const appSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    description: z.string().trim().max(1000).default(""),
    category: z.enum(["GAME", "WORK", "LIFESTYLE"]),
    status: z
      .enum(["ONLINE", "BETA", "MAINTENANCE", "DISABLED"])
      .default("ONLINE"),
    url: safeUrl,
    icon: z
      .string()
      .regex(/^[A-Za-z0-9]+$/)
      .max(60)
      .default("LayoutGrid"),
    color: z
      .enum([
        "from-cyan-500 to-blue-600",
        "from-indigo-500 to-purple-600",
        "from-rose-500 to-pink-600",
        "from-amber-500 to-orange-600",
        "from-emerald-500 to-teal-600",
        "from-purple-500 to-indigo-600",
        "from-amber-400 to-orange-500",
        "from-blue-500 to-indigo-600",
        "from-violet-500 to-purple-600",
        "from-pink-500 to-purple-500",
      ])
      .default("from-indigo-500 to-purple-600"),
    minRole: z.enum(["GUEST", "MEMBER", "ADMIN"]).default("GUEST"),
    orderIndex: z.number().int().min(0).max(10000).default(0),
    isFeatured: z.boolean().default(false),
  })
  .strict();
export const appUpdateSchema = appSchema
  .partial()
  .extend({
    id: z.string().min(1),
    description: appSchema.shape.description.removeDefault().optional(),
    status: appSchema.shape.status.removeDefault().optional(),
    icon: appSchema.shape.icon.removeDefault().optional(),
    color: appSchema.shape.color.removeDefault().optional(),
    minRole: appSchema.shape.minRole.removeDefault().optional(),
    orderIndex: appSchema.shape.orderIndex.removeDefault().optional(),
    isFeatured: appSchema.shape.isFeatured.removeDefault().optional(),
  })
  .strict();
export const favoriteSchema = z
  .object({ appId: z.string().min(1), favorite: z.boolean() })
  .strict();
export const notificationSchema = z
  .object({
    userId: z.string().min(1).optional(),
    email: email.optional(),
    title: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(2000),
    sourceApp: z.string().trim().min(1).max(80).optional(),
    linkUrl: safeUrl.optional(),
  })
  .strict();
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues[0]?.message || "Invalid request.",
    );
  return result.data;
}
