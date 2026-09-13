import type { FC } from 'react'
import { useState } from 'react'
import {
  GitFork,
  CheckCircle2,
  Clock,
  RotateCw,
  Bot,
} from 'lucide-react'

interface DAGNode {
  id: string
  label: string
  worker: string
  status: 'completed' | 'in_progress' | 'pending' | 'failed'
  duration: string
}

interface Mission {
  id: string
  title: string
  status: 'completed' | 'running' | 'paused'
  started_at: string
  nodes: DAGNode[]
}

export const MissionsPage: FC = () => {
  const [missions] = useState<Mission[]>([
    {
      id: 'msn-01',
      title: 'Autonomous Phase 3 Surface Synthesis',
      status: 'running',
      started_at: '2026-09-13 22:45:00',
      nodes: [
        { id: '1', label: 'Explore Existing Codebase Schema', worker: 'scout', status: 'completed', duration: '1.2s' },
        { id: '2', label: 'Formulate DAG Flight Route', worker: 'planner', status: 'completed', duration: '0.8s' },
        { id: '3', label: 'Build Chat & Runner Engine', worker: 'builder', status: 'completed', duration: '4.5s' },
        { id: '4', label: 'Zero-Trust Gate Audit', worker: 'reviewer', status: 'completed', duration: '1.1s' },
        { id: '5', label: 'Run Pytest & Codegen Verification', worker: 'verifier', status: 'in_progress', duration: 'running' },
        { id: '6', label: 'Deploy Web & Desktop Surfaces', worker: 'builder', status: 'pending', duration: '-' },
      ],
    },
    {
      id: 'msn-02',
      title: 'Context Graph Recall Optimization',
      status: 'completed',
      started_at: '2026-09-13 21:10:00',
      nodes: [
        { id: '1', label: 'Profile HybridRetriever Scores', worker: 'scout', status: 'completed', duration: '0.9s' },
        { id: '2', label: 'Tune Dynamic Reciprocal Reranking', worker: 'builder', status: 'completed', duration: '2.1s' },
        { id: '3', label: 'Execute Regression Tests', worker: 'verifier', status: 'completed', duration: '18.4s' },
      ],
    },
  ])

  const [selectedMission, setSelectedMission] = useState<Mission>(missions[0])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080a0f] p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <GitFork className="h-5 w-5 text-amber-400" />
            DAG Autonomous Missions
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Topological flight execution routes coordinating multi-worker parallel DAG task graphs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 flex items-center gap-1.5">
            <RotateCw className="h-3 w-3 animate-spin" /> Swarm Execution Engine Active
          </span>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3 overflow-hidden">
        {/* Left: Mission List */}
        <div className="flex flex-col space-y-3 overflow-y-auto rounded-xl border border-white/8 bg-[#0b0e14]/60 p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active & Recent Flights
          </span>
          {missions.map((mission) => {
            const isSelected = selectedMission.id === mission.id
            return (
              <button
                key={mission.id}
                onClick={() => setSelectedMission(mission)}
                className={`flex flex-col text-left rounded-lg border p-3 transition-all ${
                  isSelected
                    ? 'border-amber-500/50 bg-amber-500/10 text-white shadow-sm'
                    : 'border-white/6 bg-white/2 text-slate-300 hover:border-white/12 hover:bg-white/4'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-amber-400">{mission.id}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                      mission.status === 'running'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {mission.status}
                  </span>
                </div>
                <div className="font-medium text-xs text-slate-100">{mission.title}</div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{mission.nodes.length} DAG Nodes</span>
                  <span>{mission.started_at}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Right: DAG Visualizer */}
        <div className="lg:col-span-2 flex flex-col rounded-xl border border-white/8 bg-[#0b0e14]/60 p-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-5">
            <div>
              <span className="font-mono text-xs text-amber-400">{selectedMission.id}</span>
              <h3 className="text-base font-semibold text-white mt-0.5">{selectedMission.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Execution Mode:</span>
              <span className="rounded bg-white/6 px-2 py-0.5 text-xs font-mono text-cyan-400">
                Topological Parallel
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-xs font-semibold text-slate-300">DAG Step Flow:</span>
            <div className="space-y-3">
              {selectedMission.nodes.map((node, index) => {
                const isLast = index === selectedMission.nodes.length - 1
                return (
                  <div key={node.id} className="relative">
                    <div
                      className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                        node.status === 'completed'
                          ? 'border-emerald-500/20 bg-emerald-950/10 text-slate-200'
                          : node.status === 'in_progress'
                          ? 'border-amber-500/40 bg-amber-950/20 text-white shadow-md'
                          : 'border-white/6 bg-white/2 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-mono font-bold ${
                            node.status === 'completed'
                              ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                              : node.status === 'in_progress'
                              ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 animate-pulse'
                              : 'border-white/10 bg-white/5 text-slate-400'
                          }`}
                        >
                          {node.id}
                        </div>
                        <div>
                          <div className="font-medium text-xs text-slate-200">{node.label}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90">
                              <Bot className="h-3 w-3" /> Worker: {node.worker}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-slate-400">{node.duration}</span>
                        {node.status === 'completed' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        {node.status === 'in_progress' && (
                          <RotateCw className="h-4 w-4 text-amber-400 animate-spin" />
                        )}
                        {node.status === 'pending' && <Clock className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {!isLast && (
                      <div className="ml-7 h-3 w-0.5 bg-gradient-to-b from-white/20 to-white/5" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
