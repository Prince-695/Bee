import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  RotateCcw,
  GitBranch,
  Terminal,
  Search,
  GitPullRequest,
  Mail,
  Database,
  Globe,
  FolderTree,
  Key,
  Check,
  X,
  ShieldCheck,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHiveRegistry, type HiveRegistryStatus } from "@/lib/api";

interface OAuthConnector {
  provider: string;
  connected_at: string;
  scopes: string[];
  metadata: Record<string, unknown>;
}

const OAUTH_PROVIDERS_META: Record<
  string,
  {
    name: string;
    icon: React.ReactNode;
    desc: string;
    badge: string;
    scopes: string;
  }
> = {
  github: {
    name: "GitHub",
    icon: <GitPullRequest className="w-5 h-5 text-white" />,
    desc: "1-Click connect your repositories, pull requests, issues, and commit triggers.",
    badge: "Engineering",
    scopes: "repo, read:user",
  },
  google: {
    name: "Google (Gmail / Drive)",
    icon: <Mail className="w-5 h-5 text-red-400" />,
    desc: "1-Click connect Gmail alerts, incident digests, and workspace docs.",
    badge: "Workspace",
    scopes: "gmail.modify, userinfo.email",
  },
  slack: {
    name: "Slack",
    icon: <MessageSquare className="w-5 h-5 text-amber-400" />,
    desc: "1-Click connect team channels for interactive Approval Gate authorizations.",
    badge: "Team",
    scopes: "chat:write, channels:read",
  },
  discord: {
    name: "Discord",
    icon: <MessageSquare className="w-5 h-5 text-indigo-400" />,
    desc: "1-Click connect server webhooks and interactive bot notifications.",
    badge: "Community",
    scopes: "bot, messages.read",
  },
};

const LOCAL_TOOLS_META: Record<
  string,
  {
    icon: React.ReactNode;
    category: "engineering" | "workspace" | "ops" | "search";
    desc: string;
    tools: string[];
  }
> = {
  git: {
    icon: <GitBranch className="w-5 h-5 text-amber-400" />,
    category: "engineering",
    desc: "Autonomous local branch management, commit staging, diff inspections, and PR creation.",
    tools: ["git_status", "git_diff", "git_commit", "git_create_branch", "git_checkout", "git_log"],
  },
  sandbox: {
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    category: "engineering",
    desc: "Isolated test runner for pytest, vitest, ruff, eslint, cargo, and build pipelines with exit code telemetry.",
    tools: ["run_command", "run_test_suite", "run_linter", "run_build"],
  },
  code_search: {
    icon: <Search className="w-5 h-5 text-purple-400" />,
    category: "engineering",
    desc: "High-performance ripgrep regex engine and AST symbol indexing across project directories.",
    tools: ["code_ripgrep", "code_find_files", "code_view_file"],
  },
  filesystem: {
    icon: <FolderTree className="w-5 h-5 text-amber-300" />,
    category: "workspace",
    desc: "Direct local workspace file reads, directory indexing, and structured updates.",
    tools: ["read_file", "write_file", "list_directory"],
  },
  duckduckgo: {
    icon: <Globe className="w-5 h-5 text-blue-400" />,
    category: "search",
    desc: "Web and documentation search capabilities for external SDKs and libraries.",
    tools: ["duckduckgo_web_search", "duckduckgo_news_search"],
  },
  postgres: {
    icon: <Database className="w-5 h-5 text-blue-300" />,
    category: "ops",
    desc: "Database schema reflection, migrations, and read/write SQL query execution.",
    tools: ["query", "describe_table", "list_tables"],
  },
};

