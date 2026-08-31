import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Play,
  Download,
  BookOpen,
  Cpu,
  Copy,
  Check,
} from "lucide-react";
import {
  detectUserOS,
  triggerDirectDownload,
  DOWNLOAD_OPTIONS,
  type DownloadOption,
  type SupportedOS,
} from "@/lib/downloads";
import { PricingSection } from "@/components/landing/PricingSection";
import { RoiCalculator } from "@/components/landing/RoiCalculator";
import { FaqSection } from "@/components/landing/FaqSection";
import { InteractiveFlightDemo } from "@/components/landing/InteractiveFlightDemo";

export default function LandingPage() {
  const navigate = useNavigate();
  const [detectedOS, setDetectedOS] = useState<DownloadOption>(DOWNLOAD_OPTIONS["windows"]);
  const [copiedCli, setCopiedCli] = useState(false);

  useEffect(() => {
    setDetectedOS(detectUserOS());
  }, []);

  const handlePrimaryDownload = () => {
    triggerDirectDownload(detectedOS);
  };

  const handleDownloadSpecific = (osKey: SupportedOS) => {
    triggerDirectDownload(DOWNLOAD_OPTIONS[osKey]);
  };

  const copyInstallCmd = () => {
    navigator.clipboard.writeText("curl -fsSL https://get.bee.dev | bash");
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      {/* ─── Ambient Glow Background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-purple-500/5 blur-[160px] rounded-full" />
        <div className="absolute top-[1400px] -right-40 w-[600px] h-[600px] bg-blue-500/5 blur-[160px] rounded-full" />
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
            <a href="#pricing" className="hover:text-zinc-200 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
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
      <section className="relative pt-20 pb-16 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-400 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Bee 0.1.0 Cross-Platform Desktop & Cloud Available</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
            The Autonomous AI Co-Engineer for{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              Production Codebases.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Bee coordinates 5 specialized AI workers across your repository, fixes broken tests in sandboxes,
            redacts secrets automatically, and verifies human approvals on WhatsApp & Slack.
          </p>

          {/* Download & Launch Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-black font-bold text-sm shadow-xl shadow-amber-500/25 flex items-center gap-2"
              onClick={handlePrimaryDownload}
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              Direct Download for {detectedOS.osName} ({detectedOS.fileExt})
            </Button>

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

          {/* Quick CLI copy & OS selector */}
          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <div
              onClick={copyInstallCmd}
              className="px-4 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 transition-colors inline-flex items-center gap-2 font-mono text-xs text-zinc-400 cursor-pointer"
            >
              <span className="text-amber-400">$</span>
              <span>curl -fsSL https://get.bee.dev | bash</span>
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-500">
              <span>Also available for:</span>
              {Object.values(DOWNLOAD_OPTIONS).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDownloadSpecific(opt.id)}
                  className="px-2.5 py-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/40 hover:text-amber-400 transition-all font-mono text-[11px] text-zinc-400 cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-zinc-500" />
                  {opt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Live Flight Simulator Demo */}
          <div className="pt-8 max-w-4xl mx-auto">
            <InteractiveFlightDemo />
          </div>
        </div>
      </section>

      {/* ─── 5-Worker Role Architecture Section ─── */}
      <section id="architecture" className="py-24 px-6 relative z-10 border-t border-zinc-800/80 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
              <Cpu className="w-3.5 h-3.5" />
              Autonomous Multi-Worker Orchestration
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              5 Specialized Workers. 1 Unified Flight Pipeline.
            </h2>
            <p className="text-xs md:text-sm text-zinc-400">
              Unlike basic autocomplete copilots, Bee deploys specialized autonomous workers executing a deterministic DAG.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                role: "1. Inspector",
                color: "text-blue-400",
                border: "border-blue-500/30",
                bg: "bg-blue-500/5",
                desc: "Explores repository AST, symbol call-graphs, and diffs with ripgrep.",
              },
              {
                role: "2. Tester",
                color: "text-purple-400",
                border: "border-purple-500/30",
                bg: "bg-purple-500/5",
                desc: "Runs local test suites (pytest/vitest) inside isolated sandbox runners.",
              },
              {
                role: "3. Fixer",
                color: "text-amber-400",
                border: "border-amber-500/30",
                bg: "bg-amber-500/5",
                desc: "Synthesizes code repairs and re-runs test assertions until green.",
              },
              {
                role: "4. Guard",
                color: "text-emerald-400",
                border: "border-emerald-500/30",
                bg: "bg-emerald-500/5",
                desc: "Enforces zero-trust safety gates and halts before destructive actions.",
              },
              {
                role: "5. Scribe",
                color: "text-pink-400",
                border: "border-pink-500/30",
                bg: "bg-pink-500/5",
                desc: "Generates clear evidence-based summaries, audit logs, and PR comments.",
              },
            ].map((worker, wIdx) => (
              <div
                key={wIdx}
                className={`p-5 rounded-2xl border ${worker.border} ${worker.bg} space-y-2`}
              >
                <div className={`font-mono font-bold text-xs ${worker.color}`}>{worker.role}</div>
                <p className="text-xs text-zinc-400 leading-relaxed">{worker.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive ROI Calculator ─── */}
      <RoiCalculator />

      {/* ─── Transparent SaaS Pricing Matrix ─── */}
      <PricingSection />

      {/* ─── Interactive FAQ ─── */}
      <FaqSection />

      {/* ─── Footer ─── */}
      <footer className="py-12 px-6 border-t border-zinc-800 bg-black/80 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center text-black font-black text-xs">
              B
            </div>
            <span className="text-zinc-300 font-semibold">Bee Autonomous AI Co-Engineer</span>
            <span>© 2026 Bee Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
            <a href="https://github.com/Prince-695/Bee" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <a href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-zinc-300 transition-colors">FAQ</a>
            <Link to="/app" className="hover:text-amber-400 transition-colors font-semibold">Launch App →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
