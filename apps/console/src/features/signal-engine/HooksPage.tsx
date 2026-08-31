import { useCallback, useEffect, useState } from "react";
import {
  Webhook,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  Terminal,
  Copy,
  Check,
  Shield,
  Activity,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EngineeringSignal {
  signal_id: string;
  source: string;
  event_type: string;
  repository: string;
  branch: string | null;
  sender: string | null;
  payload: Record<string, unknown>;
  status: string;
  matched_mission_id: string | null;
  created_at: string;
}

const WEBHOOK_ENDPOINTS = [
  {
    name: "GitHub PR & Push Webhook",
    path: "/webhooks/github",
    desc: "Triggers autonomous PR inspections, test runs, and commit reviews.",
    icon: <GitPullRequest className="w-4 h-4 text-white" />,
  },
  {
    name: "CI/CD Pipeline Failure Webhook",
    path: "/webhooks/ci",
    desc: "Wakes up the Self-Healing loop to diagnose & remediate failing tests.",
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
  },
  {
    name: "Sentry / Incident Alert Webhook",
    path: "/webhooks/sentry",
    desc: "Investigates stack traces, locates root cause with ripgrep, and proposes fix.",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
];

export default function HooksPage() {
  const [signals, setSignals] = useState<EngineeringSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals?limit=30");
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: EngineeringSignal[] };
        if (json.success && Array.isArray(json.data)) {
          setSignals(json.data);
        }
      }
    } catch {
      // Ignore network errors in local dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignals();
    const interval = setInterval(() => void fetchSignals(), 5000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const copyWebhookUrl = (path: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(fullUrl);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleSimulateSignal = async (
    source: string,
    event_type: string,
    repository: string,
    branch: string,
    extra: Record<string, unknown>
  ) => {
    setSimulating(event_type);
    try {
      await fetch("/api/signals/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          event_type,
          repository,
          branch,
          sender: "simulated_developer",
          payload: extra,
        }),
      });
      await fetchSignals();
    } catch {
      // Ignore
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-8 bg-zinc-950 font-sans text-zinc-100">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Webhook className="w-6 h-6 text-amber-500" />
              Event & Signal Engine
            </h1>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
              Ingestion Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Bee wakes up autonomously when GitHub PRs, CI failures, or monitoring alerts are ingested.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchSignals()}
            disabled={loading}
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs gap-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* ─── SECTION 1: Interactive Signal Simulator ─── */}
      <div className="p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-zinc-900/40 to-transparent space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Interactive Signal Simulator (1-Click Test Triggers)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400">Trigger test missions instantly</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() =>
              void handleSimulateSignal("github", "pr_opened", "Prince-695/bee", "feat/auth-service", {
                pr_number: 42,
                pr_title: "feat: add 1-click oauth connectors",
              })
            }
            disabled={Boolean(simulating)}
            className="rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-amber-500/50 text-xs font-semibold text-zinc-200 hover:text-white justify-start gap-2.5 h-11"
          >
            <GitPullRequest className="w-4 h-4 text-white" />
            <span>Simulate PR Opened (feat/auth)</span>
          </Button>

          <Button
            onClick={() =>
              void handleSimulateSignal("ci", "ci_failure", "Prince-695/bee", "main", {
                step: "pytest unit suite",
                error_log: "AssertionError: 401 != 200 in test_oauth.py",
              })
            }
            disabled={Boolean(simulating)}
            className="rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-emerald-500/50 text-xs font-semibold text-zinc-200 hover:text-white justify-start gap-2.5 h-11"
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Simulate CI Build Failure</span>
          </Button>

          <Button
            onClick={() =>
              void handleSimulateSignal("sentry", "alert", "Prince-695/bee", "production", {
                culprit: "router_agent.py:line_142",
                message: "Uncaught RuntimeError: Gate resolution timeout",
              })
            }
            disabled={Boolean(simulating)}
            className="rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-red-500/50 text-xs font-semibold text-zinc-200 hover:text-white justify-start gap-2.5 h-11"
          >
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>Simulate Sentry Incident Alert</span>
          </Button>
        </div>
      </div>

      {/* ─── SECTION 2: Production Webhook Ingestion URLs ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Production Webhook Ingestion URLs
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WEBHOOK_ENDPOINTS.map((wh) => (
            <div
              key={wh.path}
              className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    {wh.icon}
                  </div>
                  <h4 className="font-bold text-xs text-white">{wh.name}</h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{wh.desc}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-amber-300 truncate">{wh.path}</code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyWebhookUrl(wh.path)}
                  className="rounded-lg border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white text-xs h-7 px-2"
                >
                  {copiedPath === wh.path ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: Live Ingested Signal Stream ─── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Ingested Signal Stream ({signals.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">Auto-refreshing every 5s</span>
        </div>

        {signals.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-zinc-800 text-center space-y-2">
            <p className="text-sm text-zinc-400">No engineering signals received yet.</p>
            <p className="text-xs text-zinc-600">Use the simulator above or configure GitHub webhooks to trigger missions.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {signals.map((sig) => (
              <div
                key={sig.signal_id}
                className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/30 flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sig.source === "github"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : sig.source === "ci"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {sig.source}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{sig.event_type}</span>
                      <span className="text-zinc-500 text-[11px]">on</span>
                      <span className="text-amber-300 text-[11px]">{sig.repository}</span>
                      {sig.branch && <span className="text-zinc-400 text-[10px]">({sig.branch})</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sig.matched_mission_id ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Matched: {sig.matched_mission_id}
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Processed</span>
                  )}
                  <span className="text-[10px] text-zinc-600">
                    {new Date(sig.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}