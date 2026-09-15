import type { FC } from 'react'
import { useState } from 'react'
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  FileCode,
  ShieldAlert,
  Terminal,
  X,
  XCircle,
} from 'lucide-react'
import type { DAGNodeData } from '../types'

interface NodeInspectorDrawerProps {
  node: DAGNodeData | null
  isOpen: boolean
  onClose: () => void
  onResolveGate: (nodeId: string, gateId: string, action: 'approved' | 'rejected') => void
}

export const NodeInspectorDrawer: FC<NodeInspectorDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onResolveGate,
}) => {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'terminal' | 'overview' | 'artifacts'>('terminal')

  if (!isOpen || !node) return null

  const isWaitingGate = node.status === 'waiting_gate'
  const isRunning = node.status === 'running'
  const isCompleted = node.status === 'completed'

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(node.stdout_log || 'No terminal logs available.')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0c0f17]/95 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white">{node.title || node.label}</h3>
              <span className="font-mono text-[10px] text-amber-400">{node.id}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Worker: <strong className="text-slate-200 capitalize">{node.assigned_worker_id || node.assigned_role}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-cyan-400">
                <Cpu className="h-2.5 w-2.5" /> gemini-3.5-flash
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          title="Close Inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Urgent Approval Gate Card (In-Drawer) */}
      {isWaitingGate && (
        <div className="m-4 rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 shadow-lg shadow-rose-950/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Zero-Trust Approval Required ({node.gate_id || 'GATE-AUTH'})</span>
            </div>
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-mono font-bold text-rose-300 border border-rose-500/30">
              {node.gate_risk_level || 'HIGH RISK'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            The Guardian engine intercepted a privileged operation. Human verification is required to proceed.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onResolveGate(node.id, node.gate_id || 'gate-req', 'approved')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors shadow-md"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve & Continue
            </button>
            <button
              onClick={() => onResolveGate(node.id, node.gate_id || 'gate-req', 'rejected')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/60 px-3 py-2 text-xs font-medium text-rose-300 transition-colors"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-2 border-b border-white/8 px-6 pt-2">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-all ${
            activeTab === 'terminal'
              ? 'border-amber-500 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Terminal className="h-3.5 w-3.5" /> Live Terminal Log
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-all ${
            activeTab === 'overview'
              ? 'border-amber-500 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-3.5 w-3.5" /> Step Overview
        </button>
        <button
          onClick={() => setActiveTab('artifacts')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-all ${
            activeTab === 'artifacts'
              ? 'border-amber-500 text-amber-300 font-semibold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Artifacts ({node.output_artifacts?.length || 0})
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'terminal' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] text-slate-400">stdout stream</span>
              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                title="Copy Terminal Logs"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="flex-1 rounded-xl border border-white/8 bg-black/70 p-3 font-mono text-xs text-slate-300 overflow-y-auto space-y-1">
              {node.stdout_log ? (
                <pre className="whitespace-pre-wrap leading-relaxed">{node.stdout_log}</pre>
              ) : (
                <div className="flex h-32 items-center justify-center text-slate-500 italic">
                  {isRunning ? 'Worker is executing... streaming stdout buffer' : 'No stdout output logged for this node.'}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Instruction & Objective
              </div>
              <p className="rounded-lg border border-white/6 bg-white/2 p-3 text-slate-200 leading-relaxed">
                {node.instruction}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/6 bg-white/2 p-3">
                <span className="text-[10px] text-slate-400 uppercase">Execution Status</span>
                <div className="mt-1 font-mono font-bold text-white capitalize">{node.status}</div>
              </div>
              <div className="rounded-lg border border-white/6 bg-white/2 p-3">
                <span className="text-[10px] text-slate-400 uppercase">Duration</span>
                <div className="mt-1 font-mono font-bold text-amber-400">
                  {node.duration_seconds ? `${node.duration_seconds}s` : '-'}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Prerequisite Dependencies
              </div>
              <div className="flex flex-wrap gap-1.5">
                {node.dependencies.length > 0 ? (
                  node.dependencies.map((dep) => (
                    <span key={dep} className="rounded bg-white/6 px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-white/8">
                      {dep}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic">None (Root entry node)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'artifacts' && (
          <div className="space-y-3 text-xs">
            {node.output_artifacts && node.output_artifacts.length > 0 ? (
              node.output_artifacts.map((art, idx) => (
                <div key={idx} className="rounded-lg border border-white/8 bg-black/40 p-3 font-mono">
                  {art}
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center text-slate-500 italic">
                {isCompleted ? 'Node completed with in-memory execution summary.' : 'Artifacts will be published once node completes.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
