import type { FC } from 'react'
import { useState } from 'react'
import { Check, Copy, Laptop, Terminal, X } from 'lucide-react'

interface RuntimePairingModalProps {
  onClose: () => void
  onPaired: () => void
}

export const RuntimePairingModal: FC<RuntimePairingModalProps> = ({
  onClose,
  onPaired,
}) => {
  const [machineName, setMachineName] = useState('Local-Workstation')
  const [osName, setOsName] = useState<'darwin' | 'linux' | 'windows'>('linux')
  const [pairingKey, setPairingKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerateKey = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/v1/runtimes/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          machine_name: machineName,
          os_name: osName,
          capabilities: ['filesystem', 'terminal', 'docker', 'git'],
        }),
      })

      if (!res.ok) throw new Error('Failed to register workstation runtime')
      const data = await res.json()
      setPairingKey(data.pairing_key)
      onPaired()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration error')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl shadow-black text-slate-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Pair Workstation Runtime</h2>
            <p className="text-xs text-slate-400">
              Connect local machine capabilities (shell, filesystem, docker) to Bee Cloud
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {!pairingKey ? (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Workstation Name
              </label>
              <input
                type="text"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                placeholder="e.g. MacBook-Pro.local or Ubuntu-Devbox"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Operating System
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['darwin', 'linux', 'windows'] as const).map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => setOsName(os)}
                    className={`rounded-lg py-2 text-xs font-mono font-medium capitalize border transition-all ${
                      osName === os
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-white/10 bg-black/40 text-slate-400 hover:text-white'
                    }`}
                  >
                    {os === 'darwin' ? 'macOS' : os}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateKey}
                disabled={loading || !machineName.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 disabled:opacity-50 transition-colors shadow-sm shadow-amber-500/20"
              >
                <Terminal className="h-3.5 w-3.5" />
                {loading ? 'Registering...' : 'Generate Pairing Key'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="text-[11px] text-amber-400 font-semibold block mb-1">
                One-Time Runtime Pairing Token
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Run this command in your local workstation terminal to connect this machine to Bee Cloud.
              </p>

              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-black/60 border border-white/10 p-2.5 font-mono text-[11px] text-amber-300">
                <span className="truncate mr-2">
                  bee runtime pair --key {pairingKey}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`bee runtime pair --key ${pairingKey}`)}
                  className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/8">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/15"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
