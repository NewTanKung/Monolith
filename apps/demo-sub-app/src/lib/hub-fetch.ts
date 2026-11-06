import { getCloudflareContext } from "@opennextjs/cloudflare";

export function hubUrl() {
  return process.env.HUB_URL || "http://localhost:3000";
}

export function hubFetch(path: string, init?: RequestInit): Promise<Response> {
  const timeout = Number(process.env.HUB_REQUEST_TIMEOUT_MS || 15000);
  if (!Number.isInteger(timeout) || timeout < 1000 || timeout > 60000) {
    throw new Error("HUB_REQUEST_TIMEOUT_MS must be between 1000 and 60000.");
  }
  let service: { fetch(request: Request): Promise<Response> } | undefined;
  try {
    const { env } = getCloudflareContext();
    service = (env as { HUB?: typeof service }).HUB;
  } catch {
    /* next dev/start uses the configured public Hub URL. */
  }
  const request = new Request(new URL(path, hubUrl()), {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(timeout),
  });
  return service ? service.fetch(request) : fetch(request);
}
