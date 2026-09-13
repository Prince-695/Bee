import type { FC } from 'react'
import { useState } from 'react'
import { Database, Eraser, Search, Tag } from 'lucide-react'

export const MemoryPage: FC = () => {
  const [activeTier, setActiveTier] = useState<'all' | 'episodic' | 'semantic' | 'working'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [memories, setMemories] = useState([
    {
      id: 'mem-01',
      title: 'Testing Framework Convention',
      content: 'Always use anyio mark for async tests in apps/api/tests, and run pytest with isolated SQLite memory database.',
      type: 'semantic',
      scope: 'user',
      confidence: 1.0,
      tags: ['testing', 'convention', 'asyncio'],
      created_at: '2026-09-13T21:00:00Z',
    },
    {
      id: 'mem-02',
      title: 'Strict FileGuard Guardrail',
      content: 'Never create, edit, modify, overwrite, or delete .env or .env.local. Update .env.example with placeholders.',
      type: 'semantic',
      scope: 'project',
      confidence: 1.0,
      tags: ['security', 'guardrail', 'env'],
      created_at: '2026-09-13T20:30:00Z',
    },
    {
      id: 'mem-03',
      title: 'Episodic Fix: Asyncpg Circular Import in db_connection',
      content: 'Normalized circular import by lazily resolving DatabaseEngine in bee_core.db.__getattr__ to ensure clean module initialization.',
      type: 'episodic',
      scope: 'project',
      confidence: 0.95,
      tags: ['remediation', 'import', 'python'],
      created_at: '2026-09-13T22:15:00Z',
    },
    {
      id: 'mem-04',
      title: 'Morning Briefing Synthesized Context',
      content: 'Latest active branch V1 completed Phase 2 Memory Graph with 132 tests passing. Next active milestone: Phase 3 Chat.',
      type: 'working',
      scope: 'worker',
      confidence: 1.0,
      tags: ['briefing', 'git', 'working_state'],
      created_at: '2026-09-13T22:45:00Z',
    },
  ])

  const handleForget = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id))
    try {
      fetch(`http://localhost:8000/v1/memory/${id}`, { method: 'DELETE' })
    } catch {
      // Ignored in offline mode
    }
  }

  const filtered = memories.filter((m) => {
    const matchesTier = activeTier === 'all' || m.type === activeTier
    const matchesQuery = !searchQuery || m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTier && matchesQuery
  })

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-[#080a0f] p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-400" />
            Living Memory & Context Graph
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, inspect, and manage what Bee remembers across Episodic, Semantic, and Working tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-[#0e121a] px-3 py-1.5 text-xs text-slate-300">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-xs text-white placeholder:text-slate-400 w-44"
            />
          </div>
        </div>
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/8 pb-3">
        {[
          { id: 'all', label: 'All Tiers' },
          { id: 'semantic', label: 'Semantic (Preferences & Rules)' },
          { id: 'episodic', label: 'Episodic (Past Fixes & Runs)' },
          { id: 'working', label: 'Working (Active Blackboard)' },
        ].map((tier) => (
          <button
            key={tier.id}
            onClick={() => setActiveTier(tier.id as any)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTier === tier.id
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((mem) => (
          <div
            key={mem.id}
            className="flex flex-col rounded-xl border border-white/8 bg-[#0e121a] p-5 shadow-lg shadow-black/30 hover:border-white/15 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 uppercase border border-amber-500/20">
                  {mem.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Scope: {mem.scope}
                </span>
              </div>
              <button
                onClick={() => handleForget(mem.id)}
                title="Forget this memory (permanent cascade delete)"
                className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Eraser className="h-3 w-3" />
                Forget
              </button>
            </div>

            <h3 className="font-semibold text-sm text-white mb-2">{mem.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4 flex-1">{mem.content}</p>

            <div className="flex items-center justify-between pt-3 border-t border-white/6 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-slate-400" />
                <div className="flex flex-wrap gap-1">
                  {mem.tags.map((t, idx) => (
                    <span key={idx} className="font-mono text-[10px] text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="font-mono text-[10px] text-emerald-400">
                Confidence: {(mem.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
