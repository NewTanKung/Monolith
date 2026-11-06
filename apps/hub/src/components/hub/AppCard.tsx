"use client";
import { Star, ArrowUpRight, Wrench, Loader2 } from "lucide-react";
import { IconRenderer } from "../common/IconRenderer";
export interface AppItemData {
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
  isFavorite?: boolean;
}
export function AppCard({
  app,
  onToggleFavorite,
  pending,
  signedIn,
}: {
  app: AppItemData;
  onToggleFavorite: (id: string) => void;
  pending: boolean;
  signedIn: boolean;
}) {
  const maintenance = app.status === "MAINTENANCE";
  return (
    <article className="liquid-card flex min-w-0 flex-col rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div
          className={
            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br " +
            app.color
          }
        >
          <IconRenderer name={app.icon} className="h-6 w-6 text-white" />
        </div>
        <button
          onClick={() => onToggleFavorite(app.id)}
          disabled={pending}
          aria-pressed={!!app.isFavorite}
          aria-label={(app.isFavorite ? "Unpin " : "Pin ") + app.name}
          title={signedIn ? "Save to favorites" : "Sign in to save favorites"}
          className={
            "rounded-lg p-2 disabled:opacity-50 " +
            (app.isFavorite
              ? "text-amber-300"
              : "text-zinc-400 hover:text-white")
          }
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Star
              className={"h-5 w-5 " + (app.isFavorite ? "fill-current" : "")}
            />
          )}
        </button>
      </div>
      <div className="mb-6 mt-5 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
          {app.category}
          {app.isFeatured ? " / Featured" : ""}
        </p>
        <h3 className="mt-2 break-words text-lg font-semibold text-white">
          {app.name}
        </h3>
        <p className="mt-2 break-words text-sm leading-relaxed text-zinc-400">
          {app.description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <span
          className={
            "flex items-center gap-1.5 text-xs " +
            (maintenance ? "text-amber-300" : "text-emerald-300")
          }
        >
          {maintenance ? (
            <Wrench className="h-3 w-3" />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          )}
          {maintenance
            ? "Maintenance"
            : app.status === "BETA"
              ? "Beta"
              : "Available"}
        </span>
        <a
          href={app.url}
          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
          aria-label={(maintenance ? "View status of " : "Open ") + app.name}
        >
          {maintenance ? "View status" : "Open"}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}
