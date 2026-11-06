"use client";

import React, { useState } from "react";
import { Swords, Trophy, Bell, CheckCircle2, Loader2 } from "lucide-react";

interface MatchArenaClientProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function MatchArenaClient({ userId, userName, userEmail }: MatchArenaClientProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerMatchVictory = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      // Push notification directly to the central Monolith Hub API!
      const res = await fetch("http://localhost:3000/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "🏆 Victory Royale in Cyber Arena!",
          message: `${userName || userEmail} secured 1st place in Cyber League Ranked Match! +150 LP`,
          sourceApp: "Cyber Arena",
          linkUrl: "http://localhost:3001",
        }),
      });

      if (res.ok) {
        setSuccessMsg("Success! Notification event delivered to Monolith Hub.");
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        throw new Error("Failed to send notification to Hub");
      }
    } catch (err: any) {
      console.error(err);
      alert("Note: To push notification, ensure Monolith Hub is running on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-neon">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Ranked Match Arena #849</div>
            <div className="text-xs text-zinc-400">Match status: Ready to commence</div>
          </div>
        </div>

        <button
          onClick={triggerMatchVictory}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-neon transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trophy className="w-4 h-4" />
          )}
          <span>Simulate Victory Event (Send Hub Notification)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg} Check the bell icon in Monolith Hub (port 3000)!</span>
        </div>
      )}
    </div>
  );
}
