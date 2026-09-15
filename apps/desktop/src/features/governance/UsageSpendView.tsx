import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Activity, Coins, Cpu, RefreshCw } from 'lucide-react'

interface SpendData {
  total_prompt_tokens: number
  total_completion_tokens: number
  total_tokens: number
  total_cost_usd: number
}

interface UsageRecord {
  id?: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  created_at?: string
  flight_id?: string
}

export const UsageSpendView: FC = () => {
  const [spend, setSpend] = useState<SpendData>({
    total_prompt_tokens: 0,
    total_completion_tokens: 0,
    total_tokens: 0,
    total_cost_usd: 0,
  })
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [reloadCounter, setReloadCounter] = useState(0)

  useEffect(() => {
    let ignore = false
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const [spendRes, recRes] = await Promise.all([
          fetch('/v1/usage/spend', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/v1/usage/records?limit=25', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (!ignore && spendRes.ok) {
          const data = await spendRes.json()
          setSpend({
            total_prompt_tokens: data.total_prompt_tokens || 0,
            total_completion_tokens: data.total_completion_tokens || 0,
            total_tokens: data.total_tokens || 0,
            total_cost_usd: data.total_cost_usd || 0,
          })
        }

        if (!ignore && recRes.ok) {
          const data = await recRes.json()
          setRecords(data.records || [])
        }
      } catch (err) {
        console.error('Failed to load usage and spend telemetry', err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    fetchUsage()
    return () => {
      ignore = true
    }
  }, [reloadCounter])

  const handleRefresh = () => {
    setLoading(true)
    setReloadCounter((c) => c + 1)
  }

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/8 bg-[#0e121b] p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Token Usage</span>
            <Coins className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white">
            {formatNumber(spend.total_tokens)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
            <span>Prompt: {formatNumber(spend.total_prompt_tokens)}</span>
            <span>•</span>
            <span>Completion: {formatNumber(spend.total_completion_tokens)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#0e121b] p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Estimated Spend</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
            ${spend.total_cost_usd.toFixed(4)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Real-time multi-model inference metering
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#0e121b] p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Flight Operations</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white">
            {records.length} Recorded
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Across DAG and Chat Worker executions
          </div>
        </div>

        <div className="rounded-xl border border-white/8 bg-[#0e121b] p-4 shadow-lg shadow-black/40">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Default Model Tier</span>
            <Cpu className="h-4 w-4 text-violet-400" />
          </div>
          <div className="mt-2 text-xl font-bold tracking-tight text-white truncate">
            Gemini 2.0 Flash
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Fast latency + Claude 3.7 fallback
          </div>
        </div>
      </div>

      {/* Model Breakdown Cards */}
      <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
        <h3 className="text-sm font-semibold text-white">Supported Execution Engines</h3>
        <p className="mt-0.5 text-xs text-slate-400">
          Dynamic model routing across lightweight fast reasoning and heavy patch synthesis
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/5 bg-black/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Gemini 2.0 Flash</span>
              <span className="rounded bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 text-[9px] font-mono">Default</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Ultra-fast DAG step orchestration, Scout symbol indexing, and real-time chat turns.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">Claude 3.7 Sonnet</span>
              <span className="rounded bg-amber-500/15 text-amber-400 px-1.5 py-0.5 text-[9px] font-mono">Specialist</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              High-depth architecture refactoring, complex bug deduplication, and code generation.
            </p>
          </div>

          <div className="rounded-lg border border-white/5 bg-black/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-white">GPT-4o</span>
              <span className="rounded bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 text-[9px] font-mono">Multimodal</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Diagram and UI screenshot verification, API contract validation, and documentation.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Usage Records Table */}
      <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Execution Metering Records</h3>
            <p className="text-xs text-slate-400">Itemized inference token events</p>
          </div>
          <button
            onClick={handleRefresh}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {records.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No usage records found. Run flights or missions to view real-time telemetry.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-2.5 font-medium">Model</th>
                  <th className="pb-2.5 font-medium">Prompt Tokens</th>
                  <th className="pb-2.5 font-medium">Completion Tokens</th>
                  <th className="pb-2.5 font-medium">Cost (USD)</th>
                  <th className="pb-2.5 font-medium">Flight ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                {records.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-white/2">
                    <td className="py-2.5 text-white font-sans">{r.model}</td>
                    <td className="py-2.5 text-slate-300">{formatNumber(r.prompt_tokens)}</td>
                    <td className="py-2.5 text-slate-300">{formatNumber(r.completion_tokens)}</td>
                    <td className="py-2.5 text-emerald-400">${(r.cost_usd || 0).toFixed(5)}</td>
                    <td className="py-2.5 text-slate-500 text-[11px]">{r.flight_id || 'chat_worker'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
