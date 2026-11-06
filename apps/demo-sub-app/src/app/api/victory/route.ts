import { NextResponse } from "next/server";
import { demoUser, hubUrl } from "@/lib/session";
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const expected = new URL(process.env.DEMO_URL || req.url).origin;
    if (
      (origin && origin !== expected) ||
      req.headers.get("sec-fetch-site") === "cross-site"
    ) {
      return NextResponse.json(
        { error: "Request origin is not allowed." },
        { status: 403 },
      );
    }
    const user = await demoUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to simulate a match." },
        { status: 401 },
      );
    const token = process.env.MONOLITH_SERVICE_TOKEN;
    if (!token || token.length < 32)
      throw new Error("Configure MONOLITH_SERVICE_TOKEN.");
    const response = await fetch(new URL("/api/notifications", hubUrl()), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        userId: user.id,
        title: "Victory in Cyber Arena",
        message: (user.name || user.email) + " secured first place. +150 LP",
        linkUrl: process.env.DEMO_URL || "http://localhost:3001",
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok)
      return NextResponse.json(
        { error: "Unable to deliver the event. Please try again." },
        { status: response.status === 429 ? 429 : 502 },
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Victory event failed:", error);
    return NextResponse.json(
      { error: "The Hub is unavailable. Please try again." },
      { status: 503 },
    );
  }
}
