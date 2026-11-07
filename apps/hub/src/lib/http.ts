import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = "REQUEST_FAILED",
    public fields: Record<string, string> = {},
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
    throw new HttpError(403, "ต้นทางคำขอไม่ถูกต้อง", "INVALID_ORIGIN");
  }
}
export async function jsonBody(req: Request): Promise<unknown> {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new HttpError(415, "ต้องส่งข้อมูลแบบ JSON", "UNSUPPORTED_MEDIA_TYPE");
  }
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "ไม่พบข้อมูลคำขอ", "INVALID_BODY");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new HttpError(413, "ข้อมูลคำขอใหญ่เกินกำหนด", "PAYLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "รูปแบบ JSON ไม่ถูกต้อง", "INVALID_JSON");
  }
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message, code: error.code, fields: error.fields },
      { status: error.status },
    );
  console.error(
    "Request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return NextResponse.json(
    { error: "เกิดข้อผิดพลาด กรุณาลองใหม่", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
