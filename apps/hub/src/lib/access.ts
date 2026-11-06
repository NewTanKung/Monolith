import { hasRequiredRole, HubUser } from "@monolith/auth-client";
import { prisma } from "./prisma";
import { HttpError } from "./http";
export async function accessibleApp(id: string, user: HubUser | null) {
  const app = await prisma.appItem.findUnique({ where: { id } });
  if (
    !app ||
    app.status === "DISABLED" ||
    !hasRequiredRole(user?.role, app.minRole)
  ) {
    throw new HttpError(404, "Application not found.");
  }
  return app;
}
