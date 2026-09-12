import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCw,
  Sparkles,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getRoute,
  executeFlight,
  createFlightStream,
  approveGate,
  rejectGate,
  type AgentRoute,
  type RouteStep,
  type SSEEvent,
  type ApprovalGateRecord,
} from "@/lib/api";

export type StepStatus =
  | "pending"
  | "running"
  | "completed"
  | "error"
  | "self_healing"
  | "gate_pending";

export interface LiveFlightStep extends RouteStep {
  status: StepStatus;
  result?: string;
  error?: string;
  retryCount?: number;
  gateId?: string;
}

interface InlineFlightPlayerProps {
  routeId: string;
  initialRoute?: AgentRoute | null;
  autoStart?: boolean;
  onCompleted?: (summary: string) => void;
}

export function InlineFlightPlayer({
  routeId,
  initialRoute,
  autoStart = false,
  onCompleted,
}: InlineFlightPlayerProps) {
  const [route, setRoute] = useState<AgentRoute | null>(initialRoute || null);
  const [liveSteps, setLiveSteps] = useState<LiveFlightStep[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executionDone, setExecutionDone] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamingTokens, setStreamingTokens] = useState("");
  const [finalSummary, setFinalSummary] = useState("");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeTab, setActiveTab] = useState<"steps" | "terminal">("steps");
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [pendingGate, setPendingGate] = useState<ApprovalGateRecord | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{ text: string; type: "info" | "warn" | "error" | "success" | "heal" }>
  >([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load Route data if not pre-provided
  useEffect(() => {
    let mounted = true;
    if (!route) {
      void getRoute(routeId)
        .then((data) => {
          if (!mounted) return;
          setRoute(data);
          setLiveSteps(
            data.steps.map((s) => ({ ...s, status: "pending" as StepStatus }))
          );
          setTerminalLogs([
            {
              text: `[SYSTEM] Flight blueprint initialized for Route ${routeId} (${data.steps.length} steps).`,
              type: "info",
            },
          ]);
        })
        .catch((err) => {
          if (!mounted) return;
          setExecutionError(
            err instanceof Error ? err.message : "Failed to load route."
          );
        });
    } else if (route?.steps) {
      setLiveSteps((current) => {
        if (current.length === 0) {
          return (route.steps || []).map((s) => ({ ...s, status: "pending" as StepStatus }));
        }
        return current;
      });
    }
    return () => {
      mounted = false;
    };
  }, [routeId, route]);

  // Elapsed flight clock
  useEffect(() => {
    if (!isExecuting || isPaused || executionDone) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isExecuting, isPaused, executionDone]);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs.length, streamingTokens]);

  const addTerminalLog = (
    text: string,
    type: "info" | "warn" | "error" | "success" | "heal" = "info"
  ) => {
    setTerminalLogs((prev) => [...prev, { text, type }]);
  };

  // Launch Flight Execution
  const handleStartFlight = useCallback(async () => {
    if (isExecuting || executionDone) return;
    setIsExecuting(true);
    setIsPaused(false);
    setExecutionError(null);
    setStreamingTokens("");

    addTerminalLog(
      `[COCKPIT] Initiating Flight Deck for Route ${routeId}...`,
      "info"
    );

    try {
      const sse = createFlightStream(routeId);
      eventSourceRef.current = sse;

      sse.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as SSEEvent;

          if (payload.type === "step_start") {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === payload.step ? { ...s, status: "running" } : s
              )
            );
            addTerminalLog(
              `⚡ Step ${payload.step}: Running ${payload.server}::${payload.tool}`,
              "info"
            );
          } else if (payload.type === "step_complete") {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === payload.step
                  ? { ...s, status: "completed", result: payload.result }
                  : s
              )
            );
            addTerminalLog(
              `✔ Step ${payload.step}: Successfully resolved.`,
              "success"
            );
          } else if (payload.type === "self_heal_retry") {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === payload.step
                  ? {
                      ...s,
                      status: "self_healing",
                      retryCount: payload.retry_count,
                    }
                  : s
              )
            );
            addTerminalLog(
              `🔁 Self-Healing (Attempt #${payload.retry_count}): ${payload.error}`,
              "heal"
            );
          } else if (payload.type === "step_error") {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === payload.step
                  ? { ...s, status: "error", error: payload.error }
                  : s
              )
            );
            addTerminalLog(
              `❌ Step ${payload.step} Error: ${payload.error}`,
              "error"
            );
          } else if (payload.type === "gate_pending") {
            setLiveSteps((prev) =>
              prev.map((s) =>
                s.step === payload.step ? { ...s, status: "gate_pending" } : s
              )
            );
            setPendingGate({
              gate_id: payload.gate_id,
              route_id: routeId,
              step_num: payload.step,
              server: payload.server,
              tool: payload.tool,
              args: {},
              action_summary: payload.action_summary,
              status: "pending",
              created_at: new Date().toISOString(),
              resolved_at: null,
            });
            addTerminalLog(
              `⚠️ Zero-Trust Approval Gate Required: ${payload.action_summary}`,
              "warn"
            );
          } else if (payload.type === "gate_resolved") {
            setPendingGate(null);
            addTerminalLog(
              `Gate #${payload.gate_id} ${payload.status.toUpperCase()}`,
              payload.status === "approved" ? "success" : "warn"
            );
          } else if (payload.type === "llm_token") {
            setStreamingTokens((prev) => prev + payload.token);
          } else if (payload.type === "flight_complete") {
            sse.close();
            setIsExecuting(false);
            setExecutionDone(true);
            setFinalSummary(payload.summary);
            addTerminalLog(
              `✨ Flight successfully concluded: ${payload.summary}`,
              "success"
            );
            onCompleted?.(payload.summary);
          } else if (payload.type === "flight_error") {
            sse.close();
            setIsExecuting(false);
            setExecutionError(payload.error);
            addTerminalLog(`🚨 Flight execution aborted: ${payload.error}`, "error");
          }
        } catch {
          // Ignore parse errors on keepalive ping
        }
      };

      sse.onerror = () => {
        // SSE disconnected or finished
        sse.close();
      };

      // Trigger server-side execution pipeline
      await executeFlight(routeId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed to initialize.";
      setIsExecuting(false);
      setExecutionError(msg);
      addTerminalLog(`Error launching flight: ${msg}`, "error");
    }
  }, [routeId, isExecuting, executionDone, onCompleted]);

  // Handle autostart if specified
  useEffect(() => {
    if (autoStart && route && !isExecuting && !executionDone) {
      void handleStartFlight();
    }
  }, [autoStart, route, isExecuting, executionDone, handleStartFlight]);

  // Handle Gate Approval inline
  const handleResolveGate = async (approved: boolean) => {
    if (!pendingGate) return;
    try {
      if (approved) {
        await approveGate(pendingGate.gate_id);
      } else {
        await rejectGate(pendingGate.gate_id);
      }
      setPendingGate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resolve approval gate.";
      addTerminalLog(`Failed to resolve approval gate: ${msg}`, "error");
    }
  };

  const handleAbortFlight = () => {
    eventSourceRef.current?.close();
    setIsExecuting(false);
    addTerminalLog("[COCKPIT] Flight terminated by operator.", "warn");
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder
      .toString()
      .padStart(2, "0")}s`;
  };

  const completedStepsCount = liveSteps.filter(
    (s) => s.status === "completed"
  ).length;
  const progressPercent =
    liveSteps.length > 0
      ? Math.round((completedStepsCount / liveSteps.length) * 100)
      : 0;

  return (
    <div
      className={`my-3 transition-all rounded-2xl overflow-hidden skeuo-glass-deck ${
        isFullscreen ? "fixed inset-4 z-50 shadow-2xl flex flex-col" : "w-full"
      }`}
    >
      {/* ─── 1. Cockpit Header & Hardware Control Bar ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-card/40 backdrop-blur-md">
        {/* Left: Flight telemetry and LED */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full transition-all ${
                isExecuting
                  ? "bg-primary honey-led-active"
                  : executionDone
                  ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                  : "bg-muted-foreground/40"
              }`}
            />
            <span className="font-mono text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>FLIGHT DECK</span>
              <span className="text-[10px] text-muted-foreground">
                #{routeId.slice(0, 8)}
              </span>
            </span>
          </div>

          <div className="h-4 w-px bg-border/80" />

          {/* Clock telemetry */}
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-md border border-border/40">
            <Clock className="size-3 text-primary" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Progress telemetry */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden border border-border/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {completedStepsCount}/{liveSteps.length}
            </span>
          </div>
        </div>

        {/* Right: Tactile Hardware Controls */}
        <div className="flex items-center gap-2">
          {!isExecuting && !executionDone && (
            <button
              type="button"
              onClick={() => void handleStartFlight()}
              className="skeuo-button-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="size-3 fill-current" />
              <span>ENGAGE FLIGHT</span>
            </button>
          )}

          {isExecuting && (
            <>
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="skeuo-button-secondary px-2.5 py-1.5 rounded-lg text-xs font-semibold text-foreground flex items-center gap-1 cursor-pointer"
              >
                {isPaused ? (
                  <>
                    <Play className="size-3 fill-current text-primary" />
                    <span className="text-[11px]">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="size-3 fill-current text-amber-500" />
                    <span className="text-[11px]">Hold</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAbortFlight}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Square className="size-3 fill-current" />
                <span className="text-[11px]">Abort</span>
              </button>
            </>
          )}

          {executionDone && (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-mono">
              <CheckCircle2 className="size-3 mr-1" />
              COMPLETED
            </Badge>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Flight Deck"}
          >
            {isFullscreen ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── 2. Route Goal Banner ────────────────────────────────────── */}
      {route?.prompt && (
        <div className="px-4 py-2 bg-primary/5 border-b border-border/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="size-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate">
              {route.prompt}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0 pl-2">
            {route.steps?.length || 0} DAG Nodes
          </span>
        </div>
      )}

      {/* ─── 3. Inset Terminal / Steps Stage ─────────────────────────── */}
      <div className={`p-4 space-y-3 ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}>
        {/* Tab switchers: Visual Steps vs Live Terminal */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "steps"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3" />
              <span>Flight Steps ({liveSteps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("terminal")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "terminal"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="size-3" />
              <span>Live Console Stream</span>
            </button>
          </div>

          {isExecuting && (
            <div className="flex items-center gap-1.5 text-[11px] text-primary font-mono animate-pulse">
              <Loader2 className="size-3 animate-spin" />
              <span>Streaming DAG...</span>
            </div>
          )}
        </div>

        {/* TAB 1: Visual DAG Steps */}
        {activeTab === "steps" && (
          <div className="space-y-2">
            {liveSteps.map((step, idx) => {
              const isSelected = selectedStepIndex === idx;
              return (
                <div
                  key={step.step}
                  className={`rounded-xl border transition-all ${
                    step.status === "running"
                      ? "border-primary bg-primary/10 shadow-[0_2px_12px_rgba(255,178,44,0.12)]"
                      : step.status === "completed"
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : step.status === "self_healing"
                      ? "border-purple-500/40 bg-purple-500/5 animate-pulse"
                      : step.status === "error"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border/60 bg-card/40 hover:bg-card/70"
                  }`}
                >
                  <div
                    onClick={() =>
                      setSelectedStepIndex(isSelected ? null : idx)
                    }
                    className="flex items-center justify-between p-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Step Status Indicator */}
                      <span
                        className={`size-6 rounded-lg flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                          step.status === "running"
                            ? "bg-primary text-primary-foreground honey-led-active"
                            : step.status === "completed"
                            ? "bg-emerald-500 text-white"
                            : step.status === "self_healing"
                            ? "bg-purple-600 text-white"
                            : step.status === "error"
                            ? "bg-destructive text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {step.status === "running" ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : step.status === "completed" ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : step.status === "self_healing" ? (
                          <RotateCw className="size-3 animate-spin" />
                        ) : step.status === "error" ? (
                          <XCircle className="size-3.5" />
                        ) : (
                          step.step
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {step.description || `Step ${step.step}`}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/40">
                            {step.server}::{step.tool}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {step.retryCount && step.retryCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-semibold">
                          Retry #{step.retryCount}
                        </span>
                      )}
                      {isSelected ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Step Inspector Drawer */}
                  {isSelected && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/40 text-xs space-y-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground">
                          Arguments
                        </span>
                        <pre className="p-2 rounded-lg skeuo-inset-terminal font-mono text-[11px] text-primary/90 overflow-x-auto">
                          {JSON.stringify(step.args, null, 2)}
                        </pre>
                      </div>

                      {step.result && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-emerald-400">
                            Execution Output
                          </span>
                          <pre className="p-2 rounded-lg skeuo-inset-terminal font-mono text-[11px] text-zinc-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {step.result}
                          </pre>
                        </div>
                      )}

                      {step.error && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase text-destructive">
                            Failure Diagnostic
                          </span>
                          <pre className="p-2 rounded-lg skeuo-inset-terminal font-mono text-[11px] text-destructive whitespace-pre-wrap">
                            {step.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Inset Acrylic Terminal View */}
        {activeTab === "terminal" && (
          <div className="p-3 rounded-xl skeuo-inset-terminal font-mono text-xs text-zinc-300 h-64 overflow-y-auto space-y-1.5">
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

            {/* Real-time LLM streaming thoughts */}
            {streamingTokens && (
              <div className="mt-2 pt-2 border-t border-white/10 text-primary whitespace-pre-wrap">
                <span className="text-[10px] text-muted-foreground uppercase block mb-1">
                  Co-Engineer Reasoning Stream:
                </span>
                {streamingTokens}
              </div>
            )}
            <div ref={terminalEndRef} />
          </div>
        )}

        {/* ─── 4. Zero-Trust Approval Gate Alert (If Triggered) ─────── */}
        {pendingGate && (
          <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 backdrop-blur-md space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-foreground">
                  Zero-Trust Approval Gate Resolution Required
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {pendingGate.action_summary}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1 pl-6">
              <button
                type="button"
                onClick={() => void handleResolveGate(true)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer"
              >
                Approve Action
              </button>
              <button
                type="button"
                onClick={() => void handleResolveGate(false)}
                className="px-3 py-1.5 rounded-lg bg-destructive text-white font-bold text-xs hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
              >
                Reject Action
              </button>
            </div>
          </div>
        )}

        {/* ─── 5. Final Synthesis Summary ──────────────────────────── */}
        {finalSummary && (
          <div className="p-3 rounded-xl border border-primary/40 bg-primary/5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <CheckCircle2 className="size-3.5" />
              <span>Flight Mission Synthesized</span>
            </div>
            <p className="text-foreground leading-relaxed">
              {finalSummary}
            </p>
          </div>
        )}

        {/* Execution Error Banner */}
        {executionError && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            {executionError}
          </div>
        )}
      </div>
    </div>
  );
}
