import { useState } from "react";
import { WebNavbar } from "@/layout/WebNavbar";
import { DocsSidebar } from "./components/DocsSidebar";
import { type DocSection, API_ENDPOINTS } from "./content/docsData";
import { Terminal, Download, Key, Shield, Copy, Check } from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("quickstart");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyCode = (code: string, key: string) => {
    void navigator.clipboard.writeText(code);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-white">
      <WebNavbar />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        <DocsSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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
                    onClick={() => copyCode("curl -fsSL https://get.bee.dev | bash", "curl")}
                    className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === "curl" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
                {API_ENDPOINTS.map((ep, eIdx) => (
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
