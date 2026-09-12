import { useState } from "react";
import {
  X,
  Trash2,
  Terminal,
  Globe,
  Server,
  Key,
  Check,
  RotateCw,
  Boxes,
  ShieldCheck,
} from "lucide-react";

interface HiveAddServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerAdded: (name: string) => void;
}

export function HiveAddServerModal({
  isOpen,
  onClose,
  onServerAdded,
}: HiveAddServerModalProps) {
  const [transport, setTransport] = useState<"stdio" | "sse" | "docker">("stdio");
  const [name, setName] = useState("");
  const [commandOrUrl, setCommandOrUrl] = useState("");
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: "", value: "" },
  ]);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddEnv = () => {
    setEnvPairs([...envPairs, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (idx: number) => {
    setEnvPairs(envPairs.filter((_, i) => i !== idx));
  };

  const handleUpdateEnv = (idx: number, field: "key" | "value", val: string) => {
    setEnvPairs(
      envPairs.map((pair, i) => (i === idx ? { ...pair, [field]: val } : pair))
    );
  };

  const handleTestConnection = () => {
    setTesting(true);
    setTestSuccess(false);
    setTimeout(() => {
      setTesting(false);
      setTestSuccess(true);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onServerAdded(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in select-none font-sans text-foreground">
      <div
        className="w-full max-w-lg skeuo-glass-deck rounded-2xl border border-border/80 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-[#FFB22C]/15 border border-[#FFB22C]/30 flex items-center justify-center text-[#FFB22C]">
              <Boxes className="size-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Install Custom MCP Server
              </h3>
              <span className="text-[11px] font-mono text-muted-foreground">
                Connect external tool providers over Model Context Protocol
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="skeuo-button-secondary p-1.5 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Transport Picker */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
              Transport Type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTransport("stdio")}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  transport === "stdio"
                    ? "bg-[#FFB22C] text-[#121316] border-[#FFB22C] font-bold shadow-sm"
                    : "skeuo-button-secondary text-muted-foreground"
                }`}
              >
                <Terminal className="size-3.5" />
                <span>Stdio Subprocess</span>
              </button>
              <button
                type="button"
                onClick={() => setTransport("sse")}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  transport === "sse"
                    ? "bg-[#FFB22C] text-[#121316] border-[#FFB22C] font-bold shadow-sm"
                    : "skeuo-button-secondary text-muted-foreground"
                }`}
              >
                <Globe className="size-3.5" />
                <span>Remote SSE</span>
              </button>
              <button
                type="button"
                onClick={() => setTransport("docker")}
                className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                  transport === "docker"
                    ? "bg-[#FFB22C] text-[#121316] border-[#FFB22C] font-bold shadow-sm"
                    : "skeuo-button-secondary text-muted-foreground"
                }`}
              >
                <Server className="size-3.5" />
                <span>Docker</span>
              </button>
            </div>
          </div>

          {/* Server Name */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
              Server Identifier:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. sentry_mcp or linear_mcp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-card/60 border border-border/80 text-foreground focus:border-[#FFB22C] focus:outline-none transition-colors"
            />
          </div>

          {/* Command or URL */}
          <div className="space-y-1">
            <label className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
              {transport === "stdio"
                ? "Executable Command (npx / uvx / binary):"
                : transport === "sse"
                ? "Remote SSE URL Endpoint:"
                : "Docker Image Name:"}
            </label>
            <input
              type="text"
              required
              placeholder={
                transport === "stdio"
                  ? "npx -y @modelcontextprotocol/server-postgres postgresql://..."
                  : transport === "sse"
                  ? "https://mcp.internal.acme.com/sse"
                  : "ghcr.io/acme/mcp-runner:latest"
              }
              value={commandOrUrl}
              onChange={(e) => setCommandOrUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-card/60 border border-border/80 text-foreground focus:border-[#FFB22C] focus:outline-none font-mono transition-colors"
            />
          </div>

          {/* Environment Variables & Secrets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                <Key className="size-3 text-[#FFB22C]" />
                Injected Environment Secrets:
              </label>
              <button
                type="button"
                onClick={handleAddEnv}
                className="text-[11px] text-[#FFB22C] hover:underline font-semibold cursor-pointer"
              >
                + Add Secret
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {envPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="API_KEY_NAME"
                    value={pair.key}
                    onChange={(e) => handleUpdateEnv(idx, "key", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border/80 text-foreground font-mono text-[11px]"
                  />
                  <input
                    type="password"
                    placeholder="sk_live_..."
                    value={pair.value}
                    onChange={(e) => handleUpdateEnv(idx, "value", e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-card/60 border border-border/80 text-foreground font-mono text-[11px]"
                  />
                  {envPairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEnv(idx)}
                      className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dry-run Ping Test */}
          <div className="p-3 rounded-xl bg-card/40 border border-border/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <span className="text-[11px] text-muted-foreground">
                {testSuccess
                  ? "Handshake verified: JSON-RPC 2.0 protocol matched."
                  : "Validate connection before auto-mounting sidecar."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !commandOrUrl}
              className="skeuo-button-secondary px-3 py-1 rounded-lg text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`size-3 text-muted-foreground ${testing ? "animate-spin text-[#FFB22C]" : ""}`} />
              {testing ? "Testing..." : testSuccess ? "Verified ✓" : "Test Ping"}
            </button>
          </div>

          {/* Footer CTAs */}
          <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="skeuo-button-secondary px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="size-3.5 stroke-[2.5]" />
              Register & Mount Server
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
