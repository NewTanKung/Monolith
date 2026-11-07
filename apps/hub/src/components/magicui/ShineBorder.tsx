import type { CSSProperties } from "react";

// Adapted from Magic UI's MIT-licensed Shine Border for Tailwind v3.
// https://magicui.design/docs/components/shine-border
export function ShineBorder({
  shineColor,
  duration = 14,
}: {
  shineColor: string[];
  duration?: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="magic-shine-border"
      style={
        {
          "--shine-duration": `${duration}s`,
          backgroundImage: `radial-gradient(transparent, transparent, ${shineColor.join(",")}, transparent, transparent)`,
        } as CSSProperties
      }
    />
  );
}
