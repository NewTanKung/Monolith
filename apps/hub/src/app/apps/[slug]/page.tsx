import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { IconRenderer } from "@/components/common/IconRenderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AppDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const app = await prisma.appItem.findUnique({
    where: { slug },
  });

  if (!app) {
    notFound();
  }

  return (
    <div className="min-h-screen p-6 sm:p-12 max-w-5xl mx-auto flex flex-col justify-center">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Monolith Hub
      </Link>

      <div className="rounded-3xl liquid-glass p-8 sm:p-12 border border-white/10 relative overflow-hidden shadow-2xl">
        <div
          className={`absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br ${app.color} opacity-20 blur-3xl pointer-events-none`}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/10">
          <div className="flex items-center gap-5">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shadow-liquid-md`}
            >
              <IconRenderer name={app.icon} className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{app.name}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                  {app.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">{app.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
              Ecosystem Connected
            </span>
          </div>
        </div>

        {/* User Identity SSO Card */}
        <div className="mt-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            SSO Session Context
          </div>
          {user ? (
            <div className="flex items-center gap-4">
              <img
                src={user.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                alt={user.name || "User"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/50"
              />
              <div>
                <div className="text-sm font-semibold text-white">{user.name || user.email}</div>
                <div className="text-xs text-zinc-400">Authenticated via Monolith SSO Domain Cookie • Role: {user.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-400">
              Not signed in. Session cookie is anonymous or expired.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
