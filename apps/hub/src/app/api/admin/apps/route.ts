import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Role } from "@prisma/client";

async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    return false;
  }
  return true;
}

// GET: list all apps for admin
export async function GET() {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  const apps = await prisma.appItem.findMany({
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ apps });
}

// POST: create new app
export async function POST(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { name, slug, description, category, status, url, icon, color, minRole, isFeatured } = data;

    if (!name || !slug || !url || !category) {
      return NextResponse.json({ error: "Missing required app fields" }, { status: 400 });
    }

    const newApp = await prisma.appItem.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: description || "",
        category,
        status: status || "ONLINE",
        url,
        icon: icon || "LayoutGrid",
        color: color || "from-indigo-500 to-purple-600",
        minRole: minRole || "GUEST",
        isFeatured: Boolean(isFeatured),
      },
    });

    return NextResponse.json({ success: true, app: newApp });
  } catch (err: any) {
    console.error("Create app error:", err);
    return NextResponse.json({ error: "Failed to create app. Slug may already exist." }, { status: 500 });
  }
}

// PUT: update existing app
export async function PUT(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, ...updateFields } = data;

    if (!id) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 });
    }

    const updatedApp = await prisma.appItem.update({
      where: { id },
      data: updateFields,
    });

    return NextResponse.json({ success: true, app: updatedApp });
  } catch (err: any) {
    console.error("Update app error:", err);
    return NextResponse.json({ error: "Failed to update app" }, { status: 500 });
  }
}

// DELETE: delete app
export async function DELETE(req: Request) {
  if (!(await checkAdmin())) {
    return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "App ID is required" }, { status: 400 });
    }

    await prisma.appItem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete app error:", err);
    return NextResponse.json({ error: "Failed to delete app" }, { status: 500 });
  }
}
