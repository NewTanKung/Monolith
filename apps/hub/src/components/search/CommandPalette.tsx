"use client";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { IconRenderer } from "../common/IconRenderer";
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
      aria-label="Search applications"
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl border border-white/15 bg-[#111522] p-0 text-white shadow-2xl backdrop:bg-black/75"
    >
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <Search className="h-5 w-5 text-indigo-300" />
        <input
          autoFocus
          aria-label="Search applications"
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
          placeholder="Search your applications…"
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        <button
          aria-label="Close search"
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {onSelectCategory && (
        <div className="flex gap-2 border-b border-white/10 p-3">
          {["GAME", "WORK", "LIFESTYLE"].map((c) => (
            <button
              key={c}
              onClick={() => {
                onSelectCategory(c);
                onClose();
              }}
              className="rounded-lg bg-white/5 px-3 py-2 text-xs text-zinc-300"
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div
        id="app-results"
        role="listbox"
        aria-label="Applications"
        className="max-h-[55dvh] overflow-y-auto p-2"
      >
        {results.map((app, i) => (
          <button
            key={app.id}
            id={"result-" + app.id}
            role="option"
            aria-selected={i === active}
            onMouseMove={() => setActive(i)}
            onClick={() => {
              onClose();
              window.location.assign(app.url);
            }}
            className={
              "flex w-full items-center gap-3 rounded-xl p-3 text-left " +
              (active === i ? "bg-white/10" : "")
            }
          >
            <span className={"rounded-xl bg-gradient-to-br p-2 " + app.color}>
              <IconRenderer name={app.icon} className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium break-words">{app.name}</span>
              <span className="block truncate text-xs text-zinc-400">
                {app.status === "MAINTENANCE"
                  ? "Maintenance — view status"
                  : app.description}
              </span>
            </span>
          </button>
        ))}
        {!results.length && (
          <p role="status" className="p-10 text-center text-sm text-zinc-400">
            No matching applications.
          </p>
        )}
      </div>
      <p className="border-t border-white/10 px-4 py-3 text-xs text-zinc-500">
        ↑ ↓ to navigate · Enter to open · Esc to close
      </p>
    </dialog>
  );
}
