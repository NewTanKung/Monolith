import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MonolithMark } from "./MonolithMark";
import { ThemeToggle } from "./Providers";
export function WorkspaceHeader({ label }: { label?: string }) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-inner">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" aria-label="หน้าแรก Monolith" className="brand-link">
            <MonolithMark className="brand-mark" />
          </Link>
          {label && <span className="header-location">{label}</span>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>กลับหน้า Hub</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
