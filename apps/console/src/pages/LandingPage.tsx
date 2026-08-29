import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Play,
  Download,
  Boxes,
  RotateCcw,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import {
  detectUserOS,
  triggerDirectDownload,
  DOWNLOAD_OPTIONS,
  type DownloadOption,
  type SupportedOS,
} from "@/lib/downloads";

export default function LandingPage() {
  const navigate = useNavigate();
  const [detectedOS, setDetectedOS] = useState<DownloadOption>(DOWNLOAD_OPTIONS["windows"]);
  const [showAllDownloads, setShowAllDownloads] = useState(false);
  const [activeTab, setActiveTab] = useState<"terminal" | "dag" | "healer">("terminal");
  const activePrompt = "Run vitest auth suite, inspect failures with ripgrep, and auto-heal assertions";

  useEffect(() => {
    setDetectedOS(detectUserOS());
  }, []);

  const handlePrimaryDownload = () => {
    triggerDirectDownload(detectedOS);
  };

  const handleDownloadSpecific = (osKey: SupportedOS) => {
    triggerDirectDownload(DOWNLOAD_OPTIONS[osKey]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      {/* ─── Ambient Glow Background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[600px] -left-40 w-[600px] h-[600px] bg-purple-500/5 blur-[160px] rounded-full" />
        <div className="absolute top-[900px] -right-40 w-[600px] h-[600px] bg-blue-500/5 blur-[160px] rounded-full" />
      </div>

      {/* ─── Sticky Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4.5 h-4.5 text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">BEE</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v0.1.0
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
            <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-zinc-200 transition-colors">Architecture</a>
            <a href="#downloads" className="hover:text-zinc-200 transition-colors">Downloads</a>
            <Link to="/docs" className="hover:text-amber-400 transition-colors flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs hidden sm:inline-flex"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 px-4"
              onClick={() => navigate("/app")}
            >
              Launch Console
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-20 pb-20 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Bee 0.1.0 Cross-Platform Desktop & Cloud Available</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
            The Autonomous AI Co-Engineer for{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              Production Codebases.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Bee creates multi-step Flights across your developer tools, executes tests in sandboxes,
            self-heals broken code, and requires human authorization for critical actions.
          </p>

          {/* Download & Launch Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {/* Primary Direct Download */}
            <div className="relative inline-flex items-center">
              <Button
                size="lg"
                className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2"
                onClick={handlePrimaryDownload}
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Direct Download for {detectedOS.osName} ({detectedOS.fileExt})
              </Button>

              <button
                onClick={() => setShowAllDownloads(!showAllDownloads)}
                className="h-12 px-3 rounded-r-xl bg-amber-600 hover:bg-amber-700 text-black border-l border-amber-400/40 flex items-center justify-center cursor-pointer transition-colors"
                title="Select other operating systems"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAllDownloads ? "rotate-180" : ""}`} />
              </button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-sm font-semibold flex items-center gap-2"
              onClick={() => navigate("/app")}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Open Cloud Workspace
            </Button>
          </div>

          {/* Quick OS Pills Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500 mb-12">
            <span>Also available for:</span>
            {Object.values(DOWNLOAD_OPTIONS).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleDownloadSpecific(opt.id)}
                className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/40 hover:text-amber-400 transition-all font-mono text-[11px] text-zinc-400 cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-zinc-500" />
                {opt.name}
              </button>
            ))}
          </div>

          {/* ─── Interactive Hero Visualizer Terminal ─── */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
            {/* Terminal Header */}
            <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-zinc-400 ml-2">bee-mission-control :: flight-9021</span>
              </div>

              <div className="flex items-center gap-1.5">
                {(["terminal", "dag", "healer"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      activeTab === tab
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-6 font-mono text-xs space-y-3 bg-black/80 min-h-[260px]">
              {activeTab === "terminal" && (
                <>
                  <div className="text-zinc-500 flex items-center gap-2">
                    <span className="text-amber-400">➜</span>
                    <span className="text-zinc-300">{activePrompt}</span>
                  </div>
                  <div className="text-zinc-400">[PLANNER] Route compiled: 4 DAG steps across [sandbox, code_search, git]</div>
                  <div className="text-emerald-400">[STEP 1] ▶️ sandbox.run_test_suite(cmd="vitest auth.test.ts") → 1 failed assertion</div>
                  <div className="text-cyan-400">[SELF-HEAL] ⚡ Diagnosing assertion failure in AuthProvider.ts:L42...</div>
                  <div className="text-zinc-300">[STEP 2] ▶️ code_search.code_ripgrep(query="validateSessionToken") → 3 occurrences</div>
                  <div className="text-emerald-400">[STEP 3] ▶️ sandbox.run_test_suite(cmd="vitest auth.test.ts") → ✅ 14/14 tests passing</div>
                  <div className="text-blue-400 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    <span>[APPROVAL GATE] Pending authorization for git.git_commit("fix(auth): correct token validation logic")</span>
                  </div>
                </>
              )}

              {activeTab === "dag" && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                    <span className="text-emerald-400">Step 1: sandbox.run_test_suite</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Complete (Self-Healed)</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                    <span className="text-emerald-400">Step 2: code_search.code_ripgrep</span>
                    <span className="text-[10px] font-bold uppercase text-emerald-400">Complete</span>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 flex items-center justify-between animate-pulse">
                    <span className="text-blue-400">Step 3: git.git_commit</span>
                    <span className="text-[10px] font-bold uppercase text-blue-400">Approval Gate Pending</span>
                  </div>
                </div>
              )}

              {activeTab === "healer" && (
                <div className="space-y-2 text-zinc-300 leading-relaxed">
                  <div className="text-amber-400 font-bold">Self-Healing Execution Cycle:</div>
                  <div className="text-zinc-400">1. Step output inspected for failure signatures & exit codes</div>
                  <div className="text-zinc-400">2. Error context parsed and injected into diagnostic LLM prompt</div>
                  <div className="text-zinc-400">3. Remediation executed and validated via sandbox runner</div>
                  <div className="text-emerald-400 font-semibold">Result: 0 human intervention required for routine fixes.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Core Architecture & Flow ─── */}
      <section id="architecture" className="py-20 px-6 border-t border-zinc-900 bg-zinc-950/60 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              Deterministic & Resilient
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              How Bee Autonomous Flights Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                step: "01",
                title: "Intent & DAG Planning",
                desc: "LLM compiler translates natural language goals into a structured DAG of tool executions.",
                icon: <Zap className="w-5 h-5 text-amber-400" />,
              },
              {
                step: "02",
                title: "Hive MCP Tool Dispatch",
                desc: "Local sandbox, Git, and search tools execute deterministically with exit code capturing.",
                icon: <Boxes className="w-5 h-5 text-emerald-400" />,
              },
              {
                step: "03",
                title: "Self-Healing Loop",
                desc: "Failures trigger diagnostic reflection, automated code repair, and verification test runs.",
                icon: <RotateCcw className="w-5 h-5 text-cyan-400" />,
              },
              {
                step: "04",
                title: "Zero-Trust Approval Gate",
                desc: "Destructive actions (commits, pushes, migrations) require 1-click human authorization.",
                icon: <Shield className="w-5 h-5 text-blue-400" />,
              },
            ].map((card) => (
              <div
                key={card.step}
                className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-amber-400">{card.step}</span>
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
                      {card.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Direct Platform Downloads Section ─── */}
      <section id="downloads" className="py-20 px-6 border-t border-zinc-900 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              Desktop Binaries
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Download Bee for Your Operating System
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Cross-platform desktop application powered by React 19 and supervised Python FastAPI sidecar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Windows Card */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Windows</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">x64</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">
                  Windows 10 / 11 64-bit installer with automated background updates and Python supervisor.
                </p>
                <div className="space-y-2 text-xs font-mono text-zinc-500 mb-6">
                  <div>Package: NSIS Installer (.exe)</div>
                  <div>Version: 0.1.0</div>
                </div>
              </div>
              <Button
                className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                onClick={() => handleDownloadSpecific("windows")}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Direct Download (.exe)
              </Button>
            </div>

            {/* macOS Card */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">macOS</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Universal</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">
                  Native macOS application for Apple Silicon (M1/M2/M3/M4) and Intel x64 architectures.
                </p>
                <div className="space-y-2 text-xs font-mono text-zinc-500 mb-6">
                  <div>Package: Disk Image (.dmg)</div>
                  <div>Arch: Apple Silicon / Intel</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                  onClick={() => handleDownloadSpecific("mac-arm64")}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Apple Silicon
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-zinc-700 text-zinc-300 text-xs"
                  onClick={() => handleDownloadSpecific("mac-x64")}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Intel
                </Button>
              </div>
            </div>

            {/* Linux Card */}
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 transition-all">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Linux</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">x86_64</span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">
                  Universal AppImage standalone package and Debian/Ubuntu (.deb) distribution.
                </p>
                <div className="space-y-2 text-xs font-mono text-zinc-500 mb-6">
                  <div>Package: AppImage / .deb</div>
                  <div>Compatible: Ubuntu, Fedora, Arch</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                  onClick={() => handleDownloadSpecific("linux-appimage")}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  AppImage
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl border-zinc-700 text-zinc-300 text-xs"
                  onClick={() => handleDownloadSpecific("linux-deb")}
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  .deb
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-zinc-900 py-12 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm text-white">BEE — Autonomous AI Co-Engineer</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link to="/docs" className="hover:text-zinc-300">Documentation</Link>
            <a href="#downloads" className="hover:text-zinc-300">Downloads</a>
            <Link to="/app" className="hover:text-zinc-300">Web Console</Link>
            <a href="https://github.com/Prince-695/bee" target="_blank" rel="noreferrer" className="hover:text-zinc-300">
              GitHub
            </a>
          </div>

          <div className="text-xs text-zinc-600">
            © 2026 Bee. Open autonomous engineering platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
