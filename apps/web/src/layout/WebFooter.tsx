import { Link } from "react-router-dom";
import { ArrowUpRight, Code2, Globe, MessageSquare } from "lucide-react";

export function WebFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-black/90 text-zinc-400 py-16 px-6 relative z-10">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Bee Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-xl tracking-tight text-white">BEE</span>
            </Link>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              The autonomous AI co-engineer platform coordinating 5 specialized workers across your codebase, fixing broken tests in isolated sandboxes, and verifying zero-trust approvals.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
              </span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2.5">
              <li><Link to="/features" className="hover:text-amber-400 transition-colors">5 AI Workers</Link></li>
              <li><Link to="/architecture" className="hover:text-amber-400 transition-colors">System Architecture</Link></li>
              <li><Link to="/pricing" className="hover:text-amber-400 transition-colors">Pricing & Tokens</Link></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Book a Demo</Link></li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Resources</h4>
            <ul className="space-y-2.5">
              <li><Link to="/docs" className="hover:text-amber-400 transition-colors">Documentation</Link></li>
              <li><a href="https://github.com/Prince-695/Bee" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">GitHub Repository <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><a href="https://discord.gg/bee" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors flex items-center gap-1">Discord Community <ArrowUpRight className="w-3 h-3" /></a></li>
              <li><Link to="/contact" className="hover:text-amber-400 transition-colors">Security & Compliance</Link></li>
            </ul>
          </div>

          {/* Platform & Social */}
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Developers</h4>
            <ul className="space-y-2.5">
              <li><Link to="/login" className="hover:text-amber-400 transition-colors">Sign In to Console</Link></li>
              <li><Link to="/signup" className="hover:text-amber-400 transition-colors">Create Free Account</Link></li>
              <li><a href="https://bee.dev/docs#mcp" className="hover:text-amber-400 transition-colors">FastMCP Registry</a></li>
              <li><a href="https://bee.dev/docs#whatsapp" className="hover:text-amber-400 transition-colors">WhatsApp Gate Setup</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © 2026 Bee Inc. All rights reserved. Designed for elite engineering teams.
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/Prince-695/Bee" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="GitHub">
              <Code2 className="w-4 h-4" />
            </a>
            <a href="https://bee.dev" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Website">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://discord.gg/bee" target="_blank" rel="noreferrer" className="hover:text-white transition-colors" title="Community">
              <MessageSquare className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
