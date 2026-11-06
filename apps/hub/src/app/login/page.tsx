"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Layers, ArrowRight, Lock, Mail, User, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Ambient background glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl liquid-glass p-8 sm:p-10 relative z-10 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-4 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-liquid-glow-indigo group-hover:scale-105 transition-transform">
              <Layers className="w-8 h-8 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Monolith Hub</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Centralized Identity & App Launcher Portal
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.05] border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              !isRegister
                ? "bg-white/20 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`py-2 rounded-lg text-xs font-semibold transition-all ${
              isRegister
                ? "bg-white/20 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl liquid-input text-white text-sm placeholder-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          )}

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
            className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-semibold shadow-liquid-glow-indigo transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : isRegister ? "Create Account & Sign In" : "Sign In to Ecosystem"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Back to Hub link */}
        <div className="text-center mt-6">
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
