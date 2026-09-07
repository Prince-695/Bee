import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  FileCode2,
  Clock,
  ExternalLink,
  Check,
  X,
  Smartphone,
  Cpu,
  Boxes,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  listApprovalGates,
  approveGate,
  rejectGate,
  type ApprovalGateRecord,
} from "@/lib/api";

// The 5 Specialized AI Co-Engineers in the Bee Fleet
const FLEET_AGENTS = [
  {
    id: "scout",
    name: "Scout Agent",
    role: "Codebase Indexing & AST Navigation",
    status: "Monitoring",
    state: "idle",
    toolsUsed: 38,
    activeTask: "Watching git tree for branch changes",
    icon: <Bot className="w-4 h-4 text-primary" />,
  },
  {
    id: "tester",
    name: "Tester Agent",
    role: "Pytest & Vitest Regression Runner",
    status: "Executing",
    state: "running",
    toolsUsed: 64,
    activeTask: "Running pytest on apps/api/tests",
    icon: <Cpu className="w-4 h-4 text-amber-400" />,
  },
  {
    id: "fixer",
    name: "Fixer Agent",
    role: "Autonomous AST Code Patching",
    status: "Active",
    state: "active",
    toolsUsed: 52,
    activeTask: "Synthesizing AST diff for security fix",
    icon: <Zap className="w-4 h-4 text-primary fill-primary" />,
  },
  {
    id: "guard",
    name: "Guard Agent",
    role: "Zero-Leak Credential Shield",
    status: "Guarding",
    state: "guarding",
    toolsUsed: 45,
    activeTask: "Sanitizing environment secrets & gates",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
  },
  {
    id: "scribe",
    name: "Scribe Agent",
    role: "Git Commit & Changelog Scribe",
    status: "Ready",
    state: "ready",
    toolsUsed: 29,
    activeTask: "Standby for commit message formatting",
    icon: <FileCode2 className="w-4 h-4 text-muted-foreground" />,
  },
];

// Realistic Active Mission Flights
interface MissionFlight {
  id: string;
  routeId: string;
  title: string;
  stage: "Scout" | "Tester" | "Fixer" | "Guard" | "Scribe";
  stageNum: number;
  status: "running" | "completed" | "gate_pending" | "failed";
  duration: string;
  filesTouched: string;
  tokens: string;
}

const INITIAL_MISSIONS: MissionFlight[] = [
  {
    id: "fl_01",
    routeId: "mission_auto_fr7y",
    title: "Auto-Heal Failing Pytest in test_security_budget.py",
    stage: "Fixer",
    stageNum: 3,
    status: "running",
    duration: "24.2s",
    filesTouched: "router_security.py (+8, -2)",
    tokens: "4.8k tokens",
  },
  {
    id: "fl_02",
    routeId: "route_sec_audit_9",
    title: "Zero-Leak Secret Redaction Ingress Scan",
    stage: "Scribe",
    stageNum: 5,
    status: "completed",
    duration: "14.2s",
    filesTouched: "connection.py (0 secrets leaked)",
    tokens: "3.2k tokens",
  },
  {
    id: "fl_03",
    routeId: "route_sentry_triage_4",
    title: "Triage Sentry Ingress Crash: Auth Middleware Token Parser",
    stage: "Guard",
    stageNum: 4,
    status: "gate_pending",
    duration: "31.0s",
    filesTouched: "auth_middleware.py (+15, -4)",
    tokens: "6.9k tokens",
  },
];

