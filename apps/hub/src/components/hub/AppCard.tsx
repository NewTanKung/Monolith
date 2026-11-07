"use client";
import { Star, Wrench, Loader2 } from "lucide-react";
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
  const status = maintenance
    ? "Maintenance"
    : app.status === "BETA"
      ? "Beta"
      : "Available";
  return (
    <article className="service-tile">
      <a
        href={app.url}
        className="service-link"
        aria-label={(maintenance ? "View status of " : "Open ") + app.name}
        title={app.description + " · " + status}
      >
        <span className="service-icon liquid-glass">
          <span className={"service-icon-color bg-gradient-to-br " + app.color}>
            <IconRenderer name={app.icon} className="h-6 w-6 text-white" />
          </span>
          <span
            className={
              "service-status " + (maintenance ? "is-maintenance" : "")
            }
            aria-label={status}
          >
            {maintenance && <Wrench size={8} />}
          </span>
        </span>
        <h3 className="service-name">{app.name}</h3>
        <span className="service-caption">
          {maintenance
            ? "Maintenance"
            : app.status === "BETA"
              ? "Beta access"
              : app.category === "GAME"
                ? "Gaming"
                : app.category === "WORK"
                  ? "Work & tools"
                  : "Lifestyle"}
        </span>
      </a>
      <button
        type="button"
        onClick={() => onToggleFavorite(app.id)}
        disabled={pending}
        aria-pressed={!!app.isFavorite}
        aria-label={(app.isFavorite ? "Unpin " : "Pin ") + app.name}
        title={signedIn ? "Save to favorites" : "Sign in to save favorites"}
        className={"service-pin " + (app.isFavorite ? "is-pinned" : "")}
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Star size={12} fill={app.isFavorite ? "currentColor" : "none"} />
        )}
      </button>
    </article>
  );
}
