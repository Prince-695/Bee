import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { ShieldCheck, Lock, EyeOff, Server, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-foreground">
      <WebNavbar />

      <main className="py-20 px-6 max-w-4xl mx-auto space-y-12">
        {/* Page Header */}
        <div className="space-y-4 text-center sm:text-left border-b border-border pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> SOC2 & GDPR Compliant
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-mono">
            Effective Date: March 1, 2026 • Version 2.4 (Enterprise Production)
          </p>
        </div>

        {/* Zero-Retention Code Commitment Banner */}
        <div className="skeuo-glass-card rounded-2xl p-6 border-2 border-primary/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <Lock className="w-4 h-4" />
            <span>Zero-Retention Code Execution Commitment</span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
            Bee is architected as an autonomous engineering partner, not a data broker. <strong>We do not store your source code on our servers, and we never use your private codebase, commits, or AST tokens to train public or proprietary machine learning models.</strong> All repository indexing runs inside isolated, ephemeral FastMCP sidecars on your local machine or dedicated VPC clusters.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-primary" /> 1. Information We Collect
            </h2>
            <p>
              When you interact with the Bee platform, we collect minimal operational information strictly necessary to provide autonomous co-engineering services:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/80">
              <li><strong>Account Credentials:</strong> Name, work email address, and OAuth provider tokens (GitHub, Google) managed via encrypted session keys.</li>
              <li><strong>Billing Information:</strong> Processed directly by our payment processor, Stripe. We store only customer IDs, plan tiers, and transaction timestamps—never raw credit card numbers.</li>
              <li><strong>Execution Telemetry:</strong> Aggregated, anonymized token consumption counts, execution latencies, and tool invocation error codes used to enforce budget caps.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> 2. Zero-Leak Credential Redaction
            </h2>
            <p>
              Bee includes an enterprise-grade cryptographic sanitization engine. Before any contextual diff or error traceback is dispatched to configured LLM inference providers (Gemini, OpenAI, Anthropic):
            </p>
            <div className="skeuo-inset-terminal rounded-xl p-4 text-xs font-mono text-emerald-400 space-y-1">
              <div>[INGRESS_FILTER]: Scanning AST for high-entropy tokens and credentials...</div>
              <div>[SANITIZED]: Found sk-proj-... -&gt; Replaced with [REDACTED_OPENAI_KEY]</div>
              <div>[SANITIZED]: Found postgresql://... -&gt; Replaced with [REDACTED_POSTGRES_URI]</div>
              <div>[STATUS]: 100% Zero-Leak clearance passed. Dispatched to LLM.</div>
            </div>
            <p>
              Secrets are masked in memory and never logged to persistent telemetry stores.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> 3. Data Retention & Deletion
            </h2>
            <p>
              You maintain full sovereignty over your organizational data. You may at any time:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-foreground/80">
              <li>Export all SOC2 audit trails as CSV or JSONL directly from the Console.</li>
              <li>Purge all historical flight logs, chat records, and approval gate history via your Organization Settings.</li>
              <li>Request full account and tenant deletion by emailing <span className="text-primary font-mono font-semibold">privacy@bee.dev</span>. Account purges are completed within 48 hours across all active and backup volumes.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> 4. GDPR & CCPA Compliance Rights
            </h2>
            <p>
              Users in the European Economic Area (EEA), United Kingdom, and California enjoy statutory privacy rights including the Right to Access, Right to Rectification, Right to Erasure, and Right to Data Portability. Bee operates in full compliance with Standard Contractual Clauses (SCCs) for cross-border telemetry transit.
            </p>
          </section>
        </div>
      </main>

      <WebFooter />
    </div>
  );
}
