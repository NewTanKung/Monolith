import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminAppManager } from "./AdminAppManager";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Layers } from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const apps = await prisma.appItem.findMany({
    orderBy: { orderIndex: "asc" },
  });

  const usersCount = await prisma.user.count();
  const notificationsCount = await prisma.notification.count();

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-8 pt-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl liquid-pill text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Hub Administration
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin Portal
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Manage ecosystem apps, maintenance switches, and service permissions
            </p>
          </div>
        </div>

        {/* Admin User Info */}
        <div className="flex items-center gap-3 liquid-glass px-4 py-2 rounded-2xl shrink-0">
          <img
            src={user.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
            alt={user.name || "Admin"}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-400/50"
          />
          <div>
            <div className="text-xs font-semibold text-white">{user.name || user.email}</div>
            <div className="text-[10px] text-amber-400 font-bold uppercase">Root Privileges</div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl liquid-glass p-5">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Total Applications</div>
          <div className="text-2xl font-bold text-white mt-1">{apps.length}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Across Game, Work & Lifestyle</div>
        </div>
        <div className="rounded-2xl liquid-glass p-5">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Registered Users</div>
          <div className="text-2xl font-bold text-white mt-1">{usersCount}</div>
          <div className="text-[11px] text-indigo-400 mt-1">Single Sign-On Enabled</div>
        </div>
        <div className="rounded-2xl liquid-glass p-5">
          <div className="text-xs text-zinc-400 uppercase font-semibold">Active Notifications</div>
          <div className="text-2xl font-bold text-white mt-1">{notificationsCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Aggregated across services</div>
        </div>
      </div>

      {/* Interactive App Management Panel */}
      <AdminAppManager initialApps={apps as any} />
    </div>
  );
}
