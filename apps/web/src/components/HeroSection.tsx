import type { FC } from 'react'
import { useState } from 'react'
import {
  Apple,
  Bot,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Download,
  Laptop,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react'

export const HeroSection: FC = () => {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'mac' | 'linux'>(() => {
    if (typeof window === 'undefined') return 'linux'
    const userAgent = window.navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) return 'windows'
    if (userAgent.includes('mac')) return 'mac'
    return 'linux'
  })
  const [copied, setCopied] = useState(false)
  const [showOsMenu, setShowOsMenu] = useState(false)

  const osDetails = {
    windows: {
      name: 'Windows',
      file: 'bee-desktop-setup-0.1.0.exe',
      icon: Laptop,
      arch: 'x64 Installer (64-bit)',
    },
    mac: {
      name: 'macOS',
      file: 'bee-desktop-0.1.0-arm64.dmg',
      icon: Apple,
      arch: 'Apple Silicon / Intel DMG',
    },
    linux: {
      name: 'Linux',
      file: 'bee-desktop-0.1.0.AppImage',
      icon: Terminal,
      arch: '.AppImage & .deb (x86_64)',
    },
  }

  const currentOS = osDetails[detectedOS]

  const handleCopyInstall = () => {
    navigator.clipboard.writeText('git clone https://github.com/Prince-695/Bee.git && cd Bee && pnpm install && pnpm dev:desktop')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Ambient background glows */}
      <div className="ambient-glow pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[600px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[130px]" />
      <div className="ambient-glow pointer-events-none absolute top-40 right-10 -z-10 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center">
          {/* Release Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-medium text-amber-300 backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Bee v0.1.0 Release Candidate</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Native Electron + FastAPI Sidecar</span>
          </div>

          {/* Main Title */}
          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            The Autonomous Multi-Worker <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Co-Engineering Platform
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Replace fragmented coding assistants with a coordinated swarm of 6 specialized, undestroyable workers. Powered by a 3-tier living memory graph, topological DAG routes, and zero-trust human approval gates.
          </p>

          {/* Primary Download CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            {/* Primary Detected OS Download Button */}
            <div className="relative">
              <div className="flex items-center">
                <a
                  href={`#downloads`}
                  id="hero-download-primary"
                  className="group flex items-center gap-3 rounded-l-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all"
                >
                  <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  <div className="flex flex-col text-left leading-tight">
                    <span>Download for {currentOS.name}</span>
                    <span className="text-[10px] font-medium opacity-80">{currentOS.arch}</span>
                  </div>
                </a>
                <button
                  onClick={() => setShowOsMenu(!showOsMenu)}
                  className="rounded-r-xl border-l border-amber-600/40 bg-amber-500 px-3 py-4 text-black hover:bg-amber-400 transition-colors"
                  aria-label="Select Operating System"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* OS Selection Dropdown */}
              {showOsMenu && (
                <div className="absolute top-full mt-2 w-56 rounded-xl border border-white/10 bg-[#0e121a] p-2 shadow-2xl z-30">
                  {(['windows', 'mac', 'linux'] as const).map((osKey) => {
                    const os = osDetails[osKey]
                    const Icon = os.icon
                    return (
                      <button
                        key={osKey}
                        onClick={() => {
                          setDetectedOS(osKey)
                          setShowOsMenu(false)
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-left transition-colors ${
                          detectedOS === osKey
                            ? 'bg-amber-500/15 text-amber-300 font-semibold'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <div>
                          <div>{os.name}</div>
                          <div className="text-[10px] text-slate-500">{os.arch}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quickstart Command Box */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0c0f17]/90 px-4 py-3 backdrop-blur-md">
              <Terminal className="h-4 w-4 text-slate-400 shrink-0" />
              <code className="font-mono text-xs text-slate-300 select-all">
                pnpm dev:desktop
              </code>
              <button
                onClick={handleCopyInstall}
                className="ml-2 rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
                title="Copy bootstrap command"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Highlight badges under CTA */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Zero-Trust Gate Protection
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-amber-400" /> 6 Undestroyable Workers
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" /> gemini-3.5-flash Native
            </span>
          </div>

          {/* Product Surface Mockup Preview */}
          <div className="relative mt-14 w-full max-w-5xl rounded-2xl border border-white/12 bg-[#0a0d14]/90 p-2 shadow-2xl shadow-black/80 backdrop-blur-2xl">
            {/* Window chrome header */}
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-400">Bee Desktop v0.1.0 • Workspace: Prince-695/Bee</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  Sidecar: Healthy (:8000)
                </span>
                <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/20">
                  Zero-Trust Active
                </span>
              </div>
            </div>

            {/* Mockup content representation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 text-left">
              {/* Left sidebar mock */}
              <div className="space-y-2 rounded-xl border border-white/6 bg-white/2 p-3">
                <div className="text-[10px] font-mono uppercase text-slate-500">Worker Swarm</div>
                {['Bee Orchestrator', 'Scout (Explorer)', 'Builder (Implementation)', 'Verifier (QA)', 'Reviewer (Security)', 'BrowserWorker'].map((name, i) => (
                  <div
                    key={name}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs ${
                      i === 0 ? 'bg-amber-500/15 text-amber-300 font-medium' : 'text-slate-400'
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>

              {/* Chat & Gate preview mock */}
              <div className="md:col-span-3 space-y-3 rounded-xl border border-white/6 bg-[#080a0f] p-4 font-sans">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold">
                    B
                  </div>
                  <div className="flex-1 space-y-2 text-xs text-slate-300">
                    <p>
                      Synthesized topological DAG flight route for <span className="text-amber-400 font-semibold">Phase 3 Autonomous Swarm</span>. Recalled memory: <code className="text-amber-300 font-mono">#strict-env-guardrail</code>.
                    </p>
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-rose-400">
                        <span>Interactive Approval Gate #981241</span>
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-mono">HIGH RISK</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-300">
                        Action: <code className="text-slate-200">pytest apps/api/tests -q</code> • Intercepted by Guardian Engine.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-medium text-white">
                          Approve & Execute
                        </span>
                        <span className="rounded border border-rose-500/40 px-2 py-0.5 text-[10px] text-rose-300">
                          Deny
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
