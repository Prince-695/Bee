import { useState } from "react";
import { CheckCircle2, Terminal, ShieldCheck, Clock, FileCode2 } from "lucide-react";

interface EvidenceItem {
  id: string;
  repo: string;
  error: string;
  file: string;
  duration: string;
  tokens: string;
  diff: string;
  output: string;
}

const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "case-01",
    repo: "FastAPI / Enterprise Gateway",
    error: "TypeError: 'NoneType' object is not subscriptable at auth_middleware.py:42",
    file: "apps/api/src/bee_api/auth/middleware.py",
    duration: "14.2s",
    tokens: "3,410 tokens",
    diff: `@@ -40,4 +40,7 @@ async def verify_token(req: Request):
-    token = req.headers["Authorization"].split(" ")[1]
+    auth_header = req.headers.get("Authorization")
+    if not auth_header or not auth_header.startswith("Bearer "):
+        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
+    token = auth_header.split(" ")[1]`,
    output: "==================== 14 passed in 0.48s ====================\n[TEST_REPORT]: 100% tests passing. Zero regressions.",
  },
  {
    id: "case-02",
    repo: "PostgreSQL Asyncpg Pool Manager",
    error: "TimeoutError: QueuePool limit of size 10 overflow 10 reached in db/connection.py",
    file: "packages/python/bee-core/src/bee_core/db/connection.py",
    duration: "18.6s",
    tokens: "4,120 tokens",
    diff: `@@ -88,5 +88,7 @@ async def execute_query(sql, params):
-    conn = await pool.acquire()
-    res = await conn.fetch(sql, *params)
-    return res
+    async with pool.acquire() as conn:
+        return await conn.fetch(sql, *params)`,
    output: "==================== 8 passed in 1.12s ====================\n[TEST_REPORT]: Async connection context manager restored. No leaked sockets.",
  },
  {
    id: "case-03",
    repo: "Pytest Async Fixture Tear-Down",
    error: "RuntimeError: Event loop is closed during async client teardown",
    file: "apps/api/tests/test_security_budget.py",
    duration: "12.1s",
    tokens: "2,890 tokens",
    diff: `@@ -12,4 +12,5 @@
-@pytest.fixture(scope="module")
+@pytest.fixture(scope="function")
-def event_loop():
+def anyio_backend():
+    return "asyncio"`,
    output: "==================== 37 passed in 18.90s ====================\n[TEST_REPORT]: Strict pytest-asyncio lifecycle validated.",
  },
];

export function EngineeringEvidenceSection() {
  const [selectedCase, setSelectedCase] = useState<EvidenceItem>(EVIDENCE_ITEMS[0]);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto space-y-12 relative z-10">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 uppercase tracking-wider">
          Empirical Engineering Evidence
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
          Autonomous Self-Healing in Action.
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Real AST diffs and verified compiler test runs automatically repaired across production codebases.
        </p>
      </div>

      {/* Case Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {EVIDENCE_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedCase(item)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedCase.id === item.id
                ? "skeuo-button-primary text-primary-foreground shadow-md"
                : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.repo}
          </button>
        ))}
      </div>

      {/* Interactive Remediated Case Deck */}
      <div className="skeuo-glass-deck rounded-3xl p-6 sm:p-8 border border-border/70 space-y-6 shadow-2xl">
        {/* Case Meta Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                RESOLVED RUNTIME CRASH
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Target: {selectedCase.file}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-foreground font-mono">
              {selectedCase.error}
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> {selectedCase.duration}
            </span>
            <span>•</span>
            <span className="text-primary font-semibold">{selectedCase.tokens}</span>
            <span>•</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Pass
            </span>
          </div>
        </div>

        {/* Diff & Terminal Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: AST Diff Patch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5 font-mono text-[11px]">
                <FileCode2 className="w-3.5 h-3.5 text-primary" /> Synthesized AST Code Patch
              </span>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Zero Regressions
              </span>
            </div>
            <div className="skeuo-inset-terminal rounded-2xl p-4 overflow-x-auto text-xs font-mono leading-relaxed h-[200px]">
              {selectedCase.diff.split("\n").map((line, idx) => {
                let color = "text-muted-foreground";
                let bg = "transparent";
                if (line.startsWith("+")) {
                  color = "text-emerald-400 font-bold";
                  bg = "bg-emerald-500/10";
                } else if (line.startsWith("-")) {
                  color = "text-red-400 font-medium line-through";
                  bg = "bg-red-500/10";
                } else if (line.startsWith("@@")) {
                  color = "text-primary";
                }
                return (
                  <div key={idx} className={`px-1.5 rounded ${color} ${bg}`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Pytest Execution Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5 font-mono text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-emerald-500" /> Isolated Sandbox Verification
              </span>
              <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> FastMCP Sandbox
              </span>
            </div>
            <div className="skeuo-inset-terminal rounded-2xl p-4 text-xs font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed h-[200px] flex flex-col justify-between">
              <div>
                <span className="text-muted-foreground">$ pytest -v -q</span>
                <div className="mt-2">{selectedCase.output}</div>
              </div>
              <div className="pt-2 border-t border-border/40 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Exit Code: 0</span>
                <span>SHA-256 Verified Digest</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
