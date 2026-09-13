import type { FC } from 'react'
import { useState } from 'react'
import { Clock, ShieldAlert } from 'lucide-react'

export const ApprovalsPage: FC = () => {
  const [gates] = useState([
    {
      id: 'gate-981241',
      tool: 'bash',
      args: { command: 'pytest apps/api/tests -q' },
      risk_level: 'HIGH',
      reason: 'Executing shell commands requires explicit developer approval.',
      status: 'approved',
      worker: 'verifier',
      timestamp: '10 minutes ago',
    },
    {
      id: 'gate-981242',
      tool: 'write_file',
      args: { path: 'services/chat/engine.py' },
      risk_level: 'MEDIUM',
      reason: 'Direct file modification to core services layer.',
      status: 'approved',
      worker: 'builder',
      timestamp: '5 minutes ago',
    },
    {
      id: 'gate-981243',
      tool: 'read_file',
      args: { path: '.env' },
      risk_level: 'CRITICAL',
      reason: 'FileGuard intercepted access to sensitive environment configuration file.',
      status: 'blocked_by_guardrail',
      worker: 'scout',
      timestamp: '2 minutes ago',
    },
  ])

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#080a0f] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Zero-Trust Approval Gates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guardian policy engine enforces strict human-in-the-loop authorization before workers can execute privileged actions.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {gates.map((g) => (
          <div
            key={g.id}
            className="flex flex-col rounded-xl border border-white/8 bg-[#0e121a] p-4.5 shadow-md shadow-black/40"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-semibold text-white">{g.id}</span>
                <span className="text-xs text-slate-400">Worker: <span className="text-slate-200 font-medium capitalize">{g.worker}</span></span>
                <span className="rounded bg-white/4 px-2 py-0.5 text-[10px] font-mono text-slate-300">Tool: {g.tool}</span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
                  g.status === 'approved'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : g.status === 'blocked_by_guardrail'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}
              >
                {g.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-2">{g.reason}</p>

            <div className="rounded-lg border border-white/6 bg-black/40 p-2.5 font-mono text-[11px] text-amber-300/90 overflow-x-auto mb-2">
              {JSON.stringify(g.args)}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/6">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {g.timestamp}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                Risk Tier: <span className={g.risk_level === 'CRITICAL' ? 'text-rose-400 font-semibold' : 'text-amber-400'}>{g.risk_level}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
