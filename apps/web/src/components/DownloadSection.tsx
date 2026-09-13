import type { FC } from 'react'
import {
  Apple,
  Download,
  FileDown,
  Laptop,
  Shield,
  Terminal,
} from 'lucide-react'

export const DownloadSection: FC = () => {
  const downloadOptions = [
    {
      os: 'Windows',
      icon: Laptop,
      color: 'amber',
      recommended: false,
      files: [
        { name: 'Bee-Desktop-Setup-0.1.0.exe', desc: 'x64 NSIS Installer (Windows 10/11)', size: '84.2 MB', primary: true },
        { name: 'Bee-Desktop-0.1.0-win-x64.zip', desc: 'Portable x64 Archive', size: '92.4 MB', primary: false },
      ],
      requirements: 'Windows 10/11 (64-bit), Node 20+, Python 3.11+ (for sidecar)',
    },
    {
      os: 'Linux',
      icon: Terminal,
      color: 'cyan',
      recommended: true,
      files: [
        { name: 'Bee-Desktop-0.1.0.AppImage', desc: 'Universal AppImage (Any Distro)', size: '88.6 MB', primary: true },
        { name: 'bee-desktop_0.1.0_amd64.deb', desc: 'Debian / Ubuntu Package', size: '76.1 MB', primary: false },
        { name: 'bee-desktop-0.1.0.tar.gz', desc: 'Standalone Binary Tarball', size: '89.0 MB', primary: false },
      ],
      requirements: 'glibc 2.31+, Python 3.11+, pnpm / Node 20+',
    },
    {
      os: 'macOS',
      icon: Apple,
      color: 'emerald',
      recommended: false,
      files: [
        { name: 'Bee-Desktop-0.1.0-arm64.dmg', desc: 'Apple Silicon (M1/M2/M3/M4)', size: '82.3 MB', primary: true },
        { name: 'Bee-Desktop-0.1.0-x64.dmg', desc: 'Intel Mac DMG', size: '86.5 MB', primary: false },
      ],
      requirements: 'macOS 12 Monterey or later',
    },
  ]

  return (
    <section id="downloads" className="py-24 bg-[#090c13]/80">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Ready for Production Engineering</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Download Bee Desktop
          </h2>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-slate-400">
            Install Bee natively on your primary workstation. All builds include the integrated Python sidecar harness and automatic update verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {downloadOptions.map((opt) => {
            const Icon = opt.icon
            return (
              <div
                key={opt.os}
                className={`flex flex-col rounded-2xl border p-6 bg-[#0c0f17] shadow-xl transition-all ${
                  opt.recommended
                    ? 'border-amber-500/50 shadow-amber-500/5'
                    : 'border-white/8 hover:border-white/16'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/8">
                      <Icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{opt.os}</h3>
                      <span className="text-[11px] text-slate-400">Native Desktop</span>
                    </div>
                  </div>
                  {opt.recommended && (
                    <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-300">
                      Detected OS
                    </span>
                  )}
                </div>

                <div className="space-y-3 flex-1 my-4">
                  {opt.files.map((file, fIdx) => (
                    <a
                      key={fIdx}
                      href={`https://github.com/Prince-695/Bee/releases/download/v0.1.0/${file.name}`}
                      className={`group flex items-center justify-between rounded-xl p-3 border transition-all ${
                        file.primary
                          ? 'bg-amber-500 text-black border-transparent font-semibold shadow-md hover:bg-amber-400'
                          : 'bg-white/3 text-slate-300 border-white/6 hover:bg-white/6 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileDown className={`h-4 w-4 shrink-0 ${file.primary ? 'text-black' : 'text-slate-400'}`} />
                        <div className="overflow-hidden text-left">
                          <div className="text-xs truncate">{file.name}</div>
                          <div className={`text-[10px] truncate ${file.primary ? 'text-black/80' : 'text-slate-400'}`}>
                            {file.desc}
                          </div>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ml-2 ${file.primary ? 'text-black/80' : 'text-slate-400'}`}>
                        {file.size}
                      </span>
                    </a>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/6 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Requires: </span>
                  {opt.requirements}
                </div>
              </div>
            )
          })}
        </div>

        {/* Verification banner */}
        <div className="mt-12 rounded-xl border border-white/8 bg-black/40 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300">
              All binaries are code-signed and verified with SHA-256 cryptographic hashes in continuous GitHub Actions CI.
            </div>
          </div>
          <a
            href="https://github.com/Prince-695/Bee/releases"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-amber-400 hover:underline shrink-0"
          >
            View SHA-256 Checksums →
          </a>
        </div>
      </div>
    </section>
  )
}
