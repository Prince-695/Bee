import type { FC } from 'react'
import { useState } from 'react'
import {
  CheckCircle2,
  GitFork,
  Plus,
  RotateCw,
  ShieldAlert,
} from 'lucide-react'
import type { DAGNodeData, MissionData } from './types'
import { DAGCanvas } from './components/DAGCanvas'
import { NodeInspectorDrawer } from './components/NodeInspectorDrawer'
import { CrewLauncherModal } from './components/CrewLauncherModal'

const INITIAL_MISSIONS: MissionData[] = [
  {
    id: 'msn-01',
    title: 'Autonomous Phase 4 Visual DAG Engine Synthesis',
    objective:
      'Build dynamic topological multi-worker DAG execution canvas with real-time SSE token stream, SVG bezier connectors, and in-canvas zero-trust gate resolution.',
    crew_template_id: 'coding_flight',
    crew_name: 'Coding Flight Crew',
    status: 'running',
    created_at: '2026-09-14 18:30:00',
    topological_tiers: [['scout'], ['planner'], ['builder'], ['verifier'], ['reviewer']],
    nodes: [
      {
        id: 'scout',
        label: 'Scout Worker',
        title: 'Codebase & Dependency Mapping',
        assigned_role: 'scout',
        assigned_worker_id: 'ScoutWorker',
        instruction: 'Analyzes repository AST symbols, changed files, and dependency graph.',
        dependencies: [],
        status: 'completed',
        duration_seconds: 1.2,
        stdout_log:
          '[ScoutWorker] Initializing AST symbol extractor...\n[ScoutWorker] Found 34 source files in services/orchestrator\n[ScoutWorker] Symbol graph mapped without circular dependencies.\n',
        output_artifacts: ['ast_symbol_index.json', 'dependency_edges.json'],
      },
      {
        id: 'planner',
        label: 'Planner Worker',
        title: 'DAG Route & Strategy Formulation',
        assigned_role: 'planner',
        assigned_worker_id: 'PlannerWorker',
        instruction: 'Formulates atomic patch strategy and defines verification acceptance criteria.',
        dependencies: ['scout'],
        status: 'completed',
        duration_seconds: 0.8,
        stdout_log:
          '[PlannerWorker] Formulating topological DAG flight plan...\n[PlannerWorker] Generated 5 execution stages with linear dependency chain.\n[PlannerWorker] Verification criteria: 100% pytest suite pass rate.\n',
        output_artifacts: ['flight_plan.md'],
      },
      {
        id: 'builder',
        label: 'Builder Worker',
        title: 'Patch Application & Code Synthesis',
        assigned_role: 'builder',
        assigned_worker_id: 'BuilderWorker',
        instruction: 'Generates atomic code modifications and refactors target files.',
        dependencies: ['planner'],
        status: 'completed',
        duration_seconds: 3.4,
        stdout_log:
          '[BuilderWorker] Drafting DAGCanvas.tsx with SVG bezier connectors...\n[BuilderWorker] Implemented NodeCard.tsx with pulsating status halos.\n[BuilderWorker] Implemented NodeInspectorDrawer.tsx with terminal stdout buffer.\n',
        output_artifacts: ['patch_diff.diff'],
      },
      {
        id: 'verifier',
        label: 'Verifier Worker',
        title: 'Regression & Test Suite QA',
        assigned_role: 'verifier',
        assigned_worker_id: 'VerifierWorker',
        instruction: 'Executes test runner (pytest/vitest) and enforces test contract pass.',
        dependencies: ['builder'],
        status: 'running',
        duration_seconds: 2.1,
        stdout_log:
          '[VerifierWorker] Running pytest test_dag_engine.py...\n[VerifierWorker] test_crew_templates_registry PASSED\n[VerifierWorker] test_dag_engine_acyclic_and_topological_sort PASSED\n[VerifierWorker] Running pnpm --filter @bee/desktop build...\n',
        output_artifacts: [],
      },
      {
        id: 'reviewer',
        label: 'Reviewer Worker',
        title: 'Architecture & Gate Verification',
        assigned_role: 'reviewer',
        assigned_worker_id: 'ReviewerWorker',
        instruction: 'Audits diff against zero-trust policies and requests developer gate authorization.',
        dependencies: ['verifier'],
        status: 'waiting_gate',
        gate_required: true,
        gate_id: 'gate-981244',
        gate_risk_level: 'MEDIUM',
        duration_seconds: 0.0,
        stdout_log:
          '[ReviewerWorker] Checking zero-trust security invariants...\n[ReviewerWorker] Privileged action intercepted: code modification to core packages.\n[ReviewerWorker] Paused at interactive gate approval checkpoint.\n',
        output_artifacts: [],
      },
    ],
  },
  {
    id: 'msn-02',
    title: 'Context Graph Recall & SQLite-vec Optimization',
    objective: 'Benchmark reciprocal rank fusion and vector indexing latency across 10k items.',
    crew_template_id: 'research_swarm',
    crew_name: 'Research & Discovery Swarm',
    status: 'completed',
    created_at: '2026-09-14 17:15:00',
    topological_tiers: [['scout'], ['searcher'], ['synthesizer'], ['writer']],
    nodes: [
      {
        id: 'scout',
        label: 'Scout Worker',
        title: 'Context Discovery',
        assigned_role: 'scout',
        assigned_worker_id: 'ScoutWorker',
        instruction: 'Inspects existing pgvector retriever implementations.',
        dependencies: [],
        status: 'completed',
        duration_seconds: 0.9,
      },
      {
        id: 'searcher',
        label: 'Search Worker',
        title: 'SQLite-vec Research',
        assigned_role: 'searcher',
        assigned_worker_id: 'SearchWorker',
        instruction: 'Scans sqlite-vec v0.1 bindings for Node and Python runtimes.',
        dependencies: ['scout'],
        status: 'completed',
        duration_seconds: 1.4,
      },
      {
        id: 'synthesizer',
        label: 'Synthesizer Worker',
        title: 'Benchmark Analysis',
        assigned_role: 'synthesizer',
        assigned_worker_id: 'ContextSynthesizer',
        instruction: 'Synthesizes latency numbers into citation graph.',
        dependencies: ['scout', 'searcher'],
        status: 'completed',
        duration_seconds: 1.1,
      },
      {
        id: 'writer',
        label: 'Documentation Worker',
        title: 'RFC Synthesis',
        assigned_role: 'scribe',
        assigned_worker_id: 'DocumentationWorker',
        instruction: 'Generates final RFC document.',
        dependencies: ['synthesizer'],
        status: 'completed',
        duration_seconds: 0.8,
      },
    ],
  },
]

