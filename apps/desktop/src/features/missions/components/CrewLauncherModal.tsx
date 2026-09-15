import type { FC } from 'react'
import { useState } from 'react'
import {
  Code2,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

interface CrewLauncherModalProps {
  isOpen: boolean
  onClose: () => void
  onLaunch: (templateId: string, title: string, objective: string) => void
}

export const CrewLauncherModal: FC<CrewLauncherModalProps> = ({
  isOpen,
  onClose,
  onLaunch,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('coding_flight')
  const [title, setTitle] = useState<string>('Feature Implementation Flight')
  const [objective, setObjective] = useState<string>(
    'Synthesize autonomous implementation patch with 100% test contract verification and zero-trust gate audit.'
  )

  if (!isOpen) return null

  const templates = [
    {
      id: 'coding_flight',
      name: 'Coding Flight Crew',
      icon: Code2,
      category: 'Engineering',
      stages: '5 Stages',
      duration: '~1m',
      desc: 'Scout → Planner → Builder → Verifier → Reviewer. Delivers verified patches with automated testing.',
    },
    {
      id: 'research_swarm',
      name: 'Research & Discovery Swarm',
      icon: Search,
      category: 'Intelligence',
      stages: '4 Stages',
      duration: '~45s',
      desc: 'Parallel codebase exploration, library docs crawl, and architecture RFC synthesis.',
    },
    {
      id: 'security_audit',
      name: 'Security Audit & Hardening',
      icon: ShieldCheck,
      category: 'Governance',
      stages: '4 Stages',
      duration: '~1m',
      desc: 'Zero-trust AST taint scan, FileGuard verification, and developer-gated hardening patches.',
    },
  ]

  const promptStarters = [
    'Refactor auth middleware to verify refresh token rotation',
    'Audit zero-trust FileGuard policies and prevent .env tampering',
    'Execute test runner and fix regressions in chat engine',
    'Generate architectural discovery RFC for SQLite-vec integration',
  ]

  const handleLaunch = () => {
    if (!title.trim() || !objective.trim()) return
    onLaunch(selectedTemplate, title.trim(), objective.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-white/12 bg-[#0c0f17] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Play className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Launch Multi-Worker DAG Flight</h3>
              <p className="text-[11px] text-slate-400">
                Deploy an autonomous swarm coordinated by topological DAG execution.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 p-6 overflow-y-auto max-h-[75vh]">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Crew Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {templates.map((tpl) => {
                const Icon = tpl.icon
                const isSelected = selectedTemplate === tpl.id
                return (
                  <button
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplate(tpl.id)
                      if (tpl.id === 'coding_flight') setTitle('Feature Implementation Flight')
                      if (tpl.id === 'research_swarm') setTitle('Codebase Architecture Discovery')
                      if (tpl.id === 'security_audit') setTitle('Zero-Trust Security Audit')
                    }}
                    className={`flex flex-col text-left rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-amber-500/80 bg-amber-500/15 shadow-md shadow-amber-500/10'
                        : 'border-white/8 bg-white/2 hover:border-white/16 hover:bg-white/4'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          isSelected ? 'bg-amber-500 text-black' : 'bg-white/6 text-slate-300'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-mono text-[9px] text-slate-400">{tpl.stages}</span>
                    </div>
                    <div className="font-semibold text-xs text-white mb-1">{tpl.name}</div>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{tpl.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Flight Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement AST Symbol Mapper"
              className="w-full rounded-xl border border-white/10 bg-[#07090e] px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Goal Prompt Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              High-Level Objective & Constraints
            </label>
            <textarea
              rows={3}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the engineering goal for the worker crew..."
              className="w-full rounded-xl border border-white/10 bg-[#07090e] p-3 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Prompt Starters */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Suggested Goals:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {promptStarters.map((starter, i) => (
                <button
                  key={i}
                  onClick={() => setObjective(starter)}
                  className="rounded-lg border border-white/6 bg-white/2 px-2 py-1 text-[10px] text-slate-400 hover:border-amber-500/40 hover:text-amber-300 transition-all text-left truncate max-w-full"
                >
                  + {starter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/8 bg-black/40 px-6 py-3.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Topological parallel execution via gemini-3.5-flash</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={!title.trim() || !objective.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black px-4 py-1.5 text-xs font-semibold shadow-md transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              Launch Flight
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
