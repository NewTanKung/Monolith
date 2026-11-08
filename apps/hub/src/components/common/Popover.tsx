"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Popover({
  label,
  trigger,
  children,
  profile = false,
}: {
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  profile?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  function close() {
    if (ref.current) {
      ref.current.open = false;
      ref.current.querySelector("summary")?.focus();
    }
  }
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        ref.current.open = false;
    }
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape" && ref.current?.open) {
        e.preventDefault();
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", keys);
    };
  }, []);
  return (
    <details ref={ref} className="popover" name="workspace-navigation">
      <summary role="button" aria-label={label}>
        {trigger}
      </summary>
      <div
        className={
          "popover-panel liquid-glass" + (profile ? " is-profile" : "")
        }
      >
        {children(close)}
      </div>
    </details>
  );
}
