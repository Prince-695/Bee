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
  Check,
  X,
  Shield,
  FileText,
  Search,
  Wrench,
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
}

const WORKER_STAGES = [
  { id: "scout", name: "Inspector", role: "Scout & Analysis", icon: <Search className="w-3.5 h-3.5" /> },
  { id: "test", name: "Tester", role: "Edge Synthesis", icon: <Terminal className="w-3.5 h-3.5" /> },
  { id: "fixer", name: "Fixer", role: "Auto-Heal", icon: <Wrench className="w-3.5 h-3.5" /> },
  { id: "guard", name: "Guard", role: "Policy & Gates", icon: <Shield className="w-3.5 h-3.5" /> },
  { id: "scribe", name: "Scribe", role: "Evidence Report", icon: <FileText className="w-3.5 h-3.5" /> },
];

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
  const [activeWorkerStage, setActiveWorkerStage] = useState<string>("scout");

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

  const checkPendingGates = useCallback(async () => {
    if (!routeId) return;
    try {
      const gates = await listApprovalGates(routeId, "pending");
      if (gates.length > 0) {
        setPendingGate(gates[0]);
      } else {
        setPendingGate(null);
      }
    } catch {
      // Ignore
    }
  }, [routeId]);

  const handleApproveGate = async (gateId: string) => {
    try {
      await approveGate(gateId);
      setPendingGate(null);
      addLog(`[SECURITY GUARD] Gate ${gateId} authorized by human. Resuming flight.`, "success");
    } catch (err) {
      addLog(`[ERROR] Failed to approve gate: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    }
  };

  const handleRejectGate = async (gateId: string) => {
    try {
      await rejectGate(gateId);
      setPendingGate(null);
      addLog(`[SECURITY GUARD] Gate ${gateId} rejected by human. Flight halted.`, "warn");
    } catch (err) {
      addLog(`[ERROR] Failed to reject gate: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    }
  };

  const handleStartFlight = async () => {
    if (!routeId || isExecuting) return;
    setIsExecuting(true);
    setExecutionDone(false);
    setExecutionError(null);
    setStreamingTokens("");
    setFinalSummary("");
    setActiveWorkerStage("scout");
    addLog(`[FLIGHT] Engaging autonomous multi-worker flight for Route ${routeId}...`, "info");

    const es = createFlightStream(routeId);

    es.onmessage = (event) => {
      try {
        const evt = JSON.parse(event.data) as SSEEvent;
        switch (evt.type) {
          case "step_start": {
            const stepNum = evt.step;
            const tool = evt.tool;
            setActiveWorkerStage(tool.includes("test") ? "test" : tool.includes("git") ? "guard" : "fixer");
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === stepNum ? { ...s, status: "running" } : s))
            );
            addLog(`[DISPATCH] Step ${stepNum}: Invoking tool '${tool}'`, "info");
            break;
          }
          case "step_complete": {
            const stepNum = evt.step;
            const res = evt.result;
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === stepNum ? { ...s, status: "completed", result: res } : s))
            );
            addLog(`[SUCCESS] Step ${stepNum} completed cleanly.`, "success");
            break;
          }
          case "self_heal_retry": {
            const stepNum = evt.step;
            const retry = evt.retry_count;
            const err = evt.error;
            setActiveWorkerStage("fixer");
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === stepNum ? { ...s, status: "self_healing", retryCount: retry, error: err } : s))
            );
            addLog(`[SELF-HEALING] Assertion failure in Step ${stepNum} (Retry ${retry}/2): ${err}. Injecting diagnosis...`, "heal");
            break;
          }
          case "gate_pending": {
            const stepNum = evt.step;
            const gateId = evt.gate_id;
            setActiveWorkerStage("guard");
            setLiveSteps((prev) =>
              prev.map((s) => (s.step === stepNum ? { ...s, status: "gate_pending", gateId } : s))
            );
            addLog(`[SECURITY GUARD] Critical action gate pending (${gateId}). Pausing for human authorization.`, "warn");
            void checkPendingGates();
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
            addLog(`[SCRIBE] Flight completed successfully! Generated final report.`, "success");
            es.close();
            break;
          }
          case "flight_error": {
            setExecutionError(evt.error);
            setIsExecuting(false);
            addLog(`[ERROR] Flight encountered error: ${evt.error}`, "error");
            es.close();
            break;
          }
        }
      } catch {
        // Ignore parse error
      }
    };

    es.onerror = () => {
      addLog("[STREAM ERROR] Connection error with flight stream.", "error");
      es.close();
    };

    try {
      await executeFlight(routeId);
    } catch (err) {
      setExecutionError(err instanceof Error ? err.message : "Execution failed");
      setIsExecuting(false);
    }
  };

  if (loadError) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 bg-zinc-950 text-zinc-100">
        <ShieldAlert className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-bold text-white">Route Error</h2>
        <p className="text-zinc-400 text-sm">{loadError}</p>
        <Button onClick={() => navigate("/app")} variant="outline" className="rounded-xl border-zinc-800 bg-zinc-900 text-xs">
          ← Back to Workspace
        </Button>
      </div>
    );
  }

  const selectedStepData = liveSteps.find((s) => s.step === selectedStep) || liveSteps[0];

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      {/* ─── Top Control Bar ─── */}
      <div className="h-16 border-b border-zinc-800/80 px-6 flex items-center justify-between shrink-0 bg-zinc-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app")}
            className="rounded-xl text-zinc-400 hover:text-white text-xs gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {routeId || "FLIGHT"}
            </span>
            <span className="text-xs font-medium text-zinc-300 truncate max-w-md">
              {route?.prompt || "Loading objective..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isExecuting && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-amber-400">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{elapsedSeconds}s</span>
            </div>
          )}

          <Button
            onClick={handleStartFlight}
            disabled={isExecuting || !route}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs shadow-lg shadow-amber-500/10 gap-2"
          >
            {isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-black" />}
            {isExecuting ? "Executing Flight..." : executionDone ? "Re-Run Flight" : "Engage Flight"}
          </Button>
        </div>
      </div>

      {/* ─── Multi-Worker Pipeline Ribbon ─── */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/30 px-6 py-2.5 flex items-center justify-between overflow-x-auto shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mr-3">Workers:</span>
          {WORKER_STAGES.map((ws, idx) => {
            const isActive = activeWorkerStage === ws.id;
            return (
              <div key={ws.id} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs transition-all ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold shadow-sm shadow-amber-500/10"
                      : "text-zinc-500 hover:text-zinc-400"
                  }`}
                >
                  {ws.icon}
                  <span>{ws.name}</span>
                  <span className="text-[10px] font-normal text-zinc-500 hidden md:inline">({ws.role})</span>
                </div>
                {idx < WORKER_STAGES.length - 1 && <span className="text-zinc-700 text-xs">→</span>}
              </div>
            );
          })}
        </div>

        {pendingGate && (
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
            <span>Human Approval Required</span>
          </div>
        )}
      </div>

      {/* ─── Pending Approval Gate Banner ─── */}
      {pendingGate && (
        <div className="m-4 p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>APPROVAL GATE: Action Requires Authorization</span>
            </div>
            <p className="text-xs text-zinc-300">
              Action summary: <span className="text-amber-300 font-mono">{pendingGate.action_summary}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => void handleRejectGate(pendingGate.gate_id)}
              variant="outline"
              className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Reject Action
            </Button>
            <Button
              size="sm"
              onClick={() => void handleApproveGate(pendingGate.gate_id)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Authorize Action
            </Button>
          </div>
        </div>
      )}

      {/* ─── Execution Error Banner ─── */}
      {executionError && (
        <div className="m-4 p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>Flight Error: {executionError}</span>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExecutionError(null)} className="text-red-400 text-xs">
            Dismiss
          </Button>
        </div>
      )}

      {/* ─── Main Workspace: DAG Steps + Live Terminal ─── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: DAG Step Visualizer */}
        <div className="w-full md:w-80 border-r border-zinc-800/80 p-4 overflow-y-auto space-y-2.5 bg-zinc-950/50 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-2">
              Execution Steps ({liveSteps.length})
            </div>

            {liveSteps.map((step) => {
              const isSelected = selectedStep === step.step;
              return (
                <div
                  key={step.step}
                  onClick={() => setSelectedStep(step.step)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 border-amber-500/40 shadow-sm"
                      : "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-zinc-400">#{step.step}</span>
                      <span className="font-mono text-xs font-semibold text-white">{step.tool}</span>
                    </div>
                    {step.status === "completed" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {step.status === "running" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                    {step.status === "self_healing" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        Heal #{step.retryCount}
                      </span>
                    )}
                    {step.status === "gate_pending" && <ShieldAlert className="w-4 h-4 text-blue-400" />}
                    {step.status === "error" && <XCircle className="w-4 h-4 text-red-400" />}
                    {step.status === "pending" && <span className="w-2 h-2 rounded-full bg-zinc-700" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{step.description || "Step invocation"}</p>
                </div>
              );
            })}
          </div>

          {selectedStepData && (
            <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 text-[11px]">
              <div className="font-bold text-white flex items-center justify-between">
                <span>Step #{selectedStepData.step} Inspector</span>
                <span className="font-mono text-[10px] text-amber-400">{selectedStepData.tool}</span>
              </div>
              <div className="text-zinc-400 font-mono text-[10.5px] truncate">
                Args: {JSON.stringify(selectedStepData.args || {})}
              </div>
            </div>
          )}
        </div>

        {/* Right: JetBrains Mono Streaming Terminal */}
        <div className="flex-1 flex flex-col bg-black/90 overflow-hidden font-mono text-xs">
          <div className="h-10 border-b border-zinc-800/80 px-4 flex items-center justify-between text-zinc-400 text-[11px] bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>LIVE FLIGHT TERMINAL</span>
            </div>
            <span className="text-[10px] text-zinc-600">Auto-scrolling</span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-1.5 text-zinc-300">
            {terminalLogs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed ${
                  log.type === "error"
                    ? "text-red-400 font-bold"
                    : log.type === "heal"
                    ? "text-cyan-300 bg-cyan-950/20 px-2 py-0.5 rounded border border-cyan-500/20"
                    : log.type === "success"
                    ? "text-emerald-400"
                    : log.type === "warn"
                    ? "text-amber-300 font-semibold"
                    : "text-zinc-300"
                }`}
              >
                {log.text}
              </div>
            ))}

            {streamingTokens && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-200 whitespace-pre-wrap font-sans text-xs">
                {streamingTokens}
              </div>
            )}

            {finalSummary && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 font-sans text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Scribe Final Report & Verification</span>
                </div>
                <div className="whitespace-pre-wrap">{finalSummary}</div>
              </div>
            )}

            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
