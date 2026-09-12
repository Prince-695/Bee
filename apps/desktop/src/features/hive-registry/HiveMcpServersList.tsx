import { useState } from "react";
import {
  Boxes,
  Terminal,
  GitBranch,
  Search,
  FolderTree,
  Globe,
  Database,
  RotateCw,
  Plus,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { McpToolSchema } from "./HiveToolDrawer";

export interface McpServerRecord {
  id: string;
  name: string;
  packageName: string;
  version: string;
  category: "engineering" | "search" | "workspace" | "ops" | "custom";
  transport: "stdio" | "sse" | "websocket";
  enabled: boolean;
  status: "online" | "degraded" | "offline";
  latencyMs: number;
  description: string;
  tools: McpToolSchema[];
  envKeys: string[];
}

const INITIAL_SERVERS: McpServerRecord[] = [
  {
    id: "sandbox_runner",
    name: "sandbox_runner",
    packageName: "@bee/sandbox-runner",
    version: "1.4.2",
    category: "engineering",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 8,
    description: "Containerized execution sandbox for pytest, vitest, cargo, ruff, and build test suites.",
    envKeys: ["DOCKER_HOST", "SANDBOX_TIMEOUT_SEC"],
    tools: [
      {
        name: "run_command",
        serverName: "sandbox_runner",
        description: "Executes a shell command inside the isolated micro-container with stdout/stderr capture.",
        riskLevel: "high",
        requiresApproval: true,
        parameters: {
          type: "object",
          properties: {
            command: { type: "string", description: "Bash command string to execute", required: true },
            cwd: { type: "string", description: "Working directory path relative to workspace" },
            timeout: { type: "number", description: "Max timeout in seconds (default 30)" },
          },
          required: ["command"],
        },
        samplePayload: { command: "pytest apps/api/tests/ -q", cwd: "./" },
      },
      {
        name: "run_test_suite",
        serverName: "sandbox_runner",
        description: "Synthesizes edge-case test runs and captures pytest/vitest pass/fail metrics.",
        riskLevel: "medium",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            suite: { type: "string", description: "Target test suite runner path" },
            coverage: { type: "boolean", description: "Enable line coverage calculation" },
          },
          required: ["suite"],
        },
        samplePayload: { suite: "tests/test_auth_v1.py", coverage: true },
      },
      {
        name: "run_linter",
        serverName: "sandbox_runner",
        description: "Runs ruff / eslint in check mode with AST lint error taxonomy.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            paths: { type: "string", description: "Directories to lint" },
            fix: { type: "boolean", description: "Attempt automatic fixes" },
          },
          required: ["paths"],
        },
      },
    ],
  },
  {
    id: "git_agent",
    name: "git_agent",
    packageName: "@bee/git-agent",
    version: "2.1.0",
    category: "engineering",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 12,
    description: "Autonomous branch management, commit staging, side-by-side git diffs, and pull requests.",
    envKeys: ["GITHUB_TOKEN", "GIT_AUTHOR_NAME", "GIT_AUTHOR_EMAIL"],
    tools: [
      {
        name: "git_status",
        serverName: "git_agent",
        description: "Returns porcelain status of untracked, modified, and staged git working tree files.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Subdirectory to check status for" },
          },
        },
      },
      {
        name: "git_diff",
        serverName: "git_agent",
        description: "Calculates unified or split diff between HEAD and current working tree or branches.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            staged: { type: "boolean", description: "Inspect staged index diff only" },
            branch: { type: "string", description: "Compare against target branch (e.g. main)" },
          },
        },
      },
      {
        name: "git_commit",
        serverName: "git_agent",
        description: "Commits specified files with a structured conventional commit message.",
        riskLevel: "high",
        requiresApproval: true,
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Conventional commit message", required: true },
            files: { type: "string", description: "Comma-separated list of filepaths to commit" },
          },
          required: ["message"],
        },
        samplePayload: { message: "feat(auth): add rate-limiting token bucket", files: "middleware.py" },
      },
      {
        name: "git_create_branch",
        serverName: "git_agent",
        description: "Creates and checks out a new semantic branch from origin.",
        riskLevel: "medium",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            branch_name: { type: "string", description: "Target branch name", required: true },
          },
          required: ["branch_name"],
        },
      },
    ],
  },
  {
    id: "code_search",
    name: "code_search",
    packageName: "@bee/ripgrep-ast",
    version: "1.0.8",
    category: "engineering",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 5,
    description: "Ultra-fast ripgrep regex engine and tree-sitter AST symbol indexing across files.",
    envKeys: ["RIPGREP_MAX_MATCHES"],
    tools: [
      {
        name: "code_ripgrep",
        serverName: "code_search",
        description: "Searches patterns across codebases with line numbers and file filtering.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Regex or exact match string", required: true },
            includes: { type: "string", description: "Glob patterns to include (e.g. *.py, *.tsx)" },
          },
          required: ["query"],
        },
        samplePayload: { query: "DatabaseEngine", includes: "*.py" },
      },
      {
        name: "code_find_files",
        serverName: "code_search",
        description: "Discovers file paths matching glob patterns in milliseconds.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            pattern: { type: "string", description: "Glob pattern to find", required: true },
          },
          required: ["pattern"],
        },
      },
      {
        name: "code_view_file",
        serverName: "code_search",
        description: "Reads slice of lines from any text or binary codebase asset with line numbering.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            file_path: { type: "string", description: "Absolute or workspace-relative path", required: true },
            start_line: { type: "number", description: "1-indexed starting line" },
            end_line: { type: "number", description: "1-indexed ending line" },
          },
          required: ["file_path"],
        },
      },
    ],
  },
  {
    id: "filesystem",
    name: "filesystem",
    packageName: "@modelcontextprotocol/server-filesystem",
    version: "0.6.2",
    category: "workspace",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 6,
    description: "Direct local workspace file reads, atomic file patching, and directory tree listings.",
    envKeys: ["ALLOWED_DIRECTORIES"],
    tools: [
      {
        name: "read_file",
        serverName: "filesystem",
        description: "Reads entire content of a file from permitted workspace directories.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Path to file", required: true },
          },
          required: ["path"],
        },
      },
      {
        name: "write_file",
        serverName: "filesystem",
        description: "Creates or overwrites files with atomic write verification.",
        riskLevel: "high",
        requiresApproval: true,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Target filepath", required: true },
            content: { type: "string", description: "Complete file content", required: true },
          },
          required: ["path", "content"],
        },
      },
      {
        name: "list_directory",
        serverName: "filesystem",
        description: "Lists child files and directories with sizes and modification times.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            path: { type: "string", description: "Directory to list", required: true },
          },
          required: ["path"],
        },
      },
    ],
  },
  {
    id: "postgres",
    name: "postgres_mcp",
    packageName: "@modelcontextprotocol/server-postgres",
    version: "0.2.1",
    category: "ops",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 16,
    description: "Relational database schema reflection, pgvector similarity lookups, and SQL queries.",
    envKeys: ["DATABASE_URL", "MAX_CONNECTIONS"],
    tools: [
      {
        name: "query",
        serverName: "postgres_mcp",
        description: "Executes parameterized SQL queries against active PostgreSQL tenant databases.",
        riskLevel: "high",
        requiresApproval: true,
        parameters: {
          type: "object",
          properties: {
            sql: { type: "string", description: "SQL query statement", required: true },
            params: { type: "array", description: "Positional query parameters" },
          },
          required: ["sql"],
        },
      },
      {
        name: "describe_table",
        serverName: "postgres_mcp",
        description: "Retrieves column types, primary keys, foreign keys, and indexes for a table.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            table_name: { type: "string", description: "Table name to describe", required: true },
          },
          required: ["table_name"],
        },
      },
      {
        name: "list_tables",
        serverName: "postgres_mcp",
        description: "Lists all relational tables and vector embeddings in the current schema.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            schema: { type: "string", description: "Database schema (default 'public')" },
          },
        },
      },
    ],
  },
  {
    id: "duckduckgo",
    name: "duckduckgo_search",
    packageName: "@bee/duckduckgo-mcp",
    version: "1.1.0",
    category: "search",
    transport: "stdio",
    enabled: true,
    status: "online",
    latencyMs: 142,
    description: "Live web search, documentation crawls, and GitHub issue research for modern libraries.",
    envKeys: [],
    tools: [
      {
        name: "duckduckgo_web_search",
        serverName: "duckduckgo_search",
        description: "Searches documentation and engineering forums for error signatures.",
        riskLevel: "low",
        requiresApproval: false,
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query string", required: true },
            max_results: { type: "number", description: "Max results to return (default 5)" },
          },
          required: ["query"],
        },
      },
    ],
  },
];

