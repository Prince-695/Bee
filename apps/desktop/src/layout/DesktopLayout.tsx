import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  Bot,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Database,
  GitFork,
  MessageSquare,
  ShieldAlert,
  Zap,
} from 'lucide-react'

interface DesktopLayoutProps {
  children: ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  activeWorkerId: string | null
  onWorkerSelect: (workerId: string | null) => void
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  activeWorkerId,
  onWorkerSelect,
}) => {
  const [collapsed, setCollapsed] = useState(false)

  const navItems = [
    { id: 'chat', label: 'Chat & Swarm', icon: MessageSquare, badge: 'Phase 3' },
    { id: 'workers', label: 'Worker Fleet', icon: Bot, badge: '6 Core' },
    { id: 'memory', label: 'Memory Graph', icon: Database, badge: 'Hybrid' },
    { id: 'missions', label: 'DAG Missions', icon: GitFork },
    { id: 'approvals', label: 'Gate Approvals', icon: ShieldAlert, badge: 'Zero-Trust' },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080a0f] text-slate-200">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-white/8 bg-[#0b0e14]/90 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? 'w-18' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/8 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
              <Zap className="h-4.5 w-4.5 text-black fill-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                  Bee Desktop <span className="rounded bg-amber-500/15 px-1 py-0.2 text-[10px] font-mono font-medium text-amber-400">v0.1.0</span>
                </span>
                <span className="text-[11px] text-slate-400">Autonomous OS</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 space-y-1 p-2.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-slate-300 uppercase">
              Platform
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                {!collapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom System Status */}
        <div className="border-t border-white/8 p-3 bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </div>
            {!collapsed && (
              <div className="flex flex-col overflow-hidden text-[11px]">
                <span className="font-medium text-slate-300 truncate">Bee Engine Online</span>
                <span className="text-[10px] text-slate-300 truncate">FastAPI :8000 • SQLite/pgvector</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Surface Container */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#080a0f]">
        {/* Header Bar */}
        <header className="flex h-14 items-center justify-between border-b border-white/8 bg-[#0b0e14]/60 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <span>Platform</span>
              <span className="text-slate-600">/</span>
              <span className="font-medium text-slate-200 capitalize">{activeTab}</span>
            </div>
            {activeWorkerId ? (
              <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                <Bot className="h-3 w-3" />
                1:1 with {activeWorkerId}
                <button
                  onClick={() => onWorkerSelect(null)}
                  className="ml-1 hover:text-white"
                  title="Switch to Universal Orchestrator"
                >
                  ×
                </button>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
                <BrainCircuit className="h-3 w-3" />
                Universal Orchestrator Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-1 text-xs">
              <span className="text-slate-300">Model:</span>
              <span className="font-mono text-amber-400">gemini-3.5-flash</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/3 px-3 py-1 text-xs">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-300">Guardian: Zero-Trust</span>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </main>
    </div>
  )
}
