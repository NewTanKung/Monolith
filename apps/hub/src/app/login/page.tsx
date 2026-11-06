"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers } from "lucide-react";
export default function AuthPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        "/api/auth/" + (register ? "register" : "login"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            register ? { email, password, name } : { email, password },
          ),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center px-4 py-12"
    >
      <section className="liquid-glass w-full max-w-md rounded-3xl p-6 sm:p-9">
        <Link
          href="/"
          aria-label="Monolith home"
          className="mb-7 inline-flex rounded-2xl bg-indigo-600 p-3"
        >
          <Layers className="h-7 w-7" />
        </Link>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
          Monolith Hub
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {register ? "Create your account." : "Welcome back."}
        </h1>
        <p className="mb-7 mt-3 text-sm leading-relaxed text-zinc-400">
          {register
            ? "One account for your connected workspace."
            : "Sign in to access your apps and saved favorites."}
        </p>
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
          {[false, true].map((value) => (
            <button
              key={String(value)}
              disabled={busy}
              aria-pressed={register === value}
              onClick={() => {
                setRegister(value);
                setError("");
              }}
              className={
                "rounded-lg py-2.5 text-sm " +
                (register === value
                  ? "bg-white/10 font-medium"
                  : "text-zinc-400")
              }
            >
              {value ? "Create account" : "Sign in"}
            </button>
          ))}
        </div>
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="space-y-4">
            {register && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="admin-input"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="auth-email"
                className="mb-2 block text-sm text-zinc-300"
              >
                Email Address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="mb-2 block text-sm text-zinc-300"
              >
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={register ? 12 : 1}
                maxLength={72}
                autoComplete={register ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-describedby={register ? "password-hint" : undefined}
                className="admin-input"
              />
              {register && (
                <p id="password-hint" className="mt-2 text-xs text-zinc-400">
                  Use at least 12 characters.
                </p>
              )}
            </div>
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50"
            >
              {busy
                ? "Please wait…"
                : register
                  ? "Create Account & Sign In"
                  : "Sign In to Ecosystem"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </fieldset>
        </form>
        <Link href="/" className="mt-7 block text-center text-xs text-zinc-400">
          ← Return to Hub
        </Link>
      </section>
    </main>
  );
}
