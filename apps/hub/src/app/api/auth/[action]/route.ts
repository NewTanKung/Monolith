import { accountPost, sessionGet, sessionDelete } from "@/lib/accounts";
type Context = { params: Promise<{ action: string }> };
export async function POST(req: Request, ctx: Context) {
  return accountPost(req, (await ctx.params).action);
}
export async function GET(_req: Request, ctx: Context) {
  return (await ctx.params).action === "sessions"
    ? sessionGet()
    : Response.json({ error: "ไม่พบรายการ" }, { status: 404 });
}
export async function DELETE(req: Request, ctx: Context) {
  return (await ctx.params).action === "sessions"
    ? sessionDelete(req)
    : Response.json({ error: "ไม่พบรายการ" }, { status: 404 });
}
