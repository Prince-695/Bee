import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InteractiveFlightDemo() {
  const [activeScenario, setActiveScenario] = useState<"pr_review" | "ci_heal" | "approval_gate">("ci_heal");
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(3);

  const scenarios = {
    pr_review: {
      title: "PR #42 Autonomous Edge-Case Inspection",
      worker: "Inspector & Tester Worker",
      steps: [
        { id: 1, text: "code_find_files: Discovered 6 modified TypeScript files in packages/auth", done: true },
        { id: 2, text: "code_ripgrep: Traced bearer token handler symbol across 18 call sites", done: true },
        { id: 3, text: "run_test_suite: Synthesized boundary assertions for missing headers", done: true },
        { id: 4, text: "scribe_report: Formatted PR inspection summary with 0 security regressions", done: true },
      ],
      output: "✅ Verification Succeeded: All 6 modified files passed zero-leak audit and regression tests.",
    },
    ci_heal: {
      title: "CI/CD Test Failure Auto-Healing Flight",
      worker: "Remediation & Fixer Worker",
      steps: [
        { id: 1, text: "run_command: pytest tests/test_auth.py -> AssertionError in test_oauth_flow", done: true },
        { id: 2, text: "self_heal_retry: Diagnosis injected -> 'Missing Bearer token fallback in headers'", done: true },
        { id: 3, text: "write_file: Applied atomic patch to packages/auth/src/token.py", done: true },
        { id: 4, text: "sandbox_runner: Re-executed pytest -> 18/18 tests PASSED with 0 errors", done: true },
      ],
      output: "🎉 Self-Healing Complete: Automated repair applied and verified in isolated sandbox container.",
    },
    approval_gate: {
      title: "Zero-Trust Human Gate (WhatsApp & Desktop Sync)",
      worker: "Security Guard Worker",
      steps: [
        { id: 1, text: "git_diff: Inspected 3 planned file modifications and 1 database migration", done: true },
        { id: 2, text: "policy_guard: Critical action detected -> Intercepted git_push to origin/main", done: true },
        { id: 3, text: "dispatch_alert: Sent mobile 1-click [Authorize] / [Reject] notification to WhatsApp", done: true },
        { id: 4, text: "gate_resolved: Engineer clicked [Authorize Action] via phone -> Flight unblocked", done: true },
      ],
      output: "🛡️ Zero-Trust Gate Authorized: Critical action validated by human operator.",
    },
  };

  const current = scenarios[activeScenario];

  const handleSimulate = () => {
    setIsRunning(true);
    setStepIndex(0);
    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          setIsRunning(false);
          return 3;
        }
        return prev + 1;
      });
    }, 400);
  };

  return (
    <div className="p-6 md:p-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-xs font-mono text-zinc-400 ml-2">bee-mission-terminal v0.3</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
          <button
            onClick={() => { setActiveScenario("ci_heal"); setStepIndex(3); }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeScenario === "ci_heal" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            Auto-Heal Tests
          </button>
          <button
            onClick={() => { setActiveScenario("pr_review"); setStepIndex(3); }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeScenario === "pr_review" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            PR Inspection
          </button>
          <button
            onClick={() => { setActiveScenario("approval_gate"); setStepIndex(3); }}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeScenario === "approval_gate" ? "bg-amber-500 text-black font-bold" : "text-zinc-400 hover:text-white"
            }`}
          >
            WhatsApp Gate
          </button>
        </div>
      </div>

      {/* Terminal Title & Active Worker */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white font-mono">{current.title}</h4>
          <span className="text-xs text-amber-400 font-mono">Worker: {current.worker}</span>
        </div>
        <Button
          size="sm"
          onClick={handleSimulate}
          disabled={isRunning}
          className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 gap-1.5 h-8"
        >
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Replay Flight
        </Button>
      </div>

      {/* Terminal Execution Steps */}
      <div className="p-4 rounded-2xl bg-black/90 border border-zinc-800/80 font-mono text-xs space-y-2.5 min-h-[180px]">
        {current.steps.map((step, idx) => {
          const isVisible = idx <= stepIndex;
          return (
            isVisible && (
              <div key={step.id} className="flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-zinc-300 leading-relaxed">{step.text}</span>
              </div>
            )
          );
        })}

        {stepIndex >= 3 && (
          <div className="pt-3 border-t border-zinc-800/80 text-emerald-400 font-bold">
            {current.output}
          </div>
        )}
      </div>
    </div>
  );
}
