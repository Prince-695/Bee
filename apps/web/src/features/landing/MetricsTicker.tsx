import { CheckCircle2, Zap, ShieldCheck, Clock } from "lucide-react";

export function MetricsTicker() {
  const stats = [
    { value: "10,480+", label: "Autonomous PRs Healed", icon: <CheckCircle2 className="w-4 h-4 text-amber-400" /> },
    { value: "99.4%", label: "Compiler Test Fix Rate", icon: <Zap className="w-4 h-4 text-amber-400" /> },
    { value: "< 42s", label: "Average Flight Latency", icon: <Clock className="w-4 h-4 text-amber-400" /> },
    { value: "0 Leaks", label: "Zero-Trust Secret Redaction", icon: <ShieldCheck className="w-4 h-4 text-amber-400" /> },
  ];

  return (
    <section className="border-y border-zinc-800/80 bg-zinc-950/60 py-10 px-6 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, idx) => (
          <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left space-y-1">
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-2xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {s.value}
              </span>
            </div>
            <span className="text-xs text-zinc-400 font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
