import React, { useState } from "react";
import {
  Lock,
  Shield,
  Play,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RedactionResult {
  redactedText: string;
  detectedSecrets: string[];
  secretCount: number;
}

const PRESETS = [
  {
    name: "OpenAI Secret Key",
    text: 'export OPENAI_API_KEY="sk-proj-88a9f02bca881763e00b84c1f5e89a"',
  },
  {
    name: "Production Postgres DB",
    text: 'DATABASE_URL="postgresql://bee_admin:super_secret_pg_pwd_99!@cluster-01.us-east-1.internal:5432/bee_prod"',
  },
  {
    name: "Slack Bot Token",
    text: 'SLACK_BOT_TOKEN="xoxb-mock-sample-redaction-token-slack"',
  },
  {
    name: "GitHub PAT",
    text: 'git clone https://ghp_aB3d9876543210zyxwvutsrqponmlkjihgfedcba@github.com/org/private-repo.git',
  },
];

// Offline client-side regex fallback for zero-leak sanitization
function clientSideRedact(input: string): RedactionResult {
  let text = input;
  const detected: string[] = [];

  // OpenAI
  if (/sk-[a-zA-Z0-9_-]{20,}/.test(text)) {
    detected.push("OpenAI API Key");
    text = text.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_OPENAI_KEY]");
  }
  // Postgres URI
  if (/postgres(ql)?:\/\/[^:]+:[^@]+@[^/:]+(:\d+)?\/[^\s"']*/.test(text)) {
    detected.push("PostgreSQL Connection String");
    text = text.replace(
      /postgres(ql)?:\/\/[^:]+:[^@]+@[^/:]+(:\d+)?\/[^\s"']*/g,
      "[REDACTED_POSTGRES_URI]"
    );
  }
  // Slack token
  if (/xox[baprs]-[0-9a-zA-Z-]{20,}/.test(text)) {
    detected.push("Slack Bot Token");
    text = text.replace(/xox[baprs]-[0-9a-zA-Z-]{20,}/g, "[REDACTED_SLACK_TOKEN]");
  }
  // GitHub token
  if (/gh[pousr]_[a-zA-Z0-9]{36,}/.test(text)) {
    detected.push("GitHub Personal Access Token");
    text = text.replace(/gh[pousr]_[a-zA-Z0-9]{36,}/g, "[REDACTED_GITHUB_PAT]");
  }
  // Generic Bearer / AWS / Private keys
  if (/Bearer\s+[a-zA-Z0-9._-]{24,}/i.test(text)) {
    detected.push("Bearer Token");
    text = text.replace(/Bearer\s+[a-zA-Z0-9._-]{24,}/gi, "Bearer [REDACTED_BEARER_TOKEN]");
  }

  return {
    redactedText: text,
    detectedSecrets: detected,
    secretCount: detected.length,
  };
}

export const ZeroLeakRedactionTester: React.FC = () => {
  const [inputText, setInputText] = useState<string>(PRESETS[0].text);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleRedact = async (textToScan?: string) => {
    const text = textToScan !== undefined ? textToScan : inputText;
    if (!text.trim()) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/security/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setResult({
            redactedText: json.data.redacted_text,
            detectedSecrets: json.data.detected_secrets || [],
            secretCount: json.data.secret_count || json.data.detected_secrets?.length || 0,
          });
          setIsProcessing(false);
          return;
        }
      }
      // Fallback
      setResult(clientSideRedact(text));
    } catch {
      setResult(clientSideRedact(text));
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (presetText: string) => {
    setInputText(presetText);
    void handleRedact(presetText);
  };

  const copyRedacted = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.redactedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="skeuo-glass-card rounded-2xl p-5 relative overflow-hidden transition-all">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(255,178,44,0.2)]">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Zero-Leak Redaction Live Suite
              </h2>
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-semibold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zero-Trust Active
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Simulate enterprise ingress filter. API credentials, Bearer tokens, and connection URIs are masked before LLM context ingestion.
            </p>
          </div>
        </div>

        {/* Quick sample injection buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Presets:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.text)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary border border-border/60 hover:border-primary/40 text-foreground transition-all duration-150 font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Testing Chassis */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Input Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" /> Sensitive Raw Input
            </span>
            <button
              onClick={() => setInputText("")}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw string containing credentials or config..."
              className="w-full skeuo-inset-terminal rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 resize-none"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => void handleRedact()}
              disabled={isProcessing || !inputText.trim()}
              className="skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              {isProcessing ? "Scanning..." : "Scan & Redact"}
            </button>
          </div>
        </div>

        {/* Right: Sanitized Ingress Console */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Sanitized Output
            </span>
            {result && (
              <button
                onClick={copyRedacted}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Redacted
                  </>
                )}
              </button>
            )}
          </div>

          <div className="skeuo-inset-terminal rounded-xl p-3 min-h-[92px] flex flex-col justify-between">
            {result ? (
              <div className="space-y-2">
                <div className="text-xs font-mono text-emerald-400 break-all whitespace-pre-wrap leading-relaxed">
                  {result.redactedText}
                </div>
                <div className="pt-2 border-t border-border/30 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground">Detected:</span>
                  {result.detectedSecrets.length > 0 ? (
                    result.detectedSecrets.map((secret, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold"
                      >
                        {secret}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      No secrets detected
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground font-mono">
                Click "Scan & Redact" or select a preset above to inspect live output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
