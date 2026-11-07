"use client";
import { useEffect, useState } from "react";
import { AppCard, AppItemData } from "./AppCard";
import { CategoryTabs } from "./CategoryTabs";
export function AppGrid({
  initialApps,
  selectedCategory = "ALL",
  signedIn,
  isAdmin = false,
  query = "",
  onClearSearch,
}: {
  initialApps: AppItemData[];
  selectedCategory?: string;
  signedIn: boolean;
  isAdmin?: boolean;
  query?: string;
  onClearSearch?: () => void;
}) {
  const [apps, setApps] = useState(initialApps);
  const [activeCategory, setActiveCategory] = useState(selectedCategory);
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => setApps(initialApps), [initialApps]);
  useEffect(() => setActiveCategory(selectedCategory), [selectedCategory]);
  async function toggleFavorite(appId: string) {
    if (!signedIn) {
      setError("กรุณาเข้าสู่ระบบเพื่อบันทึกรายการโปรด");
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
        throw new Error(data.error || "บันทึกรายการโปรดไม่สำเร็จ");
      setApps((p) =>
        p.map((a) =>
          a.id === appId ? { ...a, isFavorite: data.isFavorite } : a,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "กรุณาลองใหม่");
    } finally {
      setPending((p) => p.filter((id) => id !== appId));
    }
  }
  const favorites = apps.filter((a) => a.isFavorite);
  const filtered = apps.filter(
    (a) =>
      (activeCategory === "ALL" ||
        (activeCategory === "FAVORITES"
          ? a.isFavorite
          : a.category === activeCategory)) &&
      `${a.name} ${a.description} ${a.category}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase()),
  );
  function cards(items: AppItemData[]) {
    return (
      <div className="services-grid">
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
    <section className="launcher-services launcher-arrival" aria-label="บริการ">
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
      <div className="services-heading">
        <h2>
          {query.trim()
            ? "ผลการค้นหา"
            : activeCategory === "FAVORITES"
              ? "รายการโปรดของคุณ"
              : "บริการของคุณ"}
        </h2>
        <span role="status" aria-live="polite">
          {filtered.length} {"บริการ"}
        </span>
      </div>
      {filtered.length ? (
        cards(filtered)
      ) : (
        <div className="services-empty liquid-glass">
          <p>
            {query.trim()
              ? `ไม่พบบริการที่ตรงกับ “${query.trim()}”`
              : activeCategory === "FAVORITES"
                ? "ยังไม่มีรายการโปรด กดดาวบนบริการเพื่อบันทึกไว้ที่นี่"
                : "ยังไม่มีบริการในหมวดนี้"}
          </p>
          {isAdmin && !query.trim() && (
            <a href="/admin" className="primary-button mt-4 inline-block">
              เพิ่มบริการแรก
            </a>
          )}
          {query.trim() && (
            <button
              type="button"
              onClick={onClearSearch}
              className="mt-4 text-sm text-teal-200 underline underline-offset-4"
            >
              ล้างคำค้นหา
            </button>
          )}
        </div>
      )}
    </section>
  );
}
