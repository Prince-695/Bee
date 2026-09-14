import type { FC } from 'react'
import { useEffect, useState } from 'react'
import {
  Coins,
  Laptop,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { InviteMemberModal } from './InviteMemberModal'
import { UsageSpendView } from './UsageSpendView'

interface Member {
  id: string
  email: string
  full_name: string
  avatar_url?: string | null
  role: 'owner' | 'admin' | 'member' | 'viewer'
  created_at: string
}

interface PairedRuntime {
  id: string
  runtime_id: string
  machine_name: string
  os_name: string
  capabilities: string[]
  status: 'online' | 'busy' | 'idle' | 'offline' | 'connected'
  last_heartbeat_at: string
  metadata: Record<string, any>
  created_at: string
}

interface AuditLogEntry {
  id: string
  action: string
  user_id?: string | null
  resource_type?: string | null
  resource_id?: string | null
  ip_address?: string | null
  created_at: string
  metadata?: Record<string, any>
}

export const GovernancePage: FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'fleet' | 'audit' | 'usage'>('team')

  // Organization state
  const [members, setMembers] = useState<Member[]>([])
  const [currentTenantId, setCurrentTenantId] = useState<string>('default')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Workstation Fleet state
  const [runtimes, setRuntimes] = useState<PairedRuntime[]>([])
  const [loadingRuntimes, setLoadingRuntimes] = useState(false)

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  // Policy toggles
  const [requireLocalApproval, setRequireLocalApproval] = useState(true)
  const [enforceFlightGates, setEnforceFlightGates] = useState(true)
  const [autoReapStale, setAutoReapStale] = useState(true)

  useEffect(() => {
    fetchTenantData()
    fetchRuntimes()
    fetchAuditLogs()
  }, [])

  const fetchTenantData = async () => {
    setLoadingMembers(true)
    try {
      // 1. Fetch user's tenants
      const tRes = await fetch('/v1/tenants', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (tRes.ok) {
        const tData = await tRes.json()
        const primary = tData.tenants?.[0]?.id || 'default'
        setCurrentTenantId(primary)

        // 2. Fetch members for tenant
        const mRes = await fetch(`/v1/tenants/${primary}/members`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        })
        if (mRes.ok) {
          const mData = await mRes.json()
          setMembers(mData.members || [])
        }
      }
    } catch (err) {
      console.error('Failed to load organization members', err)
    } finally {
      setLoadingMembers(false)
    }
  }

  const fetchRuntimes = async () => {
    setLoadingRuntimes(true)
    try {
      const res = await fetch('/v1/runtimes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRuntimes(data.runtimes || [])
      }
    } catch (err) {
      console.error('Failed to load paired runtimes', err)
    } finally {
      setLoadingRuntimes(false)
    }
  }

  const fetchAuditLogs = async () => {
    setLoadingAudit(true)
    try {
      const res = await fetch('/v1/security/audit-logs?limit=50', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to load audit logs', err)
    } finally {
      setLoadingAudit(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/v1/tenants/${currentTenantId}/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        fetchTenantData()
      }
    } catch (err) {
      console.error('Error updating member role', err)
    }
  }

  const handleRevokeRuntime = async (runtimeId: string) => {
    if (!confirm('Are you sure you want to revoke this workstation pairing?')) return
    try {
      const res = await fetch(`/v1/runtimes/${runtimeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
      if (res.ok) {
        fetchRuntimes()
      }
    } catch (err) {
      console.error('Error revoking runtime', err)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#080a0f] p-6 text-slate-200">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Multi-Tenant Governance & RBAC
            </h1>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-medium text-emerald-300">
              Enterprise Ready
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Control organization membership, inspect paired workstation fleets, view audit logs, and meter compute spend.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'team' && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors shadow-sm shadow-amber-500/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="mt-6 flex gap-2 border-b border-white/8 pb-3">
        {[
          { id: 'team', label: 'Team & RBAC', icon: Users, badge: `${members.length} Members` },
          { id: 'fleet', label: 'Workstation Fleet', icon: Laptop, badge: `${runtimes.length} Connected` },
          { id: 'audit', label: 'Security Audit Log', icon: Shield, badge: 'Zero-Trust' },
          { id: 'usage', label: 'Usage & Spend', icon: Coins, badge: 'Telemetry' },
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/5'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
              {tab.label}
              {tab.badge && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono ${
                    isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-6 flex-1">
        {/* SUBTAB 1: Team & RBAC */}
        {activeSubTab === 'team' && (
          <div className="space-y-6">
            {/* Zero-Trust Policy Matrix */}
            <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
              <h3 className="text-sm font-semibold text-white">Zero-Trust Organization Policies</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Governance guardrails applied automatically across all autonomous agents
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div
                  onClick={() => setRequireLocalApproval(!requireLocalApproval)}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 p-3 cursor-pointer hover:border-white/10 transition-colors"
                >
                  <div>
                    <span className="font-medium text-xs text-white block">LOCAL Shell Guard</span>
                    <span className="text-[11px] text-slate-400">Require human approval for bash executions</span>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full transition-colors p-0.5 ${
                      requireLocalApproval ? 'bg-amber-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        requireLocalApproval ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setEnforceFlightGates(!enforceFlightGates)}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 p-3 cursor-pointer hover:border-white/10 transition-colors"
                >
                  <div>
                    <span className="font-medium text-xs text-white block">Flight Patch Gates</span>
                    <span className="text-[11px] text-slate-400">Require approval before applying git diffs</span>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full transition-colors p-0.5 ${
                      enforceFlightGates ? 'bg-amber-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        enforceFlightGates ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>

                <div
                  onClick={() => setAutoReapStale(!autoReapStale)}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-black/30 p-3 cursor-pointer hover:border-white/10 transition-colors"
                >
                  <div>
                    <span className="font-medium text-xs text-white block">Workstation Heartbeats</span>
                    <span className="text-[11px] text-slate-400">Mark offline after 60s inactivity</span>
                  </div>
                  <div
                    className={`h-5 w-9 rounded-full transition-colors p-0.5 ${
                      autoReapStale ? 'bg-amber-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full bg-white transition-transform ${
                        autoReapStale ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Member Roster */}
            <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Team Members</h3>
                  <p className="text-xs text-slate-400">Role-Based Access Control (RBAC) definitions</p>
                </div>
                <button
                  onClick={fetchTenantData}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingMembers ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2.5 font-medium">User</th>
                      <th className="pb-2.5 font-medium">Email</th>
                      <th className="pb-2.5 font-medium">Role</th>
                      <th className="pb-2.5 font-medium">Joined</th>
                      <th className="pb-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-white/2">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 font-semibold text-[11px] text-amber-400">
                              {m.full_name?.charAt(0) || m.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{m.full_name || 'Member'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[11px]">{m.email}</td>
                        <td className="py-3">
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.id, e.target.value)}
                            disabled={m.role === 'owner'}
                            className={`rounded-lg border px-2 py-1 text-[11px] font-mono font-medium focus:outline-none bg-black/40 ${
                              m.role === 'owner'
                                ? 'border-amber-500/30 text-amber-300'
                                : m.role === 'admin'
                                ? 'border-cyan-500/30 text-cyan-300'
                                : 'border-white/10 text-slate-300'
                            }`}
                          >
                            <option value="owner" disabled>
                              Owner
                            </option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-3 text-slate-500 text-[11px] font-mono">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 text-right">
                          {m.role !== 'owner' && (
                            <span className="text-[11px] text-slate-500">Configured</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: Workstation Fleet */}
        {activeSubTab === 'fleet' && (
          <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Paired Workstation Fleet</h3>
                <p className="text-xs text-slate-400">
                  Local execution engines running Bee Desktop / CLI with shell and filesystem capabilities
                </p>
              </div>
              <button
                onClick={fetchRuntimes}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRuntimes ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {runtimes.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No workstations currently paired. Open the Marketplace tab and click "Pair Machine" to connect a desktop runtime.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2.5 font-medium">Workstation</th>
                      <th className="pb-2.5 font-medium">OS</th>
                      <th className="pb-2.5 font-medium">Capabilities</th>
                      <th className="pb-2.5 font-medium">Status</th>
                      <th className="pb-2.5 font-medium">Last Heartbeat</th>
                      <th className="pb-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {runtimes.map((rt) => {
                      const isOnline = ['online', 'busy', 'idle', 'connected'].includes(rt.status)
                      return (
                        <tr key={rt.id} className="hover:bg-white/2">
                          <td className="py-3">
                            <div className="flex items-center gap-2.5">
                              <Laptop className="h-4 w-4 text-amber-400" />
                              <span className="font-medium text-white">{rt.machine_name}</span>
                            </div>
                          </td>
                          <td className="py-3 font-mono capitalize text-slate-400">{rt.os_name}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {(rt.capabilities || []).map((c) => (
                                <span
                                  key={c}
                                  className="rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 border border-white/5"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium font-mono ${
                                isOnline
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                              />
                              {rt.status}
                            </span>
                          </td>
                          <td className="py-3 text-[11px] font-mono text-slate-400">
                            {rt.last_heartbeat_at
                              ? new Date(rt.last_heartbeat_at).toLocaleTimeString()
                              : 'Pending'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRevokeRuntime(rt.runtime_id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/15 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Revoke
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 3: Security Audit Log */}
        {activeSubTab === 'audit' && (
          <div className="rounded-xl border border-white/8 bg-[#0e121b] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Chronological Security Audit Log</h3>
                <p className="text-xs text-slate-400">
                  Immutable event records for runtime pairings, gate resolutions, and tool executions
                </p>
              </div>
              <button
                onClick={fetchAuditLogs}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loadingAudit ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No security events recorded yet. Actions like runtime pairing and gate resolution will stream here in real time.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-2.5 font-medium">Timestamp</th>
                      <th className="pb-2.5 font-medium">Action</th>
                      <th className="pb-2.5 font-medium">Resource</th>
                      <th className="pb-2.5 font-medium">Actor / IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/2">
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-amber-400 font-semibold">{log.action}</td>
                        <td className="py-2.5 text-slate-300">
                          {log.resource_type ? `${log.resource_type}:${log.resource_id || ''}` : '-'}
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">
                          {log.user_id || log.ip_address || 'system'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: Usage & Spend */}
        {activeSubTab === 'usage' && <UsageSpendView />}
      </div>

      {/* Modals */}
      {showInviteModal && (
        <InviteMemberModal
          tenantId={currentTenantId}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            fetchTenantData()
          }}
        />
      )}
    </div>
  )
}
