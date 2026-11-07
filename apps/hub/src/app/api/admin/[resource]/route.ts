import { adminGet, adminPost } from "@/lib/admin";
type Context = { params: Promise<{ resource: string }> };
export async function GET(req: Request, ctx: Context) {
  return adminGet(req, (await ctx.params).resource);
}
export async function POST(req: Request, ctx: Context) {
  return adminPost(req, (await ctx.params).resource);
}
