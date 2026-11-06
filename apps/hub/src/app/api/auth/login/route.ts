import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (user && user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (isMatch) {
          const hubUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
          await setSessionCookie(hubUser);
          return NextResponse.json({ success: true, user: hubUser });
        }
      }
    } catch (dbErr) {
      console.warn("DB connection failed during login, checking in-memory demo accounts");
    }

    // In-memory demo accounts fallback (in case PostgreSQL is not running locally)
    if (cleanEmail === "admin@monolith.local" && password === "admin1234") {
      const adminUser = {
        id: "admin-demo-id",
        email: "admin@monolith.local",
        name: "Neo Commander",
        role: "ADMIN" as const,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      await setSessionCookie(adminUser);
      return NextResponse.json({ success: true, user: adminUser });
    }

    if (cleanEmail === "user@monolith.local" && password === "user1234") {
      const memberUser = {
        id: "user-demo-id",
        email: "user@monolith.local",
        name: "Alex Vance",
        role: "MEMBER" as const,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      };
      await setSessionCookie(memberUser);
      return NextResponse.json({ success: true, user: memberUser });
    }

    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
