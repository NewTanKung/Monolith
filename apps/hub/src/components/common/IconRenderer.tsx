import {
  Activity,
  BarChart3,
  Briefcase,
  FileText,
  Gamepad2,
  HeartPulse,
  Headphones,
  KanbanSquare,
  LayoutGrid,
  Shield,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
const icons: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Briefcase,
  FileText,
  Gamepad2,
  HeartPulse,
  Headphones,
  KanbanSquare,
  LayoutGrid,
  Shield,
  Sparkles,
  Trophy,
};
export function IconRenderer({
  name,
  className = "h-5 w-5",
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = icons[name] || LayoutGrid;
  return <Icon className={className} size={size} aria-hidden="true" />;
}
