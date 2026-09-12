import { useState, useCallback } from "react";
import {
  Boxes,
  RotateCw,
  Plus,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { HiveConnectorsGrid } from "./HiveConnectorsGrid";
import { HiveMcpServersList } from "./HiveMcpServersList";
import { HivePermissionsMatrix } from "./HivePermissionsMatrix";
import { HiveToolDrawer, type McpToolSchema } from "./HiveToolDrawer";
import { HiveAddServerModal } from "./HiveAddServerModal";

type HiveTab = "connectors" | "mcp_registry" | "permissions";

export default function HivePage() {
  const [activeTab, setActiveTab] = useState<HiveTab>("connectors");
  const [selectedTool, setSelectedTool] = useState<McpToolSchema | null>(null);
  const [isAddServerOpen, setIsAddServerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSyncAll = useCallback(() => {
    setIsSyncing(true);
    setSyncNotice(null);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncNotice("All 6 MCP Sidecars and 18 Platform Connectors synchronized successfully.");
      setTimeout(() => setSyncNotice(null), 4000);
    }, 800);
  }, []);

  const handleServerAdded = (name: string) => {
    setSyncNotice(`MCP Server "${name}" registered and mounted to Autonomous Flight Engine.`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background text-foreground font-sans select-none pb-12">
      {/* ─── 1. Cockpit HUD Top Bar ───────────────────────────────────── */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur-xl px-6 py-5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#FFB22C]/15 border border-[#FFB22C]/30 flex items-center justify-center text-[#FFB22C] shadow-inner">
                <Boxes className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Hive Platform, Registry & Permissions
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFB22C]/10 text-[#FFB22C] border border-[#FFB22C]/25">
                    Production SaaS Hub
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Zero-config developer platforms, local MCP sidecars, and Zero-Trust gate policies.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions & Sync */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="skeuo-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RotateCw className={`size-3.5 text-muted-foreground ${isSyncing ? "animate-spin text-[#FFB22C]" : ""}`} />
              <span>{isSyncing ? "Syncing Mesh..." : "Sync Mesh Status"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddServerOpen(true)}
              className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Install MCP Server</span>
            </button>
          </div>
        </div>

        {/* Sync Success Banner */}
        {syncNotice && (
          <div className="max-w-7xl mx-auto mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span>{syncNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncNotice(null)}
              className="text-xs hover:underline cursor-pointer opacity-80"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── 2. Segmented Navigation Deck ────────────────────────────── */}
        <div className="max-w-7xl mx-auto mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("connectors")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "connectors"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="size-3.5" />
            <span>Platform Connectors (18)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mcp_registry")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "mcp_registry"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Boxes className="size-3.5" />
            <span>MCP Registry & Sidecars (6)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "permissions"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="size-3.5" />
            <span>Zero-Trust Permissions & Policies (10)</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Main Views ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {activeTab === "connectors" && <HiveConnectorsGrid />}

        {activeTab === "mcp_registry" && (
          <HiveMcpServersList
            onSelectTool={(tool) => setSelectedTool(tool)}
            onOpenAddServer={() => setIsAddServerOpen(true)}
          />
        )}

        {activeTab === "permissions" && <HivePermissionsMatrix />}
      </div>

      {/* ─── 4. Tool Schema Drawer ────────────────────────────────────── */}
      <HiveToolDrawer
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />

      {/* ─── 5. Add MCP Server Modal ──────────────────────────────────── */}
      <HiveAddServerModal
        isOpen={isAddServerOpen}
        onClose={() => setIsAddServerOpen(false)}
        onServerAdded={handleServerAdded}
      />
    </div>
  );
}
