import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Bot, Check, CheckSquare, Save, Square, X } from 'lucide-react'
import type { Integration } from './IntegrationCard'

interface WorkerProvisioningModalProps {
  integration?: Integration | null
  onClose: () => void
}

interface WorkerSummary {
  id: string
  name: string
  role: string
}

interface CatalogTool {
  name: string
  server_name: string
  category: string
  description: string
  execution_scope: 'LOCAL' | 'CLOUD' | 'HYBRID'
  is_allowed: boolean
}

export const WorkerProvisioningModal: FC<WorkerProvisioningModalProps> = ({
  integration,
  onClose,
}) => {
  const workers: WorkerSummary[] = [
    { id: 'scout', name: 'Scout', role: 'Codebase Explorer & AST Indexer' },
    { id: 'planner', name: 'Planner', role: 'Strategy & DAG Decomposer' },
    { id: 'builder', name: 'Builder', role: 'Implementation & Patch Specialist' },
    { id: 'verifier', name: 'Verifier', role: 'Test Runner & Regression Guard' },
    { id: 'reviewer', name: 'Reviewer', role: 'Architecture & Security Auditor' },
  ]

  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('builder')
  const [allowedTools, setAllowedTools] = useState<string[]>([])
  const [availableTools, setAvailableTools] = useState<CatalogTool[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkerTools(selectedWorkerId)
  }, [selectedWorkerId])

  const fetchWorkerTools = async (workerId: string) => {
    setLoading(true)
    setError(null)
    setSavedSuccess(false)
    try {
      const res = await fetch(`/v1/mcp/workers/${workerId}/tools`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (!res.ok) throw new Error('Failed to load worker tool matrix')
      const data = await res.json()
      setAllowedTools(data.allowed_tools || [])
      setAvailableTools(data.available_catalog_tools || [])
    } catch (err: any) {
      setError(err.message || 'Error loading tools')
    } finally {
      setLoading(false)
    }
  }

  const toggleTool = (toolName: string) => {
    if (allowedTools.includes(toolName)) {
      setAllowedTools(allowedTools.filter((t) => t !== toolName))
    } else {
      setAllowedTools([...allowedTools, toolName])
    }
    setSavedSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/v1/mcp/workers/${selectedWorkerId}/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          allowed_tools: allowedTools,
        }),
      })
      if (!res.ok) throw new Error('Failed to save worker provisioning')
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Error saving provisioning')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl shadow-black text-slate-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Worker Tool Provisioning</h2>
            <p className="text-xs text-slate-400">
              Grant or revoke MCP capabilities for autonomous agents
            </p>
          </div>
        </div>

        {/* Worker Selector Pills */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {workers.map((w) => {
            const isSelected = selectedWorkerId === w.id
            return (
              <button
                key={w.id}
                onClick={() => setSelectedWorkerId(w.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Bot className={`h-3.5 w-3.5 ${isSelected ? 'text-black' : 'text-slate-400'}`} />
                {w.name}
              </button>
            )
          })}
        </div>

        {integration && (
          <div className="mt-3 rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-xs flex items-center justify-between">
            <span className="text-slate-400">
              Target Integration: <span className="font-semibold text-white">{integration.name}</span>
            </span>
            <span className="text-[11px] font-mono text-amber-300">
              {integration.tools.length} tool(s) available
            </span>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Tools Checklist */}
        <div className="mt-4 max-h-72 overflow-y-auto rounded-xl border border-white/8 bg-black/30 p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading worker tool matrix...</div>
          ) : availableTools.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No tools found in catalog.</div>
          ) : (
            availableTools.map((tool) => {
              const isChecked = allowedTools.includes(tool.name)
              const isFromTargetIntg = integration?.tools.includes(tool.name)
              return (
                <div
                  key={tool.name}
                  onClick={() => toggleTool(tool.name)}
                  className={`flex items-center justify-between rounded-lg p-2.5 cursor-pointer transition-colors border ${
                    isChecked
                      ? 'bg-amber-500/5 border-amber-500/20 text-white'
                      : 'border-transparent hover:bg-white/5 text-slate-300'
                  } ${isFromTargetIntg ? 'ring-1 ring-amber-500/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <button type="button" className="text-amber-400">
                      {isChecked ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-slate-500" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-white">{tool.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({tool.server_name})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{tool.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tool.execution_scope === 'LOCAL' && (
                      <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/20">
                        LOCAL
                      </span>
                    )}
                    {tool.execution_scope === 'CLOUD' && (
                      <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 border border-cyan-500/20">
                        CLOUD
                      </span>
                    )}
                    {tool.execution_scope === 'HYBRID' && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 border border-emerald-500/20">
                        HYBRID
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
          <div className="text-[11px] text-slate-400">
            <span className="font-semibold text-white">{allowedTools.length}</span> tools provisioned to{' '}
            <span className="font-semibold text-amber-400 capitalize">{selectedWorkerId}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                Provisioning Saved!
              </span>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm shadow-amber-500/20"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Provisioning'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
