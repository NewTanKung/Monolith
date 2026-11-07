import { getCurrentUser } from "@/lib/session";
import { safeReturnTo } from "@/lib/services";
import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const url = new URL(req.url);
  const service = url.searchParams.get("service");
  const returnTo = url.searchParams.get("returnTo");
  const target = await safeReturnTo(service, returnTo);
  const user = await getCurrentUser();
  if (!user) {
    const login = new URL("/login", process.env.HUB_URL || req.url);
    if (target !== "/") {
      login.searchParams.set("service", service!);
      login.searchParams.set("returnTo", target);
    }
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL(target, process.env.HUB_URL || req.url));
}
