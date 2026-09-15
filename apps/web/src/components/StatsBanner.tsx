import type { FC } from 'react'
import { Bot, CheckCircle2, Database, ShieldCheck } from 'lucide-react'

export const StatsBanner: FC = () => {
  const stats = [
    {
      icon: Bot,
      value: '6',
      label: 'Specialized Undestroyable Workers',
      subtext: 'Scout, Builder, Verifier, Reviewer, Planner, Browser',
    },
    {
      icon: Database,
      value: '3-Tier',
      label: 'Living Context Memory Graph',
      subtext: 'Episodic runs, Semantic rules, Working blackboards',
    },
    {
      icon: ShieldCheck,
      value: '0-Trust',
      label: 'Guardian Security Approval Gates',
      subtext: 'Intercepts bash commands, protects .env from tampering',
    },
    {
      icon: CheckCircle2,
      value: '100%',
      label: 'Self-Healing Test Pass Rate',
      subtext: '136/136 test suite coverage in continuous CI',
    },
  ]

  return (
    <section className="border-y border-white/8 bg-[#0a0d14]/70 py-12 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className="flex flex-col items-start border-l border-white/10 pl-6">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-5 w-5 text-amber-400" />
                  <span className="text-3xl font-extrabold tracking-tight text-white">{stat.value}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200">{stat.label}</div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{stat.subtext}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
