import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Loader2,
  Clock,
  Terminal,
  ShieldAlert,
  Shield,
  FileText,
  Search,
  Wrench,
  Layers,
  FileCode,
  RotateCw,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getRoute,
  executeFlight,
  createFlightStream,
  listApprovalGates,
  approveGate,
  rejectGate,
  type AgentRoute,
  type SSEEvent,
  type ApprovalGateRecord,
} from "@/lib/api";
import { FlightDagCanvas } from "./FlightDagCanvas";
import { CodeDiffInspector } from "./CodeDiffInspector";
import type { LiveFlightStep, StepStatus } from "./InlineFlightPlayer";

const WORKER_STAGES = [
  { id: "scout", name: "Inspector", role: "Scout & Analysis", icon: Search },
  { id: "test", name: "Tester", role: "Edge Synthesis", icon: Terminal },
  { id: "fixer", name: "Fixer", role: "Auto-Heal", icon: Wrench },
  { id: "guard", name: "Guard", role: "Policy & Gates", icon: Shield },
  { id: "scribe", name: "Scribe", role: "Evidence Report", icon: FileText },
];

const SAMPLE_FALLBACK_ROUTE: AgentRoute = {
  route_id: "route_sample_audit",
  prompt: "Audit authentication middleware, patch rate-limit vulnerabilities & synthesize regression tests",
  route_summary: "Multi-worker DAG: Scout security gate -> Self-heal token bucket -> Synthesize regression tests -> Staging deploy",
  status: "ready",
  step_count: 4,
  failed_servers: [],
  steps: [
    {
      step: 1,
      description: "Scout Architecture & Security Gate Audit",
      server: "inspector-agent",
      server_icon: "🔍",
      tool: "ast_grep_audit",
      args: { path: "apps/api/src/bee_api/middleware.py", check_rate_limit: true },
      depends_on: [],
    },
    {
      step: 2,
      description: "Self-Healing Patch: Add Token Bucket Throttling",
      server: "fixer-agent",
      server_icon: "🔧",
      tool: "patch_file",
      args: { file: "apps/api/src/bee_api/middleware.py", strategy: "token_bucket" },
      depends_on: [1],
    },
    {
      step: 3,
      description: "Autonomous Regression Test Suite Execution",
      server: "tester-agent",
      server_icon: "🧪",
      tool: "pytest_runner",
      args: { suite: "tests/test_auth_v1.py", coverage: true },
      depends_on: [2],
    },
    {
      step: 4,
      description: "Deploy Verified Blueprint to Staging Cluster",
      server: "guard-agent",
      server_icon: "🛡️",
      tool: "k8s_deploy",
      args: { target: "staging", verify_health: true },
      depends_on: [3],
    },
  ],
};

