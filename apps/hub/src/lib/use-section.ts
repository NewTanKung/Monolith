"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
export function useSection(values: readonly string[], fallback: string) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get("section") || fallback;
  return [
    values.includes(value) ? value : fallback,
    (section: string) => {
      const next = new URLSearchParams(params.toString());
      next.set("section", section);
      router.replace(pathname + "?" + next, { scroll: false });
    },
  ] as const;
}