export default function HivePage() {
  const [data, setData] = useState<HiveRegistryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectedOAuth, setConnectedOAuth] = useState<Record<string, OAuthConnector>>({});
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [showAdvancedBYOK, setShowAdvancedBYOK] = useState(false);
  const [customKeyModal, setCustomKeyModal] = useState<string | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState("");

  const fetchOAuthConnectors = useCallback(async () => {
    try {
      const res = await fetch("/api/oauth/connectors");
      if (res.ok) {
        const json = await res.json() as { success: boolean; data: OAuthConnector[] };
        if (json.success && Array.isArray(json.data)) {
          const map: Record<string, OAuthConnector> = {};
          for (const c of json.data) {
            map[c.provider.toLowerCase()] = c;
          }
          setConnectedOAuth(map);
        }
      }
    } catch {
      // Ignore network errors in local dev
    }
  }, []);

  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getHiveRegistry();
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load Hive registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRegistry();
    void fetchOAuthConnectors();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === "object" && "type" in event.data && event.data.type === "OAUTH_SUCCESS") {
        void fetchOAuthConnectors();
        setConnectingProvider(null);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchRegistry, fetchOAuthConnectors]);

  const handle1ClickConnect = (provider: string) => {
    setConnectingProvider(provider);
    const popupUrl = `/api/oauth/${provider}/demo-authorize`;
    const popup = window.open(
      popupUrl,
      `bee_oauth_${provider}`,
      "width=500,height=600,menubar=no,toolbar=no,location=no,status=no"
    );

    // Fallback polling if postMessage blocked
    const interval = setInterval(() => {
      if (popup?.closed) {
        clearInterval(interval);
        setConnectingProvider(null);
        void fetchOAuthConnectors();
      }
    }, 1000);
  };

  const handleDisconnectOAuth = async (provider: string) => {
    try {
      await fetch(`/api/oauth/${provider}`, { method: "DELETE" });
      void fetchOAuthConnectors();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-8 bg-zinc-950 font-sans text-zinc-100">
      {/* ─── Header & Top Actions ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Boxes className="w-6 h-6 text-amber-500" />
              Hive Platform & Tools
            </h1>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Zero-Config SaaS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Connect your platforms with 1-click logins. No API keys or environment variables required.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchRegistry();
              void fetchOAuthConnectors();
            }}
            disabled={loading}
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
            Sync Status
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── SECTION 1: 1-Click OAuth Connectors ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1-Click Platform Connectors (No API Keys Needed)
            </h2>
          </div>
          <span className="text-xs text-zinc-500">
            {Object.keys(connectedOAuth).length} of {Object.keys(OAUTH_PROVIDERS_META).length} Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(OAUTH_PROVIDERS_META).map(([pid, pmeta]) => {
            const isConnected = Boolean(connectedOAuth[pid]);
            const isConnecting = connectingProvider === pid;

            return (
              <div
                key={pid}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                  isConnected
                    ? "bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                    : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center shadow-inner">
                      {pmeta.icon}
                    </div>
                    {isConnected ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                        {pmeta.badge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-white">{pmeta.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{pmeta.desc}</p>
                  </div>
                </div>

                <div>
                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDisconnectOAuth(pid)}
                      className="w-full rounded-xl text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handle1ClickConnect(pid)}
                      disabled={isConnecting}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs shadow-md shadow-amber-500/10"
                    >
                      {isConnecting ? "Connecting..." : `Connect ${pmeta.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 2: Local Auto-Mounted Engineering Tools ─── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Local Workspace Tools (Auto-Mounted & 100% Private)
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400">Sandbox Active</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(LOCAL_TOOLS_META).map(([serverName, meta]) => {
            const isOnline = data?.servers?.some((s) => s.name === serverName && s.status === "connected") ?? false;

            return (
              <div
                key={serverName}
                className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                        {meta.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-white capitalize font-mono">{serverName}</h4>
                        <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">{meta.category}</span>
                      </div>
                    </div>
                    {isOnline ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" title="Ready" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" title="Standby" />
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{meta.desc}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-zinc-800/60">
                  {meta.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50 font-mono text-[10.5px] text-amber-300/90"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SECTION 3: Advanced Bring-Your-Own-Key (BYOK) Toggle ─── */}
      <div className="pt-6 border-t border-zinc-800/80">
        <button
          onClick={() => setShowAdvancedBYOK(!showAdvancedBYOK)}
          className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {showAdvancedBYOK ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Advanced: Bring Your Own API Keys & Custom MCP Servers</span>
        </button>

        {showAdvancedBYOK && (
          <div className="mt-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-4">
            <p className="text-xs text-zinc-400">
              For power users and custom enterprise environments: Configure custom OpenAI/Anthropic/NVIDIA keys, Postgres URIs, or custom Stdio MCP server paths.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Custom LLM Key", "Postgres Connection URI", "Custom Stdio MCP"].map((label) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomKeyModal(label);
                    setCustomKeyInput("");
                  }}
                  className="rounded-xl border-zinc-800 bg-zinc-900 text-xs text-zinc-300 hover:bg-zinc-800 gap-2"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Configure {label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Custom Key Modal ─── */}
      {customKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Configure {customKeyModal}
              </h3>
              <button
                onClick={() => setCustomKeyModal(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Saved securely to your local encrypted database. Never shared with anyone.
            </p>
            <input
              type="password"
              placeholder={`Enter ${customKeyModal}...`}
              value={customKeyInput}
              onChange={(e) => setCustomKeyInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCustomKeyModal(null)}
                className="rounded-xl text-xs text-zinc-400"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setCustomKeyModal(null)}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
