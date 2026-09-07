import { useState } from "react";
import {
  GitPullRequest,
  Terminal,
  AlertTriangle,
  Smartphone,
  Copy,
  Check,
  Shield,
  Key,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react";

export interface WebhookEndpointDef {
  id: string;
  name: string;
  path: string;
  description: string;
  signatureHeader: string;
  secretEnv: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  sampleCurl: string;
}

const ENDPOINTS: WebhookEndpointDef[] = [
  {
    id: "github",
    name: "GitHub Webhook",
    path: "/webhooks/github",
    description: "Ingests Pull Requests, code pushes, branch creations, and issue comment triggers.",
    signatureHeader: "X-Hub-Signature-256",
    secretEnv: "GITHUB_WEBHOOK_SECRET",
    icon: <GitPullRequest className="size-5" />,
    iconBg: "bg-[#24292e]/80 border-white/20",
    iconColor: "text-white",
    sampleCurl: `curl -X POST "http://localhost:8000/webhooks/github" \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: pull_request" \\
  -H "X-Hub-Signature-256: sha256=..." \\
  -d '{"action":"opened","pull_request":{"number":42,"title":"feat: auth"}}'`,
  },
  {
    id: "ci",
    name: "CI/CD Pipeline Failure Webhook",
    path: "/webhooks/ci",
    description: "Auto-ingests failing CI jobs (GitHub Actions, GitLab CI, CircleCI) to trigger self-healing loops.",
    signatureHeader: "X-Bee-CI-Signature",
    secretEnv: "CI_WEBHOOK_SECRET",
    icon: <Terminal className="size-5" />,
    iconBg: "bg-emerald-500/15 border-emerald-500/30",
    iconColor: "text-emerald-500",
    sampleCurl: `curl -X POST "http://localhost:8000/webhooks/ci" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"failed","step":"pytest","error_log":"AssertionError in test_auth.py"}'`,
  },
  {
    id: "sentry",
    name: "Sentry / Crash Incident Webhook",
    path: "/webhooks/sentry",
    description: "Captures unhandled exceptions and stack traces directly from Sentry or Datadog alerts.",
    signatureHeader: "Sentry-Hook-Signature",
    secretEnv: "SENTRY_WEBHOOK_SECRET",
    icon: <AlertTriangle className="size-5" />,
    iconBg: "bg-destructive/15 border-destructive/30",
    iconColor: "text-destructive",
    sampleCurl: `curl -X POST "http://localhost:8000/webhooks/sentry" \\
  -H "Content-Type: application/json" \\
  -d '{"project":"bee-api","event":{"culprit":"router_auth.py","message":"Crash"}}'`,
  },
  {
    id: "approvals",
    name: "Mobile Approval Webhook (WhatsApp / Slack)",
    path: "/webhooks/approvals",
    description: "Receives 1-tap interactive approval gate responses from WhatsApp and Slack buttons.",
    signatureHeader: "X-Approval-HMAC-SHA256",
    secretEnv: "APPROVAL_HMAC_SECRET",
    icon: <Smartphone className="size-5" />,
    iconBg: "bg-amber-500/15 border-amber-500/30",
    iconColor: "text-[#FFB22C]",
    sampleCurl: `curl -X POST "http://localhost:8000/webhooks/approvals" \\
  -H "Content-Type: application/json" \\
  -d '{"token_hash":"abc123hash","decision":"approved","channel":"whatsapp"}'`,
  },
];

export function WebhookEndpointsMatrix() {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedCurl, setExpandedCurl] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const copyUrl = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const toggleShowSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="size-4 text-[#FFB22C]" />
            Production Webhook Ingestion Endpoints
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure these URLs in your GitHub settings, CI pipelines, or alert webhooks to trigger autonomous agent workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-card/60 border border-border/70 text-xs font-mono text-muted-foreground shrink-0">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          HMAC-SHA256 Ingestion Active
        </div>
      </div>

      {/* ─── Webhook Endpoints Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ENDPOINTS.map((wh) => {
          const isCopied = copiedPath === wh.path;
          const isCurlOpen = expandedCurl === wh.id;
          const isSecretRevealed = Boolean(showSecrets[wh.id]);

          return (
            <div
              key={wh.id}
              className="skeuo-glass-card p-5 rounded-2xl border border-border/80 flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <div className="space-y-3.5">
                {/* Header: Icon + Title + Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-10 rounded-xl border flex items-center justify-center shadow-inner ${wh.iconBg} ${wh.iconColor}`}
                    >
                      {wh.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground tracking-tight">{wh.name}</h3>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Header: <code className="text-foreground">{wh.signatureHeader}</code>
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    200 OK
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{wh.description}</p>

                {/* Webhook Path Box with 1-Click Copy */}
                <div className="p-2.5 rounded-xl bg-card/70 border border-border/80 flex items-center justify-between gap-3 shadow-inner">
                  <code className="text-xs font-mono text-[#FFB22C] truncate select-all">
                    {wh.path}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyUrl(wh.path)}
                    className="skeuo-button-secondary px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0 cursor-pointer"
                    title="Copy full webhook URL"
                  >
                    {isCopied ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-muted-foreground" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secret Signature Variable */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground px-1">
                  <div className="flex items-center gap-1.5">
                    <Key className="size-3 text-[#FFB22C]" />
                    <span>Secret Env: <strong className="text-foreground">{wh.secretEnv}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleShowSecret(wh.id)}
                    className="hover:underline cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {isSecretRevealed ? "Hide Secret" : "Reveal Secret"}
                  </button>
                </div>

                {isSecretRevealed && (
                  <div className="p-2 rounded-lg bg-card/90 border border-border/70 text-[11px] font-mono text-amber-500/90 truncate animate-in fade-in select-all">
                    whsec_{wh.id}_live_7f8a9bc0d1e2f3456789
                  </div>
                )}
              </div>

              {/* Action Footer: Curl Snippet Toggle */}
              <div className="pt-2 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setExpandedCurl(isCurlOpen ? null : wh.id)}
                  className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Code2 className="size-3 text-[#FFB22C]" />
                    Example cURL Request
                  </span>
                  {isCurlOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </button>

                {isCurlOpen && (
                  <div className="mt-2.5 skeuo-inset-terminal p-3 rounded-xl border border-white/5 text-[11px] font-mono text-zinc-300 overflow-x-auto select-text animate-in fade-in">
                    <pre>{wh.sampleCurl}</pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
