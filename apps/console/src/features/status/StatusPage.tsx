import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
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
  Cpu,
  Boxes,
} from "lucide-react";
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
    icon: <Cpu className="w-4 h-4 text-amber-500" />,
  },
  {
    id: "fixer",
    name: "Fixer Agent",
    role: "Autonomous AST Code Patching",
    status: "Active",
    state: "active",
    toolsUsed: 52,
    activeTask: "Synthesizing AST diff for security fix",
    icon: <Zap className="w-4 h-4 text-primary" />,
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
    id: "m-01",
    routeId: "route-084",
    title: "Sanitize XSS vectors & enforce timing-safe HMAC in auth middleware",
    stage: "Tester",
    stageNum: 2,
    status: "running",
    duration: "1m 12s",
    filesTouched: "apps/api/src/bee_api/middleware.py (+14, -6)",
    tokens: "48.2k tokens",
  },
  {
    id: "m-02",
    routeId: "route-083",
    title: "Zero-Trust Approval Gate: Authorize Stripe webhook secret rotation",
    stage: "Guard",
    stageNum: 4,
    status: "gate_pending",
    duration: "42s",
    filesTouched: "apps/api/src/bee_api/routers/v1/router_billing.py (+28, -2)",
    tokens: "31.5k tokens",
  },
  {
    id: "m-03",
    routeId: "route-082",
    title: "Self-healing test retry for PostgreSQL asyncpg connection teardown",
    stage: "Scribe",
    stageNum: 5,
    status: "completed",
    duration: "3m 45s",
    filesTouched: "packages/python/bee-core/src/bee_core/db/connection.py (+8, -1)",
    tokens: "84.1k tokens",
  },
];

