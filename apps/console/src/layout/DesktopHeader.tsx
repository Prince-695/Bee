import { useState, useEffect } from "react";
import { Terminal, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface DesktopHeaderProps {
  activeFlightTitle?: string;
}

export function DesktopHeader({ activeFlightTitle = "Desktop Engine Online" }: DesktopHeaderProps) {
  const [syncStatus, setSyncStatus] = useState<"synced" | "offline" | "syncing">("synced");
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  const handleManualSync = async () => {
    setSyncStatus("syncing");
    try {
      const res = await fetch("/v1/sync/status");
      if (res.ok) {
        setSyncStatus("synced");
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } else {
        setSyncStatus("offline");
      }
    } catch {
      setSyncStatus("offline");
    }
  };

  useEffect(() => {
    // Check cloud connectivity on mount
    handleManualSync();
  }, []);

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
        {/* Cloud Sync Status Badge */}
        <button
          onClick={handleManualSync}
          title="Click to trigger sync with Cloud PostgreSQL"
          className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono transition-colors hover:border-zinc-700"
        >
          {syncStatus === "synced" && (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Cloud Synced</span>
              <span className="text-zinc-500 text-[10px] hidden md:inline">({lastSyncTime})</span>
            </>
          )}
          {syncStatus === "offline" && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 font-medium">Offline (bee.db)</span>
              <RefreshCw className="w-3 h-3 text-zinc-500 ml-1 hover:text-white" />
            </>
          )}
          {syncStatus === "syncing" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span className="text-sky-400 font-medium">Syncing...</span>
            </>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span>Port: 8000</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}

