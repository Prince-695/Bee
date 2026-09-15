import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  CheckCircle2,
  Database,
  Eraser,
  Loader2,
  Send,
  ShieldAlert,
  User,
  Wrench,
  XCircle,
} from 'lucide-react'

interface Message {
  id: string
  sender_type: 'user' | 'worker' | 'system'
  sender_id: string
  content: string
  recalled_memory_ids?: string[]
  tool_invocations?: Array<{
    tool: string
    args: Record<string, unknown>
    result?: Record<string, unknown>
  }>
  gate_id?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

interface WorkerInfo {
  id: string
  name: string
  role: string
  avatar: string
  description: string
  capabilities: string[]
}

const SYSTEM_WORKERS: WorkerInfo[] = [
  {
    id: 'universal',
    name: 'Bee Orchestrator',
    role: 'Lead Engineering Orchestrator',
    avatar: 'BrainCircuit',
    description: 'Autonomous multi-worker supervisor. Formulates DAG flight routes and directs swarm workers.',
    capabilities: ['planning', 'routing', 'coordination'],
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Codebase Explorer & Dependency Mapper',
    avatar: 'Bot',
    description: 'Performs deep static code analysis, discovers symbol definitions, and inspects files.',
    capabilities: ['read_file', 'ast_traversal', 'dependency_graph'],
  },
  {
    id: 'builder',
    name: 'Builder',
    role: 'Implementation & Patch Specialist',
    avatar: 'Bot',
    description: 'Generates code patches, refactors modules, and implements features safely.',
    capabilities: ['code_generation', 'patch_application', 'diff_analysis'],
  },
  {
    id: 'verifier',
    name: 'Verifier',
    role: 'Test Runner & Regression Guard',
    avatar: 'Bot',
    description: 'Runs pytest/vitest test suites, checks coverage, and verifies bug fixes.',
    capabilities: ['test_execution', 'lint_verification', 'typecheck'],
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    role: 'Architecture & Security Auditor',
    avatar: 'Bot',
    description: 'Audits changes against zero-trust policy, checks security guardrails, and validates quality.',
    capabilities: ['security_audit', 'style_governance', 'policy_validation'],
  },
  {
    id: 'planner',
    name: 'Planner',
    role: 'Strategy & DAG Decomposer',
    avatar: 'Bot',
    description: 'Decomposes complex requests into parallel task graphs and assigns worker nodes.',
    capabilities: ['dag_synthesis', 'flight_formulation', 'step_scheduling'],
  },
]

const createWelcomeMessage = (worker: (typeof SYSTEM_WORKERS)[0]): Message => ({
  id: 'welcome',
  sender_type: 'worker',
  sender_id: worker.id,
  content: `Hello! I am **${worker.name}** (${worker.role}).\n\n${worker.description}\n\nI am connected to the living **Memory Graph** and protected by the **Guardian Zero-Trust Shield**. How can I assist you with your engineering objectives today?`,
  recalled_memory_ids: ['mem-rule-01', 'mem-rule-02'],
  created_at: '2026-09-14T00:00:00.000Z',
  metadata: {
    worker_name: worker.name,
    role: worker.role,
  },
})

const createMessageId = (prefix: string) => `${prefix}-${Date.now()}`
const getIsoTimestamp = () => new Date().toISOString()

interface ChatPageProps {
  activeWorkerId: string | null
  onWorkerSelect: (workerId: string | null) => void
}

export const ChatPage: FC<ChatPageProps> = ({ activeWorkerId, onWorkerSelect }) => {
  const activeWorker = SYSTEM_WORKERS.find((w) => (activeWorkerId ? w.id === activeWorkerId : w.id === 'universal')) || SYSTEM_WORKERS[0]
  const [prevWorkerId, setPrevWorkerId] = useState(activeWorkerId)
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage(activeWorker)])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [threadId] = useState<string>('default-thread')
  const [gateStatuses, setGateStatuses] = useState<Record<string, 'approved' | 'rejected'>>({})
  const [forgottenMemoryIds, setForgottenMemoryIds] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  if (activeWorkerId !== prevWorkerId) {
    setPrevWorkerId(activeWorkerId)
    setMessages([createWelcomeMessage(activeWorker)])
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputPrompt.trim() || isGenerating) return

    const userText = inputPrompt.trim()
    setInputPrompt('')

    const userMsg: Message = {
      id: createMessageId('usr'),
      sender_type: 'user',
      sender_id: 'developer',
      content: userText,
      created_at: getIsoTimestamp(),
    }

    setMessages((prev) => [...prev, userMsg])
    setIsGenerating(true)

    try {
      // Direct call to /v1/chat/threads/{thread_id}/messages
      const res = await fetch(`http://localhost:8000/v1/chat/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userText }),
      })

      if (res.ok) {
        const json = await res.json()
        const assistantReply: Message = json.data
        setMessages((prev) => [...prev, assistantReply])
      } else {
        // Fallback simulated turn if backend dev server is currently offline
        await simulateFallbackResponse(userText)
      }
    } catch {
      await simulateFallbackResponse(userText)
    } finally {
      setIsGenerating(false)
    }
  }

  const simulateFallbackResponse = async (query: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600))
    let toolInv = undefined
    let gateId = null

    // Check if query was asking for a sensitive or gated action
    if (query.toLowerCase().includes('.env') || query.toLowerCase().includes('secret')) {
      const reply: Message = {
        id: createMessageId('reply'),
        sender_type: 'worker',
        sender_id: activeWorker.id,
        content: `❌ **Guardian Security Block**: FileGuard prevented access to environment and credential files. Reading or modifying \`.env\` is prohibited by policy.`,
        created_at: getIsoTimestamp(),
      }
      setMessages((prev) => [...prev, reply])
      return
    }

    if (query.toLowerCase().includes('run') || query.toLowerCase().includes('test') || query.toLowerCase().includes('deploy')) {
      gateId = createMessageId('gate').slice(-11)
      toolInv = [
        {
          tool: 'bash',
          args: { command: 'pytest apps/api/tests -q' },
          result: { status: 'gate_requested', reason: 'High-risk shell execution requires human gate confirmation.' },
        },
      ]
    }

    const fallbackReply: Message = {
      id: createMessageId('reply'),
      sender_type: 'worker',
      sender_id: activeWorker.id,
      content: `I have received your instruction: "${query}".\n\nAs **${activeWorker.name}**, I'm analyzing the codebase context and cross-referencing past episodic remediations. All actions remain governed under Zero-Trust approval gates.`,
      recalled_memory_ids: ['mem-rule-01'],
      tool_invocations: toolInv,
      gate_id: gateId,
      created_at: getIsoTimestamp(),
    }
    setMessages((prev) => [...prev, fallbackReply])
  }

  const handleGateAction = (gateId: string, action: 'approved' | 'rejected') => {
    setGateStatuses((prev) => ({ ...prev, [gateId]: action }))
    const systemNotice: Message = {
      id: createMessageId('sys'),
      sender_type: 'system',
      sender_id: 'gate-manager',
      content: action === 'approved'
        ? `✅ **Approval Gate ${gateId} Approved**: Human developer granted permission. Tool execution resumed.`
        : `🛑 **Approval Gate ${gateId} Denied**: Developer denied authorization. Action cancelled.`,
      created_at: getIsoTimestamp(),
    }
    setMessages((prev) => [...prev, systemNotice])
  }

  const handleForgetMemory = async (memoryId: string) => {
    setForgottenMemoryIds((prev) => new Set(prev).add(memoryId))
    try {
      await fetch(`http://localhost:8000/v1/memory/${memoryId}`, { method: 'DELETE' })
    } catch {
      // Ignored in offline dev mode
    }
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#080a0f]">
      {/* Worker Selector Bar */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-[#0b0e14]/40 px-6 py-2.5 overflow-x-auto">
        <span className="text-[11px] font-medium text-slate-300 uppercase tracking-wider shrink-0 mr-1">
          Active Worker:
        </span>
        {SYSTEM_WORKERS.map((w) => {
          const isSelected = activeWorker.id === w.id
          return (
            <button
              key={w.id}
              onClick={() => onWorkerSelect(w.id === 'universal' ? null : w.id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'border-amber-500/50 bg-amber-500/15 text-amber-300 shadow-sm shadow-amber-500/10'
                  : 'border-white/6 bg-white/2 text-slate-400 hover:border-white/15 hover:text-slate-200'
              }`}
            >
              <Bot className={`h-3.5 w-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{w.name}</span>
              <span className="text-[10px] text-slate-400">({w.role.split(' ')[0]})</span>
            </button>
          )
        })}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.sender_type === 'user'
          const isSystem = msg.sender_type === 'system'

          if (isSystem) {
            return (
              <div key={msg.id} className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/3 px-4 py-2 text-xs text-slate-300">
                <span>{msg.content}</span>
              </div>
            )
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                  isUser
                    ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                    : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Content Bubble */}
              <div className="flex flex-col space-y-2 max-w-2xl">
                <div className="flex items-center gap-2 text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-300">
                    {isUser ? 'You' : (msg.metadata?.worker_name as string) || activeWorker.name}
                  </span>
                  {!isUser && (
                    <span className="rounded bg-white/6 px-1.5 py-0.2 text-[10px] font-mono text-slate-400">
                      {(msg.metadata?.role as string) || activeWorker.role}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-300">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`rounded-xl border p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'border-cyan-500/20 bg-cyan-950/20 text-slate-200'
                      : 'border-white/10 bg-[#0e121a] text-slate-200 shadow-md shadow-black/40'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans space-y-2">{msg.content}</div>

                  {/* Recalled Memory Graph Chips */}
                  {msg.recalled_memory_ids && msg.recalled_memory_ids.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-white/6 flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[10px] font-mono font-medium text-amber-400/90">
                        <Database className="h-3 w-3" />
                        Memory Cited:
                      </span>
                      {msg.recalled_memory_ids.map((memId) => {
                        const isForgotten = forgottenMemoryIds.has(memId)
                        if (isForgotten) return null
                        return (
                          <span
                            key={memId}
                            className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300"
                          >
                            <span>{memId === 'mem-rule-01' ? 'Testing Convention (anyio)' : 'Zero-Trust Gate Guard'}</span>
                            <button
                              onClick={() => handleForgetMemory(memId)}
                              title="Forget this memory (cascade delete from Context Graph)"
                              className="text-amber-400 hover:text-rose-400 transition-colors"
                            >
                              <Eraser className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* Tool Invocations */}
                  {msg.tool_invocations && msg.tool_invocations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.tool_invocations.map((inv, idx) => (
                        <div key={idx} className="rounded-lg border border-white/8 bg-black/40 p-2.5 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <Wrench className="h-3 w-3" />
                              Tool: {inv.tool}
                            </span>
                            <span className="text-[10px]">Ephemeral Run</span>
                          </div>
                          <pre className="text-slate-300 overflow-x-auto p-1 text-[10px]">
                            {JSON.stringify(inv.args, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Interactive Approval Gate Card */}
                  {msg.gate_id && (
                    <div className="mt-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Interactive Approval Gate Required ({msg.gate_id})</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-3">
                        A critical action was intercepted by the Guardian policy engine. Review and approve before this worker can proceed.
                      </p>
                      {gateStatuses[msg.gate_id] ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          {gateStatuses[msg.gate_id] === 'approved' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approved by developer
                            </span>
                          ) : (
                            <span className="text-rose-400 flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" /> Rejected by developer
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleGateAction(msg.gate_id!, 'approved')}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve & Execute
                          </button>
                          <button
                            onClick={() => handleGateAction(msg.gate_id!, 'rejected')}
                            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 hover:bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-amber-400 animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{activeWorker.name} is synthesizing context graph and generating response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="border-t border-white/8 bg-[#0b0e14]/70 p-4 backdrop-blur-xl">
        {/* Quick prompt starters */}
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            'Explore auth routes',
            'Run test suite',
            'Search for Vite 6 migration',
            'Remember that we always use anyio',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => setInputPrompt(prompt)}
              className="rounded-full border border-white/6 bg-white/2 px-2.5 py-1 text-[11px] text-slate-400 hover:border-amber-500/30 hover:bg-amber-500/5 hover:text-amber-300 transition-all"
            >
              + {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#0e121a] px-3 py-2 shadow-inner focus-within:border-amber-500/40 focus-within:ring-1 focus-within:ring-amber-500/40">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder={`Message ${activeWorker.name} (Enter to send, Shift+Enter for new line)...`}
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-400 max-h-24 overflow-y-auto"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputPrompt.trim() || isGenerating}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 transition-colors shrink-0"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
