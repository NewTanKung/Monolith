import { serviceTokens } from "@/lib/admin";
type Context = { params: Promise<{ id: string }> };
export async function GET(req: Request, ctx: Context) {
  return serviceTokens(req, (await ctx.params).id);
}
export async function POST(req: Request, ctx: Context) {
  return serviceTokens(req, (await ctx.params).id);
}
export async function DELETE(req: Request, ctx: Context) {
  return serviceTokens(req, (await ctx.params).id);
}
