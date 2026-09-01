import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { detectUserOS, triggerDirectDownload } from "@/lib/downloads";

export function HeroSection() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const detectedOS = detectUserOS();

  return (
    <section className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-amber-500/15 to-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="text-center space-y-6 max-w-4xl mx-auto relative z-10">
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-zinc-300 text-xs shadow-lg shadow-amber-500/5 hover:border-amber-400 transition-all cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-white">Bee v1.0 Production Architecture</span>
          <span className="text-zinc-500">|</span>
          <span className="text-amber-400 font-medium flex items-center gap-1">
            Explore 5 Workers <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        {/* Main Kinetic Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
          The Autonomous
          <br />
          <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            AI Co-Engineer
          </span>
          <br />
          for Production Codebases.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Coordinates 5 specialized AI workers across your repository, fixes broken tests in isolated sandboxes, and verifies zero-trust human approvals on WhatsApp.
        </p>

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            className="w-full sm:w-auto px-8 py-6 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:scale-104 transition-all cursor-pointer"
            onClick={() => navigate("/signup")}
          >
            Start Free Autonomous Flight <ArrowRight className="w-4 h-4" />
          </Button>

          <button
            onClick={() => triggerDirectDownload(detectedOS)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            Download Desktop for {detectedOS.osName}
          </button>
        </div>
      </div>

      {/* ─── INTERACTIVE FLIGHT CANVAS / VIDEO SIMULATOR ─── */}
      <div className="mt-16 relative max-w-5xl mx-auto rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black overflow-hidden group">
        <div className="bg-zinc-900/90 border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[11px] text-zinc-500">flight-mission://ci-heal-auth-fixture</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 5 WORKERS CONNECTED
            </span>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />}
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-black/90 font-mono text-xs text-zinc-300 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-500 border-b border-zinc-900 pb-3">
            <span>OBJECTIVE: Fix Pytest assertion failure in OAuth token rotation</span>
            <span className="text-emerald-400">STATUS: AUTONOMOUS FLIGHT ACTIVE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {[
              { role: "01 Scout", status: "Done (0.4s)", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
              { role: "02 Architect", status: "Done (0.8s)", color: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
              { role: "03 Fixer", status: "Active (2.1s)", color: "text-emerald-400 border-emerald-500/60 bg-emerald-500/20 animate-pulse" },
              { role: "04 Tester", status: "Queued", color: "text-zinc-500 border-zinc-800 bg-zinc-900/40" },
              { role: "05 Gatekeeper", status: "WhatsApp Ready", color: "text-zinc-500 border-zinc-800 bg-zinc-900/40" },
            ].map((st, i) => (
              <div key={i} className={`p-3 rounded-2xl border ${st.color} flex flex-col justify-between`}>
                <span className="font-bold text-[11px]">{st.role}</span>
                <span className="text-[10px] mt-2 font-semibold">{st.status}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 space-y-1.5 text-zinc-400 text-[11px] overflow-x-auto">
            <p className="text-zinc-500">[22:15:02] <span className="text-amber-400">Scout:</span> Identified root-cause in apps/api/src/auth/security.py:42.</p>
            <p className="text-zinc-500">[22:15:03] <span className="text-cyan-400">Architect:</span> Synthesized DAG: Checkpoint 1: Docker isolation -&gt; Checkpoint 2: Patch injection.</p>
            <p className="text-emerald-400">[22:15:04] Fixer: Applied unified diff. Running isolated pytest in sandbox...</p>
            <p className="text-emerald-300 font-bold">[22:15:06] Compiler Feedback: 32/32 Pytest suites passed (100%). Zero regressions.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
