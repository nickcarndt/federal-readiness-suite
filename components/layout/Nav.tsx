import Link from "next/link";
import { Shield } from "lucide-react";
import { StepIndicator } from "./StepIndicator";

export function Nav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-screen-xl items-center justify-between px-6">
        {/* Left: Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Federal Readiness Suite home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-coral/10 border border-coral/20 transition-colors group-hover:bg-coral/20">
            <Shield className="h-4 w-4 text-coral" />
          </div>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight whitespace-nowrap">
            Federal Readiness Suite
          </span>
        </Link>

        {/* Center: Step Indicator */}
        <div className="flex-1 flex justify-center px-4">
          <StepIndicator />
        </div>

        {/* Right: Powered by Claude */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-xs text-zinc-500">Powered by</span>
          <span className="text-xs font-semibold text-coral tracking-wide">
            Claude
          </span>
          <span className="ml-1 inline-flex items-center rounded-full border border-coral/20 bg-coral/10 px-2 py-0.5 text-[10px] font-medium text-coral">
            Anthropic
          </span>
        </div>
      </div>
    </header>
  );
}
