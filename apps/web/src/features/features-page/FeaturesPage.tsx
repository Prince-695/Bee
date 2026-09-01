import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { WorkerAccordion } from "@/features/landing/WorkerAccordion";
import { LiveAgentWidget } from "@/features/landing/LiveAgentWidget";
import { Lock, Terminal, Smartphone, Database, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FeaturesPage() {
  const securityFeatures = [
    {
      icon: <Lock className="w-5 h-5 text-amber-400" />,
      title: "Zero-Leak Secret Redaction",
      desc: "Automatically detects and scrubs API keys, JWT secrets, and bearer headers before sending prompts to external LLMs.",
    },
    {
      icon: <Smartphone className="w-5 h-5 text-amber-400" />,
      title: "Mobile WhatsApp Approvals",
      desc: "High-risk file modifications or database mutations halt at Zero-Trust approval gates, sending 1-click mobile verification buttons.",
    },
    {
      icon: <Terminal className="w-5 h-5 text-amber-400" />,
      title: "Isolated Sandbox Execution",
      desc: "Runs compiler and test loops inside ephemeral, secure sandboxes to prevent corrupted developer working directories.",
    },
    {
      icon: <Database className="w-5 h-5 text-amber-400" />,
      title: "Persistent Episodic Memory",
      desc: "Neon PostgreSQL with pgvector remembers past verified bug fixes to instantly solve similar compiler regressions in future flights.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-white font-sans">
      <WebNavbar />

      <main className="pt-28 pb-20">
        <div className="py-16 px-6 max-w-5xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Features & Capabilities
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Designed for Reliability,
            <br />
            <span className="text-amber-400">Engineered for Safety.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Explore the 5 specialized worker personas, FastMCP tool registry, and zero-trust security infrastructure powering Bee.
          </p>
        </div>

        <WorkerAccordion />

        <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
          <div className="border-b border-zinc-800 pb-8 text-center sm:text-left">
            <h2 className="text-3xl font-black text-white">Zero-Trust Security & Control</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">Enterprise-grade safety guardrails built into every autonomous flight.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((f, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4 hover:border-amber-500/40 transition-colors"
              >
                <div className="p-3 rounded-2xl bg-zinc-800 w-fit">{f.icon}</div>
                <h3 className="text-xl font-bold text-white">{f.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 px-6 max-w-5xl mx-auto">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-amber-500/40 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Ready to automate your developer workflow?</h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">Start with 50 free autonomous flights every month. No credit card required.</p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-all shadow-xl shadow-amber-500/20 hover:scale-105"
            >
              Start Free Flight <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <LiveAgentWidget />
      <WebFooter />
    </div>
  );
}
