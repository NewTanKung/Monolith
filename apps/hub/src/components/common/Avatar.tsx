export function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => Array.from(s)[0] || "")
    .join("")
    .toLocaleUpperCase();
  return (
    <span aria-hidden="true" className="avatar">
      {initials || "M"}
    </span>
  );
}