export const MissionsPage: FC = () => {
  const [missions, setMissions] = useState<MissionData[]>(INITIAL_MISSIONS)
  const [selectedMissionId, setSelectedMissionId] = useState<string>(INITIAL_MISSIONS[0].id)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isLauncherOpen, setIsLauncherOpen] = useState(false)

  const activeMission =
    missions.find((m) => m.id === selectedMissionId) || missions[0]

  const selectedNode =
    activeMission.nodes.find((n) => n.id === selectedNodeId) || null

  // Calculate completion progress
  const completedNodes = activeMission.nodes.filter((n) => n.status === 'completed').length
  const progressPercent = activeMission.nodes.length
    ? Math.round((completedNodes / activeMission.nodes.length) * 100)
    : 0

  const hasWaitingGate = activeMission.nodes.some((n) => n.status === 'waiting_gate')

  // Handle in-canvas gate resolution
  const handleResolveGate = (
    nodeId: string,
    gateId: string,
    action: 'approved' | 'rejected'
  ) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== activeMission.id) return m
        const updatedNodes = m.nodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              status: action === 'approved' ? ('completed' as const) : ('failed' as const),
              stdout_log:
                (n.stdout_log || '') +
                `\n[GateGuardian] Gate ${gateId} was ${action.toUpperCase()} by developer. Execution resumed.\n`,
              duration_seconds: 1.5,
            }
          }
          return n
        })

        const allDone = updatedNodes.every((n) => n.status === 'completed')
        return {
          ...m,
          status: allDone ? ('completed' as const) : m.status,
          nodes: updatedNodes,
        }
      })
    )

    // Call backend gate resolution endpoint asynchronously
    try {
      fetch(
        `http://localhost:8000/v1/missions/${activeMission.id}/gates/${gateId}/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reason: 'Developer in-canvas approval' }),
        }
      ).catch(() => {})
    } catch {
      // Offline fallback
    }
  }

  // Handle launching a new mission
  const handleLaunchFlight = (
    templateId: string,
    title: string,
    objective: string
  ) => {
    const newMissionId = `msn-${Date.now().toString().slice(-4)}`
    let tiers = [['scout'], ['planner'], ['builder'], ['verifier'], ['reviewer']]
    let newNodes: DAGNodeData[] = []

    if (templateId === 'research_swarm') {
      tiers = [['scout'], ['searcher'], ['synthesizer'], ['writer']]
      newNodes = [
        {
          id: 'scout',
          label: 'Scout Worker',
          title: 'Repository Context Discovery',
          assigned_role: 'scout',
          assigned_worker_id: 'ScoutWorker',
          instruction: 'Index codebase symbols and structure.',
          dependencies: [],
          status: 'running',
          duration_seconds: 0.5,
          stdout_log: '[ScoutWorker] Exploring repo architecture...\n',
        },
        {
          id: 'searcher',
          label: 'Search Worker',
          title: 'External Intelligence Crawl',
          assigned_role: 'searcher',
          assigned_worker_id: 'SearchWorker',
          instruction: 'Search external documentation and web citations in parallel.',
          dependencies: ['scout'],
          status: 'pending',
          duration_seconds: 0,
        },
        {
          id: 'synthesizer',
          label: 'Synthesizer Worker',
          title: 'Context Graph Synthesis',
          assigned_role: 'synthesizer',
          assigned_worker_id: 'ContextSynthesizer',
          instruction: 'Cross-reference internal patterns with external citations.',
          dependencies: ['scout', 'searcher'],
          status: 'pending',
          duration_seconds: 0,
        },
        {
          id: 'writer',
          label: 'Documentation Worker',
          title: 'Technical RFC Drafting',
          assigned_role: 'scribe',
          assigned_worker_id: 'DocumentationWorker',
          instruction: 'Generate formatted markdown report.',
          dependencies: ['synthesizer'],
          status: 'pending',
          duration_seconds: 0,
        },
      ]
    } else {
      newNodes = [
        {
          id: 'scout',
          label: 'Scout Worker',
          title: 'Codebase & Dependency Mapping',
          assigned_role: 'scout',
          assigned_worker_id: 'ScoutWorker',
          instruction: 'Analyzes repository AST symbols and dependencies.',
          dependencies: [],
          status: 'running',
          duration_seconds: 0.3,
          stdout_log: '[ScoutWorker] Initializing AST mapping for flight...\n',
        },
        {
          id: 'planner',
          label: 'Planner Worker',
          title: 'DAG Route Synthesis',
          assigned_role: 'planner',
          assigned_worker_id: 'PlannerWorker',
          instruction: 'Formulate execution route.',
          dependencies: ['scout'],
          status: 'pending',
          duration_seconds: 0,
        },
        {
          id: 'builder',
          label: 'Builder Worker',
          title: 'Patch Implementation',
          assigned_role: 'builder',
          assigned_worker_id: 'BuilderWorker',
          instruction: 'Generate code patches.',
          dependencies: ['planner'],
          status: 'pending',
          duration_seconds: 0,
        },
        {
          id: 'verifier',
          label: 'Verifier Worker',
          title: 'Test Verification QA',
          assigned_role: 'verifier',
          assigned_worker_id: 'VerifierWorker',
          instruction: 'Execute pytest and regression tests.',
          dependencies: ['builder'],
          status: 'pending',
          duration_seconds: 0,
        },
        {
          id: 'reviewer',
          label: 'Reviewer Worker',
          title: 'Zero-Trust Gate Audit',
          assigned_role: 'reviewer',
          assigned_worker_id: 'ReviewerWorker',
          instruction: 'Audit policy rules and require gate approval.',
          dependencies: ['verifier'],
          status: 'pending',
          gate_required: true,
          gate_risk_level: 'MEDIUM',
          duration_seconds: 0,
        },
      ]
    }

    const newFlight: MissionData = {
      id: newMissionId,
      title,
      objective,
      crew_template_id: templateId,
      crew_name: templateId === 'research_swarm' ? 'Research Swarm' : 'Coding Flight Crew',
      status: 'running',
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      topological_tiers: tiers,
      nodes: newNodes,
    }

    setMissions((prev) => [newFlight, ...prev])
    setSelectedMissionId(newMissionId)
    setSelectedNodeId('scout')
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#07090e]">
      {/* Top Orchestration Control Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/8 bg-[#0b0e14]/90 px-6 py-3 backdrop-blur-xl z-10 gap-3">
        {/* Left: Mission Selector & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <GitFork className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMissionId}
                onChange={(e) => {
                  setSelectedMissionId(e.target.value)
                  setSelectedNodeId(null)
                }}
                className="bg-transparent font-bold text-xs text-white outline-none cursor-pointer hover:text-amber-300 transition-colors border-none p-0 pr-2"
              >
                {missions.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#0e121a] text-white">
                    {m.id} • {m.title}
                  </option>
                ))}
              </select>

              {hasWaitingGate ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-300 border border-rose-500/40 animate-pulse">
                  <ShieldAlert className="h-3 w-3" /> PAUSED (APPROVAL REQUIRED)
                </span>
              ) : activeMission.status === 'running' ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/30">
                  <RotateCw className="h-3 w-3 animate-spin" /> SWARM RUNNING
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3" /> COMPLETED
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-mono text-amber-400">{activeMission.crew_name}</span>
              <span>•</span>
              <span>{activeMission.nodes.length} Topological Nodes</span>
              <span>•</span>
              <span className="truncate max-w-[280px]">{activeMission.objective}</span>
            </div>
          </div>
        </div>

        {/* Right: Progress bar & Launch Button */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="flex flex-col items-end text-[10px] font-mono text-slate-400">
              <span>
                Progress: <strong className="text-white">{progressPercent}%</strong>
              </span>
              <span>
                {completedNodes}/{activeMission.nodes.length} nodes done
              </span>
            </div>
            <div className="h-2 w-28 overflow-hidden rounded-full bg-white/6 border border-white/8">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => setIsLauncherOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-semibold shadow-md transition-colors"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            Launch Flight
          </button>
        </div>
      </div>

      {/* Main Interactive Visual DAG Canvas */}
      <div className="relative flex-1 overflow-hidden">
        <DAGCanvas
          nodes={activeMission.nodes}
          topologicalTiers={activeMission.topological_tiers}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
        />

        {/* Live Node Inspector Drawer */}
        <NodeInspectorDrawer
          node={selectedNode}
          isOpen={selectedNode !== null}
          onClose={() => setSelectedNodeId(null)}
          onResolveGate={handleResolveGate}
        />
      </div>

      {/* Crew Launcher Modal */}
      <CrewLauncherModal
        isOpen={isLauncherOpen}
        onClose={() => setIsLauncherOpen(false)}
        onLaunch={handleLaunchFlight}
      />
    </div>
  )
}
