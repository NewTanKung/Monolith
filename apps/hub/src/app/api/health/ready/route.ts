import { readiness } from "@/lib/readiness";
export async function GET() {
  const result = await readiness();
  return Response.json(
    { ok: result.ok },
    { status: result.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
