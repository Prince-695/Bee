import type { FC } from 'react'
import { ExternalLink, Shield, Zap } from 'lucide-react'

export const Footer: FC = () => {
  return (
    <footer className="border-t border-white/8 bg-[#07090e] py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
                <Zap className="h-4.5 w-4.5 text-black fill-black" />
              </div>
              <span className="font-bold text-base text-white">Bee Desktop</span>
            </div>
            <p className="max-w-md text-xs text-slate-400 leading-relaxed">
              The autonomous multi-worker co-engineering platform. Delivering living memory graphs, topological DAG flight coordination, and zero-trust approval gates for software teams.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Licensed under Apache 2.0 / MIT</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Resources
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-amber-400 transition-colors">Architecture Visualizer</a>
              </li>
              <li>
                <a href="#docs" className="hover:text-amber-400 transition-colors">Documentation</a>
              </li>
              <li>
                <a href="#downloads" className="hover:text-amber-400 transition-colors">Downloads</a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Community & Code
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="https://github.com/Prince-695/Bee"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Prince-695/Bee/issues"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Issue Tracker</span>
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Prince-695/Bee/releases"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Release Notes</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Bee Autonomous Co-Engineering Platform. Built with gemini-3.5-flash.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
              <span>All Systems Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
