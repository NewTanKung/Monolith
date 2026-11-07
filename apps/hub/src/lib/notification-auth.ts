import { authenticatedService } from "./services";
export async function notificationService(req: Request) {
  return req.headers.has("authorization")
    ? authenticatedService(req, "notifications:write")
    : null;
}
