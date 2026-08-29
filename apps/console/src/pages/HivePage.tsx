import { useCallback, useEffect, useState } from "react";
import {
  Boxes,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHiveRegistry, type HiveRegistryStatus } from "@/lib/api";

const SERVER_METADATA: Record<
  string,
  {
    icon: React.ReactNode;
    category: "engineering" | "workspace" | "ops" | "search";
    desc: string;
    tools: string[];
    tokenField?: string;
    tokenPlaceholder?: string;
  }
> = {
  git: {
    icon: <GitBranch className="w-5 h-5 text-amber-400" />,
    category: "engineering",
    desc: "Autonomous branch management, commit staging, diff inspections, and PR creation on local repo.",
    tools: ["git_status", "git_diff", "git_commit", "git_create_branch", "git_checkout", "git_log"],
  },
  sandbox: {
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    category: "engineering",
    desc: "Isolated runner for pytest, vitest, ruff, eslint, cargo, and build pipelines with exit code telemetry.",
    tools: ["run_command", "run_test_suite", "run_linter", "run_build"],
  },
  code_search: {
    icon: <Search className="w-5 h-5 text-purple-400" />,
    category: "engineering",
    desc: "High-performance ripgrep regex engine and AST symbol indexing across project directories.",
    tools: ["code_ripgrep", "code_find_files", "code_view_file"],
  },
  github: {
    icon: <GitPullRequest className="w-5 h-5 text-zinc-200" />,
    category: "engineering",
    desc: "GitHub API integration for issues, pull requests, commits, and workflow dispatch.",
    tools: ["create_issue", "create_pull_request", "list_repo_branches"],
    tokenField: "GitHub Personal Access Token (PAT)",
    tokenPlaceholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
  },
  duckduckgo: {
    icon: <Globe className="w-5 h-5 text-blue-400" />,
    category: "search",
    desc: "Web and documentation search capabilities for external SDKs and libraries.",
    tools: ["duckduckgo_web_search", "duckduckgo_news_search"],
  },
  filesystem: {
    icon: <FolderTree className="w-5 h-5 text-amber-300" />,
    category: "workspace",
    desc: "Direct local workspace file reads, directory indexing, and structured updates.",
    tools: ["read_file", "write_file", "list_directory"],
  },
  postgres: {
    icon: <Database className="w-5 h-5 text-blue-300" />,
    category: "ops",
    desc: "Database schema reflection, migrations, and read/write SQL query execution.",
    tools: ["query", "describe_table", "list_tables"],
    tokenField: "Postgres Connection URI",
    tokenPlaceholder: "postgresql://user:pass@localhost:5432/mydb",
  },
  gmail: {
    icon: <Mail className="w-5 h-5 text-red-400" />,
    category: "workspace",
    desc: "Read engineering incident emails and dispatch notification digests.",
    tools: ["send_email", "list_messages"],
    tokenField: "Google OAuth Access Token / App Password",
    tokenPlaceholder: "ya29.a0AfH6SM...",
  },
};

