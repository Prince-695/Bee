import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { HeroSection } from "./components/HeroSection";
import { InteractiveFlightDemo } from "./components/InteractiveFlightDemo";
import { WorkerArchitecture } from "./components/WorkerArchitecture";
import { RoiCalculator } from "./components/RoiCalculator";
import { PricingSection } from "./components/PricingSection";
import { FaqSection } from "./components/FaqSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-purple-500/5 blur-[160px] rounded-full" />
        <div className="absolute top-[1400px] -right-40 w-[600px] h-[600px] bg-blue-500/5 blur-[160px] rounded-full" />
      </div>

      <WebNavbar />

      <main className="relative z-10">
        <HeroSection />

        <div className="max-w-4xl mx-auto px-6 pb-20">
          <InteractiveFlightDemo />
        </div>

        <WorkerArchitecture />
        <RoiCalculator />
        <PricingSection />
        <FaqSection />
      </main>

      <WebFooter />
    </div>
  );
}
