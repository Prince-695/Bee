import { useState } from "react";
import {
  X,
  Wrench,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Play,
  Copy,
  Check,
  Terminal,
  Code2,
  Cpu,
} from "lucide-react";

export interface McpToolSchema {
  name: string;
  serverName: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  requiresApproval: boolean;
  parameters: {
    type: string;
    properties: Record<
      string,
      {
        type: string;
        description: string;
        required?: boolean;
        default?: unknown;
      }
    >;
    required?: string[];
  };
  samplePayload?: Record<string, unknown>;
}

interface HiveToolDrawerProps {
  tool: McpToolSchema | null;
  onClose: () => void;
}

export function HiveToolDrawer({ tool, onClose }: HiveToolDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [testPayload, setTestPayload] = useState<string>(
    tool?.samplePayload ? JSON.stringify(tool.samplePayload, null, 2) : "{}"
  );
  const [simulating, setSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<string | null>(null);

  if (!tool) return null;

  const handleCopySchema = () => {
    void navigator.clipboard.writeText(
      JSON.stringify(
        {
          name: tool.name,
          server: tool.serverName,
          parameters: tool.parameters,
        },
        null,
        2
      )
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulation = () => {
    setSimulating(true);
    setSimulateResult(null);
    setTimeout(() => {
      setSimulating(false);
      setSimulateResult(
        JSON.stringify(
          {
            jsonrpc: "2.0",
            status: "success",
            exit_code: 0,
            simulated: true,
            execution_ms: 18,
            output: `Dry-run execution of ${tool.name} completed under sandbox isolation. Zero-trust gate evaluated: PASS.`,
          },
          null,
          2
        )
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl h-full skeuo-glass-deck border-l border-border/80 flex flex-col justify-between shadow-2xl p-6 overflow-hidden animate-in slide-in-from-right duration-300 select-none text-foreground font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Drawer Header ─── */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#FFB22C]/15 border border-[#FFB22C]/30 flex items-center justify-center text-[#FFB22C]">
                <Wrench className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
                  {tool.name}
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Server: <strong className="text-foreground">{tool.serverName}</strong> (MCP Protocol 2024-11-05)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySchema}
              className="skeuo-button-secondary p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy JSON Schema"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="skeuo-button-secondary p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="Close Drawer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ─── Drawer Body (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 select-text">
          {/* Security & Risk Badge */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-card/60 border border-border/70 shadow-inner">
            <div className="flex items-center gap-2.5">
              {tool.riskLevel === "high" ? (
                <ShieldAlert className="size-5 text-destructive shrink-0" />
              ) : tool.riskLevel === "medium" ? (
                <Shield className="size-5 text-amber-500 shrink-0" />
              ) : (
                <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {tool.riskLevel === "high"
                    ? "High Risk: Mutation & Exec Gate Required"
                    : tool.riskLevel === "medium"
                    ? "Medium Risk: Workspace Modification"
                    : "Low Risk: Sandboxed Read-Only"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {tool.requiresApproval
                    ? "Requires human authorization token before flight execution."
                    : "Granted auto-approve execution scope under sandbox containment."}
                </span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                tool.riskLevel === "high"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : tool.riskLevel === "medium"
                  ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                  : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
              }`}
            >
              {tool.riskLevel}
            </span>
          </div>

          {/* Tool Description */}
          <div className="space-y-1.5">
            <span className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Code2 className="size-3 text-[#FFB22C]" />
              Capability Description
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed p-3.5 rounded-xl bg-card/40 border border-border/60 font-sans">
              {tool.description}
            </p>
          </div>

          {/* JSON-RPC Schema Definition */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Terminal className="size-3 text-[#FFB22C]" />
              Input Parameter Schema (JSON Schema)
            </span>
            <div className="skeuo-inset-terminal p-3.5 rounded-xl text-xs font-mono text-zinc-300 max-h-52 overflow-y-auto leading-relaxed border border-white/5">
              <pre className="text-[11px]">
                {JSON.stringify(tool.parameters, null, 2)}
              </pre>
            </div>
          </div>

          {/* Dry-Run Sandbox Simulator */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Cpu className="size-3 text-emerald-500" />
                Dry-Run Sandbox Simulation
              </span>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulating}
                className="skeuo-button-primary px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="size-3 fill-current" />
                {simulating ? "Executing Dry-Run..." : "Simulate Call"}
              </button>
            </div>

            <textarea
              rows={3}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full p-3 rounded-xl bg-card/60 border border-border/80 text-xs font-mono focus:border-[#FFB22C] focus:outline-none text-foreground placeholder:text-muted-foreground/60 transition-colors"
              placeholder="Enter JSON test parameters..."
            />

            {simulateResult && (
              <div className="skeuo-inset-terminal p-3 rounded-xl text-[11px] font-mono text-emerald-400 border border-emerald-500/30 animate-in fade-in">
                <pre>{simulateResult}</pre>
              </div>
            )}
          </div>
        </div>

        {/* ─── Drawer Footer ─── */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            Sidecar Process Active
          </div>
          <button
            type="button"
            onClick={onClose}
            className="skeuo-button-secondary px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
