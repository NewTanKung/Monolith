"use client";
import { useEffect, useState } from "react";
import { AppCard, AppItemData } from "./AppCard";
import { CategoryTabs } from "./CategoryTabs";
export function AppGrid({
  initialApps,
  selectedCategory = "ALL",
  signedIn,
}: {
  initialApps: AppItemData[];
  selectedCategory?: string;
  signedIn: boolean;
}) {
  const [apps, setApps] = useState(initialApps);
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => setApps(initialApps), [initialApps]);
  useEffect(() => setActiveCategory(selectedCategory), [selectedCategory]);
  async function toggleFavorite(appId: string) {
    if (!signedIn) {
      setError("Sign in to save your favorites.");
      return;
    }
    if (pending.includes(appId)) return;
    const favorite = !apps.find((a) => a.id === appId)?.isFavorite;
    setPending((p) => [...p, appId]);
    setError("");
    try {
      const response = await fetch("/api/apps/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, favorite }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to update favorite.");
      setApps((p) =>
        p.map((a) =>
          a.id === appId ? { ...a, isFavorite: data.isFavorite } : a,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setPending((p) => p.filter((id) => id !== appId));
    }
  }
  const favorites = apps.filter((a) => a.isFavorite);
  const filtered = apps.filter(
    (a) =>
      activeCategory === "ALL" ||
      (activeCategory === "FAVORITES"
        ? a.isFavorite
        : a.category === activeCategory),
  );
  function cards(items: AppItemData[]) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            pending={pending.includes(app.id)}
            signedIn={signedIn}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 sm:px-8">
      <CategoryTabs
        currentCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        favoritesCount={favorites.length}
      />
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
      {activeCategory === "ALL" && favorites.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-amber-200">
            Pinned favorites
          </h2>
          {cards(favorites)}
          <h2 className="pt-4 text-sm font-semibold text-zinc-400">
            All applications
          </h2>
        </section>
      )}
      {filtered.length ? (
        cards(filtered)
      ) : (
        <div className="rounded-2xl liquid-glass p-12 text-center text-zinc-400">
          {activeCategory === "FAVORITES"
            ? "Your favorites will appear here. Pin an app to get started."
            : "No applications in this category yet."}
        </div>
      )}
    </div>
  );
}
