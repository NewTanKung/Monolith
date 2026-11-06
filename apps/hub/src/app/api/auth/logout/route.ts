import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";
import { apiError, assertSameOrigin } from "@/lib/http";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
