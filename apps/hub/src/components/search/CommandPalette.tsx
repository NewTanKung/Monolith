"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { IconRenderer } from "../common/IconRenderer";
import { categoryLabels } from "@/lib/display";
interface App {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  icon: string;
  color: string;
  status: string;
}
export function CommandPalette({
  apps,
  isOpen,
  onClose,
  onSelectCategory,
}: {
  apps: App[];
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory?: (category: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = apps.filter((a) =>
    (a.name + " " + a.description + " " + a.category)
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActive(0);
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [isOpen]);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-label="ค้นหาแอป"
      className="workspace-dialog is-wide"
    >
      <div className="dialog-header">
        <Search className="h-5 w-5 text-accent" aria-hidden="true" />
        <input
          autoFocus
          aria-label="ค้นหาแอป"
          role="combobox"
          aria-expanded="true"
          aria-controls="app-results"
          aria-activedescendant={
            results[active] ? "result-" + results[active].id : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) =>
                Math.max(
                  0,
                  Math.min(
                    results.length - 1,
                    i + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Enter" && results[active]) {
              onClose();
              window.location.assign(results[active].url);
            }
          }}
          placeholder="ค้นหาบริการ…"
          className="admin-input min-w-0 flex-1"
        />
        <button
          aria-label="ปิดการค้นหา"
          onClick={onClose}
          className="icon-button"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {onSelectCategory && (
        <div className="flex flex-wrap gap-2 px-5 pt-3">
          {["GAME", "WORK", "LIFESTYLE"].map((c) => (
            <button
              key={c}
              onClick={() => {
                onSelectCategory(c);
                onClose();
              }}
              className="category-pill"
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      )}
      <div
        id="app-results"
        role="listbox"
        aria-label="บริการ"
        className="max-h-[55dvh] overflow-y-auto p-2"
      >
        {results.map((app, i) => (
          <a
            href={app.url}
            key={app.id}
            id={"result-" + app.id}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => {
              onClose();
            }}
            className={
              "flex w-full items-center gap-3 rounded-xl p-3 text-left " +
              (active === i ? "bg-surface" : "")
            }
          >
            <span className={"rounded-xl bg-gradient-to-br p-2 " + app.color}>
              <IconRenderer name={app.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium break-words">{app.name}</span>
              <span className="block truncate text-xs text-muted">
                {app.status === "MAINTENANCE"
                  ? "กำลังปรับปรุง — ดูรายละเอียด"
                  : app.description}
              </span>
            </span>
          </a>
        ))}
        {!results.length && (
          <p role="status" className="p-10 text-center text-sm text-muted">
            ไม่พบบริการที่ตรงกับคำค้นหา
          </p>
        )}
      </div>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        ↑ ↓ เลือก · Enter เปิด · Esc ปิด
      </p>
    </dialog>
  );
}
