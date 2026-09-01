import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

export function WebNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Overview" },
    { to: "/features", label: "5 Workers" },
    { to: "/architecture", label: "Architecture" },
    { to: "/pricing", label: "Pricing" },
    { to: "/docs", label: "Docs" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
      <nav className="w-full max-w-5xl bg-zinc-950/80 backdrop-blur-2xl border border-zinc-800/80 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-2xl shadow-black/60 pointer-events-auto transition-all">
        {/* Brand Logo & Pill */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Bee Logo"
            className="w-8 h-8 rounded-lg object-contain group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base sm:text-lg tracking-tight text-white font-sans">BEE</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> v1.0
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-full border border-zinc-800/60">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
                  isActive
                    ? "bg-white text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs hidden sm:inline-flex px-4"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <Button
            className="rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs px-4 sm:px-5 py-2 flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:scale-102 transition-all cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Start Flight <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-4 right-4 bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-3 pointer-events-auto z-50">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pt-3 border-t border-zinc-800 flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full rounded-2xl border-zinc-800 text-xs"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
            >
              Sign In
            </Button>
            <Button
              className="w-full rounded-2xl bg-amber-400 text-black font-bold text-xs"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/signup");
              }}
            >
              Start Flight Free
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
