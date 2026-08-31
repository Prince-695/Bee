import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";

export function WebNavbar() {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4.5 h-4.5 text-black" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">BEE</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              v0.1.0
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-zinc-200 transition-colors">Architecture</a>
          <a href="#pricing" className="hover:text-zinc-200 transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
          <Link to="/docs" className="hover:text-amber-400 transition-colors flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Documentation
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs hidden sm:inline-flex"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 px-4"
            onClick={() => navigate("/login")}
          >
            Launch Console
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
