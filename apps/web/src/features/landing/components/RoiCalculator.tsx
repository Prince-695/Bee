import { useState } from "react";
import { Calculator, Clock, DollarSign, Sparkles, TrendingUp } from "lucide-react";

export function RoiCalculator() {
  const [engineers, setEngineers] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(75);

  const hoursSavedPerWeek = engineers * 8;
  const weeklyDollarsSaved = hoursSavedPerWeek * hourlyRate;
  const annualDollarsSaved = weeklyDollarsSaved * 52;
  const beeCostAnnual = engineers * 39 * 12;
  const netRoiPercentage = Math.round(((annualDollarsSaved - beeCostAnnual) / beeCostAnnual) * 100);

  return (
    <section className="py-20 px-6 relative z-10 bg-zinc-950/60 border-t border-zinc-800/80">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            <Calculator className="w-3.5 h-3.5" />
            Engineering Efficiency ROI Calculator
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            Calculate your team's weekly time & cost savings
          </h2>
          <p className="text-xs md:text-sm text-zinc-400">
            See how much engineering bandwidth Bee unlocks by automating flaky test fixes, PR reviews, and incident triage.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-zinc-800 bg-zinc-900/40 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Team Size (Engineers)</span>
                <span className="text-amber-400 font-mono text-sm">{engineers} developers</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={engineers}
                onChange={(e) => setEngineers(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">Average Hourly Rate ($USD)</span>
                <span className="text-amber-400 font-mono text-sm">${hourlyRate}/hr</span>
              </div>
              <input
                type="range"
                min="30"
                max="200"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5 text-xs text-zinc-400">
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Benchmark Methodology
              </div>
              <p className="leading-relaxed">
                Assumes an average of 8 hours saved per engineer weekly through self-healing test loops, automated PR reviews, and AST symbol analysis.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-zinc-900/60 to-zinc-950 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> Time Saved / Wk
                </div>
                <div className="text-2xl font-black text-white font-mono">{hoursSavedPerWeek} hrs</div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Weekly Value
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ${weeklyDollarsSaved.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Estimated Annual Net ROI</span>
                <span className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +{netRoiPercentage}%
                </span>
              </div>
              <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tight">
                ${annualDollarsSaved.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ year</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
