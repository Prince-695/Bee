import type { FC } from 'react'
import { useState } from 'react'
import { Mail, Shield, UserPlus, X } from 'lucide-react'

interface InviteMemberModalProps {
  tenantId: string
  onClose: () => void
  onInvited: () => void
}

export const InviteMemberModal: FC<InviteMemberModalProps> = ({
  tenantId,
  onClose,
  onInvited,
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/v1/tenants/${tenantId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to add member to organization')
      }

      onInvited()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error inviting member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl shadow-black text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Invite Team Member</h2>
            <p className="text-xs text-slate-400">Assign role and grant workspace permissions</p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-black/40 py-2 pl-9 pr-3 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Role & Permissions
            </label>
            <div className="space-y-2">
              {[
                { id: 'admin', title: 'Admin', desc: 'Can manage integrations, invite members, and configure runtimes' },
                { id: 'member', title: 'Member', desc: 'Can initiate missions, run flights, and chat with workers' },
                { id: 'viewer', title: 'Viewer', desc: 'Read-only access to DAG execution and audit logs' },
              ].map((r) => {
                const isSelected = role === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => setRole(r.id as any)}
                    className={`flex items-start gap-3 rounded-lg p-2.5 border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-amber-500/30 bg-amber-500/5 text-white'
                        : 'border-white/5 bg-black/20 text-slate-400 hover:border-white/10'
                    }`}
                  >
                    <Shield className={`h-4 w-4 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="font-semibold text-xs block text-white">{r.title}</span>
                      <span className="text-[11px] text-slate-400">{r.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm shadow-amber-500/20"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {loading ? 'Adding...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
