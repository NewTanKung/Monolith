"use client";

import React, { useState } from "react";
import { Plus, Trash2, AlertTriangle, ExternalLink, RefreshCw, CheckCircle, Shield } from "lucide-react";
import { IconRenderer } from "@/components/common/IconRenderer";

interface AppRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: "GAME" | "WORK" | "LIFESTYLE";
  status: "ONLINE" | "BETA" | "MAINTENANCE" | "DISABLED";
  url: string;
  icon: string;
  color: string;
  minRole: string;
  isFeatured: boolean;
}

interface AdminAppManagerProps {
  initialApps: AppRecord[];
}

export function AdminAppManager({ initialApps }: AdminAppManagerProps) {
  const [apps, setApps] = useState<AppRecord[]>(initialApps);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // New App Form State
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<"GAME" | "WORK" | "LIFESTYLE">("GAME");
  const [newUrl, setNewUrl] = useState("http://localhost:3000/demo/new-app");
  const [newIcon, setNewIcon] = useState("Gamepad2");
  const [newColor, setNewColor] = useState("from-cyan-500 to-blue-600");

  const toggleMaintenance = async (app: AppRecord) => {
    setLoadingId(app.id);
    const nextStatus = app.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE";

    try {
      const res = await fetch("/api/admin/apps", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: app.id, status: nextStatus }),
      });
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, status: nextStatus } : a))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Are you sure you want to remove this application?")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/apps?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setApps((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug: newSlug || newName.toLowerCase().replace(/\s+/g, "-"),
          description: newDesc,
          category: newCategory,
          url: newUrl,
          icon: newIcon,
          color: newColor,
          status: "ONLINE",
        }),
      });
      const data = await res.json();
      if (res.ok && data.app) {
        setApps((prev) => [...prev, data.app]);
        setIsCreating(false);
        setNewName("");
        setNewSlug("");
        setNewDesc("");
      } else {
        alert(data.error || "Failed to create app");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Ecosystem App Registry</h2>
          <p className="text-xs text-zinc-400">Add or manage apps linked to the Monolith Hub</p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-semibold shadow-liquid-glow-indigo transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Cancel" : "Register New App"}</span>
        </button>
      </div>

      {/* New App Modal/Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateApp}
          className="rounded-2xl liquid-glass p-6 border border-indigo-500/30 space-y-4 animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Register Application
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">App Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                placeholder="e.g. Cyber Arena"
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">Slug Identifier</label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. cyber-arena"
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              >
                <option value="GAME">Game</option>
                <option value="WORK">Work</option>
                <option value="LIFESTYLE">Lifestyle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">Target URL / Subdomain</label>
              <input
                type="text"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="e.g. https://game.mydomain.com or http://localhost:3001"
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">Lucide Icon Name</label>
              <input
                type="text"
                required
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="e.g. Gamepad2, Shield, HeartPulse, Trophy"
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-300 font-medium mb-1">Accent Gradient</label>
              <select
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              >
                <option value="from-cyan-500 to-blue-600">Cyan to Blue</option>
                <option value="from-indigo-500 to-purple-600">Indigo to Purple</option>
                <option value="from-rose-500 to-pink-600">Rose to Pink</option>
                <option value="from-amber-500 to-orange-600">Amber to Orange</option>
                <option value="from-emerald-500 to-teal-600">Emerald to Teal</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-300 font-medium mb-1">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Short description of this app..."
                className="w-full px-3 py-2 rounded-xl liquid-input text-white text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl liquid-pill text-xs text-zinc-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
            >
              Save Application
            </button>
          </div>
        </form>
      )}

      {/* Apps Table */}
      <div className="rounded-2xl liquid-glass overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-white/[0.04] border-b border-white/10 uppercase tracking-wider text-[10px] text-zinc-400 font-bold">
              <tr>
                <th className="px-5 py-3">App</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Target URL</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center text-white shrink-0 shadow-sm`}
                    >
                      <IconRenderer name={app.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{app.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{app.slug}</div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 font-medium text-[10px] uppercase">
                      {app.category}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 max-w-xs truncate font-mono text-[11px] text-zinc-400">
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      <span>{app.url}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500" />
                    </a>
                  </td>

                  <td className="px-5 py-3.5">
                    {app.status === "ONLINE" && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                        Online
                      </span>
                    )}
                    {app.status === "BETA" && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                        Beta
                      </span>
                    )}
                    {app.status === "MAINTENANCE" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                        Maintenance
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-2">
                    {/* Toggle Maintenance Button */}
                    <button
                      type="button"
                      disabled={loadingId === app.id}
                      onClick={() => toggleMaintenance(app)}
                      title={app.status === "MAINTENANCE" ? "Take app back Online" : "Put in Maintenance mode"}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        app.status === "MAINTENANCE"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      {app.status === "MAINTENANCE" ? "Set Online" : "Maintenance"}
                    </button>

                    {/* Delete App */}
                    <button
                      type="button"
                      disabled={loadingId === app.id}
                      onClick={() => deleteApp(app.id)}
                      title="Delete app"
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
