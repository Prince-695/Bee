import type { FC } from 'react'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  RotateCw,
  ShieldAlert,
  XCircle,
} from 'lucide-react'
import type { DAGNodeData } from '../types'

interface NodeCardProps {
  node: DAGNodeData
  isSelected: boolean
  onClick: () => void
}

export const NodeCard: FC<NodeCardProps> = ({ node, isSelected, onClick }) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'scout':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
      case 'planner':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      case 'builder':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      case 'verifier':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      case 'reviewer':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusDisplay = () => {
    switch (node.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/30 animate-pulse">
            <RotateCw className="h-3 w-3 animate-spin" /> RUNNING
          </span>
        )
      case 'waiting_gate':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/40 animate-bounce">
            <ShieldAlert className="h-3 w-3" /> GATE REQUIRED
          </span>
        )
      case 'completed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> DONE
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-rose-400 border border-rose-500/30">
            <XCircle className="h-3 w-3" /> FAILED
          </span>
        )
      case 'blocked':
        return (
          <span className="flex items-center gap-1 rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 border border-slate-500/20">
            <AlertTriangle className="h-3 w-3" /> BLOCKED
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-white/8">
            <Clock className="h-3 w-3" /> PENDING
          </span>
        )
    }
  }

  const isRunning = node.status === 'running'
  const isWaitingGate = node.status === 'waiting_gate'
  const isCompleted = node.status === 'completed'

  return (
    <div
      onClick={onClick}
      className={`group relative w-64 cursor-pointer rounded-xl border p-4 transition-all select-none ${
        isSelected
          ? 'ring-2 ring-amber-500 border-amber-500 bg-[#121722] shadow-xl shadow-amber-500/10'
          : isWaitingGate
          ? 'border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-500/15 animate-pulse'
          : isRunning
          ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-500/15'
          : isCompleted
          ? 'border-emerald-500/30 bg-[#0e131d] hover:border-emerald-500/50'
          : 'border-white/8 bg-[#0b0e14]/90 hover:border-white/20'
      }`}
    >
      {/* Port connection dots */}
      {node.dependencies.length > 0 && (
        <div
          className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[#080a0f] bg-slate-400 group-hover:bg-amber-400 transition-colors"
          title="Input Dependency Port"
        />
      )}
      <div
        className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[#080a0f] bg-slate-400 group-hover:bg-cyan-400 transition-colors"
        title="Output Target Port"
      />

      {/* Card Header: Worker & Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[10px] font-mono font-medium ${getRoleBadgeColor(
            node.assigned_role
          )}`}
        >
          <Bot className="h-3 w-3" />
          <span className="capitalize">{node.assigned_role}</span>
        </span>
        {getStatusDisplay()}
      </div>

      {/* Title & Instruction */}
      <h4 className="font-semibold text-xs text-white line-clamp-1 mb-1 group-hover:text-amber-300 transition-colors">
        {node.title || node.label}
      </h4>
      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
        {node.instruction}
      </p>

      {/* Card Footer: Telemetry & Dependencies */}
      <div className="mt-3.5 pt-2.5 border-t border-white/6 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {node.duration_seconds ? `${node.duration_seconds}s` : '-'}
        </span>
        <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
          {node.dependencies.length > 0 ? `deps: [${node.dependencies.join(', ')}]` : 'root node'}
        </span>
      </div>
    </div>
  )
}
