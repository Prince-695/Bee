import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { HeroSection } from "./HeroSection";
import { MetricsTicker } from "./MetricsTicker";
import { WorkerAccordion } from "./WorkerAccordion";
import { CaseStudiesGrid } from "./CaseStudiesGrid";
import { LiveAgentWidget } from "./LiveAgentWidget";
import { RoiCalculator } from "./components/RoiCalculator";
import { FaqSection } from "./components/FaqSection";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  const testimonials = [
    {
      name: "Marcus Vance",
      role: "VP of Engineering at FinScale",
      quote: "Bee eliminated 90% of our PR test triage. The compiler self-healing feedback loop fixes flaky tests before developers even see them.",
      rating: 5,
    },
    {
      name: "Elena Rostova",
      role: "Staff DevOps Lead at CloudNova",
      quote: "The WhatsApp mobile approval gate is a game changer. I can authorize security patches and branch pushes from my phone in 2 seconds.",
      rating: 5,
    },
    {
      name: "Devon Chen",
      role: "Solo SaaS Founder",
      quote: "As a solo developer, having 5 specialized AI workers handling repository context, DAG planning, and testing feels like having an elite team.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-white font-sans relative overflow-x-hidden">
      {/* Viewport Ambient Glow Border */}
      <div className="fixed inset-0 pointer-events-none border border-amber-500/10 z-50 rounded-none sm:rounded-[32px] m-0 sm:m-2 shadow-[inset_0_0_80px_rgba(245,158,11,0.03)]" />

      <WebNavbar />

      <main className="space-y-6">
        <HeroSection />
        <MetricsTicker />
        <WorkerAccordion />
        <CaseStudiesGrid />
        <RoiCalculator />

        {/* ─── TESTIMONIALS & SOCIAL PROOF ─── */}
        <section className="py-24 px-6 max-w-7xl mx-auto space-y-12 relative z-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
              Social Proof
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Trusted by Elite Teams.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Verified 5.0 Clutch & GitHub developer community reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between space-y-6 shadow-xl hover:border-amber-500/40 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-1">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic">
                    "{t.quote}"
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <span className="text-xs text-zinc-500">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <FaqSection />

        {/* ─── BOTTOM CTA HERO ─── */}
        <section className="py-20 px-6 max-w-5xl mx-auto relative z-10">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border border-amber-500/40 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Start Your First Autonomous Flight.
            </h2>
            <p className="text-xs sm:text-base text-zinc-300 max-w-xl mx-auto">
              50 free monthly flights, full 5-worker DAG pipeline, and local SQLite or Neon Postgres connectivity.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-sm transition-all shadow-xl shadow-amber-500/25 hover:scale-105"
              >
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LiveAgentWidget />
      <WebFooter />
    </div>
  );
}
