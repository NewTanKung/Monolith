import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assertSameOrigin(req: Request) {
  const expected = new URL(process.env.HUB_URL || req.url).origin;
  const origin = req.headers.get("origin");
  // Non-browser integrations authenticate separately. Reject browser cross-site writes.
  if (
    (origin && origin !== expected) ||
    req.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new HttpError(403, "This request origin is not allowed.");
  }
}
export async function jsonBody(req: Request): Promise<unknown> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new HttpError(415, "Use application/json.");
  }
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new HttpError(413, "Request body is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
