"use client";
import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
export function MatchArenaClient() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  async function victory() {
    if (status === "loading") return;
    setStatus("loading");
    try {
      const response = await fetch("/api/victory", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to send event.");
      setStatus("success");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
      setStatus("error");
    }
  }
  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Ranked Match Arena</h2>
        <p className="text-sm text-zinc-400">
          Simulate a victory and send the result to your Hub.
        </p>
      </div>
      <button
        disabled={status === "loading"}
        onClick={victory}
        className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 font-semibold disabled:opacity-50"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trophy className="h-4 w-4" />
        )}
        {status === "loading" ? "Sending…" : "Simulate victory"}
      </button>
      <p
        role="status"
        className={
          status === "error"
            ? "text-rose-300 text-sm"
            : "text-emerald-300 text-sm"
        }
      >
        {status === "error"
          ? error
          : status === "success"
            ? "Delivered. Open the notification bell in your Hub."
            : ""}
      </p>
    </section>
  );
}
