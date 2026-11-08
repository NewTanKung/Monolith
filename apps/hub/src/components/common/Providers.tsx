"use client";
import { ThemeProvider, useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ConfirmProvider } from "./Dialog";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="monolith-theme"
      disableTransitionOnChange
      scriptProps={{ type: "text/plain" }}
    >
      <ConfirmProvider>{children}</ConfirmProvider>
    </ThemeProvider>
  );
}
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const Icon =
    mounted && theme === "light"
      ? Sun
      : mounted && theme === "dark"
        ? Moon
        : Monitor;
  return (
    <label className="theme-control" title="เลือกธีม">
      <Icon size={18} aria-hidden="true" />
      <span className="sr-only">ธีมสี</span>
      <select
        aria-label="ธีมสี"
        value={mounted ? theme : "system"}
        disabled={!mounted}
        onChange={(e) => setTheme(e.target.value)}
      >
        <option value="system">ตามเครื่อง</option>
        <option value="light">สว่าง</option>
        <option value="dark">มืด</option>
      </select>
    </label>
  );
}
