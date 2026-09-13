import type { FC } from 'react'
import { useState } from 'react'
import {
  BookOpen,
  Check,
  Code2,
  Copy,
  Database,
  Layers,
  Shield,
  Terminal,
} from 'lucide-react'

export const DocsSection: FC = () => {
  const [activeTab, setActiveTab] = useState<string>('quickstart')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const docTabs = [
    { id: 'quickstart', label: 'Quickstart', icon: Terminal },
    { id: 'architecture', label: 'Worker Contracts', icon: Layers },
    { id: 'security', label: 'Zero-Trust & FileGuard', icon: Shield },
    { id: 'memory', label: 'Context Memory Graph', icon: Database },
    { id: 'api', label: 'REST & SSE Endpoints', icon: Code2 },
  ]

  return (
    <section id="docs" className="py-24 border-t border-white/8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <BookOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Developer Reference & Docs</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Documentation & Integration Guides
          </h2>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-400">
            Everything you need to configure the Bee Desktop sidecar, manage workers, and extend the platform.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {docTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/16 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content Box */}
        <div className="rounded-2xl border border-white/10 bg-[#0c0f17] p-6 sm:p-8 shadow-2xl">
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Local Development & Desktop Boot</h3>
                <p className="text-xs text-slate-400">
                  Clone the Bee monorepo and run the native Electron desktop harness alongside the Python FastAPI sidecar.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/8 bg-black/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">1. Clone repository & install dependencies</span>
                    <button
                      onClick={() => handleCopy('git clone https://github.com/Prince-695/Bee.git\ncd Bee\npnpm install', 'qs-1')}
                      className="text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedKey === 'qs-1' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-amber-300 overflow-x-auto">
                    git clone https://github.com/Prince-695/Bee.git{"\n"}
                    cd Bee{"\n"}
                    pnpm install
                  </pre>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">2. Launch Native Electron Desktop Application</span>
                    <button
                      onClick={() => handleCopy('pnpm dev:desktop', 'qs-2')}
                      className="text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedKey === 'qs-2' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-amber-300 overflow-x-auto">
                    pnpm dev:desktop
                  </pre>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/60 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">3. Run Pytest test suite across all engines</span>
                    <button
                      onClick={() => handleCopy('pytest apps/api/tests', 'qs-3')}
                      className="text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copiedKey === 'qs-3' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-amber-300 overflow-x-auto">
                    pytest apps/api/tests
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">6 Undestroyable System Workers</h3>
                <p className="text-xs text-slate-400">
                  Every worker is instantiated with strict persona definitions, role constraints, and tool whitelists.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Scout', role: 'Explorer & AST Mapper', tools: 'read_file, ast_search, find_symbols' },
                  { name: 'Planner', role: 'DAG Decomposer', tools: 'formulate_route, topological_sort' },
                  { name: 'Builder', role: 'Patch & Code Specialist', tools: 'apply_patch, generate_diff, write_file' },
                  { name: 'Verifier', role: 'QA & Regression Guard', tools: 'run_tests, pytest, vitest, typecheck' },
                  { name: 'Reviewer', role: 'Security & Policy Auditor', tools: 'zero_trust_audit, guardrail_check' },
                  { name: 'BrowserWorker', role: 'Executive Briefing Agent', tools: 'browser_history, git_briefing' },
                ].map((w) => (
                  <div key={w.name} className="rounded-xl border border-white/8 bg-black/40 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{w.name}</span>
                      <span className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                        gemini-3.5-flash
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{w.role}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Allowed: <span className="text-slate-300">{w.tools}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Zero-Trust & Strict FileGuard</h3>
                <p className="text-xs text-slate-400">
                  Security policies are enforced at the engine level before tool invocations can reach operating system APIs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4 text-xs text-rose-300">
                  <strong>Strict .env Prohibition:</strong> Workers are prohibited from reading, modifying, creating, or deleting live .env files. Attempted access raises a <code className="font-mono text-rose-200">SecurityViolation</code> and blocks execution.
                </div>
                <div className="rounded-xl border border-white/8 bg-black/50 p-4 text-xs text-slate-300">
                  <strong>Human-in-the-Loop Gate Approval:</strong> High-risk commands (e.g. bash execution, external network calls, destructive git commands) generate an Approval Gate card with a unique ID. Execution is held asynchronously until the developer clicks Approve or Deny.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Three-Tier Context Memory Graph</h3>
                <p className="text-xs text-slate-400">
                  Hybrid semantic search combines reciprocal rank fusion with cosine distance over pgvector and SQLite.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/8 bg-black/40 p-4">
                  <span className="font-bold text-sm text-amber-400">Episodic Memory</span>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Stores past bug fixes, stack trace remediation patterns, and tool run results to avoid repeating past mistakes.
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/40 p-4">
                  <span className="font-bold text-sm text-cyan-400">Semantic Memory</span>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Distills developer coding preferences, style guides, test conventions, and guardrails automatically from chat prompts.
                  </p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/40 p-4">
                  <span className="font-bold text-sm text-emerald-400">Working Memory</span>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                    Shared scratchpad and active blackboard maintaining state across multi-step DAG flight executions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">OpenAPI 3.1 & Server-Sent Events (SSE)</h3>
                <p className="text-xs text-slate-400">
                  Full programmatic control via standardized REST and SSE streaming endpoints.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="rounded-lg border border-white/8 bg-black/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-emerald-400 font-bold">GET</span>{' '}
                    <span className="text-slate-300">/v1/chat/threads/{'{id}'}/stream</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Real-time SSE token stream</span>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-amber-400 font-bold">POST</span>{' '}
                    <span className="text-slate-300">/v1/chat/threads/{'{id}'}/messages</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Send chat turn with memory recall</span>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-bold">GET</span>{' '}
                    <span className="text-slate-300">/v1/workers</span>
                  </div>
                  <span className="text-[10px] text-slate-400">List available system workers</span>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/50 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-rose-400 font-bold">DELETE</span>{' '}
                    <span className="text-slate-300">/v1/memory/{'{id}'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">1-Click Forget memory cascade</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
