export function MonolithMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      width="64"
      height="48"
      fill="none"
      className={"monolith-mark " + (className || "")}
      aria-hidden="true"
    >
      <path
        d="M0 7.5 12 0 32 14.6 52 0 64 7.5V45.5H52V13.5L32 26.4 12 13.5V45.5H0Z"
        fill="currentColor"
      />
      <path
        d="m12 13.5 11.5 7.4V42L12 45.5Zm40 0-11.5 7.4V42L52 45.5Z"
        className="monolith-mark-inset"
        stroke="currentColor"
        strokeWidth=".75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
