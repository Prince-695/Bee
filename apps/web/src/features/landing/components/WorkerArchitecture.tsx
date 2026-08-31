import { Cpu } from "lucide-react";

export function WorkerArchitecture() {
  const workers = [
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
  ];

  return (
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
          {workers.map((worker, wIdx) => (
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
  );
}
