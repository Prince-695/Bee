import { useState, useCallback, useEffect } from "react";
import {
  Webhook,
  RotateCcw,
  Zap,
  Shield,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { SignalSimulatorCards, type SimulatePayload } from "./SignalSimulatorCards";
import { WebhookEndpointsMatrix } from "./WebhookEndpointsMatrix";
import { SignalFeedTable } from "./SignalFeedTable";
import { SignalInspectorDrawer, type SignalRecord } from "./SignalInspectorDrawer";

type SignalTab = "simulator" | "endpoints" | "feed";

const SEED_SIGNALS: SignalRecord[] = [
  {
    signal_id: "sig_gh_pr_42",
    source: "github",
    event_type: "pr_opened",
    repository: "Prince-695/bee",
    branch: "feat/auth-service",
    sender: "sarah_connor",
    status: "matched",
    matched_mission_id: "mission_auth_fix_8a2",
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    payload: {
      action: "opened",
      number: 42,
      pull_request: {
        title: "feat(auth): add 1-click oauth connectors & session rotation",
        user: { login: "sarah_connor" },
        head: { ref: "feat/auth-service" },
        base: { ref: "main" },
        changed_files: 4,
        additions: 128,
        deletions: 12,
      },
    },
  },
  {
    signal_id: "sig_ci_fail_891",
    source: "ci",
    event_type: "ci_failure",
    repository: "Prince-695/bee",
    branch: "main",
    sender: "github-actions[bot]",
    status: "matched",
    matched_mission_id: "mission_heal_91f",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    payload: {
      workflow: "ci.yml",
      run_id: "98421048",
      step: "pytest apps/api/tests/test_auth_v1.py",
      exit_code: 1,
      error_log: "AssertionError: 401 != 200 in test_full_auth_v1_lifecycle\nassert 0 >= 1 where 0 = len([])",
    },
  },
  {
    signal_id: "sig_sentry_alert_102",
    source: "sentry",
    event_type: "alert",
    repository: "Prince-695/bee",
    branch: "production",
    sender: "sentry-webhook",
    status: "evaluated",
    matched_mission_id: null,
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    payload: {
      project: "bee-api",
      culprit: "router_auth.py:line_152",
      exception: "Uncaught RuntimeError: Invalid session token hash signature",
      level: "error",
      environment: "production",
      impacted_users: 14,
    },
  },
  {
    signal_id: "sig_approval_wa_77",
    source: "approvals",
    event_type: "gate_decision",
    repository: "Prince-695/bee",
    branch: "main",
    sender: "+1 (555) 019-2831",
    status: "matched",
    matched_mission_id: "mission_auth_fix_8a2",
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    payload: {
      channel: "whatsapp",
      token_hash: "9b3c4d5e6f7a8b9c",
      decision: "approved",
      authorizer: "Lead Systems Architect",
      action: "git_commit & deploy_staging",
    },
  },
];

export default function HooksPage() {
  const [activeTab, setActiveTab] = useState<SignalTab>("simulator");
  const [signals, setSignals] = useState<SignalRecord[]>(SEED_SIGNALS);
  const [selectedSignal, setSelectedSignal] = useState<SignalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signals?limit=30");
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: SignalRecord[] };
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSignals(json.data);
        }
      }
    } catch {
      // Keep resilient seed in local standalone dev
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignals();
    const interval = setInterval(() => void fetchSignals(), 5000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const handleSimulate = async (payload: SimulatePayload) => {
    setIsSimulating(true);
    setNotice(null);

    const newSignal: SignalRecord = {
      signal_id: `sig_${payload.source}_${Date.now().toString(36)}`,
      source: payload.source,
      event_type: payload.event_type,
      repository: payload.repository,
      branch: payload.branch,
      sender: payload.sender,
      status: "matched",
      matched_mission_id: `mission_auto_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
      payload: payload.payload,
    };

    try {
      await fetch("/api/signals/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Resilient local fallback
    } finally {
      setSignals((prev) => [newSignal, ...prev]);
      setIsSimulating(false);
      setNotice(
        `Signal "${payload.event_type}" ingested from ${payload.source.toUpperCase()}. Matched autonomous flight spawned!`
      );
      setTimeout(() => setNotice(null), 5000);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-background text-foreground font-sans select-none pb-12">
      {/* ─── 1. Cockpit HUD Top Bar ───────────────────────────────────── */}
      <div className="border-b border-border/60 bg-card/40 backdrop-blur-xl px-6 py-5 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#FFB22C]/15 border border-[#FFB22C]/30 flex items-center justify-center text-[#FFB22C] shadow-inner">
                <Webhook className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Signal Ingestion Engine & Autonomous Hooks
                  </h1>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ingestion Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Autonomous event-driven agent orchestration for GitHub PRs, CI breakdowns, and Sentry crash alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => void fetchSignals()}
              disabled={loading}
              className="skeuo-button-secondary px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className={`size-3.5 text-muted-foreground ${loading ? "animate-spin text-[#FFB22C]" : ""}`} />
              <span>{loading ? "Polling..." : "Refresh Feed"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Zap className="size-3.5 fill-current" />
              <span>Trigger Test Signal</span>
            </button>
          </div>
        </div>

        {/* Live Ingestion Success Notice */}
        {notice && (
          <div className="max-w-7xl mx-auto mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs hover:underline cursor-pointer opacity-80 ml-2 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── 2. Segmented Navigation Deck ────────────────────────────── */}
        <div className="max-w-7xl mx-auto mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "simulator"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="size-3.5" />
            <span>Signal Simulator & Triggers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("endpoints")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "endpoints"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="size-3.5" />
            <span>Production Webhooks Registry (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "feed"
                ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Radio className="size-3.5" />
            <span>Live Ingested Feed ({signals.length})</span>
          </button>
        </div>
      </div>

      {/* ─── 3. Main Views ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        {activeTab === "simulator" && (
          <div className="space-y-8">
            <SignalSimulatorCards
              onSimulate={handleSimulate}
              isSimulating={isSimulating}
            />

            {/* Quick Ingested Preview below simulator */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-mono uppercase font-bold text-muted-foreground">
                  Recent Ingested Activity
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("feed")}
                  className="text-xs text-[#FFB22C] hover:underline font-semibold cursor-pointer"
                >
                  View Full Live Feed →
                </button>
              </div>
              <SignalFeedTable
                signals={signals.slice(0, 5)}
                onInspectSignal={(sig) => setSelectedSignal(sig)}
                onSimulateClick={() => setActiveTab("simulator")}
              />
            </div>
          </div>
        )}

        {activeTab === "endpoints" && <WebhookEndpointsMatrix />}

        {activeTab === "feed" && (
          <SignalFeedTable
            signals={signals}
            onInspectSignal={(sig) => setSelectedSignal(sig)}
            onSimulateClick={() => setActiveTab("simulator")}
          />
        )}
      </div>

      {/* ─── 4. Payload Inspector Drawer ──────────────────────────────── */}
      <SignalInspectorDrawer
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </div>
  );
}