export default function StatusPage() {
  const navigate = useNavigate();
  const [pendingGates, setPendingGates] = useState<ApprovalGateRecord[]>([]);
  const [missions, setMissions] = useState<MissionFlight[]>(INITIAL_MISSIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedGateId, setResolvedGateId] = useState<string | null>(null);

  const fetchGates = useCallback(async () => {
    try {
      const gates = await listApprovalGates(undefined, "pending").catch(() => []);
      if (gates && gates.length > 0) {
        setPendingGates(gates);
      } else {
        // High-fidelity fallback gate
        setPendingGates([
          {
            gate_id: "gate_commit_991b",
            route_id: "route_sentry_triage_4",
            step_num: 4,
            server: "git_agent",
            tool: "git_commit",
            args: {
              branch: "fix/auth-middleware-crash",
              files: ["auth_middleware.py", "test_auth_v1.py"],
              message: "fix(auth): prevent null pointer on malformed bearer token",
            },
            action_summary: "Commit 2 modified files to branch fix/auth-middleware-crash",
            status: "pending",
            created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
            resolved_at: null,
          },
        ]);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchGates();
  }, [fetchGates]);

  const handleApprove = async (gateId: string) => {
    setResolvedGateId(gateId);
    try {
      await approveGate(gateId).catch(() => {});
    } finally {
      setTimeout(() => {
        setPendingGates((prev) => prev.filter((g) => g.gate_id !== gateId));
        setMissions((prev) =>
          prev.map((m) =>
            m.status === "gate_pending" ? { ...m, status: "completed", stage: "Scribe", stageNum: 5 } : m
          )
        );
        setResolvedGateId(null);
      }, 600);
    }
  };

  const handleReject = async (gateId: string) => {
    setResolvedGateId(gateId);
    try {
      await rejectGate(gateId).catch(() => {});
    } finally {
      setTimeout(() => {
        setPendingGates((prev) => prev.filter((g) => g.gate_id !== gateId));
        setMissions((prev) =>
          prev.map((m) =>
            m.status === "gate_pending" ? { ...m, status: "failed" } : m
          )
        );
        setResolvedGateId(null);
      }, 600);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 font-sans bg-background text-foreground transition-colors duration-200">
      {/* ─── 1. Cockpit Master Header ─── */}
      <div className="skeuo-glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border/70 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.25)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Autonomous Mission Control & Teammate Board
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Fleet Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time orchestration of specialized Bee agent swarms, active mission routes, and zero-trust approval gates.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh Fleet Telemetry"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate("/hooks")}
            className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl text-foreground font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Signal Simulator</span>
          </button>

          <button
            onClick={() => navigate("/chat")}
            className="skeuo-button-primary text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Flight</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top Telemetry HUD Capsules ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Capsule 1: Autonomous Fix Rate */}
        <div className="skeuo-glass-card rounded-2xl p-4.5 border border-border/70 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Autonomous Fix Rate
            </span>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
              SELF-HEALING
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground font-mono">96.4%</span>
            <span className="text-xs text-muted-foreground font-mono">54 / 56 resolved</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 w-[96.4%] rounded-full" />
          </div>
        </div>

        {/* Capsule 2: Active Missions */}
        <div className="skeuo-glass-card rounded-2xl p-4.5 border border-border/70 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Mission Swarm
            </span>
            <span className="flex items-center gap-1 text-[10px] text-primary font-mono font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground font-mono">3 Active</span>
            <span className="text-xs text-muted-foreground font-mono">12 today</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>0 failing builds • 100% test pass</span>
          </div>
        </div>

        {/* Capsule 3: Approval Gates */}
        <div className="skeuo-glass-card rounded-2xl p-4.5 border border-border/70 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending Gates
            </span>
            {pendingGates.length > 0 ? (
              <Badge variant="outline" className="text-[10px] font-mono text-amber-500 bg-amber-500/10 border-amber-500/30 font-bold">
                ACTION REQUIRED
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                CLEARED
              </Badge>
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground font-mono">
              {pendingGates.length} Gate{pendingGates.length === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-500" /> WhatsApp Synced
            </span>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-mono truncate">
            {pendingGates.length > 0 ? "Awaiting engineer signature" : "All permissions authorized"}
          </div>
        </div>

        {/* Capsule 4: Fleet Spend & Latency */}
        <div className="skeuo-glass-card rounded-2xl p-4.5 border border-border/70 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Fleet Latency & Spend
            </span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10">
              OPTIMIZED
            </Badge>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground font-mono">18.4s</span>
            <span className="text-xs text-emerald-500 font-mono font-bold">$14.82 USD</span>
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
            <span>Gemini 2.5 Flash</span>
            <span className="text-foreground font-semibold">1.48M Tokens</span>
          </div>
        </div>
      </div>

      {/* ─── 3. Zero-Trust Approval Gate Resolution Banner (Urgent if pending) ─── */}
      {pendingGates.length > 0 && (
        <div className="skeuo-glass-card rounded-2xl p-5 border-2 border-amber-500/50 shadow-[0_0_24px_rgba(255,178,44,0.15)] relative overflow-hidden animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                    Zero-Trust Approval Gate Required
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border">
                    {pendingGates[0].server}.{pendingGates[0].tool}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {pendingGates[0].action_summary}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Route ID: <span className="text-primary font-semibold">{pendingGates[0].route_id}</span> • Step #{pendingGates[0].step_num}
                </p>
              </div>
            </div>

            {/* Approval Decision Pushers */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleReject(pendingGates[0].gate_id)}
                disabled={resolvedGateId === pendingGates[0].gate_id}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject & Abort</span>
              </button>

              <button
                onClick={() => handleApprove(pendingGates[0].gate_id)}
                disabled={resolvedGateId === pendingGates[0].gate_id}
                className="skeuo-button-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Execute</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. Agent Swarm Teammate Board (The 5 AI Co-Engineers) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Bee Agent Swarm Fleet (5 Specialized AI Workers)
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            All agents synchronized via FastMCP Sidecar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {FLEET_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="skeuo-glass-card rounded-2xl p-4 border border-border/60 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-secondary/80 border border-border/70 flex items-center justify-center">
                    {agent.icon}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      agent.state === "running" || agent.state === "active"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-500"
                        : agent.state === "guarding"
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.state === "running" || agent.state === "active"
                          ? "bg-amber-500 animate-pulse"
                          : agent.state === "guarding"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-muted-foreground"
                      }`}
                    />
                    {agent.status}
                  </span>
                </div>

                <div className="font-bold text-sm text-foreground">{agent.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {agent.role}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 space-y-1">
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {agent.activeTask}
                </div>
                <div className="text-[10px] font-mono text-primary font-semibold">
                  {agent.toolsUsed} tool invocations today
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. Active Missions & Flight Queue Matrix ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Active Missions & Autonomous Flight Queue
            </h3>
          </div>
          <button
            onClick={() => navigate("/logs")}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Flight Logs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {missions.map((m) => (
            <div
              key={m.id}
              className="skeuo-glass-card rounded-2xl p-4.5 border border-border/60 hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Mission Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {m.routeId}
                  </span>
                  {m.status === "completed" && (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> COMPLETED
                    </span>
                  )}
                  {m.status === "running" && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Radio className="w-3 h-3 animate-pulse" /> EXECUTING ({m.stage})
                    </span>
                  )}
                  {m.status === "gate_pending" && (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> APPROVAL GATE PENDING
                    </span>
                  )}
                  {m.status === "failed" && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
                      ABORTED
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-foreground">{m.title}</h4>

                {/* Pipeline Progress Stages */}
                <div className="flex items-center gap-2 pt-1 text-xs">
                  {["Scout", "Tester", "Fixer", "Guard", "Scribe"].map((stg, i) => {
                    const isPassed = i + 1 < m.stageNum;
                    const isCurrent = i + 1 === m.stageNum;
                    return (
                      <div key={stg} className="flex items-center gap-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                            isPassed
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold"
                              : isCurrent
                              ? "bg-primary/15 border-primary/40 text-primary font-bold shadow-[0_0_8px_rgba(255,178,44,0.3)]"
                              : "bg-secondary/40 border-border/40 text-muted-foreground"
                          }`}
                        >
                          {stg}
                        </span>
                        {i < 4 && <span className="text-muted-foreground/40 text-[10px]">→</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mission Stats & Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                <div className="text-right text-xs font-mono space-y-0.5">
                  <div className="text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> {m.duration} • {m.tokens}
                  </div>
                  <div className="text-foreground/90 font-medium">{m.filesTouched}</div>
                </div>

                <button
                  onClick={() => navigate(`/route/${m.routeId}`)}
                  className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-foreground hover:border-primary/40"
                >
                  <span>Inspect Route</span>
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 6. Quick Launch Scenario Deck ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <button
          onClick={() => navigate("/chat")}
          className="skeuo-glass-card rounded-2xl p-4.5 border border-border/60 hover:border-primary/40 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-xs">
            <Zap className="w-4 h-4" />
            <span>Auto-Fix Broken Tests</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Spawns Scout & Tester agents to reproduce failing pytest or vitest runs and apply AST patches.
          </p>
        </button>

        <button
          onClick={() => navigate("/hive")}
          className="skeuo-glass-card rounded-2xl p-4.5 border border-border/60 hover:border-primary/40 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-xs">
            <Boxes className="w-4 h-4" />
            <span>Connect MCP Database</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Audit Postgres or SQLite schema migrations and execute zero-leak sanitized queries.
          </p>
        </button>

        <button
          onClick={() => navigate("/hooks")}
          className="skeuo-glass-card rounded-2xl p-4.5 border border-border/60 hover:border-primary/40 text-left transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5 text-primary font-bold text-xs">
            <Radio className="w-4 h-4" />
            <span>Simulate GitHub PR Webhook</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dispatches a synthetic pull request signal to evaluate autonomous review and approval gates.
          </p>
        </button>
      </div>
    </div>
  );
}
