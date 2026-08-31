import { Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface DesktopHeaderProps {
  activeFlightTitle?: string;
}

export function DesktopHeader({ activeFlightTitle = "Desktop Engine Online" }: DesktopHeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20">
      {/* Active Flight / Workspace Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">FAST-MCP SIDECAR</span>
        </div>
        <span className="text-zinc-600 text-xs">/</span>
        <span className="text-xs text-zinc-300 font-medium">{activeFlightTitle}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span>Local Daemon Port: 8000</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
