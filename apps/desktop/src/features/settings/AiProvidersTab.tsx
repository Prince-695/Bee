import React, { useState } from "react";
import {
  Key,
  ShieldCheck,
  CheckCircle2,
  Play,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Server,
  Eye,
  EyeOff,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AiProvider {
  id: string;
  name: string;
  badge: string;
  model: string;
  keyMask: string;
  endpoint?: string;
  status: "connected" | "unconfigured" | "testing";
  latency?: string;
  isCustomKey: boolean;
}

const INITIAL_PROVIDERS: AiProvider[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "PRIMARY",
    model: "gemini-2.5-flash",
    keyMask: "AIzaSyD89aB02c449F...88fA",
    status: "connected",
    latency: "184ms",
    isCustomKey: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    badge: "FALLBACK 1",
    model: "gpt-4o",
    keyMask: "sk-proj-081bca7829...91ba",
    status: "connected",
    latency: "340ms",
    isCustomKey: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    badge: "FALLBACK 2",
    model: "claude-3-5-sonnet",
    keyMask: "sk-ant-api03-77a8...e440",
    status: "connected",
    latency: "412ms",
    isCustomKey: false,
  },
  {
    id: "ollama",
    name: "Local Ollama Engine",
    badge: "AIR-GAPPED",
    model: "deepseek-coder-v2:16b",
    endpoint: "http://localhost:11434",
    keyMask: "LOCAL_SOCKET_NO_AUTH",
    status: "connected",
    latency: "48ms",
    isCustomKey: false,
  },
];

export const AiProvidersTab: React.FC = () => {
  const [providers, setProviders] = useState<AiProvider[]>(INITIAL_PROVIDERS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveProvider = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= providers.length) return;

    const updated = [...providers];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Update fallback badges
    const reBadged = updated.map((p, idx) => ({
      ...p,
      badge:
        idx === 0
          ? "PRIMARY"
          : idx === updated.length - 1
          ? "AIR-GAPPED"
          : `FALLBACK ${idx}`,
    }));
    setProviders(reBadged);
  };

  const testConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setProviders((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status: "connected", latency: `${Math.floor(120 + Math.random() * 180)}ms` } : p
        )
      );
      setTestingId(null);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.2)]">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                AI Providers & BYOK Vault
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                <ShieldCheck className="w-3 h-3 mr-1" /> Zero-Leak Encrypted
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bring Your Own Key (BYOK) with automated priority failover routing.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert("Provider credentials securely synced.")}
          className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Provider Fallback Chain Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-foreground">Priority Failover Ordering</h4>
            <p className="text-xs text-muted-foreground">
              Missions attempt execution on the primary model first, with instant failover down the chain upon rate limits.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {providers.map((p, index) => (
            <div
              key={p.id}
              className="skeuo-glass-card rounded-2xl p-4.5 border border-border/60 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="flex items-center gap-3.5">
                <div className="flex flex-col gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => moveProvider(index, "up")}
                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    title="Move Priority Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === providers.length - 1}
                    onClick={() => moveProvider(index, "down")}
                    className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                    title="Move Priority Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="w-8 h-8 rounded-xl bg-secondary/80 border border-border flex items-center justify-center text-primary shrink-0">
                  <Server className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{p.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        p.badge === "PRIMARY"
                          ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_8px_rgba(255,178,44,0.3)]"
                          : "bg-secondary border-border text-muted-foreground"
                      }`}
                    >
                      {p.badge}
                    </span>
                    {p.status === "connected" && (
                      <span className="text-[10px] text-emerald-500 font-mono font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {p.latency}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    Model: <span className="text-foreground font-semibold">{p.model}</span>
                    {p.endpoint && ` • Endpoint: ${p.endpoint}`}
                  </div>
                </div>
              </div>

              {/* Right Key Input & Actions */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <input
                    type={showKeys[p.id] ? "text" : "password"}
                    readOnly
                    value={p.keyMask}
                    className="w-56 px-3 py-1.5 text-xs font-mono rounded-xl bg-secondary/50 border border-border/70 text-foreground pr-8 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey(p.id)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKeys[p.id] ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => testConnection(p.id)}
                  disabled={testingId === p.id}
                  className="skeuo-button-secondary text-xs px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 text-primary fill-current" />
                  <span>{testingId === p.id ? "Pinging..." : "Test"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
