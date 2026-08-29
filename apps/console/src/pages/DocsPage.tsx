import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Copy,
  Check,
  Terminal,
  Zap,
  Shield,
  Boxes,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  Download,
} from "lucide-react";

type DocSection =
  | "quickstart"
  | "architecture"
  | "mcp-catalog"
  | "approval-gates"
  | "custom-mcp"
  | "api-reference";

interface SectionMeta {
  id: DocSection;
  title: string;
  category: "Getting Started" | "Core Concepts" | "Ecosystem" | "Security & API";
  icon: React.ReactNode;
}

const SECTIONS: SectionMeta[] = [
  { id: "quickstart", title: "Quickstart & Desktop Install", category: "Getting Started", icon: <Download className="w-4 h-4" /> },
  { id: "architecture", title: "Architecture & Self-Healing Loop", category: "Core Concepts", icon: <Cpu className="w-4 h-4" /> },
  { id: "mcp-catalog", title: "Hive MCP Tool Catalog", category: "Ecosystem", icon: <Boxes className="w-4 h-4" /> },
  { id: "approval-gates", title: "Zero-Trust Approval Gates", category: "Security & API", icon: <Shield className="w-4 h-4" /> },
  { id: "custom-mcp", title: "Building Custom MCP Servers", category: "Ecosystem", icon: <Code2 className="w-4 h-4" /> },
  { id: "api-reference", title: "REST & Streaming API Reference", category: "Security & API", icon: <Layers className="w-4 h-4" /> },
];

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<DocSection>("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredSections = SECTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-white">
      {/* ─── Top Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">BEE</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Docs
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs"
            onClick={() => navigate("/")}
          >
            ← Back to Home
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20"
            onClick={() => navigate("/app")}
          >
            Open Console
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </nav>

      {/* ─── Main Docs Workspace ─── */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-72 border-r border-zinc-800/80 p-5 shrink-0 flex flex-col gap-4 bg-zinc-950/40">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/70 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-4 overflow-y-auto">
            {["Getting Started", "Core Concepts", "Ecosystem", "Security & API"].map((cat) => {
              const items = filteredSections.filter((s) => s.category === cat);
              if (!items.length) return null;

              return (
                <div key={cat} className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3">
                    {cat}
                  </span>
                  <div className="space-y-1">
                    {items.map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          activeSection === sec.id
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        }`}
                      >
                        {sec.icon}
                        <span>{sec.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Content Body Area */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl space-y-10 leading-relaxed text-sm text-zinc-300">
          {/* Quickstart Section */}
          {activeSection === "quickstart" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Getting Started
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  Quickstart & Installation Guide
                </h1>
                <p className="text-zinc-400 mt-2">
                  Bee runs as a standalone desktop app on Windows, macOS, and Linux with a local supervised FastAPI sidecar, or as a containerized web cloud service.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  1. Local Repository Development
                </h3>
                <p className="text-xs text-zinc-400">
                  Run Bee locally from source using pnpm and Python 3.11+:
                </p>
                <div className="relative p-3.5 rounded-xl bg-black/90 border border-zinc-800 font-mono text-xs text-zinc-200">
                  <pre>{`# 1. Clone repository
git clone https://github.com/Prince-695/bee.git && cd bee

# 2. Install Node and Python dependencies
pnpm install

# 3. Launch Desktop development shell
pnpm dev:desktop`}</pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `git clone https://github.com/Prince-695/bee.git && cd bee\npnpm install\npnpm dev:desktop`,
                        "git-clone"
                      )
                    }
                    className="absolute right-3 top-3 p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                  >
                    {copiedCode === "git-clone" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  2. Standalone Desktop Binary Packaging
                </h3>
                <p className="text-xs text-zinc-400">
                  Generate installers for your current or target operating system:
                </p>
                <div className="p-3 rounded-xl bg-black/90 border border-zinc-800 font-mono text-xs text-zinc-300">
                  <div># Package for Windows: pnpm package:win</div>
                  <div># Package for Linux:   pnpm package:linux</div>
                  <div># Package for macOS:   pnpm package:mac</div>
                </div>
              </div>
            </div>
          )}

          {/* Architecture & Self-Healing Loop */}
          {activeSection === "architecture" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Core Concepts
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  Architecture & Adaptive Self-Healing Loop
                </h1>
                <p className="text-zinc-400 mt-2">
                  How Bee translates high-level prompts into resilient, deterministic tool graphs that self-remediate when tests or builds fail.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  The Flight Execution Cycle
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-zinc-300">
                  <li><strong className="text-white">Route Compilation:</strong> The LLM analyzes the codebase and outputs a Directed Acyclic Graph (DAG) with explicit dependency step IDs.</li>
                  <li><strong className="text-white">Sandboxed Dispatch:</strong> Steps execute through Model Context Protocol (MCP) servers with process isolation and stdout/stderr capture.</li>
                  <li><strong className="text-white">Adaptive Error Diagnosis:</strong> If an assertion or command fails, the output stack trace is injected into a diagnostic context loop.</li>
                  <li><strong className="text-white">Verification Pass:</strong> The repaired code is automatically re-tested before moving to dependent steps.</li>
                </ol>
              </div>
            </div>
          )}

          {/* MCP Tool Catalog */}
          {activeSection === "mcp-catalog" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Ecosystem
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  Hive MCP Tool Catalog
                </h1>
                <p className="text-zinc-400 mt-2">
                  Built-in developer tools available out-of-the-box for autonomous coding tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { name: "git", tools: ["git_status", "git_diff", "git_commit", "git_create_branch", "git_checkout", "git_log"], desc: "Local repository branch lifecycle, diff tracking, and staged commits." },
                  { name: "sandbox", tools: ["run_command", "run_test_suite", "run_linter", "run_build"], desc: "Test runner for pytest, vitest, ruff, eslint, cargo with exit code feedback." },
                  { name: "code_search", tools: ["code_ripgrep", "code_find_files", "code_view_file"], desc: "Ultra-fast regex symbol indexing across multi-package projects." },
                ].map((item) => (
                  <div key={item.name} className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white capitalize font-mono">[{item.name}] MCP Server</span>
                    </div>
                    <p className="text-xs text-zinc-400">{item.desc}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.tools.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/60 font-mono text-[11px] text-amber-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Zero-Trust Approval Gates */}
          {activeSection === "approval-gates" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Security
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  Zero-Trust Approval Gates
                </h1>
                <p className="text-zinc-400 mt-2">
                  Never allow an autonomous agent to perform critical operations without explicit human authorization.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3 text-xs">
                <p className="text-zinc-300 leading-relaxed">
                  Bee classifies actions into safe read-only tasks (searching code, running local unit tests) and critical operations:
                </p>
                <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-300 space-y-1 font-mono">
                  <div>● git_commit / git_push (Modifying remote git history)</div>
                  <div>● database migration execution</div>
                  <div>● destructive file deletions</div>
                </div>
                <p className="text-zinc-400 mt-2">
                  When a critical action is scheduled, Bee enters <strong className="text-blue-400">Gate Pending</strong> state, streams an alert via SSE, and pauses execution until authorized via <code className="text-amber-400">POST /api/agent/gates/:id/approve</code>.
                </p>
              </div>
            </div>
          )}

          {/* Building Custom MCP Servers */}
          {activeSection === "custom-mcp" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Extensibility
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  Building Custom MCP Servers
                </h1>
                <p className="text-zinc-400 mt-2">
                  Extend Bee with your proprietary internal APIs, cloud providers, and development tools.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-purple-400" />
                  Custom Stdio MCP Example (Python)
                </h3>
                <div className="p-3.5 rounded-xl bg-black/90 border border-zinc-800 font-mono text-xs text-zinc-300">
                  <pre>{`from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my_custom_tool")

@mcp.tool()
def deploy_staging(service_name: str) -> str:
    """Deploy a service to staging environment."""
    return f"Successfully deployed {service_name} to staging."

if __name__ == "__main__":
    mcp.run()`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* REST & Streaming API Reference */}
          {activeSection === "api-reference" && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  API Reference
                </span>
                <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
                  REST & Streaming API Reference
                </h1>
                <p className="text-zinc-400 mt-2">
                  Integrate Bee into your CI/CD pipelines, IDE extensions, and automation scripts.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { method: "POST", path: "/api/agent/route", desc: "Compile a natural language prompt into a DAG Route." },
                  { method: "POST", path: "/api/agent/flight/{route_id}", desc: "Execute a compiled route and return final assistant report." },
                  { method: "GET", path: "/api/agent/flight/{route_id}/stream", desc: "Server-Sent Events (SSE) live step & token stream." },
                  { method: "POST", path: "/api/agent/gates/{gate_id}/approve", desc: "Authorize a pending approval gate action." },
                  { method: "GET", path: "/api/hive/registry", desc: "Query registered MCP servers and available tools." },
                ].map((ep) => (
                  <div key={ep.path} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-start justify-between gap-4 font-mono">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.method === "POST" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                          {ep.method}
                        </span>
                        <span className="text-white font-bold">{ep.path}</span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1.5 font-sans">{ep.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
