"use client";
import { Grid, X } from "lucide-react";
import { Popover } from "../common/Popover";
import { IconRenderer } from "../common/IconRenderer";
import { categoryLabels } from "@/lib/display";
export function WaffleMenu({
  apps,
}: {
  apps: {
    id: string;
    name: string;
    category: string;
    url: string;
    icon: string;
    color: string;
    status: string;
  }[];
}) {
  return (
    <Popover
      label="เมนูบริการ"
      trigger={
        <span className="icon-button">
          <Grid size={20} aria-hidden="true" />
        </span>
      }
    >
      {(close) => (
        <>
          <div className="popover-title">
            <h2 className="font-semibold">บริการของคุณ</h2>
            <button
              className="icon-button"
              aria-label="ปิดเมนูบริการ"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
          {!apps.length && (
            <p className="text-muted py-6 text-center">
              ยังไม่มีบริการที่เปิดให้คุณ
            </p>
          )}
          {["WORK", "GAME", "LIFESTYLE"].map((category) => {
            const list = apps.filter((a) => a.category === category);
            return (
              !!list.length && (
                <section key={category} className="mb-4">
                  <h3 className="text-muted text-xs mb-2">
                    {categoryLabels[category]}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {list.map((a) => (
                      <a
                        href={a.url}
                        key={a.id}
                        className="service-link"
                        onClick={close}
                      >
                        <span
                          className={
                            "service-icon-color bg-gradient-to-br " + a.color
                          }
                        >
                          <IconRenderer
                            name={a.icon}
                            className="w-5 h-5 text-white"
                          />
                        </span>
                        <span className="service-name">{a.name}</span>
                        {a.status === "MAINTENANCE" && (
                          <span className="service-caption">กำลังปรับปรุง</span>
                        )}
                      </a>
                    ))}
                  </div>
                </section>
              )
            );
          })}
        </>
      )}
    </Popover>
  );
}
