import { ArrowRight, Layers, Search, X } from "lucide-react";
import { ShineBorder } from "../magicui/ShineBorder";
export function HeroSection({
  userName,
  totalApps,
  onlineApps,
  query,
  onQueryChange,
}: {
  userName?: string | null;
  totalApps: number;
  onlineApps: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="launcher-hero" aria-labelledby="launcher-title">
      <p className="launcher-eyebrow">ทุกบริการ เชื่อมถึงกัน</p>
      <h1 id="launcher-title" className="launcher-wordmark">
        <Layers aria-hidden="true" />
        Monolith<span>.</span>
      </h1>
      <p className="launcher-greeting">
        {userName
          ? `ยินดีต้อนรับ ${userName}`
          : "ค้นหาง่าย เปิดใช้ไว ด้วยบัญชีเดียว"}
      </p>
      <div className="launcher-search liquid-glass">
        <ShineBorder
          shineColor={["#77dcd3", "#b3b8ff", "#e4ecff"]}
          duration={16}
        />
        <Search
          className="shrink-0 text-white/60"
          size={20}
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="service-search">
          ค้นหาบริการ
        </label>
        <input
          id="service-search"
          type="search"
          autoComplete="off"
          placeholder="ค้นหาบริการที่ต้องการใช้…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="ล้างคำค้นหา"
            className="search-clear"
          >
            <X size={16} />
          </button>
        ) : (
          <span className="search-arrow" aria-hidden="true">
            <ArrowRight size={18} />
          </span>
        )}
      </div>
      <div className="launcher-context">
        <span className="availability-dot" />
        <span>
          {onlineApps} จาก {totalApps} บริการเปิดให้ใช้
        </span>
        <span className="context-divider">/</span>
        <span>บัญชีเดียว ทุกบริการ</span>
      </div>
    </section>
  );
}
