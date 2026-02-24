import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-screen-xl px-6 py-8">
        <Separator className="mb-6 bg-zinc-800" />
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Attribution */}
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-sm font-medium text-zinc-300">
              Built by{" "}
              <span className="text-zinc-100 font-semibold">Nick Arndt</span>
              <span className="text-zinc-500 mx-2">|</span>
              <span className="text-coral">Solutions Architect</span>
            </p>
            <p className="text-xs text-zinc-600">
              Built with Claude API · Next.js · MCP
            </p>
          </div>

          {/* Links */}
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/nickarndt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              aria-label="GitHub profile"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </Link>
            <Link
              href="https://linkedin.com/in/nickarndt"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              aria-label="LinkedIn profile"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
