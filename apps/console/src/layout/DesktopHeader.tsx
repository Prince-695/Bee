import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Terminal, Cloud, CloudOff, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

interface DesktopHeaderProps {
  activeFlightTitle?: string;
}

export function DesktopHeader({ activeFlightTitle }: DesktopHeaderProps) {
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState<"synced" | "offline" | "syncing">("synced");
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  const getBreadcrumbTitle = () => {
    if (activeFlightTitle) return activeFlightTitle;
    const path = location.pathname;
    if (path === "/" || path === "/status" || path === "/app" || path === "/app/status") {
      return "Mission Control & Fleet Board";
    }
    if (path.startsWith("/chat")) return "AI Co-Engineer Chat Deck";
    if (path.startsWith("/hive")) return "Hive MCP Registry & Tool Schemas";
    if (path.startsWith("/logs")) return "Flight Logs & Spend Governance";
    if (path.startsWith("/hooks")) return "Autonomous Signals & Hooks";
    if (path.startsWith("/settings")) return "Organization, RBAC & Billing";
    if (path.startsWith("/route")) {
      const parts = path.split("/");
      const routeId = parts[2] || "Active";
      return `Autonomous Flight Route (${routeId})`;
    }
    return "Mission Control";
  };

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
    handleManualSync();
  }, []);

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors duration-200">
      {/* Active Location / Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span className="font-bold hidden sm:inline">FAST-MCP</span>
          <span className="font-bold text-[10px] sm:text-xs">ONLINE</span>
        </div>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Status Badge */}
        <button
          onClick={handleManualSync}
          title="Click to trigger sync with Cloud PostgreSQL"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-secondary/80 border border-border text-xs font-mono transition-colors hover:border-primary/50 text-foreground cursor-pointer"
        >
          {syncStatus === "synced" && (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium hidden sm:inline">Cloud Synced</span>
              <span className="text-muted-foreground text-[10px] hidden md:inline">({lastSyncTime})</span>
            </>
          )}
          {syncStatus === "offline" && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary font-medium hidden sm:inline">Offline (bee.db)</span>
              <RefreshCw className="w-3 h-3 text-muted-foreground ml-0.5 hover:text-foreground" />
            </>
          )}
          {syncStatus === "syncing" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-primary font-medium hidden sm:inline">Syncing...</span>
            </>
          )}
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground font-mono">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Port: 8000</span>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