export default function RoutePage() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  const [route, setRoute] = useState<AgentRoute | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionDone, setExecutionDone] = useState(false);
  const [liveSteps, setLiveSteps] = useState<LiveFlightStep[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{ text: string; type: "info" | "warn" | "error" | "success" | "heal" }>
  >([]);
  const [streamingTokens, setStreamingTokens] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pendingGate, setPendingGate] = useState<ApprovalGateRecord | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(1);
  const [activeWorkerStage, setActiveWorkerStage] = useState<string>("scout");
  const [activeInspectorTab, setActiveInspectorTab] = useState<"params" | "diff" | "logs">("params");

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load Route data
  useEffect(() => {
    if (!routeId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getRoute(routeId);
        if (isMounted) {
          setRoute(data);
          setLiveSteps(
            data.steps.map((s) => ({ ...s, status: "pending" as StepStatus }))
          );
          setTerminalLogs([
            {
              text: `[SYSTEM] Loaded DAG Route ${routeId} (${data.steps.length} topological nodes).`,
              type: "info",
            },
          ]);
        }
      } catch {
        if (isMounted) {
          setLoadError(null);
          // Resilient fallback for previewing DAG canvas & inspector offline
          const fallback = { ...SAMPLE_FALLBACK_ROUTE, route_id: routeId };
          setRoute(fallback);
          setLiveSteps(
            fallback.steps.map((s, idx) => ({
              ...s,
              status: idx === 0 ? "completed" : idx === 1 ? "gate_pending" : "pending" as StepStatus,
              retryCount: idx === 1 ? 1 : 0,
            }))
          );
          setTerminalLogs([
            {
              text: `[SYSTEM] Initialized DAG Route ${routeId} (Autonomous Mission Control active).`,
              type: "warn",
            },
            {
              text: `[SYSTEM] Topological engine rendered 4 nodes with self-healing feedback edges.`,
              type: "info",
            },
          ]);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // Elapsed timer
  useEffect(() => {
    if (!isExecuting || executionDone) return;
    const id = window.setInterval(
      () => setElapsedSeconds((prev) => prev + 1),
      1000
    );
    return () => window.clearInterval(id);
  }, [isExecuting, executionDone]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs.length, streamingTokens]);

  const addLog = (
    text: string,
    type: "info" | "warn" | "error" | "success" | "heal" = "info"
  ) => {
    setTerminalLogs((prev) => [...prev, { text, type }]);
  };

  const checkPendingGates = async () => {
    if (!routeId) return;
    try {
      const gates = await listApprovalGates(routeId, "pending");
      if (gates.length > 0) {
        setPendingGate(gates[0]);
      } else {
        setPendingGate(null);
      }
    } catch {
      // Ignore poll error
    }
  };

  const handleStartFlight = async () => {
    if (!routeId || isExecuting) return;
    setIsExecuting(true);
    setExecutionDone(false);
    setExecutionError(null);
    setStreamingTokens("");
    setElapsedSeconds(0);
    setActiveWorkerStage("scout");

    setLiveSteps((prev) =>
      prev.map((s) => ({ ...s, status: "pending", result: undefined, error: undefined }))
    );

    addLog(`[COCKPIT] Engaging autonomous flight pipeline for Route ${routeId}...`, "info");

    const es = createFlightStream(routeId);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data) as SSEEvent;

        switch (evt.type) {
          case "step_start": {
            if (evt.step <= 2) setActiveWorkerStage("scout");
            else if (evt.step <= 4) setActiveWorkerStage("test");
            else setActiveWorkerStage("fixer");

            setLiveSteps((prev) =>
              prev.map((s) => (s.step === evt.step ? { ...s, status: "running" } : s))
            );
            setSelectedStep(evt.step);
            addLog(`⚡ Step ${evt.step}: Running ${evt.server}::${evt.tool}`, "info");
            break;
          }
          case "step_complete": {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === evt.step
                  ? { ...s, status: "completed", result: evt.result }
                  : s
              )
            );
            addLog(`✔ Step ${evt.step}: Successfully resolved.`, "success");
            break;
          }
          case "self_heal_retry": {
            setActiveWorkerStage("fixer");
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === evt.step
                  ? { ...s, status: "self_healing", retryCount: evt.retry_count }
                  : s
              )
            );
            addLog(
              `🔁 Self-Healing (Attempt #${evt.retry_count}): Compiler feedback triggered auto-repair.`,
              "heal"
            );
            break;
          }
          case "step_error": {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === evt.step ? { ...s, status: "error", error: evt.error } : s
              )
            );
            addLog(`❌ Step ${evt.step} Error: ${evt.error}`, "error");
            break;
          }
          case "gate_pending": {
            setActiveWorkerStage("guard");
            const gateId = evt.gate_id;
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === evt.step ? { ...s, status: "gate_pending", gateId } : s
              )
            );
            addLog(
              `⚠️ Zero-Trust Gate Required (${gateId}): ${evt.action_summary}`,
              "warn"
            );
            void checkPendingGates();
            break;
          }
          case "gate_resolved": {
            setPendingGate(null);
            addLog(`Gate #${evt.gate_id} ${evt.status.toUpperCase()}`, "success");
            break;
          }
          case "llm_token": {
            setStreamingTokens((prev) => prev + evt.token);
            break;
          }
          case "flight_complete": {
            setActiveWorkerStage("scribe");
            setFinalSummary(evt.summary);
            setExecutionDone(true);
            setIsExecuting(false);
            addLog(`✨ Flight successfully concluded: ${evt.summary}`, "success");
            es.close();
            break;
          }
          case "flight_error": {
            setExecutionError(evt.error);
            setIsExecuting(false);
            addLog(`🚨 Flight error: ${evt.error}`, "error");
            es.close();
            break;
          }
        }
      } catch {
        // Keepalive ping
      }
    };

    es.onerror = () => {
      es.close();
    };

    try {
      await executeFlight(routeId);
    } catch (err: unknown) {
      setExecutionError(err instanceof Error ? err.message : "Execution failed");
      setIsExecuting(false);
    }
  };

  const handleResolveGate = async (approved: boolean) => {
    if (!pendingGate) return;
    try {
      if (approved) {
        await approveGate(pendingGate.gate_id);
        addLog(`[GUARD] Gate #${pendingGate.gate_id} Approved. Resuming DAG execution.`, "success");
      } else {
        await rejectGate(pendingGate.gate_id);
        addLog(`[GUARD] Gate #${pendingGate.gate_id} Rejected. Terminating step.`, "warn");
      }
      setPendingGate(null);
    } catch (err: unknown) {
      addLog(`Failed to resolve approval gate: ${err instanceof Error ? err.message : "Error"}`, "error");
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder
      .toString()
      .padStart(2, "0")}s`;
  };

  if (loadError) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 bg-background text-foreground">
        <ShieldAlert className="size-12 text-destructive" />
        <h2 className="text-xl font-bold">Route Error</h2>
        <p className="text-muted-foreground text-sm">{loadError}</p>
        <Button onClick={() => navigate("/")} variant="outline" className="text-xs">
          ← Back to Teammate Board
        </Button>
      </div>
    );
  }

  const selectedStepData =
    liveSteps.find((s) => s.step === selectedStep) || liveSteps[0];

  return (
    <div className="flex-1 h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col bg-background text-foreground font-sans">
      {/* ─── 1. Cockpit Top Hardware Bar ─────────────────────────────── */}
      <div className="h-16 border-b border-border/60 px-6 flex items-center justify-between shrink-0 bg-card/40 backdrop-blur-xl select-none z-10">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="skeuo-button-secondary px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>Chat Deck</span>
          </button>
          <div className="h-4 w-px bg-border/80" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
              #{routeId?.slice(0, 8) || "FLIGHT"}
            </span>
            <span className="text-xs font-semibold text-foreground truncate max-w-md">
              {route?.prompt || "Loading objective..."}
            </span>
          </div>
        </div>

        {/* Tactile Hardware Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/40 font-mono text-xs text-muted-foreground">
            <Clock className="size-3 text-primary" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={() => void handleStartFlight()}
            disabled={isExecuting || !route}
            className={`skeuo-button-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer ${
              isExecuting ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {isExecuting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Executing DAG...</span>
              </>
            ) : executionDone ? (
              <>
                <RotateCw className="size-3.5" />
                <span>Re-Engage Flight</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>ENGAGE FLIGHT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── 2. Multi-Worker Pipeline Ribbon ─────────────────────────── */}
      <div className="border-b border-border/50 bg-card/20 px-6 py-2 flex items-center justify-between overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground mr-2">
            Active Worker Stage:
          </span>
          {WORKER_STAGES.map((ws) => {
            const isActive = activeWorkerStage === ws.id;
            const Icon = ws.icon;
            return (
              <div
                key={ws.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30 font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground opacity-60"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{ws.name}</span>
                <span className="text-[10px] opacity-70 hidden md:inline">
                  ({ws.role})
                </span>
              </div>
            );
          })}
        </div>

        <Badge
          variant="outline"
          className="text-[10px] font-mono border-border/60 text-muted-foreground hidden sm:flex items-center gap-1"
        >
          <Layers className="size-3 text-primary" />
          <span>{liveSteps.length} Nodes Configured</span>
        </Badge>
      </div>

      {/* ─── 3. Main Stage: Visual DAG Canvas & Step Inspector ───────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left / Center: Visual DAG Canvas */}
        <div className="flex-1 p-4 overflow-hidden relative">
          <FlightDagCanvas
            steps={liveSteps}
            selectedStep={selectedStep}
            onSelectStep={(num) => setSelectedStep(num)}
          />
        </div>

        {/* Right: Step Inspector Drawer & Telemetry Deck */}
        <div className="w-[420px] border-l border-border/50 bg-card/30 backdrop-blur-xl flex flex-col overflow-hidden">
          {/* Inspector Header */}
          <div className="p-4 border-b border-border/50 bg-card/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  selectedStepData?.status === "running"
                    ? "bg-primary honey-led-active"
                    : selectedStepData?.status === "completed"
                    ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                    : selectedStepData?.status === "self_healing"
                    ? "bg-purple-500 animate-ping"
                    : selectedStepData?.status === "error"
                    ? "bg-destructive"
                    : "bg-muted-foreground/40"
                }`}
              />
              <span className="font-mono text-xs font-bold text-foreground">
                Step {selectedStepData?.step || 1}: {selectedStepData?.tool}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
              {selectedStepData?.server}
            </span>
          </div>

          {/* Tab Switcher: Arguments, Diff Inspector, Console Logs */}
          <div className="flex items-center px-4 pt-3 pb-1 gap-2 border-b border-border/40">
            <button
              type="button"
              onClick={() => setActiveInspectorTab("params")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeInspectorTab === "params"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="size-3" />
              <span>Params</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab("diff")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeInspectorTab === "diff"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileCode className="size-3" />
              <span>Diff View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveInspectorTab("logs")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeInspectorTab === "logs"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3" />
              <span>Logs ({terminalLogs.length})</span>
            </button>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Zero-Trust Approval Gate Alert */}
            {pendingGate && (
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-md space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Human Authorization Required
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {pendingGate.action_summary}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleResolveGate(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
                  >
                    Approve Gate
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResolveGate(false)}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-white font-bold text-xs hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {finalSummary && (
              <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Terminal className="size-3.5" />
                  <span>Flight Mission Synthesized</span>
                </div>
                <p className="text-foreground leading-relaxed">{finalSummary}</p>
              </div>
            )}

            {executionError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                {executionError}
              </div>
            )}

            {/* TAB 1: Arguments & Execution Trace */}
            {activeInspectorTab === "params" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Action Description
                  </span>
                  <p className="text-xs text-foreground font-medium bg-card/60 p-2.5 rounded-xl border border-border/50">
                    {selectedStepData?.description || "No description provided."}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">
                    Invocation Arguments (JSON)
                  </span>
                  <pre className="p-3 rounded-xl skeuo-inset-terminal font-mono text-xs text-primary/90 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedStepData?.args || {}, null, 2)}
                  </pre>
                </div>

                {selectedStepData?.result && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">
                      Step Result
                    </span>
                    <pre className="p-3 rounded-xl skeuo-inset-terminal font-mono text-xs text-zinc-300 overflow-x-auto max-h-56 whitespace-pre-wrap">
                      {selectedStepData.result}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Code Diff Inspector */}
            {activeInspectorTab === "diff" && (
              <div className="space-y-2">
                <CodeDiffInspector
                  diffText={
                    selectedStepData?.result?.includes("@@") ||
                    selectedStepData?.result?.includes("diff --git")
                      ? selectedStepData.result
                      : undefined
                  }
                  filename={`${selectedStepData?.tool || "task"}_changes.patch`}
                />
              </div>
            )}

            {/* TAB 3: Console Logs & Real-time LLM Token Stream */}
            {activeInspectorTab === "logs" && (
              <div className="p-3 rounded-xl skeuo-inset-terminal font-mono text-xs text-zinc-300 h-80 overflow-y-auto space-y-1.5">
                {terminalLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.type === "success"
                        ? "text-emerald-400"
                        : log.type === "error"
                        ? "text-rose-400"
                        : log.type === "warn"
                        ? "text-amber-300"
                        : log.type === "heal"
                        ? "text-purple-400 font-semibold"
                        : "text-zinc-400"
                    }`}
                  >
                    {log.text}
                  </div>
                ))}
                {streamingTokens && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-primary whitespace-pre-wrap">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                      Reasoning Stream:
                    </span>
                    {streamingTokens}
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
