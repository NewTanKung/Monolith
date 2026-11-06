"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, ArrowRight, ShieldCheck, UserCheck, Lock, Mail, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const submitEmail = customEmail || email;
    const submitPassword = customPassword || password;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, password: submitPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleSubmit(undefined, demoEmail, demoPass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Ambient background glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl liquid-glass p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="mb-4 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-liquid-glow-indigo group-hover:scale-105 transition-transform">
              <Layers className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Monolith Hub</h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Single Sign-On access to Lifestyle, Work & Game networks
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl liquid-input text-white text-sm placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl liquid-input text-white text-sm placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold shadow-liquid-glow-indigo transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Ecosystem"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Quick Test Accounts
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Quick Demo Login Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@monolith.local", "admin1234")}
            className="p-3 rounded-xl liquid-pill text-left border border-white/10 hover:border-indigo-400/50 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 group-hover:text-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Demo</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Neo Commander</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("user@monolith.local", "user1234")}
            className="p-3 rounded-xl liquid-pill text-left border border-white/10 hover:border-purple-400/50 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 group-hover:text-purple-200">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Member Demo</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Alex Vance</p>
          </button>
        </div>

        {/* Back to Hub link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            ← Return to Monolith Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
