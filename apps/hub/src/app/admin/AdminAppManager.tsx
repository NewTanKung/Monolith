"use client";
import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
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
  minRole: "GUEST" | "MEMBER" | "ADMIN";
  isFeatured: boolean;
  orderIndex: number;
}
type Form = Omit<AppRecord, "id">;
const blank: Form = {
  name: "",
  slug: "",
  description: "",
  category: "WORK",
  status: "ONLINE",
  url: "",
  icon: "LayoutGrid",
  color: "from-indigo-500 to-purple-600",
  minRole: "GUEST",
  orderIndex: 0,
  isFeatured: false,
};
const gradients = [
  "from-indigo-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-indigo-600",
  "from-amber-400 to-orange-500",
  "from-blue-500 to-indigo-600",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-purple-500",
];
export function AdminAppManager({ initialApps }: { initialApps: AppRecord[] }) {
  const [apps, setApps] = useState(initialApps);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(blank);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function field<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function edit(app?: AppRecord) {
    setEditing(app?.id || null);
    setForm(
      app
        ? {
            name: app.name,
            slug: app.slug,
            description: app.description,
            category: app.category,
            status: app.status,
            url: app.url,
            icon: app.icon,
            color: app.color,
            minRole: app.minRole,
            orderIndex: app.orderIndex,
            isFeatured: app.isFeatured,
          }
        : { ...blank },
    );
    setOpen(true);
    setError("");
    setNotice("");
  }
  async function request(method: string, body?: unknown, id?: string) {
    const response = await fetch(
      "/api/admin/apps" + (id ? "?id=" + encodeURIComponent(id) : ""),
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Unable to save changes.");
    return result;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request(
        editing ? "PUT" : "POST",
        editing ? { id: editing, ...form } : form,
      );
      setApps((prev) =>
        (editing
          ? prev.map((a) => (a.id === editing ? result.app : a))
          : [...prev, result.app]
        ).sort((a, b) => a.orderIndex - b.orderIndex),
      );
      setOpen(false);
      setNotice("Application saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function change(app: AppRecord, remove = false) {
    if (
      busy ||
      (remove && !confirm("Remove " + app.name + " from the registry?"))
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (remove) {
        await request("DELETE", undefined, app.id);
        setApps((p) => p.filter((a) => a.id !== app.id));
        setNotice("Application removed.");
      } else {
        const { app: updated } = await request("PUT", {
          id: app.id,
          status: app.status === "MAINTENANCE" ? "ONLINE" : "MAINTENANCE",
        });
        setApps((p) => p.map((a) => (a.id === updated.id ? updated : a)));
        setNotice("Application status updated.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Application registry</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Manage access, availability, and the apps in your ecosystem.
          </p>
        </div>
        <button
          disabled={busy}
          onClick={() => edit()}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          Register app
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-emerald-300">
          {notice}
        </p>
      )}
      {open && (
        <form onSubmit={save} className="liquid-glass rounded-2xl p-5 sm:p-7">
          <h3 className="mb-5 text-lg font-semibold">
            {editing ? "Edit application" : "Register application"}
          </h3>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-name">Name</label>
              <input
                id="app-name"
                className="admin-input"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-slug">Slug</label>
              <input
                id="app-slug"
                className="admin-input"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                maxLength={80}
                placeholder="my-application"
                value={form.slug}
                onChange={(e) => field("slug", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
              <label htmlFor="app-url-or-local-path">URL or local path</label>
              <input
                id="app-url-or-local-path"
                className="admin-input"
                required
                maxLength={2048}
                placeholder="https://app.example.com or /apps/my-app"
                value={form.url}
                onChange={(e) => field("url", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-category">Category</label>
              <select
                id="app-category"
                className="admin-input"
                value={form.category}
                onChange={(e) =>
                  field("category", e.target.value as Form["category"])
                }
              >
                {["WORK", "LIFESTYLE", "GAME"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-minimum-role">Minimum role</label>
              <select
                id="app-minimum-role"
                className="admin-input"
                value={form.minRole}
                onChange={(e) =>
                  field("minRole", e.target.value as Form["minRole"])
                }
              >
                {["GUEST", "MEMBER", "ADMIN"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-status">Status</label>
              <select
                id="app-status"
                className="admin-input"
                value={form.status}
                onChange={(e) =>
                  field("status", e.target.value as Form["status"])
                }
              >
                {["ONLINE", "BETA", "MAINTENANCE", "DISABLED"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-display-order">Display order</label>
              <input
                id="app-display-order"
                className="admin-input"
                type="number"
                min={0}
                max={10000}
                required
                value={form.orderIndex}
                onChange={(e) => field("orderIndex", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-icon">Icon</label>
              <input
                id="app-icon"
                className="admin-input"
                required
                maxLength={60}
                value={form.icon}
                onChange={(e) => field("icon", e.target.value)}
              />
            </div>
            <div className="space-y-2 text-sm text-zinc-300">
              <label htmlFor="app-accent">Accent</label>
              <select
                id="app-accent"
                className="admin-input"
                value={form.color}
                onChange={(e) => field("color", e.target.value)}
              >
                {gradients.map((v) => (
                  <option key={v} value={v}>
                    {v.replace("from-", "").replace(" to-", " → ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 text-sm text-zinc-300 sm:col-span-2">
              <label htmlFor="app-description">Description</label>
              <textarea
                id="app-description"
                className="admin-input"
                maxLength={1000}
                rows={3}
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => field("isFeatured", e.target.checked)}
              />
              Featured application
            </label>
          </fieldset>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-sm text-zinc-300"
            >
              Cancel
            </button>
            <button
              disabled={busy}
              className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save application"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3 md:hidden">
        {apps.map((app) => (
          <article
            key={app.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className={
                  "shrink-0 rounded-xl bg-gradient-to-br p-2 " + app.color
                }
              >
                <IconRenderer name={app.icon} className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="break-words font-medium">{app.name}</h3>
                <p className="mt-1 break-all text-xs text-zinc-500">
                  {app.slug}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
              <p className="text-xs text-zinc-400">
                {app.minRole} / {app.status}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  aria-label={"Edit " + app.name}
                  onClick={() => edit(app)}
                  className="rounded-lg bg-white/5 p-3"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  disabled={busy || app.status === "DISABLED"}
                  aria-label={
                    (app.status === "MAINTENANCE" ? "Resume " : "Maintain ") +
                    app.name
                  }
                  onClick={() => change(app)}
                  className="rounded-lg bg-white/5 p-3 text-amber-300 disabled:opacity-40"
                >
                  <Wrench className="h-4 w-4" />
                </button>
                <button
                  disabled={busy}
                  aria-label={"Delete " + app.name}
                  onClick={() => change(app, true)}
                  className="rounded-lg bg-white/5 p-3 text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-white/10 md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">
            Registered applications and access settings
          </caption>
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              {["Application", "Access", "Status", "Actions"].map((v) => (
                <th key={v} scope="col" className="px-5 py-4">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {apps.map((app) => (
              <tr key={app.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "rounded-xl bg-gradient-to-br p-2 " + app.color
                      }
                    >
                      <IconRenderer name={app.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-zinc-400">{app.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-zinc-400">
                  {app.minRole}
                </td>
                <td className="px-5 py-4 text-xs text-zinc-400">
                  {app.status}
                </td>
                <td className="px-5 py-4">
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      aria-label={"Edit " + app.name}
                      onClick={() => edit(app)}
                      className="rounded-lg p-2 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      disabled={busy || app.status === "DISABLED"}
                      aria-label={
                        (app.status === "MAINTENANCE"
                          ? "Resume "
                          : "Maintain ") + app.name
                      }
                      onClick={() => change(app)}
                      className="rounded-lg p-2 text-amber-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Wrench className="h-4 w-4" />
                    </button>
                    <button
                      disabled={busy}
                      aria-label={"Delete " + app.name}
                      onClick={() => change(app, true)}
                      className="rounded-lg p-2 text-rose-300 hover:bg-white/10 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!apps.length && (
          <p className="p-10 text-center text-zinc-400">
            Register your first application to get started.
          </p>
        )}
      </div>
    </section>
  );
}
