import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { ShieldCheck, Lock, Terminal, CheckCircle2, Mail, Key } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground">
      <WebNavbar />

      <main className="py-20 px-6 max-w-4xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="space-y-4 text-center sm:text-left border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Security & Disclosure
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Security Architecture
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Zero-Trust Execution • Ephemeral Sandboxing • Responsible Disclosure
          </p>
        </div>

        {/* 3 Core Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Zero-Leak Redactor</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every token, Postgres URI, and API credential is cryptographically sanitized before LLM context serialization.
            </p>
          </div>

          <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Terminal className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">FastMCP Sidecars</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Code execution occurs exclusively in isolated containerized sandboxes with restricted network egress.
            </p>
          </div>

          <div className="skeuo-glass-card rounded-2xl p-5 border border-border/70 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Approval Gates</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Destructive git operations require dual authorization via WhatsApp Meta API or console cryptographic tokens.
            </p>
          </div>
        </div>

        {/* Responsible Disclosure Section */}
        <div className="skeuo-glass-card rounded-2xl p-6 sm:p-8 border border-primary/30 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <Mail className="w-4 h-4" />
              <span>Vulnerability Disclosure & Bug Bounty</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Report a Security Vulnerability
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We welcome reports from independent security researchers and developers. If you believe you have discovered a vulnerability in the Bee gateway, FastMCP sidecar, or web console, please submit a report directly to our security engineering team.
            </p>
          </div>

          <div className="skeuo-inset-terminal rounded-xl p-4 text-xs font-mono space-y-1.5 text-foreground">
            <div className="text-primary font-bold">Contact Email: security@bee.dev</div>
            <div className="text-muted-foreground">Response SLA: Within 24 hours of report receipt</div>
            <div className="text-muted-foreground">PGP Key Fingerprint: 4E91 B28A 90CF 1192 8840 77E1 29AA 001B BEE0 2026</div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <h3 className="font-bold text-foreground flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" /> Safe Harbor Guarantee
            </h3>
            <p>
              Bee will not initiate legal action against researchers who discover and report vulnerabilities in compliance with good-faith research guidelines (avoiding denial-of-service, data exfiltration, or privacy violations of active users).
            </p>
          </div>
        </div>
      </main>

      <WebFooter />
    </div>
  );
}
