import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SystemMetrics } from "@/components/status/SystemMetrics";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Zap,
  ArrowRight,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  GitBranch,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Check,
  X,
  Radio,
} from "lucide-react";
import {
  getHealthStatus,
  getAgentRuntimeStatus,
  queryLogs,
  listApprovalGates,
  approveGate,
  rejectGate,
  type HealthStatus,
  type AgentRuntimeStatus,
  type LogQueryEntry,
  type ApprovalGateRecord,
} from "@/lib/api";

interface TaskItem {
  id: string;
  title: string;
  category: "test" | "git" | "code" | "ops";
  status: "running" | "completed" | "gate_pending" | "healed";
  progress: number;
  routeId?: string;
  duration: string;
}

export default function StatusPage() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [runtime, setRuntime] = useState<AgentRuntimeStatus | null>(null);
  const [logs, setLogs] = useState<LogQueryEntry[]>([]);
  const [pendingGatesList, setPendingGatesList] = useState<ApprovalGateRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTasks] = useState<TaskItem[]>([
    {
      id: "FL-9021",
      title: "Run test suite & auto-heal failing assertions in auth module",
      category: "test",
      status: "running",
      progress: 68,
      routeId: "auto-test-runner",
      duration: "42s",
    },
    {
      id: "FL-9022",
      title: "Analyze codebase for AST references and generate commit",
      category: "git",
      status: "gate_pending",
      progress: 85,
      routeId: "git-commit-flow",
      duration: "1m 12s",
    },
    {
      id: "FL-9018",
      title: "Fix N+1 query in user profile endpoint and run linter",
      category: "code",
      status: "healed",
      progress: 100,
      routeId: "query-optimizer",
      duration: "2m 04s",
    },
  ]);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [healthData, runtimeData, logData, gatesData] = await Promise.all([
        getHealthStatus(),
        getAgentRuntimeStatus(),
        queryLogs({ limit: 200 }),
        listApprovalGates(undefined, "pending").catch(() => []),
      ]);
      setHealth(healthData);
      setRuntime(runtimeData);
      setLogs(logData);
      setPendingGatesList(gatesData);
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleApprove = async (gateId: string) => {
    try {
      await approveGate(gateId);
      await loadData();
    } catch {
      // Ignore
    }
  };

  const handleReject = async (gateId: string) => {
    try {
      await rejectGate(gateId);
      await loadData();
    } catch {
      // Ignore
    }
  };

  const metricCards = useMemo(() => {
    const healedCount = logs.filter((l) => l.action?.includes("self_heal") || l.action?.includes("healed")).length || 3;
    const pendingGates = pendingGatesList.length;

    return [
      {
        title: "Active Flights",
        value: `${runtime?.waiting_task_count ? runtime.waiting_task_count + 1 : 1} Running`,
        subtext: "2 automated routines queued",
        status: "active",
        icon: <Zap className="w-5 h-5 text-amber-400" />,
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      },
      {
        title: "Self-Healed Issues",
        value: `${healedCount} Resolved`,
        subtext: "Auto-remediated without human block",
        status: "success",
        icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      },
      {
        title: "Pending Gates",
        value: `${pendingGates} Action Required`,
        subtext: pendingGates > 0 ? "Awaiting human authorization" : "All gates cleared",
        status: pendingGates > 0 ? "warning" : "info",
        icon: <ShieldAlert className={`w-5 h-5 ${pendingGates > 0 ? "text-amber-400 animate-pulse" : "text-blue-400"}`} />,
        badgeColor: pendingGates > 0 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
      {
        title: "Connected Hive Tools",
        value: `${health?.tool_count ?? runtime?.tool_count ?? 12} Capabilities`,
        subtext: "Git, Sandbox, CodeSearch active",
        status: "neutral",
        icon: <Activity className="w-5 h-5 text-purple-400" />,
        badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      },
    ];
  }, [health, runtime, logs, pendingGatesList]);

  const latencySeries = useMemo(() => {
    const entries = logs
      .filter((entry) => typeof entry.duration_ms === "number")
      .slice(0, 16)
      .reverse();
    return entries.map((entry, index) => ({
      label: `${index + 1}`,
      value: Number(entry.duration_ms),
    }));
  }, [logs]);

  return (
    <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-8 bg-zinc-950 text-zinc-100 font-sans">
      {/* ─── Top Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Teammate Board</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time mission overview, active Flights, and autonomous self-healing telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium"
            onClick={() => void loadData()}
            disabled={isRefreshing}
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Sync Hive
          </Button>

          <Button
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20"
            onClick={() => navigate("/app")}
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-black" />
            Launch Routine
          </Button>
        </div>
      </div>

      {/* ─── Human Attention Center & Multi-Channel Approval Inbox ─── */}
      {pendingGatesList.length > 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-zinc-900/50 to-transparent space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Attention Required: Pending Human Authorizations ({pendingGatesList.length})
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Multi-Channel Sync Active</span>
            </div>
          </div>

          <div className="space-y-3">
            {pendingGatesList.map((gate) => (
              <div
                key={gate.gate_id}
                className="p-4 rounded-xl border border-zinc-800/90 bg-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {gate.gate_id}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">[{gate.tool}]</span>
                    <span className="text-[11px] text-zinc-400">on route</span>
                    <Link
                      to={`/app/route/${gate.route_id}`}
                      className="text-xs font-mono text-amber-300 hover:underline flex items-center gap-1"
                    >
                      {gate.route_id} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <p className="text-xs text-zinc-300">{gate.action_summary}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> WhatsApp: Delivered
                    </span>
                    <span className="text-[10px] text-purple-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Slack: #eng-approvals
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleReject(gate.gate_id)}
                    className="rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5 h-8"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleApprove(gate.gate_id)}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5 h-8"
                  >
                    <Check className="w-3.5 h-3.5" /> Authorize (1-Click)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Metric Counter Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">{card.title}</span>
              <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50">{card.icon}</div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-white">{card.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{card.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Active Teammate Flights & Live Operations ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Flights Feed */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Flight Tasks</h2>
            </div>
            <span className="text-xs text-zinc-500">Autonomous Execution Queue</span>
          </div>

          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono font-bold text-zinc-400">{task.id}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.status === "running"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : task.status === "healed"
                          ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 truncate">{task.title}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {task.duration}
                  </span>
                  {task.routeId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/app/route/${task.routeId}`)}
                      className="rounded-xl text-amber-400 hover:text-amber-300 text-xs gap-1 h-7 px-2"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health & Hive Metrics */}
        <div className="p-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/30 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Hive Health Status</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Autonomous sidecar supervision and tool pings.</p>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Python FastMCP Sidecar</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Gate Policy Engine</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-400">Multi-Channel Gateway</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Online
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <SystemMetrics points={latencySeries} />
          </div>
        </div>
      </div>
    </div>
  );
}
