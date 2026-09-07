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
        <section className="py-16 px-6 max-w-4xl mx-auto relative z-10">
          <div className="bg-card p-8 sm:p-12 rounded-2xl border border-border text-center space-y-4">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
              Start Your First Autonomous Flight.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              50 free monthly flights, full 5-worker DAG pipeline, Zero-Leak credential protection, and local FastMCP sidecar execution.
            </p>
            <div className="pt-2">
              <Link
                to="/signup"
                className="minimal-button-primary inline-flex items-center gap-2 px-6 py-3 rounded-lg text-primary-foreground font-semibold text-sm transition-colors cursor-pointer"
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
