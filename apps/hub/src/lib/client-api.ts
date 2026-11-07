export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}
export async function requestJson<T = Record<string, unknown>>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "ติดต่อระบบไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่",
      "NETWORK_ERROR",
    );
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new ApiError("ระบบตอบกลับไม่สำเร็จ กรุณาลองใหม่", "SERVER_ERROR");
  }
  if (!response.ok)
    throw new ApiError(
      result.error || "ทำรายการไม่สำเร็จ กรุณาลองใหม่",
      result.code || "REQUEST_FAILED",
      result.fields,
    );
  return result as T;
}
