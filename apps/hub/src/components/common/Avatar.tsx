export function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => Array.from(s)[0] || "")
    .join("")
    .toLocaleUpperCase();
  return (
    <span
      aria-hidden="true"
      className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-full border border-teal-100/20 bg-teal-200/10 text-xs font-semibold text-teal-100"
    >
      {initials || "M"}
    </span>
  );
}
