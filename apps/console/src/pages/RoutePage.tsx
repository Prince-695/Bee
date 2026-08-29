import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Sparkles,
  Terminal,
  ShieldAlert,
  RotateCcw,
  Check,
  X,
  Code2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getRoute,
  executeFlight,
  createFlightStream,
  listApprovalGates,
  approveGate,
  rejectGate,
  type AgentRoute,
  type RouteStep,
  type SSEEvent,
  type ApprovalGateRecord,
} from "@/lib/api";

type StepStatus = "pending" | "running" | "completed" | "error" | "self_healing" | "gate_pending";

interface LiveStep extends RouteStep {
  status: StepStatus;
  result?: string;
  error?: string;
  retryCount?: number;
  gateId?: string;
  gateSummary?: string;
}

export default function RoutePage() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();

  const [route, setRoute] = useState<AgentRoute | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionDone, setExecutionDone] = useState(false);
  const [liveSteps, setLiveSteps] = useState<LiveStep[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<Array<{ text: string; type: "info" | "warn" | "error" | "success" | "heal" }>>([]);
  const [streamingTokens, setStreamingTokens] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [pendingGate, setPendingGate] = useState<ApprovalGateRecord | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(1);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Load Route data
  useEffect(() => {
    if (!routeId) return;
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getRoute(routeId);
        if (isMounted) {
          setRoute(data);
          setLiveSteps(data.steps.map((s) => ({ ...s, status: "pending" as StepStatus })));
          setTerminalLogs([{ text: `[SYSTEM] Loaded Route ${routeId} (${data.steps.length} steps configured).`, type: "info" }]);
        }
      } catch (err) {
        if (isMounted) setLoadError(err instanceof Error ? err.message : "Failed to load route");
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // Elapsed timer
  useEffect(() => {
    if (!isExecuting) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [isExecuting]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, streamingTokens]);

  const addLog = (text: string, type: "info" | "warn" | "error" | "success" | "heal" = "info") => {
    setTerminalLogs((prev) => [...prev, { text, type }]);
  };

  const checkGates = async () => {
    if (!routeId) return;
    try {
      const gates = await listApprovalGates(routeId, "pending");
      if (gates && gates.length > 0) {
        setPendingGate(gates[0]);
      } else {
        setPendingGate(null);
      }
    } catch {
      // ignore
    }
  };

  const handleApproveGate = async (gateId: string) => {
    try {
      await approveGate(gateId);
      addLog(`[GATE] Gate ${gateId} APPROVED by user. Resuming flight...`, "success");
      setPendingGate(null);
    } catch (err) {
      addLog(`[GATE ERROR] Failed to approve gate: ${err}`, "error");
    }
  };

  const handleRejectGate = async (gateId: string) => {
    try {
      await rejectGate(gateId);
      addLog(`[GATE] Gate ${gateId} REJECTED by user. Skipping or cancelling action...`, "warn");
      setPendingGate(null);
    } catch (err) {
      addLog(`[GATE ERROR] Failed to reject gate: ${err}`, "error");
    }
  };

  const handleExecute = useCallback(async () => {
    if (!routeId || isExecuting) return;
    setIsExecuting(true);
    setExecutionError(null);
    setStreamingTokens("");
    setFinalSummary("");
    setTerminalLogs([{ text: `[FLIGHT START] Initiating Flight for Route ${routeId}...`, type: "info" }]);

    const eventSource = createFlightStream(routeId);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SSEEvent & Record<string, any>;

        switch (data.type) {
          case "step_start":
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === data.step ? { ...s, status: "running" } : s))
            );
            setSelectedStep(data.step);
            addLog(`[STEP ${data.step}] ▶️ [${data.server}] ${data.tool}(${JSON.stringify(data.args)})`, "info");
            break;

          case "step_complete":
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === data.step ? { ...s, status: "completed", result: data.result } : s))
            );
            addLog(`[STEP ${data.step}] ✅ Output: ${data.result?.slice(0, 300)}`, "success");
            break;

          case "step_error":
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === data.step ? { ...s, status: "error", error: data.error } : s))
            );
            addLog(`[STEP ${data.step}] ❌ Error: ${data.error}`, "error");
            break;

          case "self_heal_retry":
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === data.step ? { ...s, status: "self_healing", retryCount: data.retry_count } : s
              )
            );
            addLog(`[SELF-HEAL] ⚡ Auto-diagnosing step ${data.step} failure (Retry ${data.retry_count})...`, "heal");
            break;

          case "gate_pending":
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === data.step
                  ? { ...s, status: "gate_pending", gateId: data.gate_id, gateSummary: data.action_summary }
                  : s
              )
            );
            addLog(`[APPROVAL GATE] ⚠️ Action requires approval: ${data.action_summary}`, "warn");
            void checkGates();
            break;

          case "gate_resolved":
            addLog(`[GATE RESOLVED] Gate ${data.gate_id} ${data.status.toUpperCase()}`, "info");
            void checkGates();
            break;

          case "llm_token":
            setStreamingTokens((prev) => prev + data.token);
            break;

          case "flight_complete":
            setFinalSummary(data.summary);
            setExecutionDone(true);
            setIsExecuting(false);
            addLog(`[FLIGHT COMPLETE] ✅ All steps executed successfully.`, "success");
            eventSource.close();
            break;

          case "flight_error":
            setExecutionError(data.error);
            setExecutionDone(true);
            setIsExecuting(false);
            addLog(`[FLIGHT ERROR] ❌ Flight halted: ${data.error}`, "error");
            eventSource.close();
            break;
        }
      } catch {
        // ignore parse error
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    try {
      const result = await executeFlight(routeId);
      if (!finalSummary && result.assistant_response) {
        setFinalSummary(result.assistant_response);
      }
      setExecutionDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setExecutionError(msg);
      setExecutionDone(true);
    } finally {
      setIsExecuting(false);
    }
  }, [routeId, isExecuting, finalSummary]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 max-w-md text-center">
          <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-300 font-medium">{loadError}</p>
          <Button className="mt-4 rounded-xl" onClick={() => navigate("/app")}>
            Back to Co-Engineer
          </Button>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  const activeStepDetail = liveSteps.find((s) => s.step === selectedStep) || liveSteps[0];

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-zinc-950">
      {/* Sticky Mission Control Header Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            onClick={() => navigate("/app")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {route.route_id}
              </span>
              <h1 className="text-base font-bold text-white tracking-tight">Mission Control</h1>
            </div>
            <p className="text-xs text-zinc-400 truncate max-w-md mt-0.5">{route.prompt}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isExecuting && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              {elapsedSeconds}s
            </span>
          )}

          {!executionDone && (
            <Button
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20"
              onClick={() => void handleExecute()}
              disabled={isExecuting}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Flying Route...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2 fill-black" />
                  Execute Flight
                </>
              )}
            </Button>
          )}

          {executionDone && (
            <Button
              variant="outline"
              className="rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs"
              onClick={() => navigate("/app")}
            >
              New Task
            </Button>
          )}
        </div>
      </div>

      {/* Pending Approval Gate High-Priority Banner */}
      {pendingGate && (
        <div className="bg-gradient-to-r from-blue-950/80 via-blue-900/40 to-blue-950/80 border-b border-blue-500/40 p-4 px-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                  Approval Gate Required
                </span>
                <span className="text-xs text-zinc-400">[{pendingGate.server} → {pendingGate.tool}]</span>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5">{pendingGate.action_summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs px-4"
              onClick={() => void handleApproveGate(pendingGate.gate_id)}
            >
              <Check className="w-4 h-4 mr-1.5" />
              Authorize Action
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-4"
              onClick={() => void handleRejectGate(pendingGate.gate_id)}
            >
              <X className="w-4 h-4 mr-1.5" />
              Reject
            </Button>
          </div>
        </div>
      )}

      {/* Main Split-View Workspace */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Execution DAG & Steps (55%) */}
        <div className="flex-1 lg:w-[55%] min-h-0 overflow-y-auto p-6 space-y-4 border-r border-zinc-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Route Execution Graph</h2>
            </div>
            <span className="text-xs text-zinc-500 font-mono">{route.step_count} DAG Nodes</span>
          </div>

          {/* DAG Nodes Container */}
          <div className="space-y-3">
            {liveSteps.map((step) => {
              const isSelected = selectedStep === step.step;
              return (
                <div
                  key={step.step}
                  onClick={() => setSelectedStep(step.step)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected ? "ring-1 ring-amber-500/40" : ""
                  } ${
                    step.status === "running"
                      ? "border-amber-500/60 bg-amber-500/5 shadow-lg shadow-amber-500/10"
                      : step.status === "completed"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : step.status === "error"
                      ? "border-red-500/40 bg-red-500/5"
                      : step.status === "self_healing"
                      ? "border-cyan-500/40 bg-cyan-500/5"
                      : step.status === "gate_pending"
                      ? "border-blue-500/60 bg-blue-500/5"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-sm shrink-0">
                        {step.server_icon || "🔧"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-zinc-400">Step {step.step}</span>
                          <span className="text-xs font-mono font-semibold text-amber-400">{step.tool}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">[{step.server}]</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-0.5">{step.description}</p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {step.status === "running" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Running
                        </span>
                      )}
                      {step.status === "completed" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Complete
                        </span>
                      )}
                      {step.status === "self_healing" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          <RotateCcw className="w-3 h-3 animate-spin" />
                          Healing ({step.retryCount || 1})
                        </span>
                      )}
                      {step.status === "gate_pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          <ShieldAlert className="w-3 h-3" />
                          Approval
                        </span>
                      )}
                      {step.status === "error" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" />
                          Failed
                        </span>
                      )}
                      {step.status === "pending" && (
                        <span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 rounded border border-zinc-800">
                          Queued
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Execution Error Banner */}
          {executionError && (
            <div className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 backdrop-blur-md flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Flight Error</p>
                <p className="text-xs text-red-200 mt-0.5">{executionError}</p>
              </div>
            </div>
          )}

          {/* AI Response Card */}
          {(finalSummary || streamingTokens) && (
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-4 h-4" />
                Bee Co-Engineer Report
              </div>
              <div className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans">
                {finalSummary || streamingTokens}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Streaming Terminal Log & Step Inspector (45%) */}
        <div className="flex-1 lg:w-[45%] min-h-0 flex flex-col bg-zinc-950 overflow-hidden">
          {/* Panel Tab Header */}
          <div className="border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <Terminal className="w-4 h-4 text-amber-400" />
              Live Flight Terminal Output
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-500">SSE Stream Active</span>
            </div>
          </div>

          {/* Terminal Console View */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs space-y-1.5 bg-black/90 selection:bg-amber-500/30">
            {terminalLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-600 select-none shrink-0">{i + 1}</span>
                <span
                  className={`${
                    log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "warn"
                      ? "text-amber-400"
                      : log.type === "error"
                      ? "text-red-400"
                      : log.type === "heal"
                      ? "text-cyan-400"
                      : "text-zinc-300"
                  } whitespace-pre-wrap break-all`}
                >
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Selected Step Arguments / Output Inspector */}
          {activeStepDetail && (
            <div className="border-t border-zinc-800 p-4 bg-zinc-900/70 shrink-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-200">
                  <Code2 className="w-3.5 h-3.5 text-amber-400" />
                  Step {activeStepDetail.step} Inspector: {activeStepDetail.tool}
                </div>
                <span className="text-[10.5px] font-mono text-zinc-400">{activeStepDetail.status}</span>
              </div>

              <div className="text-[11px] font-mono p-2.5 rounded-lg bg-black/70 border border-zinc-800 text-zinc-300 max-h-28 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(activeStepDetail.args, null, 2)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
