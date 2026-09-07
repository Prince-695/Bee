import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { HeroSection } from "./HeroSection";
import { MetricsTicker } from "./MetricsTicker";
import { WorkerAccordion } from "./WorkerAccordion";
import { CaseStudiesGrid } from "./CaseStudiesGrid";
import { LiveAgentWidget } from "./LiveAgentWidget";
import { RoiCalculator } from "./components/RoiCalculator";
import { FaqSection } from "./components/FaqSection";
import { EngineeringEvidenceSection } from "./components/EngineeringEvidenceSection";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-foreground font-sans relative overflow-x-hidden">
      {/* Viewport Ambient Glow Border */}
      <div className="fixed inset-0 pointer-events-none border border-primary/10 z-50 rounded-none sm:rounded-[32px] m-0 sm:m-2 shadow-[inset_0_0_80px_rgba(255,178,44,0.03)]" />

      <WebNavbar />

      <main className="space-y-6">
        <HeroSection />
        <MetricsTicker />
        <WorkerAccordion />
        <CaseStudiesGrid />
        <RoiCalculator />

        {/* Empirical Engineering Evidence & AST Diffs */}
        <EngineeringEvidenceSection />

        <FaqSection />

        {/* Bottom Call to Action */}
        <section className="py-20 px-6 max-w-5xl mx-auto relative z-10">
          <div className="skeuo-glass-deck p-10 sm:p-16 rounded-3xl border border-primary/40 text-center space-y-6 shadow-2xl">
            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Start Your First Autonomous Flight.
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              50 free monthly flights, full 5-worker DAG pipeline, Zero-Leak credential protection, and local FastMCP sidecar execution.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="skeuo-button-primary inline-flex items-center gap-2 px-8 py-4 rounded-xl text-primary-foreground font-black text-sm shadow-xl hover:scale-105 transition-all cursor-pointer"
              >
                <span>Launch Autonomous Flight Free</span>
                <ArrowRight className="w-4 h-4" />
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
