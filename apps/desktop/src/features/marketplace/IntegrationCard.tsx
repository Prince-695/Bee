import type { FC } from 'react'
import {
  Activity,
  BarChart2,
  Box,
  Check,
  CheckCircle,
  Database,
  ExternalLink,
  FileCode,
  GitBranch,
  Globe,
  Lock,
  Mail,
  MessageSquare,
  PlugZap,
  Send,
  Sliders,
  Terminal,
  Trash2,
} from 'lucide-react'

export interface Integration {
  id: string
  name: string
  category: string
  description: string
  icon: string
  is_connected: boolean
  masked_credential_preview?: string | null
  requires_credentials: boolean
  credential_keys: string[]
  tools: string[]
  execution_scope: 'LOCAL' | 'CLOUD' | 'HYBRID'
  documentation_url?: string | null
}

interface IntegrationCardProps {
  integration: Integration
  onConnect: (intg: Integration) => void
  onDisconnect: (intg: Integration) => void
  onProvision: (intg: Integration) => void
}

export const IntegrationCard: FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onDisconnect,
  onProvision,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'github':
        return <GitBranch className="h-5 w-5 text-white" />
      case 'message-square':
        return <MessageSquare className="h-5 w-5 text-emerald-400" />
      case 'check-square':
      case 'check-circle':
        return <CheckCircle className="h-5 w-5 text-blue-400" />
      case 'database':
        return <Database className="h-5 w-5 text-indigo-400" />
      case 'box':
        return <Box className="h-5 w-5 text-cyan-400" />
      case 'globe':
        return <Globe className="h-5 w-5 text-amber-400" />
      case 'activity':
        return <Activity className="h-5 w-5 text-rose-400" />
      case 'bar-chart-2':
        return <BarChart2 className="h-5 w-5 text-violet-400" />
      case 'mail':
        return <Mail className="h-5 w-5 text-red-400" />
      case 'send':
        return <Send className="h-5 w-5 text-indigo-300" />
      case 'file-code':
        return <FileCode className="h-5 w-5 text-emerald-300" />
      default:
        return <PlugZap className="h-5 w-5 text-amber-400" />
    }
  }

  const getScopeBadge = (scope: string) => {
    switch (scope) {
      case 'LOCAL':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300 border border-amber-500/20">
            <Terminal className="h-2.5 w-2.5" />
            LOCAL
          </span>
        )
      case 'CLOUD':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300 border border-cyan-500/20">
            <Globe className="h-2.5 w-2.5" />
            CLOUD
          </span>
        )
      case 'HYBRID':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-300 border border-emerald-500/20">
            <PlugZap className="h-2.5 w-2.5" />
            HYBRID
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-white/8 bg-[#0e121b]/80 p-5 shadow-lg shadow-black/40 backdrop-blur-sm transition-all hover:border-white/15 hover:shadow-xl hover:shadow-black/60">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
              {getIcon(integration.icon)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">{integration.name}</h3>
              <p className="text-[11px] text-slate-400">{integration.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {getScopeBadge(integration.execution_scope)}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3 text-xs leading-relaxed text-slate-300 line-clamp-2">
          {integration.description}
        </p>

        {/* Provided Tools */}
        <div className="mt-3.5 space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Provided Tools</span>
          <div className="flex flex-wrap gap-1">
            {integration.tools.map((t) => (
              <span
                key={t}
                className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-white/5"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Connection State Info */}
        {integration.is_connected && integration.masked_credential_preview && (
          <div className="mt-3.5 flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Lock className="h-3 w-3" />
              Vault Secret
            </span>
            <span className="font-mono text-slate-300">{integration.masked_credential_preview}</span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
        <div>
          {integration.is_connected ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              Connected
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Requires Setup</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {integration.is_connected && (
            <button
              onClick={() => onProvision(integration)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
              title="Assign tools to worker fleet"
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              Provision
            </button>
          )}

          {integration.requires_credentials ? (
            integration.is_connected ? (
              <button
                onClick={() => onDisconnect(integration)}
                className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                title="Disconnect integration and purge vault key"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Revoke
              </button>
            ) : (
              <button
                onClick={() => onConnect(integration)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20"
              >
                <PlugZap className="h-3.5 w-3.5" />
                Connect
              </button>
            )
          ) : (
            <button
              onClick={() => onProvision(integration)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              Active
            </button>
          )}

          {integration.documentation_url && (
            <a
              href={integration.documentation_url}
              target="_blank"
              rel="noreferrer"
              className="rounded p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              title="Documentation"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
