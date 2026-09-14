import type { FC } from 'react'
import { useState } from 'react'
import { Eye, EyeOff, Key, Lock, ShieldCheck, X } from 'lucide-react'
import type { Integration } from './IntegrationCard'

interface ConnectModalProps {
  integration: Integration
  onClose: () => void
  onConnected: () => void
}

export const ConnectModal: FC<ConnectModalProps> = ({
  integration,
  onClose,
  onConnected,
}) => {
  const defaultKey = integration.credential_keys[0] || 'API_KEY'
  const [credentialKey, setCredentialKey] = useState(defaultKey)
  const [credentialValue, setCredentialValue] = useState('')
  const [label, setLabel] = useState(`${integration.name} Vault Secret`)
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credentialValue.trim()) {
      setError('Please provide a valid secret value')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/v1/mcp/integrations/${integration.id}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          credential_key: credentialKey,
          credential_value: credentialValue.trim(),
          label: label.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to safely vault integration secret')
      }

      onConnected()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error connecting integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl shadow-black text-slate-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Connect {integration.name}</h2>
            <p className="text-xs text-slate-400">Enterprise Encrypted Vault Secret</p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            AES-256-GCM Vault Encryption Enforced
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            Secrets are encrypted at rest with per-tenant cryptographic keys. Plaintext values are never logged, cached, or exposed across workers without explicit user approval gates.
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Credential Key Name
            </label>
            {integration.credential_keys.length > 1 ? (
              <select
                value={credentialKey}
                onChange={(e) => setCredentialKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              >
                {integration.credential_keys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={credentialKey}
                onChange={(e) => setCredentialKey(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-amber-500 focus:outline-none font-mono"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Secret Value ({credentialKey})
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                placeholder={`Paste your secret ${credentialKey}...`}
                value={credentialValue}
                onChange={(e) => setCredentialValue(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 pr-10 text-white focus:border-amber-500 focus:outline-none font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              Friendly Label (Optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm shadow-amber-500/20"
            >
              <Lock className="h-3.5 w-3.5" />
              {loading ? 'Vaulting...' : 'Save & Encrypt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
