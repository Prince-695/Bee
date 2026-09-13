import type { FC } from 'react'
import {
  Bot,
  Database,
  RotateCw,
  ShieldAlert,
  Zap,
} from 'lucide-react'

export const FeatureGrid: FC = () => {
  const features = [
    {
      icon: Bot,
      accent: 'amber',
      tag: 'Worker Swarm',
      title: '6 Undestroyable Specialized Workers',
      description:
        'Instead of an omniscient single-thread prompt, Bee deploys focused workers: Scout maps symbols, Planner formulates DAGs, Builder drafts atomic patches, Verifier tests regressions, Reviewer audits policies, and BrowserWorker synthesizes catch-up briefings.',
      highlights: ['gemini-3.5-flash standard', 'Dynamic persona injection', '1:1 and Swarm modes'],
    },
    {
      icon: Database,
      accent: 'cyan',
      tag: 'Context Engine',
      title: 'Three-Tier Living Memory Graph',
      description:
        'A hybrid semantic retrieval engine (pgvector / SQLite fallback) index that remembers coding preferences, past bug remediation patterns, and real-time working blackboards. Includes a 1-click Forget button for full developer sovereignty.',
      highlights: ['Episodic remediation recall', 'Semantic rule distillation', '1-Click cascade forgetting'],
    },
    {
      icon: ShieldAlert,
      accent: 'rose',
      tag: 'Zero-Trust Security',
      title: 'Interactive Gate Governance & FileGuard',
      description:
        'Privileged operations (shell commands, git modifications, destructive queries) are intercepted into interactive approval gate cards in chat. Strict FileGuard prevents unauthorized reads or edits to .env and credentials.',
      highlights: ['Interactive gate approval cards', 'Strict .env tampering guard', 'Auditable security log'],
    },
    {
      icon: RotateCw,
      accent: 'emerald',
      tag: 'Closed Loop',
      title: 'Autonomous Self-Healing DAG Flights',
      description:
        'When tests fail, Verifier passes execution back to Builder with stack traces and AST context. The swarm executes patch iterations autonomously until all suites pass, preserving code integrity without human intervention.',
      highlights: ['Topological step scheduling', 'Regression guard loops', '100% test pass guarantee'],
    },
  ]

  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Next-Generation Architecture</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Engineered for Autonomous Engineering Excellence
          </h2>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-400">
            Bee Desktop moves beyond simple autocomplete by introducing an autonomous operating system governed by developer-approved gates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/8 bg-[#0c0f17] p-8 transition-all hover:border-white/16 hover:bg-[#0e121c] shadow-lg shadow-black/40"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/4 group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6 text-amber-400" />
                    </div>
                    <span className="rounded-full bg-white/6 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-slate-300 border border-white/8">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/6">
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((item, hIdx) => (
                      <span
                        key={hIdx}
                        className="rounded-lg bg-black/40 px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-white/6"
                      >
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
