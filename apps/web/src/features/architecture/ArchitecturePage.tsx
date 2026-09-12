import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { LiveAgentWidget } from "@/features/landing/LiveAgentWidget";
import { Database, Zap } from "lucide-react";

export default function ArchitecturePage() {
  const layers = [
    {
      num: "01",
      name: "Presentation & Workspace",
      tech: "Vite 7, React 19, Base UI, Tailwind v4",
      desc: "High-performance client surfaces for Web Marketing and Electron Desktop native shells with responsive state synchronization.",
    },
    {
      num: "02",
      name: "Unified API & DAG Orchestrator",
      tech: "FastAPI, Pydantic v2, SSE-Starlette",
      desc: "Standardized /v1/* platform endpoints managing 5-worker DAG execution graphs, multi-tenant RBAC, and real-time event streaming.",
    },
    {
      num: "03",
      name: "Dual Database Engine & Memory",
      tech: "Neon PostgreSQL + pgvector & SQLite Fallback",
      desc: "768-dimensional AST embedding search for codebase semantics, alongside episodic flight memory recall for instant bug fixes.",
    },
    {
      num: "04",
      name: "FastMCP Tool Federation",
      tech: "Model Context Protocol (FastMCP)",
      desc: "Pluggable microservices for git automation, sandbox command execution, semantic search, and zero-leak secret scrubbing.",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-white font-sans">
      <WebNavbar />

      <main className="pt-28 pb-20">
        {/* Header */}
        <div className="py-16 px-6 max-w-5xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            System Architecture
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Monorepo Architecture.
            <br />
            <span className="text-amber-400">Deterministic AI Execution.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            A deep look into Bee's dual-mode execution engine, DAG state machines, and zero-leak security perimeter.
          </p>
        </div>

        {/* Architecture Stack Layers */}
        <section className="py-12 px-6 max-w-6xl mx-auto space-y-6">
          {layers.map((l) => (
            <div
              key={l.num}
              className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/90 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <span className="text-2xl font-mono font-black text-amber-400">{l.num}</span>
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-zinc-400 uppercase font-semibold">{l.tech}</span>
                  <h3 className="text-xl font-bold text-white">{l.name}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">{l.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Database Dual Topology Card */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/80 border border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Storage Layer</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Dual-Mode Database Architecture</h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Bee operates identically across offline solo desktop setups and enterprise cloud SaaS environments:
              </p>
              <ul className="space-y-2 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  <span><strong className="text-white">Cloud Multi-Tenant SaaS:</strong> Neon PostgreSQL with pgvector</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span><strong className="text-white">Personal Desktop App:</strong> Zero-config local SQLite (bee.db)</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-black border border-zinc-800 font-mono text-xs text-zinc-300 space-y-2">
              <div className="text-zinc-500 border-b border-zinc-800 pb-2 flex justify-between">
                <span>DATABASE_URL Connection Handler</span>
                <span className="text-emerald-400">AUTO-DETECT</span>
              </div>
              <p className="text-zinc-400">{"// If DATABASE_URL is present -> Neon Postgres"}</p>
              <p className="text-amber-400">async def get_db_engine():</p>
              <p className="text-zinc-300 pl-4">{"if os.getenv('DATABASE_URL'): return PostgresEngine()"}</p>
              <p className="text-zinc-300 pl-4">{"return SQLiteEngine('./bee.db')"}</p>
            </div>
          </div>
        </section>
      </main>

      <LiveAgentWidget />
      <WebFooter />
    </div>
  );
}
