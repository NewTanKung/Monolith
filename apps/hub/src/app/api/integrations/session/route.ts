import {
  extractHubSessionFromCookie,
  hasRequiredRole,
} from "@monolith/auth-client";
import { authenticatedService } from "@/lib/services";
import { findSession } from "@/lib/session";
import { HttpError, apiError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
export async function GET(req: Request) {
  try {
    const token = await authenticatedService(req, "session:read");
    await rateLimit("introspection", token.id, 600, 60000);
    const cookie = extractHubSessionFromCookie(req.headers.get("cookie"));
    const session = await findSession(cookie || undefined);
    if (!session && token.app.minRole !== "GUEST")
      throw new HttpError(401, "กรุณาเข้าสู่ระบบ", "UNAUTHENTICATED");
    if (!hasRequiredRole(session?.user.role, token.app.minRole))
      throw new HttpError(403, "ไม่มีสิทธิ์เข้าบริการนี้", "FORBIDDEN");
    const u = session?.user;
    return Response.json(
      {
        user: u
          ? {
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              image: u.image,
            }
          : null,
        service: { id: token.app.id, slug: token.app.slug },
        access: { role: u?.role || "GUEST" },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
