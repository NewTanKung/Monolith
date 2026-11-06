import { demoUser, hubUrl } from "@/lib/session";
import { MatchArenaClient } from "./MatchArenaClient";
import { Gamepad2, ArrowLeft, ShieldCheck } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function CyberArenaPage() {
  const user = await demoUser();
  const hub = hubUrl();
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center gap-8 px-5 py-12"
    >
      <a
        href={hub}
        className="inline-flex items-center gap-2 text-sm text-zinc-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Hub
      </a>
      <section className="liquid-glass rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="flex items-center gap-4">
          <Gamepad2 className="h-12 w-12 text-cyan-400" />
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-300">
              Monolith / Gaming
            </p>
            <h1 className="text-3xl font-bold">Cyber Arena</h1>
          </div>
        </div>
        {user ? (
          <>
            <div className="rounded-2xl border border-white/10 p-5">
              <p className="flex items-center gap-2 text-sm text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                Connected to Monolith
              </p>
              <p className="mt-3 font-semibold break-words">
                {user.name || user.email}
              </p>
              <p className="text-sm text-zinc-400 break-all">
                {user.email} · {user.role}
              </p>
            </div>
            <MatchArenaClient />
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-zinc-400">
              Sign in to Monolith to join your arena.
            </p>
            <a
              className="inline-block rounded-xl bg-cyan-600 px-5 py-3 font-semibold"
              href={new URL("/login", hub).href}
            >
              Sign in to Hub
            </a>
          </div>
        )}
      </section>
    </main>
  );
}
