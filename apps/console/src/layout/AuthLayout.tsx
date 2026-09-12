import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Sparkles, Terminal } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  badgeText?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  badgeText = "Personal & Multi-Tenant SaaS",
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-background text-foreground transition-colors selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/10 blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed -bottom-32 right-10 w-[500px] h-[300px] bg-primary/5 blur-[120px] rounded-full" />

      {/* Top Navigation Bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/40 bg-background/50 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-black shadow-[0_2px_12px_rgba(255,178,44,0.35)] group-hover:scale-105 transition-transform">
            🐝
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
              Bee
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/20 font-semibold">
                SaaS
              </span>
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex text-xs text-muted-foreground border-border/60">
            <ShieldCheck className="size-3 text-emerald-500 mr-1" />
            Zero-Trust Sandboxing
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Header text */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" />
              <span>{badgeText}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Rendered children card */}
          {children}

          {/* Footer Security / Architecture Guarantee */}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1">
              <Terminal className="size-3 text-primary" />
              Event-Triggered DAGs
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              28+ MCP Platforms
            </span>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 border-t border-border/40 py-4 px-6 text-center text-xs text-muted-foreground/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Bee Co-Engineer. Personal & Multi-Tenant SaaS.</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="hover:text-foreground transition-colors cursor-pointer">Documentation</span>
          <span>•</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">Security Protocol</span>
          <span>•</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">Status</span>
        </div>
      </footer>
    </div>
  );
}
