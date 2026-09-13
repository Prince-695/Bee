import type { FC } from 'react'
import { Bot, Cpu, MessageSquare, Sparkles } from 'lucide-react'

interface WorkersPageProps {
  onStartChat: (workerId: string) => void
}

export const WorkersPage: FC<WorkersPageProps> = ({ onStartChat }) => {
  const workers = [
    {
      id: 'scout',
      name: 'Scout',
      role: 'Codebase Explorer & Dependency Mapper',
      badge: 'Undestroyable',
      description: 'Navigates large codebases, builds AST symbol index, and discovers call chains before modifications.',
      capabilities: ['AST Parsing', 'Dependency Graph', 'Static Code Inspection'],
      allowedTools: ['read_file', 'ast_traversal', 'symbol_search'],
      model: 'gemini-3.5-flash',
    },
    {
      id: 'planner',
      name: 'Planner',
      role: 'Strategy & DAG Decomposer',
      badge: 'Undestroyable',
      description: 'Deconstructs user objectives into topological DAG execution flights with validation gates.',
      capabilities: ['DAG Route Formulation', 'Step Scheduling', 'Parallel Branching'],
      allowedTools: ['formulate_route', 'decompose_goal'],
      model: 'gemini-3.5-flash',
    },
    {
      id: 'builder',
      name: 'Builder',
      role: 'Implementation & Patch Specialist',
      badge: 'Undestroyable',
      description: 'Generates atomic code patches, refactors functions, and executes safe implementation steps.',
      capabilities: ['Code Generation', 'Patch Application', 'Refactoring'],
      allowedTools: ['apply_patch', 'generate_code', 'write_file'],
      model: 'gemini-3.5-flash',
    },
    {
      id: 'verifier',
      name: 'Verifier',
      role: 'Test Runner & Regression Guard',
      badge: 'Undestroyable',
      description: 'Executes automated test suites (pytest/vitest), verifies type contracts, and enforces coverage.',
      capabilities: ['Test Execution', 'Coverage Analysis', 'Regression Testing'],
      allowedTools: ['run_tests', 'check_coverage', 'typecheck'],
      model: 'gemini-3.5-flash',
    },
    {
      id: 'reviewer',
      name: 'Reviewer',
      role: 'Architecture & Security Auditor',
      badge: 'Undestroyable',
      description: 'Performs zero-trust security reviews, checks Guardian policies, and guards against hallucination.',
      capabilities: ['Security Review', 'Policy Compliance', 'Architectural Verification'],
      allowedTools: ['audit_diff', 'check_policies'],
      model: 'gemini-3.5-flash',
    },
    {
      id: 'browser_worker',
      name: 'BrowserWorker',
      role: 'Executive Briefing & Browser Synthesizer',
      badge: 'Undestroyable',
      description: 'Monitors last 48 hours browser history, active git branches, and synthesizes morning catch-up briefings.',
      capabilities: ['Morning Briefing', 'Git Context', 'History Synthesis'],
      allowedTools: ['synthesize_briefing', 'git_log_inspect'],
      model: 'gemini-3.5-flash',
    },
  ]

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#080a0f] p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber-400" />
            Worker Fleet & Swarm Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            System-provisioned undestroyable workers configured with specialized roles and zero-trust tool access.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
          <Sparkles className="h-4 w-4" />
          <span>All Workers Powered by gemini-3.5-flash</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="flex flex-col rounded-xl border border-white/8 bg-[#0e121a] p-5 shadow-lg shadow-black/30 hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">{worker.name}</h3>
                  <span className="text-[11px] text-slate-400">{worker.role}</span>
                </div>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/20">
                {worker.badge}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 flex-1">
              {worker.description}
            </p>

            <div className="mb-4 space-y-2">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Capabilities:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {worker.capabilities.map((cap, i) => (
                  <span key={i} className="rounded bg-white/4 px-2 py-0.5 text-[10px] text-slate-300 border border-white/5">
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/6 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Cpu className="h-3 w-3 text-amber-400" />
                {worker.model}
              </span>
              <button
                onClick={() => onStartChat(worker.id)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-medium transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Start 1:1 Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
