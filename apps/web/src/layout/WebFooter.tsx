import { Link } from "react-router-dom";

export function WebFooter() {
  return (
    <footer className="py-12 px-6 border-t border-zinc-800 bg-black/80 z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Bee Logo"
            className="w-6 h-6 rounded-md object-contain"
          />
          <span className="text-zinc-300 font-semibold">Bee Autonomous AI Co-Engineer</span>
          <span>© 2026 Bee Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/docs" className="hover:text-zinc-300 transition-colors">Documentation</Link>
          <a href="https://github.com/Prince-695/Bee" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
          <a href="/#pricing" className="hover:text-zinc-300 transition-colors">Pricing</a>
          <a href="/#faq" className="hover:text-zinc-300 transition-colors">FAQ</a>
          <Link to="/login" className="hover:text-amber-400 transition-colors font-semibold">Sign In →</Link>
        </div>
      </div>
    </footer>
  );
}
