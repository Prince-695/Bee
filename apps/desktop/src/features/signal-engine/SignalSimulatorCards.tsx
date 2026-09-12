import { useState } from "react";
import {
  GitPullRequest,
  Terminal,
  AlertTriangle,
  Zap,
  Play,
  RotateCw,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";

export interface SimulatePayload {
  source: string;
  event_type: string;
  repository: string;
  branch: string;
  sender: string;
  payload: Record<string, unknown>;
}

interface SignalSimulatorCardsProps {
  onSimulate: (payload: SimulatePayload) => Promise<void>;
  isSimulating: boolean;
}

export function SignalSimulatorCards({
  onSimulate,
  isSimulating,
}: SignalSimulatorCardsProps) {
  const [activeTrigger, setActiveTrigger] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customSource, setCustomSource] = useState("github");
  const [customEvent, setCustomEvent] = useState("workflow_dispatch");
  const [customRepo, setCustomRepo] = useState("Prince-695/bee");
  const [customBranch, setCustomBranch] = useState("main");
  const [customPayloadJson, setCustomPayloadJson] = useState('{\n  "action": "run_audit",\n  "urgency": "critical"\n}');

  const handleTrigger = async (
    triggerKey: string,
    payload: SimulatePayload
  ) => {
    setActiveTrigger(triggerKey);
    try {
      await onSimulate(payload);
    } finally {
      setTimeout(() => setActiveTrigger(null), 1200);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(customPayloadJson) as Record<string, unknown>;
    } catch {
      parsed = { raw: customPayloadJson };
    }
    await handleTrigger("custom", {
      source: customSource,
      event_type: customEvent,
      repository: customRepo,
      branch: customBranch,
      sender: "simulated_operator",
      payload: parsed,
    });
  };

  return (
    <div className="space-y-4 font-sans select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-[#FFB22C]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Interactive Signal Simulator (1-Click Autonomous Triggers)
          </h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          Real-time Ingestion Hook Active
        </span>
      </div>

      {/* ─── 3 Standard Preset Triggers ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trigger 1: GitHub PR Opened */}
        <div className="skeuo-glass-card p-5 rounded-2xl border border-border/80 flex flex-col justify-between gap-4 relative group overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-[#24292e]/80 border border-white/20 flex items-center justify-center text-white shadow-inner">
                <GitPullRequest className="size-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/25">
                PULL REQUEST
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">PR #42 Opened</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Prince-695/bee <span className="text-foreground">(feat/auth-service)</span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Triggers multi-agent swarm: <strong>Scout</strong> scans AST git diffs, <strong>Tester</strong> runs regression tests.
            </p>

            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                event: pr_opened
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                auto-dispatch
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleTrigger("github_pr", {
                source: "github",
                event_type: "pr_opened",
                repository: "Prince-695/bee",
                branch: "feat/auth-service",
                sender: "sarah_connor",
                payload: {
                  pr_number: 42,
                  pr_title: "feat(auth): add 1-click oauth connectors & session rotation",
                  changed_files: 4,
                  commits: 2,
                },
              })
            }
            disabled={isSimulating}
            className="skeuo-button-primary w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {activeTrigger === "github_pr" ? (
              <>
                <RotateCw className="size-3.5 animate-spin" />
                <span>Injecting Signal...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Simulate GitHub PR Opened</span>
              </>
            )}
          </button>
        </div>

        {/* Trigger 2: CI/CD Build Failure */}
        <div className="skeuo-glass-card p-5 rounded-2xl border border-border/80 flex flex-col justify-between gap-4 relative group overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                <Terminal className="size-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                CI/CD PIPELINE
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">Broken Build (pytest)</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Prince-695/bee <span className="text-foreground">(main)</span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Wakes up the <strong>Fixer Agent</strong> self-healing loop to diagnose compiler error & synthesize a patch.
            </p>

            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                event: ci_failure
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                self-heal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleTrigger("ci_failure", {
                source: "ci",
                event_type: "ci_failure",
                repository: "Prince-695/bee",
                branch: "main",
                sender: "github-actions[bot]",
                payload: {
                  step: "pytest apps/api/tests/test_auth_v1.py",
                  exit_code: 1,
                  error_log: "AssertionError: 401 != 200 in test_full_auth_v1_lifecycle",
                  run_id: "98421048",
                },
              })
            }
            disabled={isSimulating}
            className="skeuo-button-primary w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {activeTrigger === "ci_failure" ? (
              <>
                <RotateCw className="size-3.5 animate-spin" />
                <span>Injecting Signal...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Simulate CI Build Failure</span>
              </>
            )}
          </button>
        </div>

        {/* Trigger 3: Sentry Incident Alert */}
        <div className="skeuo-glass-card p-5 rounded-2xl border border-border/80 flex flex-col justify-between gap-4 relative group overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive shadow-inner">
                <AlertTriangle className="size-5" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/25">
                INCIDENT ALERT
              </span>
            </div>

            <div>
              <h3 className="font-bold text-sm text-foreground">Sentry Crash Alert</h3>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                Prince-695/bee <span className="text-foreground">(production)</span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Investigates uncaught runtime crash stack trace, maps root cause with ripgrep, and creates triage report.
            </p>

            <div className="flex flex-wrap gap-1 text-[10px] font-mono text-muted-foreground">
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                event: sentry_alert
              </span>
              <span className="px-2 py-0.5 rounded bg-muted/60 border border-border/60">
                p0 incident
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              handleTrigger("sentry_alert", {
                source: "sentry",
                event_type: "alert",
                repository: "Prince-695/bee",
                branch: "production",
                sender: "sentry-webhook",
                payload: {
                  culprit: "router_auth.py:line_152",
                  exception: "Uncaught RuntimeError: Invalid session token hash signature",
                  environment: "production",
                  impacted_users: 14,
                },
              })
            }
            disabled={isSimulating}
            className="skeuo-button-primary w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {activeTrigger === "sentry_alert" ? (
              <>
                <RotateCw className="size-3.5 animate-spin" />
                <span>Injecting Signal...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Simulate Sentry Incident Alert</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Custom Signal Ingestion Accordion ─── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {showCustom ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          <span>Custom Payload Dispatcher (Arbitrary JSON Event)</span>
        </button>

        {showCustom && (
          <form
            onSubmit={handleCustomSubmit}
            className="mt-3 p-5 rounded-2xl border border-border/80 skeuo-glass-card space-y-4 animate-in fade-in"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-muted-foreground block mb-1">
                  Source:
                </label>
                <input
                  type="text"
                  value={customSource}
                  onChange={(e) => setCustomSource(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-card/60 border border-border/80 text-foreground font-mono text-xs focus:border-[#FFB22C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-muted-foreground block mb-1">
                  Event Type:
                </label>
                <input
                  type="text"
                  value={customEvent}
                  onChange={(e) => setCustomEvent(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-card/60 border border-border/80 text-foreground font-mono text-xs focus:border-[#FFB22C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-muted-foreground block mb-1">
                  Repository:
                </label>
                <input
                  type="text"
                  value={customRepo}
                  onChange={(e) => setCustomRepo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-card/60 border border-border/80 text-foreground font-mono text-xs focus:border-[#FFB22C] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase font-bold text-muted-foreground block mb-1">
                  Branch:
                </label>
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-card/60 border border-border/80 text-foreground font-mono text-xs focus:border-[#FFB22C] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase font-bold text-muted-foreground block mb-1">
                Custom Event Payload (JSON):
              </label>
              <textarea
                rows={3}
                value={customPayloadJson}
                onChange={(e) => setCustomPayloadJson(e.target.value)}
                className="w-full p-3 rounded-xl bg-card/60 border border-border/80 text-foreground font-mono text-xs focus:border-[#FFB22C] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={isSimulating}
                className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="size-3.5" />
                <span>Dispatch Custom Signal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
