// Loopback-only test proxy: resolve test subdomains without editing OS hosts.
import http from "node:http";
import net from "node:net";
const server = http.createServer((req, res) => {
  if (req.url === "/livez") {
    res.end("ok");
    return;
  }
  let url;
  try {
    url = new URL(req.url);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (
    !["hub.monolith.test", "service.monolith.test"].includes(url.hostname) ||
    url.protocol !== "http:"
  ) {
    res.writeHead(403).end();
    return;
  }
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port: url.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: { ...req.headers, host: url.host },
    },
    (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    },
  );
  upstream.on("error", () =>
    res.writeHead(502).end("Test upstream unavailable"),
  );
  req.pipe(upstream);
});
server.on("connect", (req, socket, head) => {
  let url;
  try {
    url = new URL("http://" + req.url);
  } catch {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    return;
  }
  if (!["hub.monolith.test", "service.monolith.test"].includes(url.hostname)) {
    socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
    return;
  }
  const upstream = net.connect(Number(url.port) || 80, "127.0.0.1", () => {
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
  socket.on("close", () => upstream.destroy());
});
server.listen(19002, "127.0.0.1");
