import { useState } from "react";
import {
  Search,
  Cpu,
  Wrench,
  CheckCircle2,
  ShieldAlert,
  ChevronDown,
  Terminal,
  Zap,
} from "lucide-react";

interface WorkerData {
  num: string;
  role: string;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
  tools: string[];
  deliverables: string[];
  sampleOutput: string;
}

export function WorkerAccordion() {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const workers: WorkerData[] = [
    {
      num: "001",
      role: "Scout & Inspector",
      title: "Repository AST & Context Ingestion",
      tagline: "Scans repository AST symbols, git commit history, and runtime stack traces before touching code.",
      icon: <Search className="w-5 h-5 text-amber-400" />,
      accent: "from-amber-500/20 to-amber-600/10",
      tools: ["code_ripgrep", "code_find_files", "git_log", "git_status"],
      deliverables: ["Dependency graph mapped", "Relevant symbol boundaries identified", "Error stack trace localized"],
      sampleOutput: `[SCOUT] Identified 3 call sites in auth/session.py affected by TokenExpired error. Mapping AST callers...`,
    },
    {
      num: "002",
      role: "Architect & Planner",
      title: "Directed Acyclic Graph (DAG) Synthesis",
      tagline: "Synthesizes multi-step dependency plans with explicit rollback checkpoints and verification targets.",
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      accent: "from-cyan-500/20 to-blue-600/10",
      tools: ["dag_planner", "contract_verifier", "schema_analyzer"],
      deliverables: ["Multi-worker DAG compiled", "Zero-breaking change validation", "Resource cost estimation"],
      sampleOutput: `[ARCHITECT] Generated 4-step execution DAG. Checkpoint 1: Sandbox isolation -> Checkpoint 2: Patch injection.`,
    },
    {
      num: "003",
      role: "Fixer & Code Engineer",
      title: "Compiler-Feedback Self-Healing",
      tagline: "Modifies code inside isolated execution sandboxes, executing compiler feedback loops to heal errors.",
      icon: <Wrench className="w-5 h-5 text-emerald-400" />,
      accent: "from-emerald-500/20 to-green-600/10",
      tools: ["sandbox_run_command", "code_replace", "secret_redactor"],
      deliverables: ["Unified git patch generated", "Compiles with 0 syntax errors", "Secrets automatically scrubbed"],
      sampleOutput: `[FIXER] Attempt 1 failed (pytest assertion). Analyzing stderr -> Applied fix to token_refresh() -> Tests pass!`,
    },
    {
      num: "004",
      role: "Tester & Verifier",
      title: "Edge-Case & Regression Synthesis",
      tagline: "Synthesizes edge-case unit tests to ensure the fix prevents future regressions and verifies idempotency.",
      icon: <CheckCircle2 className="w-5 h-5 text-purple-400" />,
      accent: "from-purple-500/20 to-violet-600/10",
      tools: ["pytest_runner", "fuzz_tester", "coverage_auditor"],
      deliverables: ["100% test pass verified", "No regression across existing suites", "New edge-case fixtures added"],
      sampleOutput: `[TESTER] Executed 32 test suites across sandbox. 32/32 tests passed (100%). Zero regressions detected.`,
    },
    {
      num: "005",
      role: "Gatekeeper & Mobile SecOps",
      title: "Zero-Trust Human Authorization",
      tagline: "Dispatches interactive 1-click [Authorize] / [Reject] cards to WhatsApp and Slack before production actions.",
      icon: <ShieldAlert className="w-5 h-5 text-amber-500" />,
      accent: "from-amber-600/20 to-red-600/10",
      tools: ["whatsapp_cloud_api", "slack_block_kit", "token_budget_meter"],
      deliverables: ["Audit log recorded in DB", "WhatsApp 1-click confirmation", "Branch push / PR created"],
      sampleOutput: `[GATEKEEPER] Pushed interactive approval card to WhatsApp (+1-555-0199). Operator approved -> PR created!`,
    },
  ];

  return (
    <section className="py-24 px-6 relative z-10 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Autonomous Pipeline
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4">
            Five Specialized AI Workers.
            <br />
            <span className="text-zinc-500 font-normal">One Unified Flight Mission.</span>
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
          Bee does not execute as a single confused LLM. It coordinates 5 dedicated worker personas across a formal Directed Acyclic Graph (DAG).
        </p>
      </div>

      <div className="space-y-4">
        {workers.map((w, idx) => {
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={w.num}
              onClick={() => setExpandedIndex(idx)}
              className={`rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer ${
                isExpanded
                  ? "bg-zinc-900/90 border-amber-500/50 shadow-2xl shadow-amber-500/10"
                  : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40"
              }`}
            >
              <div className="p-6 sm:p-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 sm:gap-8">
                  <span className="text-sm sm:text-base font-mono font-black text-amber-400/80 tracking-widest">
                    {w.num}
                  </span>

                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0">
                      {w.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">
                        {w.role}
                      </span>
                      <h3 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
                        {w.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full hidden sm:inline-block ${
                    isExpanded ? "bg-amber-400 text-black font-bold" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {isExpanded ? "Active Worker" : "View Stage"}
                  </span>
                  <div className={`p-2 rounded-full bg-zinc-800/60 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                    <ChevronDown className="w-4 h-4 text-zinc-300" />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-8 sm:px-8 sm:pb-8 pt-2 border-t border-zinc-800/60 space-y-6">
                  <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
                    {w.tagline}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold mb-2">
                          FastMCP Tools & Personas:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {w.tools.map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 font-mono text-xs flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3 text-amber-400" /> {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-mono uppercase text-zinc-400 font-bold mb-2">
                          Stage Deliverables:
                        </h4>
                        <ul className="space-y-1.5 text-xs text-zinc-300">
                          {w.deliverables.map((d, di) => (
                            <li key={di} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-black border border-zinc-800 p-4 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-800/80 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-amber-400" />
                          <span>Flight Execution Log</span>
                        </div>
                        <span className="text-[10px] text-emerald-400">STAGE READY</span>
                      </div>
                      <p className="text-zinc-300 leading-relaxed">{w.sampleOutput}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
