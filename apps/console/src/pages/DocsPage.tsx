import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Search,
  Copy,
  Check,
  Terminal,
  Shield,
  Boxes,
  Cpu,
  Layers,
  ArrowRight,
  Download,
  Key,
  DollarSign,
} from "lucide-react";

type DocSection =
  | "quickstart"
  | "architecture"
  | "oauth-connectors"
  | "mcp-catalog"
  | "approval-gates"
  | "security-budget"
  | "api-reference";

interface SectionMeta {
  id: DocSection;
  title: string;
  category: "Getting Started" | "Core Concepts" | "Ecosystem" | "Security & API";
  icon: React.ReactNode;
}

const SECTIONS: SectionMeta[] = [
  { id: "quickstart", title: "Quickstart & Desktop Install", category: "Getting Started", icon: <Download className="w-4 h-4" /> },
  { id: "oauth-connectors", title: "1-Click OAuth Connectors", category: "Getting Started", icon: <Key className="w-4 h-4" /> },
  { id: "architecture", title: "5-Worker DAG & Self-Healing Loop", category: "Core Concepts", icon: <Cpu className="w-4 h-4" /> },
  { id: "mcp-catalog", title: "Hive MCP Tool Catalog", category: "Ecosystem", icon: <Boxes className="w-4 h-4" /> },
  { id: "approval-gates", title: "Zero-Trust & WhatsApp Approvals", category: "Security & API", icon: <Shield className="w-4 h-4" /> },
  { id: "security-budget", title: "Zero-Leak Redaction & Budgeting", category: "Security & API", icon: <DollarSign className="w-4 h-4" /> },
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
                Documentation Hub
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
        <aside className="w-full md:w-72 border-r border-zinc-800/80 p-5 space-y-6 shrink-0 bg-zinc-950/40">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-amber-500/50"
            />
          </div>

          {/* Navigation Links Grouped by Category */}
          <div className="space-y-4">
            {["Getting Started", "Core Concepts", "Ecosystem", "Security & API"].map((cat) => {
              const catSections = filteredSections.filter((s) => s.category === cat);
              if (catSections.length === 0) return null;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-2.5">
                    {cat}
                  </div>
                  {catSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        activeSection === s.id
                          ? "bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                    >
                      <span className={activeSection === s.id ? "text-amber-400" : "text-zinc-500"}>
                        {s.icon}
                      </span>
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-4xl space-y-10">
          {/* Quickstart */}
          {activeSection === "quickstart" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Getting Started</div>
                <h1 className="text-3xl font-black text-white tracking-tight">Quickstart & Desktop Installation</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Install Bee natively on Windows, macOS, or Linux, or launch the cloud console in your browser.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  1-Line Terminal Install (macOS / Linux)
                </h3>
                <div className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 p-4 font-mono text-xs text-zinc-300">
                  <span>curl -fsSL https://get.bee.dev | bash</span>
                  <button
                    onClick={() => copyToClipboard("curl -fsSL https://get.bee.dev | bash", "curl-install")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {copiedCode === "curl-install" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  Direct Native Installers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                    <div className="text-xs font-bold text-white">Windows</div>
                    <p className="text-[11px] text-zinc-400">Standalone `.exe` NSIS installer</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                    <div className="text-xs font-bold text-white">macOS</div>
                    <p className="text-[11px] text-zinc-400">Universal `.dmg` (Apple Silicon & Intel)</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
                    <div className="text-xs font-bold text-white">Linux</div>
                    <p className="text-[11px] text-zinc-400">Portable `.AppImage` and `.deb`</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1-Click OAuth */}
          {activeSection === "oauth-connectors" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Zero-Config Usability</div>
                <h1 className="text-3xl font-black text-white tracking-tight">1-Click OAuth Tool Connectors</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Connect developer platforms without configuring complex environment variables or copying raw API tokens.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" /> How 1-Click Authorization Works
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  In the <strong>Hive Registry</strong>, click <strong>"Connect with GitHub"</strong> or <strong>"Connect with Google"</strong>. A secure OAuth 2.0 popup opens requesting permission. Upon authorization, tokens are stored locally in the encrypted SQLite `user_connectors` database table using AES-256.
                </p>
              </div>
            </div>
          )}

          {/* 5-Worker DAG Architecture */}
          {activeSection === "architecture" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Core Architecture</div>
                <h1 className="text-3xl font-black text-white tracking-tight">5-Worker DAG & Self-Healing Loop</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Deterministic task planning and automated error repair across sandboxed execution environments.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-1">
                  <span className="text-xs font-bold text-blue-400 font-mono">1. Scout & Inspector</span>
                  <p className="text-xs text-zinc-400">Searches repository files, extracts AST symbols, and traces call-graphs.</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-1">
                  <span className="text-xs font-bold text-purple-400 font-mono">2. Tester</span>
                  <p className="text-xs text-zinc-400">Executes pytest or vitest test suites inside isolated sandbox runner containers.</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-1">
                  <span className="text-xs font-bold text-amber-400 font-mono">3. Fixer</span>
                  <p className="text-xs text-zinc-400">Applies code patches and executes the self-healing retry loop until all tests pass.</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-1">
                  <span className="text-xs font-bold text-emerald-400 font-mono">4. Guard</span>
                  <p className="text-xs text-zinc-400">Intercepts dangerous operations (git_push, database migrations) with approval gates.</p>
                </div>
                <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-1">
                  <span className="text-xs font-bold text-pink-400 font-mono">5. Scribe</span>
                  <p className="text-xs text-zinc-400">Compiles evidence-based markdown walkthroughs and PR comments.</p>
                </div>
              </div>
            </div>
          )}

          {/* Zero-Trust Approvals */}
          {activeSection === "approval-gates" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Safety & Governance</div>
                <h1 className="text-3xl font-black text-white tracking-tight">Zero-Trust & WhatsApp Approvals</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Keep human engineers in full control with instant 1-click mobile authorization.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 space-y-3">
                <div className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Multi-Channel Safety Policy
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  When Bee triggers a critical action (such as pushing code to GitHub or running production migrations), the flight halts in `waiting_for_approval` state. An alert with <strong>[Authorize Action]</strong> and <strong>[Reject]</strong> interactive buttons is instantly pushed to your Desktop Attention Center, WhatsApp, and Slack.
                </p>
              </div>
            </div>
          )}

          {/* Security & Budgeting */}
          {activeSection === "security-budget" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">Enterprise Security</div>
                <h1 className="text-3xl font-black text-white tracking-tight">Zero-Leak Redaction & Token Budgeting</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Automated PII scrubbing and precise USD token cost telemetry.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-3">
                <div className="font-bold text-xs text-amber-400">Redacted Secret Types</div>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc pl-4 font-mono">
                  <li>OpenAI Keys (`sk-...`)</li>
                  <li>GitHub Tokens (`ghp_...`, `gho_...`, `ghs_...`)</li>
                  <li>Slack Bot & User Tokens (`xoxb-...`, `xoxp-...`)</li>
                  <li>AWS Access & Secret Keys</li>
                  <li>Database URIs (`postgres://`, `mongodb://`)</li>
                </ul>
              </div>
            </div>
          )}

          {/* API Reference */}
          {activeSection === "api-reference" && (
            <div className="space-y-8 animate-fadeIn">
              <div>
                <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">API Documentation</div>
                <h1 className="text-3xl font-black text-white tracking-tight">REST & Streaming API Reference</h1>
                <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                  Integrate Bee into your CI/CD pipelines, internal developer portals, and Slack bots.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { method: "POST", path: "/api/agent/route", desc: "Compile objective into a deterministic DAG of tool steps" },
                  { method: "POST", path: "/api/agent/flight", desc: "Execute flight steps with self-healing error recovery" },
                  { method: "GET", path: "/api/agent/gates", desc: "List pending human approval gates" },
                  { method: "POST", path: "/api/agent/gates/:id/approve", desc: "Authorize a pending approval gate" },
                  { method: "POST", path: "/api/missions", desc: "Create a 5-worker autonomous engineering mission" },
                  { method: "GET", path: "/api/security/spend", desc: "Get total token consumption and flight USD cost" },
                  { method: "POST", path: "/webhooks/github", desc: "Ingest GitHub PR and push events" },
                  { method: "POST", path: "/webhooks/whatsapp", desc: "Resolve interactive 1-click mobile approval buttons" },
                ].map((ep, eIdx) => (
                  <div key={eIdx} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between gap-4 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded font-bold ${ep.method === "POST" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                        {ep.method}
                      </span>
                      <span className="text-zinc-200">{ep.path}</span>
                    </div>
                    <span className="text-zinc-400 font-sans text-[11px] hidden sm:inline">{ep.desc}</span>
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