interface HiveMcpServersListProps {
  onSelectTool: (tool: McpToolSchema) => void;
  onOpenAddServer: () => void;
}

export function HiveMcpServersList({
  onSelectTool,
  onOpenAddServer,
}: HiveMcpServersListProps) {
  const [servers, setServers] = useState<McpServerRecord[]>(INITIAL_SERVERS);
  const [pingingId, setPingingId] = useState<string | null>(null);

  const handleToggleServer = (id: string) => {
    setServers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handlePing = (id: string) => {
    setPingingId(id);
    setTimeout(() => {
      setServers((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, latencyMs: Math.floor(Math.random() * 12) + 6, status: "online" }
            : s
        )
      );
      setPingingId(null);
    }, 500);
  };

  const totalTools = servers.reduce(
    (acc, s) => acc + (s.enabled ? s.tools.length : 0),
    0
  );

  return (
    <div className="space-y-6 select-none font-sans">
      {/* ── Sub-header with Add Action ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Boxes className="size-4 text-[#FFB22C]" />
            Active MCP Sidecars & Registry Servers
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model Context Protocol servers providing tools and resources directly to Bee's Autonomous Flight Engine.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/70 text-xs font-mono text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            <span className="font-bold text-foreground">{servers.filter((s) => s.enabled).length}</span> Servers /{" "}
            <span className="font-bold text-[#FFB22C]">{totalTools}</span> Tools Active
          </div>
          <button
            type="button"
            onClick={onOpenAddServer}
            className="skeuo-button-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            Install MCP Server
          </button>
        </div>
      </div>

      {/* ── Servers Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {servers.map((s) => {
          const isPinging = pingingId === s.id;

          return (
            <div
              key={s.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 relative overflow-hidden ${
                s.enabled
                  ? "skeuo-glass-card border-border/80 shadow-md hover:border-[#FFB22C]/40"
                  : "bg-muted/30 border-border/40 opacity-70"
              }`}
            >
              {/* Highlight refraction */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <div className="space-y-3.5">
                {/* Header: Title + Rocker Toggle Switch */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-card/80 border border-border/70 flex items-center justify-center text-foreground shadow-inner">
                      {s.id === "sandbox_runner" ? (
                        <Terminal className="size-5 text-emerald-500" />
                      ) : s.id === "git_agent" ? (
                        <GitBranch className="size-5 text-[#FFB22C]" />
                      ) : s.id === "code_search" ? (
                        <Search className="size-5 text-purple-400" />
                      ) : s.id === "postgres" ? (
                        <Database className="size-5 text-sky-400" />
                      ) : s.id === "duckduckgo" ? (
                        <Globe className="size-5 text-amber-400" />
                      ) : (
                        <FolderTree className="size-5 text-amber-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm font-mono text-foreground tracking-tight">
                          {s.name}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground border border-border/60">
                          v{s.version}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {s.packageName}
                      </span>
                    </div>
                  </div>

                  {/* Physical Tactile Rocker Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
                      {s.enabled ? "ACTIVE" : "OFF"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleServer(s.id)}
                      className={`relative w-12 h-6 rounded-full transition-all duration-200 p-0.5 cursor-pointer border ${
                        s.enabled
                          ? "bg-[#FFB22C] border-[#FFB22C] shadow-inner shadow-black/20"
                          : "bg-muted/80 border-border/80 shadow-inner"
                      }`}
                      title={s.enabled ? "Disable server" : "Enable server"}
                    >
                      <div
                        className={`size-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                          s.enabled ? "translate-x-6 bg-[#121316]" : "translate-x-0 bg-muted-foreground/60"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {s.description}
                </p>

                {/* Telemetry Bar (Latency, Transport, Env Count) */}
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-card/60 border border-border/60">
                    <span
                      className={`size-1.5 rounded-full ${
                        s.enabled && s.status === "online"
                          ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {s.enabled ? `${s.latencyMs}ms ping` : "Standby"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-card/60 border border-border/60 uppercase">
                    {s.transport}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-card/60 border border-border/60">
                    JSON-RPC 2.0
                  </span>
                  {s.envKeys.length > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-card/60 border border-border/60">
                      {s.envKeys.length} secret{s.envKeys.length > 1 ? "s" : ""} injected
                    </span>
                  )}
                </div>

                {/* Registered Tools Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase font-bold text-muted-foreground">
                    <span>Exported Tools ({s.tools.length}):</span>
                    <span className="text-muted-foreground/60">Click tool to inspect schema</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.tools.map((tool) => (
                      <button
                        key={tool.name}
                        type="button"
                        onClick={() => onSelectTool(tool)}
                        className="px-2.5 py-1 rounded-lg bg-card/80 hover:bg-[#FFB22C]/10 border border-border/80 hover:border-[#FFB22C]/40 text-foreground text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer group/tool"
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            tool.riskLevel === "high"
                              ? "bg-destructive"
                              : tool.riskLevel === "medium"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span>{tool.name}</span>
                        <ChevronRight className="size-2.5 text-muted-foreground group-hover/tool:text-[#FFB22C] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handlePing(s.id)}
                  disabled={isPinging || !s.enabled}
                  className="skeuo-button-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`size-3 text-muted-foreground ${isPinging ? "animate-spin text-[#FFB22C]" : ""}`} />
                  {isPinging ? "Pinging..." : "Test Latency"}
                </button>

                <button
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={() => onSelectTool(s.tools[0])}
                >
                  <span>Inspect All Schemas</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
