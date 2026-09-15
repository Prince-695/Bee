import type { FC } from 'react'
import { useState } from 'react'
import { Download, ExternalLink, Menu, Shield, X, Zap } from 'lucide-react'

export const Navbar: FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Documentation', href: '#docs' },
    { label: 'Downloads', href: '#downloads' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8 bg-[#07090e]/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5 text-black fill-black" />
          </div>
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
              Bee <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono font-medium text-amber-400 border border-amber-500/30">Desktop v0.1.0</span>
            </span>
            <span className="text-[11px] text-slate-400">Autonomous Co-Engineering Platform</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-amber-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://github.com/Prince-695/Bee"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/8 hover:text-white transition-all"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>
          <a
            href="#downloads"
            id="nav-download-cta"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-xs font-semibold text-black shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Desktop</span>
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-400 hover:text-white md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-white/8 bg-[#0b0e14] px-6 py-4 md:hidden">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-amber-400 transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/8 flex flex-col gap-2">
              <a
                href="#downloads"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-black"
              >
                <Download className="h-4 w-4" /> Download Desktop
              </a>
              <a
                href="https://github.com/Prince-695/Bee"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-300"
              >
                <Shield className="h-4 w-4" /> GitHub Repository
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
