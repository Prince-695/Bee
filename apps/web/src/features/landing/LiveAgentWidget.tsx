import { useState, useEffect } from "react";
import { Sparkles, ChevronUp, X } from "lucide-react";
import { Link } from "react-router-dom";

export function LiveAgentWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { worker: "Scout", action: "Scanning repository AST for TokenExpired errors..." },
    { worker: "Architect", action: "Synthesizing 5-stage dependency DAG..." },
    { worker: "Fixer", action: "Healing refresh_token() in sandbox (attempt 1)..." },
    { worker: "Tester", action: "Running pytest suite (32/32 tests pass)..." },
    { worker: "Gatekeeper", action: "Awaiting WhatsApp human authorization..." },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep((s) => (s + 1) % steps.length);
    }, 3500);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="fixed bottom-6 right-6 z-40 select-none">
      {/* Expanded Widget Card */}
      {isOpen ? (
        <div className="w-80 sm:w-96 rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/40 p-5 shadow-2xl shadow-black/80 space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center text-black font-black">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Bee Co-Engineer</h4>
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active simulated step */}
          <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="text-amber-400 font-bold">Worker: {steps[activeStep].worker}</span>
              <span>Step {activeStep + 1} / 5</span>
            </div>
            <p className="text-xs text-zinc-200 leading-snug">{steps[activeStep].action}</p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to="/signup"
              className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold text-center transition-colors shadow-md shadow-amber-500/20"
            >
              Launch Flight
            </Link>
            <Link
              to="/docs"
              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold text-center border border-zinc-800"
            >
              Docs
            </Link>
          </div>
        </div>
      ) : (
        /* Floating Trigger Pill */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/90 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl shadow-amber-500/10 hover:border-amber-400 hover:scale-105 transition-all group cursor-pointer"
        >
          <div className="relative">
            <img src="/logo.png" alt="Bee" className="w-6 h-6 rounded-md object-contain" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950 animate-pulse" />
          </div>

          <div className="text-left">
            <div className="text-[11px] font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Bee Autonomous</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">LIVE</span>
            </div>
            <div className="text-[10px] text-zinc-400 max-w-[130px] truncate">
              {steps[activeStep].worker}: {steps[activeStep].action}
            </div>
          </div>

          <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
        </button>
      )}
    </div>
  );
}
