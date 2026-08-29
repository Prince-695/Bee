import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SystemMetrics } from "../components/status/SystemMetrics";
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
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  getHealthStatus,
  getAgentRuntimeStatus,
  queryLogs,
  type HealthStatus,
  type AgentRuntimeStatus,
  type LogQueryEntry,
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

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [healthData, runtimeData, logData] = await Promise.all([
        getHealthStatus(),
        getAgentRuntimeStatus(),
        queryLogs({ limit: 200 }),
      ]);
      setHealth(healthData);
      setRuntime(runtimeData);
      setLogs(logData);
    } catch {
      // Keep existing data
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [healthData, runtimeData, logData] = await Promise.all([
          getHealthStatus(),
          getAgentRuntimeStatus(),
          queryLogs({ limit: 200 }),
        ]);
        if (!isMounted) return;
        setHealth(healthData);
        setRuntime(runtimeData);
        setLogs(logData);
      } catch {
        // ignore
      }
    };
    void load();
    const intervalId = window.setInterval(() => void load(), 12000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const errorCount = logs.filter((e) => e.level === "ERROR").length;
    const healedCount = logs.filter((e) => e.action?.includes("heal")).length || 3;
    const pendingGates = 1;

    return [
      {
        title: "Active Flights",
        value: "1 Running",
        subtext: errorCount > 0 ? `${errorCount} errors observed` : "All execution steps nominal",
        status: "warning",
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
        subtext: "git_commit awaiting approval",
        status: "info",
        icon: <ShieldAlert className="w-5 h-5 text-blue-400 animate-pulse" />,
        badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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
  }, [health, runtime, logs]);

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
    <div className="w-full h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-8">
      {/* Top Banner */}
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
            Assign Task
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md hover:border-zinc-700/80 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{stat.title}</span>
              <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
              <div className="text-[11.5px] text-zinc-400 mt-1">{stat.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launch Action Strip */}
      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/60 via-zinc-900/30 to-zinc-900/60 p-5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Quick Mission Launcher</h2>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">1-click autonomous workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Fix Failing Tests", desc: "Run pytest/vitest & auto-remediate", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> },
            { label: "Review Pull Request", desc: "Inspect diff & verify CI checks", icon: <GitBranch className="w-4 h-4 text-blue-400" /> },
            { label: "Run Security Linter", desc: "Scan codebase for vulnerabilities", icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
            { label: "Codebase Symbol Index", desc: "Ripgrep symbols across packages", icon: <Terminal className="w-4 h-4 text-purple-400" /> },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate("/app")}
              className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-amber-500/40 hover:bg-zinc-900 transition-all text-left group flex items-start gap-3 cursor-pointer"
            >
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors flex items-center justify-between">
                  {item.label}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-400" />
                </div>
                <div className="text-[11px] text-zinc-500 truncate mt-0.5">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Active Task Stream (Left) & Telemetry / Health (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Task Stream */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Live Flight Stream
            </h2>
            <Link to="/app/history" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
              View all history <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md hover:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      {task.id}
                    </span>
                    <span className="text-sm font-semibold text-zinc-200 leading-snug">{task.title}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === "running" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Flying
                      </span>
                    )}
                    {task.status === "gate_pending" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <AlertTriangle className="w-3 h-3 text-blue-400" />
                        Gate Pending
                      </span>
                    )}
                    {task.status === "healed" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Self-Healed
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar & meta */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        task.status === "healed"
                          ? "bg-emerald-500"
                          : task.status === "gate_pending"
                          ? "bg-blue-500"
                          : "bg-gradient-to-r from-amber-500 to-amber-400"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.duration}
                    </span>
                    <span className="font-bold text-zinc-300">{task.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Telemetry & Logs */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Execution Telemetry</h2>

          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md space-y-4">
            <SystemMetrics points={latencySeries} />

            <div className="border-t border-zinc-800 pt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">FastAPI Gateway</span>
                <span className="font-semibold text-emerald-400">● Online (Port 8000)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Flight Worker</span>
                <span className="font-semibold text-emerald-400">● Queue Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Self-Healing Engine</span>
                <span className="font-semibold text-amber-400">⚡ Adaptive Retry On</span>
              </div>
            </div>
          </div>

          {/* Real-time audit log snippets */}
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Telemetry Audit</span>
              <span className="font-mono text-zinc-500">{logs.length} events</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto font-mono text-[11px]">
              {logs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-1 border-b border-zinc-900 last:border-0">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[9.5px] shrink-0 ${
                      log.level === "ERROR"
                        ? "bg-red-500/10 text-red-400"
                        : log.level === "WARN"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {log.level}
                  </span>
                  <span className="text-zinc-300 truncate">{log.action}</span>
                  {log.duration_ms != null && (
                    <span className="text-zinc-500 ml-auto shrink-0">{log.duration_ms}ms</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
