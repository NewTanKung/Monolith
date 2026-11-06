import { Activity } from "lucide-react";
export function HeroSection({
  userName,
  totalApps,
  onlineApps,
}: {
  userName?: string | null;
  totalApps: number;
  onlineApps: number;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-8 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div className="min-w-0 max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-indigo-300">
            Your connected workspace
          </p>
          <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {userName ? "Welcome back, " + userName : "Everything starts here."}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Your tools, games, and everyday spaces. One place to find them, one
            account to connect them.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Activity className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-xs text-zinc-400">Available applications</p>
            <p className="font-semibold tabular-nums">
              {onlineApps}{" "}
              <span className="font-normal text-zinc-500">/ {totalApps}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
