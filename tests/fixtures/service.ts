import http from "node:http";
import {
  getServiceSession,
  createHubLoginUrl,
  HubAuthError,
} from "../../packages/auth-client/src/server";
const credentials = new Map<string, string>();
const publicHub = process.env.E2E_HUB_URL!;
const internalHub = new URL(publicHub);
internalHub.hostname = "127.0.0.1";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
http
  .createServer(async (req, res) => {
    const url = new URL(req.url!, "http://service.monolith.test:19001");
    if (url.pathname === "/livez") {
      res.end("ok");
      return;
    }
    if (url.pathname === "/__configure" && req.method === "POST") {
      if (
        !process.env.FIXTURE_CONTROL_KEY ||
        req.headers["x-fixture-key"] !== process.env.FIXTURE_CONTROL_KEY
      ) {
        res.writeHead(403).end();
        return;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 4096) {
          res.writeHead(413).end();
          return;
        }
      }
      const { serviceId, token } = JSON.parse(body);
      credentials.set(serviceId, token);
      res.end("ok");
      return;
    }
    const serviceId = url.searchParams.get("app") || "";
    const serviceToken = credentials.get(serviceId);
    if (!serviceToken) {
      res.writeHead(404).end();
      return;
    }
    try {
      const session = await getServiceSession(req.headers.cookie, {
        hubUrl: internalHub.origin,
        serviceToken,
      });
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        `<h1>เชื่อมต่อ Monolith แล้ว</h1><pre>${escape(JSON.stringify(session.user))}</pre>`,
      );
    } catch (error) {
      console.error(
        "Fixture access",
        error instanceof HubAuthError
          ? `${error.status} ${error.code}`
          : error instanceof Error
            ? error.name
            : "UnknownError",
      );
      if (
        error instanceof HubAuthError &&
        error.status === 401 &&
        error.code === "UNAUTHENTICATED"
      ) {
        res
          .writeHead(302, {
            Location: createHubLoginUrl({
              hubUrl: publicHub,
              serviceId,
              returnTo: url.href,
            }),
          })
          .end();
      } else {
        res
          .writeHead(error instanceof HubAuthError ? error.status : 503)
          .end("Service access denied");
      }
    }
  })
  .listen(19001, "127.0.0.1");
