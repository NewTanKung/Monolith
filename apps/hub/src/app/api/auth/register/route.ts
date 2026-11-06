import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/session";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // First user registered becomes ADMIN automatically
    const totalUsers = await prisma.user.count();
    const assignedRole = totalUsers === 0 ? Role.ADMIN : Role.MEMBER;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name ? name.trim() : cleanEmail.split("@")[0],
        passwordHash,
        role: assignedRole,
      },
    });

    const hubUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      image: newUser.image,
    };

    // Issue Domain Cookie & Signed JWT
    await setSessionCookie(hubUser);

    return NextResponse.json({ success: true, user: hubUser });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Failed to create account. Please verify database connection." }, { status: 500 });
  }
}