export default function StatusPage() {
  const navigate = useNavigate();
  const [pendingGates, setPendingGates] = useState<ApprovalGateRecord[]>([]);
  const [missions] = useState<MissionFlight[]>(INITIAL_MISSIONS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedGateId, setResolvedGateId] = useState<string | null>(null);

  const fetchGates = useCallback(async () => {
    try {
      const gates = await listApprovalGates();
      setPendingGates(gates);
    } catch {
      // Mock fallback if API offline
      setPendingGates([
        {
          gate_id: "gate-sample-01",
          route_id: "route-083",
          step_num: 4,
          server: "git",
          tool: "git_commit_push",
          action_summary: "Commit and push security patches to feat/auth-hardening",
          args: { branch: "feat/auth-hardening", files: ["middleware.py"] },
          status: "pending",
          created_at: new Date().toISOString(),
          resolved_at: null,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchGates();
  }, [fetchGates]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleApprove = async (gateId: string) => {
    setResolvedGateId(gateId);
    try {
      await approveGate(gateId);
    } catch {
      // Local optimistic clearance
    }
    setTimeout(() => {
      setPendingGates((prev) => prev.filter((g) => g.gate_id !== gateId));
      setResolvedGateId(null);
    }, 400);
  };

  const handleReject = async (gateId: string) => {
    setResolvedGateId(gateId);
    try {
      await rejectGate(gateId);
    } catch {
      // Local optimistic clearance
    }
    setTimeout(() => {
      setPendingGates((prev) => prev.filter((g) => g.gate_id !== gateId));
      setResolvedGateId(null);
    }, 400);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ─── 1. Header & Quick Flight Launch ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Mission Control
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
              Fleet Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Orchestration of specialized agent swarms, flight routes, and zero-trust approval gates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Fleet Telemetry"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate("/hooks")}
            className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-secondary text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Signals</span>
          </button>

          <button
            onClick={() => navigate("/chat")}
            className="minimal-button-primary text-xs px-3.5 py-1.5 rounded-md font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Flight</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top Telemetry Metrics Strip ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Autonomous Fix Rate */}
        <div className="bg-card rounded-xl p-4 border border-border transition-colors hover:border-border/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Autonomous Fix Rate
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-semibold">
              96.4%
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">54 / 56</div>
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            Self-healed without human intervention
          </div>
        </div>

        {/* Metric 2: Active Swarm */}
        <div className="bg-card rounded-xl p-4 border border-border transition-colors hover:border-border/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Active Flights
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">3 Active</div>
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            12 flights completed today
          </div>
        </div>

        {/* Metric 3: Pending Approval Gates */}
        <div className="bg-card rounded-xl p-4 border border-border transition-colors hover:border-border/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Pending Gates
            </span>
            {pendingGates.length > 0 ? (
              <span className="text-[10px] font-mono text-amber-500 font-bold">REQUIRED</span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-500 font-semibold">CLEARED</span>
            )}
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {pendingGates.length} Gate{pendingGates.length === 1 ? "" : "s"}
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-mono truncate">
            {pendingGates.length > 0 ? "Awaiting engineer approval" : "All operations cleared"}
          </div>
        </div>

        {/* Metric 4: Fleet Latency & Spend */}
        <div className="bg-card rounded-xl p-4 border border-border transition-colors hover:border-border/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Avg Latency / Spend
            </span>
            <span className="text-[10px] font-mono text-primary font-semibold">$14.82 USD</span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">18.4s</div>
          <div className="mt-2 text-xs text-muted-foreground font-mono">
            1.48M tokens • Gemini 2.5 Flash
          </div>
        </div>
      </div>

      {/* ─── 3. Zero-Trust Approval Gate Resolution Banner (Urgent if pending) ─── */}
      {pendingGates.length > 0 && (
        <div className="bg-card rounded-xl p-4 border border-amber-500/40 relative overflow-hidden transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wide text-amber-500">
                    Approval Gate Required
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {pendingGates[0].server}.{pendingGates[0].tool}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {pendingGates[0].action_summary}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Route: <span className="text-primary font-medium">{pendingGates[0].route_id}</span> • Step #{pendingGates[0].step_num}
                </p>
              </div>
            </div>

            {/* Approval Decision Pushers */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleReject(pendingGates[0].gate_id)}
                disabled={resolvedGateId === pendingGates[0].gate_id}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>

              <button
                onClick={() => handleApprove(pendingGates[0].gate_id)}
                disabled={resolvedGateId === pendingGates[0].gate_id}
                className="minimal-button-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Run</span>
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
            <h2 className="text-sm font-bold text-foreground">
              AI Co-Engineer Fleet
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            5 workers connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FLEET_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="bg-card rounded-xl p-3.5 border border-border hover:border-primary/40 transition-colors flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-secondary/80 border border-border flex items-center justify-center">
                    {agent.icon}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        agent.state === "running" || agent.state === "active"
                          ? "bg-amber-500"
                          : agent.state === "guarding"
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/50"
                      }`}
                    />
                    {agent.status}
                  </span>
                </div>

                <div className="font-semibold text-xs text-foreground">{agent.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                  {agent.role}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground font-mono truncate">
                {agent.activeTask}
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
            <h2 className="text-sm font-bold text-foreground">
              Flight Queue
            </h2>
          </div>
          <button
            onClick={() => navigate("/logs")}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <span>View all logs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {missions.map((m) => (
            <div
              key={m.id}
              className="bg-card rounded-xl p-3.5 sm:p-4 border border-border hover:border-primary/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-3"
            >
              {/* Mission Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-primary">
                    {m.routeId}
                  </span>
                  {m.status === "completed" && (
                    <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      Completed
                    </span>
                  )}
                  {m.status === "running" && (
                    <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Executing ({m.stage})
                    </span>
                  )}
                  {m.status === "gate_pending" && (
                    <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      Approval Gate Pending
                    </span>
                  )}
                </div>

                <h3 className="text-xs sm:text-sm font-medium text-foreground">{m.title}</h3>

                {/* Pipeline Progress Stages */}
                <div className="flex items-center gap-1.5 pt-0.5 text-xs">
                  {["Scout", "Tester", "Fixer", "Guard", "Scribe"].map((stg, i) => {
                    const isPassed = i + 1 < m.stageNum;
                    const isCurrent = i + 1 === m.stageNum;
                    return (
                      <div key={stg} className="flex items-center gap-1">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isPassed
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                              : isCurrent
                              ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                              : "bg-secondary/30 border-transparent text-muted-foreground/60"
                          }`}
                        >
                          {stg}
                        </span>
                        {i < 4 && <span className="text-muted-foreground/30 text-[10px]">/</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mission Stats & Actions */}
              <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                <div className="text-right text-xs font-mono space-y-0.5">
                  <div className="text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" /> {m.duration}
                  </div>
                  <div className="text-muted-foreground text-[11px]">{m.filesTouched}</div>
                </div>

                <button
                  onClick={() => navigate(`/route/${m.routeId}`)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 6. Quick Launch Scenarios ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <button
          onClick={() => navigate("/chat")}
          className="bg-card rounded-xl p-3.5 border border-border hover:border-primary/40 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 text-primary font-semibold text-xs">
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Fix Broken Tests</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Spawns Scout & Tester to reproduce failing test suites and synthesize AST patches.
          </p>
        </button>

        <button
          onClick={() => navigate("/hive")}
          className="bg-card rounded-xl p-3.5 border border-border hover:border-primary/40 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 text-primary font-semibold text-xs">
            <Boxes className="w-3.5 h-3.5" />
            <span>Connect MCP Database</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Inspect schema migrations and run zero-leak sanitized database queries.
          </p>
        </button>

        <button
          onClick={() => navigate("/hooks")}
          className="bg-card rounded-xl p-3.5 border border-border hover:border-primary/40 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1 text-primary font-semibold text-xs">
            <Radio className="w-3.5 h-3.5" />
            <span>Simulate PR Webhook</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Dispatches synthetic pull request signals to test autonomous review and approval gates.
          </p>
        </button>
      </div>
    </div>
  );
}
