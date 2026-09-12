import { useState } from "react";
import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { LiveAgentWidget } from "@/features/landing/LiveAgentWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  Flame,
  Camera,
  Wallet,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const targetIconName = "Bee Logo";

  const puzzleIcons = [
    { name: "Camera", icon: <Camera className="w-5 h-5" /> },
    { name: "Flame", icon: <Flame className="w-5 h-5" /> },
    { name: "Bee Logo", icon: <img src="/logo.png" alt="Bee" className="w-5 h-5 object-contain" /> },
    { name: "Wallet", icon: <Wallet className="w-5 h-5" /> },
  ];

  const handleSelectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
    if (iconName === targetIconName) {
      setIsVerified(true);
    } else {
      setIsVerified(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-white font-sans">
      <WebNavbar />

      <main className="pt-28 pb-20">
        <div className="py-16 px-6 max-w-5xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Let's Talk Autonomous
            <br />
            <span className="text-amber-400">Engineering Infrastructure.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Book a 1-on-1 architecture walkthrough with the founders or request enterprise onboarding.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
          {/* Contact Details & Social Proof */}
          <div className="md:col-span-2 space-y-8 bg-zinc-900/40 p-8 rounded-3xl border border-zinc-800">
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Direct Founder Channel</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We respond within 2 hours to engineering leaders and development teams.
              </p>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-800 text-amber-400">
                  <Mail className="w-4 h-4" />
                </div>
                <span>founders@bee.dev</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-800 text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span>discord.gg/bee-ai</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <span className="text-[11px] font-mono text-zinc-500 uppercase font-bold">Enterprise Guarantee</span>
              <p className="text-xs text-zinc-400 leading-snug">
                Zero telemetry retention, VPC FastMCP runners, and SOC2-compliant Zero-Trust secret redactors.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3 bg-zinc-900/80 p-8 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">Message Sent Successfully!</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Thanks for reaching out. A founding engineer will follow up with your team shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Your Name</Label>
                    <Input
                      placeholder="Alice Lead"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-300">Work Email</Label>
                    <Input
                      type="email"
                      placeholder="alice@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Company & Repository Tech Stack</Label>
                  <Input
                    placeholder="Acme Corp (TypeScript, Python, React)"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Project Goal or Question</Label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your test suite, CI healing needs, or custom FastMCP tools..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                {/* Interactive Human Verification Puzzle (Nixtio Style) */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Human Verification: Click the <strong className="text-amber-400">Bee Logo</strong>
                    </span>
                    {isVerified && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {puzzleIcons.map((p) => {
                      const isSelected = selectedIcon === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectIcon(p.name)}
                          className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                            isSelected && p.name === targetIconName
                              ? "bg-amber-400/20 border-amber-400 text-amber-400"
                              : isSelected
                              ? "bg-red-500/20 border-red-500 text-red-400"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                          }`}
                        >
                          {p.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!isVerified}
                  className={`w-full py-3.5 rounded-full font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                    isVerified
                      ? "bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-500/25 cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      <LiveAgentWidget />
      <WebFooter />
    </div>
  );
}
