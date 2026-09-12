import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
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
    <header className="h-13 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
      {/* Active Location / Dynamic Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground border border-border text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-semibold text-foreground text-[11px]">FAST-MCP</span>
        </div>
        <span className="text-muted-foreground/60 text-xs">/</span>
        <span className="text-xs text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Cloud Sync Status Badge */}
        <button
          onClick={handleManualSync}
          title="Click to trigger sync with Cloud PostgreSQL"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/40 hover:bg-secondary border border-border text-xs font-mono transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {syncStatus === "synced" && (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-foreground text-[11px] font-medium hidden sm:inline">Synced</span>
              <span className="text-muted-foreground text-[10px] hidden md:inline">({lastSyncTime})</span>
            </>
          )}
          {syncStatus === "offline" && (
            <>
              <CloudOff className="w-3.5 h-3.5 text-primary" />
              <span className="text-primary text-[11px] font-medium hidden sm:inline">Local (bee.db)</span>
              <RefreshCw className="w-3 h-3 text-muted-foreground ml-0.5 hover:text-foreground" />
            </>
          )}
          {syncStatus === "syncing" && (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-primary text-[11px] font-medium hidden sm:inline">Syncing...</span>
            </>
          )}
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
