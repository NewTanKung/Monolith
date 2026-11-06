import React from "react";
import { Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";

interface HeroSectionProps {
  userName?: string | null;
  totalApps: number;
  onlineApps: number;
}

export function HeroSection({ userName, totalApps, onlineApps }: HeroSectionProps) {
  const greeting = userName ? `Welcome back, ${userName}` : "Welcome to Monolith Hub";

  return (
    <section className="relative px-4 sm:px-8 pt-4 pb-8 max-w-7xl mx-auto">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Lifestyle, Work & Gaming Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            {greeting}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl leading-relaxed">
            Your centralized portal for seamless navigation across your ecosystem with Single Sign-On and zero friction.
          </p>
        </div>

        {/* Live Metrics Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl liquid-glass flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Services
              </div>
              <div className="text-sm font-bold text-white">
                {onlineApps} / {totalApps} <span className="text-emerald-400 text-xs">Online</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex px-4 py-2.5 rounded-2xl liquid-glass items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                SSO Status
              </div>
              <div className="text-sm font-bold text-white">
                Subdomain Ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
