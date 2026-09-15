import type { FC } from 'react'
import { useState } from 'react'
import { Bot, CheckCircle2, GitFork, Terminal } from 'lucide-react'

export const ArchitectureVisualizer: FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0)

  const pipelineSteps = [
    {
      id: 0,
      badge: 'Step 1',
      title: 'Universal Orchestrator & Goal Deconstruction',
      description:
        'Developer issues a natural language objective. Bee Lead Orchestrator decomposes it into a topological DAG flight plan with dependencies, assigned worker nodes, and approval checkpoints.',
      worker: 'Bee Orchestrator (Lead)',
      tool: 'dag_formulate_flight()',
      gate: 'Automated Route Planning',
    },
    {
      id: 1,
      badge: 'Step 2',
      title: 'Hybrid Context Graph Recall',
      description:
        'HybridRetriever runs reciprocal rank fusion across semantic coding preferences and past episodic remediation fixes. Relevant past solutions are injected into the worker context prompt.',
      worker: 'Memory Engine',
      tool: 'recall_context_graph(threshold=0.05)',
      gate: 'Context Graph Citation',
    },
    {
      id: 2,
      badge: 'Step 3',
      title: 'Parallel Worker Dispatch',
      description:
        'Scout indexes symbol dependencies, Builder drafts patch files, and Reviewer audits code changes against zero-trust policy. Workers execute with least-privilege tool access.',
      worker: 'Scout + Builder + Reviewer',
      tool: 'ast_traversal() + generate_patch()',
      gate: 'Least-Privilege Isolation',
    },
    {
      id: 3,
      badge: 'Step 4',
      title: 'Guardian Zero-Trust Approval Interception',
      description:
        'When a privileged action is requested (bash command execution, sensitive file access), the Guardian GateManager pauses execution and presents an interactive gate card directly in chat.',
      worker: 'Guardian Engine',
      tool: 'gate_manager.request_gate()',
      gate: 'Interactive Human Approval',
    },
    {
      id: 4,
      badge: 'Step 5',
      title: 'Verifier QA & Closed-Loop Remediation',
      description:
        'Verifier runs the test suite (pytest/vitest). If regression is detected, failure logs feed back to Builder for automatic self-healing patches before final completion.',
      worker: 'Verifier + Builder',
      tool: 'run_tests(suite="pytest")',
      gate: '100% Suite Pass Required',
    },
  ]

  const current = pipelineSteps[activeStep]

  return (
    <section id="architecture" className="py-24 border-t border-white/8 bg-[#090c13]/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
            <GitFork className="h-3.5 w-3.5 text-cyan-400" />
            <span>Autonomous Pipeline Flow</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            How the Bee Swarm Executes Flights
          </h2>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-400">
            Step through the lifecycle of an autonomous engineering task from prompt ingestion to verified code patch.
          </p>
        </div>

        {/* Interactive Step Navigator */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
          {pipelineSteps.map((step) => {
            const isActive = activeStep === step.id
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  isActive
                    ? 'border-amber-500/60 bg-amber-500/15 text-white shadow-md shadow-amber-500/10'
                    : 'border-white/8 bg-white/2 text-slate-400 hover:border-white/16 hover:bg-white/4'
                }`}
              >
                <span className={`text-[10px] font-mono font-semibold uppercase ${isActive ? 'text-amber-400' : 'text-slate-400'}`}>
                  {step.badge}
                </span>
                <span className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">
                  {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Step Detail Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left description */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-mono font-medium text-amber-400">
                  {current.badge}
                </span>
                <h3 className="text-xl font-bold text-white">{current.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {current.description}
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Bot className="h-4 w-4 text-amber-400" />
                  <span>Worker: <strong className="text-white">{current.worker}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>Call: <code className="text-cyan-300">{current.tool}</code></span>
                </div>
              </div>
            </div>

            {/* Right status block */}
            <div className="rounded-xl border border-white/8 bg-black/50 p-6 flex flex-col justify-center space-y-4">
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Pipeline Gate Checkpoint
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{current.gate}</span>
              </div>
              <div className="text-xs text-slate-400 leading-normal">
                Strict invariant verification guarantees safe execution before moving to subsequent topological steps.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