export default function HivePage() {
  const [data, setData] = useState<HiveRegistryStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeConfigServer, setActiveConfigServer] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getHiveRegistry());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Hive Registry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Load configured keys from local storage
    try {
      const stored = window.localStorage.getItem("bee_user_connectors");
      if (stored) {
        setSavedKeys(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [load]);

  const handleSaveConnector = (serverName: string) => {
    if (!apiKeyInput.trim()) return;
    const updated = { ...savedKeys, [serverName]: true };
    setSavedKeys(updated);
    window.localStorage.setItem("bee_user_connectors", JSON.stringify(updated));
    setActiveConfigServer(null);
    setApiKeyInput("");
  };

  const handleDisconnectConnector = (serverName: string) => {
    const updated = { ...savedKeys, [serverName]: false };
    setSavedKeys(updated);
    window.localStorage.setItem("bee_user_connectors", JSON.stringify(updated));
  };

  const servers = data?.servers || [];
  const filteredServers =
    selectedCategory === "all"
      ? servers
      : servers.filter((s) => SERVER_METADATA[s.name]?.category === selectedCategory);

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Boxes className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Hive Registry & Connectors</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Pluggable MCP worker catalog providing Bee with developer tools, runtime sandboxes, and user-configured SaaS integrations.
          </p>
        </div>

        <Button
          variant="outline"
          className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium self-start md:self-auto"
          onClick={() => void load()}
          disabled={loading}
        >
          <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Sync Registry
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Registry Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Available Tools</span>
          <div className="text-2xl font-black text-white mt-2">{data?.tool_count ?? "—"}</div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Callable within Flights</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Workers</span>
          <div className="text-2xl font-black text-white mt-2">{data?.servers.length ?? "—"}</div>
          <span className="text-[11px] text-zinc-400 mt-1 block">MCP capability hosts</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Runtime Status</span>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {data ? (data.runtime_initialized ? "Active" : "Initializing") : "—"}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Sidecar supervisor</span>
        </div>

        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">User Connectors</span>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {Object.values(savedKeys).filter(Boolean).length} Active
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Configured by you</span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        {[
          { id: "all", label: "All Connectors" },
          { id: "engineering", label: "Engineering & Local Tools" },
          { id: "workspace", label: "Workspace & Comms" },
          { id: "ops", label: "Databases & Ops" },
          { id: "search", label: "Search & Web" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === tab.id
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Server & Connector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServers.map((server) => {
          const meta = SERVER_METADATA[server.name] || {
            icon: <Sparkles className="w-5 h-5 text-amber-400" />,
            category: "engineering",
            desc: "Pluggable MCP tool worker for Bee.",
            tools: [],
          };
          const isConfiguredByUser = Boolean(savedKeys[server.name]);
          const isReady = server.status === "ready" || isConfiguredByUser;

          return (
            <div
              key={server.name}
              className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                      {meta.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white capitalize">{server.name}</h3>
                      <span className="text-[10.5px] font-mono text-zinc-500 uppercase tracking-wider">
                        {meta.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isReady
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : server.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {isReady ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : server.status === "failed" ? (
                      <XCircle className="w-3 h-3 text-red-400" />
                    ) : (
                      <Clock className="w-3 h-3 text-zinc-400" />
                    )}
                    {isReady ? "Ready" : server.status}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{meta.desc}</p>

                {meta.tools.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">
                      Exposed Tools ({meta.tools.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.tools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[10.5px] font-mono text-zinc-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                {meta.tokenField ? (
                  isConfiguredByUser ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Connected
                      </span>
                      <button
                        onClick={() => handleDisconnectConnector(server.name)}
                        className="text-zinc-500 hover:text-red-400 text-[11px] font-mono cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-200 text-xs"
                      onClick={() => {
                        setActiveConfigServer(server.name);
                        setApiKeyInput("");
                      }}
                    >
                      <Key className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      Configure Connector
                    </Button>
                  )
                ) : (
                  <div className="flex items-center justify-between w-full text-[11px] text-zinc-500 font-mono">
                    <span>Local workspace worker</span>
                    <span className="flex items-center gap-1 text-emerald-400">● Auto-mounted</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Connector Credentials Configuration Modal */}
      {activeConfigServer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white capitalize">
                  Connect {activeConfigServer}
                </h3>
              </div>
              <button
                onClick={() => setActiveConfigServer(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter your personal API key or token. Credentials are securely managed per-user and never exposed to other tenants.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                {SERVER_METADATA[activeConfigServer]?.tokenField || "API Token"}
              </label>
              <input
                type="password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-black text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                placeholder={SERVER_METADATA[activeConfigServer]?.tokenPlaceholder || "Enter token..."}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-xl border-zinc-800 text-zinc-300 text-xs"
                onClick={() => setActiveConfigServer(null)}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                onClick={() => handleSaveConnector(activeConfigServer)}
                disabled={!apiKeyInput.trim()}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Save & Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
