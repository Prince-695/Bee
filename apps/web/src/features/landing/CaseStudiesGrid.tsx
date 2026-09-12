import { ArrowUpRight, CheckCircle2, GitPullRequest, ShieldAlert, Cpu } from "lucide-react";
import { Link } from "react-router-dom";

export function CaseStudiesGrid() {
  const cases = [
    {
      tag: "CI/CD Auto-Healing",
      title: "Fixing Flaky Pytest OAuth Session Expiry",
      desc: "Scout ingested error logs from GitHub Actions -> Fixer modified token rotation logic in isolated sandbox -> Tester synthesized 6 new edge-case tests -> Gatekeeper alerted tech lead on WhatsApp.",
      impact: "Zero developer interruptions • Fixed in 38s",
      badge: "PR #108 Merged",
      icon: <GitPullRequest className="w-5 h-5 text-amber-400" />,
      gradient: "from-amber-500/10 to-transparent",
    },
    {
      tag: "Security Vulnerability Patch",
      title: "CVE-2026-8812 JWT Algorithm Confusion",
      desc: "Triggered via Sentry webhook signal -> Architect planned non-breaking crypto upgrade -> Fixer verified backward compatibility -> SecretRedactor scrubbed credentials before PR creation.",
      impact: "100% test pass • Zero breaking changes",
      badge: "Security Gate Cleared",
      icon: <ShieldAlert className="w-5 h-5 text-emerald-400" />,
      gradient: "from-emerald-500/10 to-transparent",
    },
    {
      tag: "Database Schema Migration",
      title: "Neon Postgres pgvector Semantic AST Indexing",
      desc: "Indexed 45,000 lines of TypeScript & Python code into 768-dim embeddings. Enabled natural language code search across entire repository with sub-millisecond retrieval.",
      impact: "10x faster symbol localization",
      badge: "Vector Memory Active",
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      gradient: "from-cyan-500/10 to-transparent",
    },
  ];

  return (
    <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Real Autonomous Missions
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4">
            Proven Flight Records.
            <br />
            <span className="text-zinc-500 font-normal">Autonomous PRs shipped to production.</span>
          </h2>
        </div>

        <Link
          to="/signup"
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
        >
          View Live Telemetry <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Case Studies 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cases.map((c, idx) => (
          <div
            key={idx}
            className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-7 flex flex-col justify-between space-y-6 hover:border-amber-500/50 hover:bg-zinc-900/90 transition-all duration-300 shadow-xl group relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-50 pointer-events-none`} />

            <div className="space-y-4 z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {c.tag}
                </span>
                <div className="p-2 rounded-xl bg-zinc-800/80 text-amber-400">
                  {c.icon}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight leading-snug group-hover:text-amber-400 transition-colors">
                {c.title}
              </h3>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {c.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between z-10 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> {c.impact}
              </span>
              <span className="font-mono text-[10px] text-zinc-500 font-bold px-2 py-0.5 rounded bg-zinc-800">
                {c.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
