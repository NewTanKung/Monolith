import React from "react";
import * as LucideIcons from "lucide-react";

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
}

export function IconRenderer({ name, className = "w-5 h-5", size }: IconRendererProps) {
  // Safe dynamic lookup in lucide-react with fallback
  const iconsMap = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>;
  const IconComponent = iconsMap[name] || LucideIcons.LayoutGrid;

  return <IconComponent className={className} size={size} />;
}
