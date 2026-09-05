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
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl px-6 flex items-center justify-between shrink-0 z-20 transition-colors duration-200">
      {/* Active Flight / Workspace Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold">FAST-MCP SIDECAR</span>
        </div>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-medium">{activeFlightTitle}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Cloud Sync Status Badge */}
        <button
          onClick={handleManualSync}
          title="Click to trigger sync with Cloud PostgreSQL"
          className="flex items-center gap-2 px-3 py-1 rounded-xl bg-secondary/80 border border-border text-xs font-mono transition-colors hover:border-primary/50 text-foreground cursor-pointer"
        >
          {syncStatus === "synced" && (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Cloud Synced</span>
              <span className="text-muted-foreground text-[10px] hidden md:inline">({lastSyncTime})</span>
            </>
          )}
          {syncStatus === "offline" && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium">Offline (bee.db)</span>
              <RefreshCw className="w-3 h-3 text-muted-foreground ml-1 hover:text-foreground" />
            </>
          )}
          {syncStatus === "syncing" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 animate-spin" />
              <span className="text-sky-600 dark:text-sky-400 font-medium">Syncing...</span>
            </>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground font-mono">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Port: 8000</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}

