import { cookies } from "next/headers";
import { verifyHubSession, DEFAULT_COOKIE_NAME } from "@monolith/auth-client";
import { MatchArenaClient } from "./MatchArenaClient";
import { Gamepad2, ArrowLeft, ShieldCheck, AlertCircle, LogIn, Sparkles } from "lucide-react";

export const revalidate = 0;

export default async function CyberArenaPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DEFAULT_COOKIE_NAME);

  let user = null;
  if (sessionCookie && sessionCookie.value) {
    const rawCookieHeader = `${DEFAULT_COOKIE_NAME}=${sessionCookie.value}`;
    user = await verifyHubSession(rawCookieHeader);
  }

  return (
    <main className="min-h-screen p-4 sm:p-12 max-w-5xl mx-auto flex flex-col justify-center">
      {/* Return to Hub */}
      <div className="mb-6">
        <a
          href="http://localhost:3000"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Monolith Hub</span>
        </a>
      </div>

      <div className="rounded-3xl liquid-glass p-6 sm:p-10 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-neon">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Cyber Arena</h1>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Subdomain Demo App
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Connected sub-application powered by Monolith SSO
              </p>
            </div>
          </div>

          <div>
            {user ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                SSO Session Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4" />
                Unauthenticated
              </span>
            )}
          </div>
        </div>

        {/* User Identity SSO Verification Panel */}
        <div className="my-8 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Shared Domain Cookie Validation Result
            </span>
            <span className="text-[10px] font-mono text-zinc-500">
              Verified by @monolith/auth-client
            </span>
          </div>

          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={user.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                  alt={user.name || "User"}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-cyan-400/50"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{user.name || "Ecosystem User"}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 text-[10px] font-bold">
                      {user.role}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">{user.email}</div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">User ID: {user.id}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-semibold text-emerald-400">Zero-Redirect Logged In</div>
                <div className="text-[10px] text-zinc-500">Session Cookie shared seamlessly</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-zinc-400 mb-3">
                No active Monolith Hub session found in this browser context.
              </p>
              <a
                href="http://localhost:3000/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In at Monolith Hub
              </a>
            </div>
          )}
        </div>

        {/* In-Game Action & Event Simulator */}
        {user && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Cross-System Action (Push to Central Hub)
            </h3>
            <MatchArenaClient
              userId={user.id}
              userName={user.name}
              userEmail={user.email}
            />
          </div>
        )}
      </div>
    </main>
  );
}
