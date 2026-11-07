import Image from "next/image";

export function MonolithMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/monolith-mark.svg"
      alt=""
      width={64}
      height={48}
      className={className}
      unoptimized
    />
  );
}
