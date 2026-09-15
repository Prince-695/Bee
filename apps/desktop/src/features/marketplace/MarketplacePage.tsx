import type { FC } from 'react'
import { useEffect, useState } from 'react'
import {
  Boxes,
  Globe,
  Laptop,
  PlugZap,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react'
import { ConnectModal } from './ConnectModal'
import { IntegrationCard, type Integration } from './IntegrationCard'
import { RuntimePairingModal } from './RuntimePairingModal'
import { WorkerProvisioningModal } from './WorkerProvisioningModal'

interface PairedRuntimeSummary {
  id: string
  machine_name: string
  status: string
}

export const MarketplacePage: FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedScope, setSelectedScope] = useState<string>('all')

  // Runtime Bridge State
  const [pairedRuntimes, setPairedRuntimes] = useState<PairedRuntimeSummary[]>([])
  const [hasOnlineRuntime, setHasOnlineRuntime] = useState(false)

  // Modals
  const [connectTarget, setConnectTarget] = useState<Integration | null>(null)
  const [provisionTarget, setProvisionTarget] = useState<Integration | null>(null)
  const [showPairingModal, setShowPairingModal] = useState(false)

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/v1/mcp/integrations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrations(data.integrations || [])
      }
    } catch (err) {
      console.error('Failed to fetch curated integrations', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRuntimes = async () => {
    try {
      const res = await fetch('/v1/runtimes', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        const runtimes: PairedRuntimeSummary[] = data.runtimes || []
        setPairedRuntimes(runtimes)
        const online = runtimes.some((r) =>
          ['online', 'busy', 'idle', 'connected'].includes(r.status)
        )
        setHasOnlineRuntime(online)
      }
    } catch (err) {
      console.error('Failed to fetch runtimes', err)
    }
  }

  useEffect(() => {
    let ignore = false
    const initData = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const [intRes, runRes] = await Promise.all([
          fetch('/v1/mcp/integrations', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/v1/runtimes', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!ignore && intRes.ok) {
          const data = await intRes.json()
          setIntegrations(data.integrations || [])
        }
        if (!ignore && runRes.ok) {
          const data = await runRes.json()
          const runtimes: PairedRuntimeSummary[] = data.runtimes || []
          setPairedRuntimes(runtimes)
          const online = runtimes.some((r) =>
            ['online', 'busy', 'idle', 'connected'].includes(r.status)
          )
          setHasOnlineRuntime(online)
        }
      } catch (err) {
        console.error('Failed to fetch marketplace data', err)
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }
    initData()
    return () => {
      ignore = true
    }
  }, [])

  const handleDisconnect = async (intg: Integration) => {
    if (!confirm(`Are you sure you want to disconnect ${intg.name} and purge its credentials?`)) {
      return
    }
    try {
      const res = await fetch(`/v1/mcp/integrations/${intg.id}/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
      })
      if (res.ok) {
        fetchIntegrations()
      }
    } catch (err) {
      console.error('Failed to disconnect integration', err)
    }
  }

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'version control', label: 'Code & Git' },
    { id: 'communication', label: 'Communication' },
    { id: 'issue tracking', label: 'Issue Trackers' },
    { id: 'databases', label: 'Databases' },
    { id: 'observability', label: 'Observability' },
    { id: 'runtime sandbox', label: 'Sandbox & Local' },
  ]

  const filteredIntegrations = integrations.filter((item) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = item.name.toLowerCase().includes(q)
      const matchDesc = item.description.toLowerCase().includes(q)
      const matchTool = item.tools.some((t) => t.toLowerCase().includes(q))
      if (!matchName && !matchDesc && !matchTool) return false
    }

    // Category
    if (selectedCategory !== 'all') {
      if (!item.category.toLowerCase().includes(selectedCategory)) {
        return false
      }
    }

    // Scope
    if (selectedScope !== 'all') {
      if (item.execution_scope !== selectedScope) {
        return false
      }
    }

    return true
  })

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#080a0f] p-6 text-slate-200">
      {/* Top Banner: Header & Workstation Runtime Bridge */}
      <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Boxes className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              MCP Marketplace & Curated Tools
            </h1>
            <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-medium text-amber-300">
              Hybrid v1.0
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Provision cloud FastMCP servers and local workstation tools to autonomous workers with zero-trust credential vaulting.
          </p>
        </div>

        {/* Workstation Bridge Health Pill */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setShowPairingModal(true)}
            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 cursor-pointer transition-all ${
              hasOnlineRuntime
                ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300'
            }`}
          >
            <div className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  hasOnlineRuntime ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${
                  hasOnlineRuntime ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="flex flex-col text-left text-[11px]">
              <span className="font-semibold">
                {hasOnlineRuntime
                  ? `${pairedRuntimes[0]?.machine_name || 'Workstation'} Online`
                  : 'Workstation Offline'}
              </span>
              <span className="text-[10px] opacity-75">
                {hasOnlineRuntime ? 'Local Shell & Filesystem Ready' : 'Pair local CLI / Desktop'}
              </span>
            </div>
            <Laptop className="h-4 w-4 ml-1 opacity-75" />
          </div>

          <button
            onClick={() => setShowPairingModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <PlugZap className="h-3.5 w-3.5 text-amber-400" />
            Pair Machine
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search integrations, tools, or providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0e121b] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Scope Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Scopes' },
            { id: 'LOCAL', label: 'Local Only', icon: Terminal },
            { id: 'CLOUD', label: 'Cloud FastMCP', icon: Globe },
            { id: 'HYBRID', label: 'Hybrid Adaptive', icon: PlugZap },
          ].map((scope) => {
            const isSelected = selectedScope === scope.id
            const Icon = scope.icon
            return (
              <button
                key={scope.id}
                onClick={() => setSelectedScope(scope.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
                }`}
              >
                {Icon && <Icon className="h-3 w-3" />}
                {scope.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category Pills */}
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isSelected
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Integrations Grid */}
      <div className="mt-6 flex-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-400">
            <RefreshCw className="h-5 w-5 animate-spin text-amber-400 mr-2" />
            Loading curated integrations catalog...
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/2 p-8 text-center text-slate-400">
            <Boxes className="h-8 w-8 text-slate-500 mb-2" />
            <p className="text-xs">No integrations matching your filters</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedScope('all')
              }}
              className="mt-3 text-xs text-amber-400 hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredIntegrations.map((intg) => (
              <IntegrationCard
                key={intg.id}
                integration={intg}
                onConnect={(item) => setConnectTarget(item)}
                onDisconnect={(item) => handleDisconnect(item)}
                onProvision={(item) => setProvisionTarget(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {connectTarget && (
        <ConnectModal
          integration={connectTarget}
          onClose={() => setConnectTarget(null)}
          onConnected={() => {
            fetchIntegrations()
            setConnectTarget(null)
          }}
        />
      )}

      {provisionTarget && (
        <WorkerProvisioningModal
          integration={provisionTarget}
          onClose={() => setProvisionTarget(null)}
        />
      )}

      {showPairingModal && (
        <RuntimePairingModal
          onClose={() => setShowPairingModal(false)}
          onPaired={() => {
            fetchRuntimes()
          }}
        />
      )}
    </div>
  )
}
