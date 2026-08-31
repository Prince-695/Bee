import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, Building2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PricingSection() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free / Community",
      tagline: "For solo developers, students, and open-source contributors.",
      priceMonthly: 0,
      priceYearly: 0,
      icon: <User className="w-5 h-5 text-zinc-400" />,
      badge: "Forever Free",
      highlight: false,
      cta: "Get Started Free",
      features: [
        "Unlimited BYOK (Bring Your Own Key)",
        "50 Free Managed Flights / mo (Gemini Flash)",
        "Desktop App for Windows, macOS & Linux",
        "Local Git, Sandbox & AST Search Tools",
        "Community Support & Discord",
      ],
    },
    {
      name: "Starter (Indie Dev)",
      tagline: "For freelancers and indie hackers automating full repos.",
      priceMonthly: 19,
      priceYearly: 15,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      badge: "Most Popular",
      highlight: true,
      cta: "Start 14-Day Free Trial",
      features: [
        "500 Zero-Config Managed Flights / mo",
        "GitHub PR Auto-Inspection & Review",
        "Self-Healing Test Loops (Pytest & Vitest)",
        "Mobile 1-Click WhatsApp Approvals",
        "Zero-Leak Secret Redaction & PII Shield",
        "Standard Email Support",
      ],
    },
    {
      name: "Pro (Agile Team)",
      tagline: "For high-velocity engineering teams shipping daily.",
      priceMonthly: 49,
      priceYearly: 39,
      icon: <Users className="w-5 h-5 text-emerald-400" />,
      badge: "Team Scale",
      highlight: false,
      cta: "Upgrade to Pro",
      features: [
        "2,500 Managed Flights / mo per seat",
        "5-Worker Mission DAG (Scout, Tester, Fixer, Guard, Scribe)",
        "CI/CD Webhook Auto-Heal (GitHub Actions & GitLab)",
        "Interactive Slack & Discord Integrations",
        "Shared Team Teammate Board & Analytics",
        "Priority 24/7 SLAs & Support",
      ],
    },
    {
      name: "Enterprise",
      tagline: "For security-conscious organizations requiring full isolation.",
      priceMonthly: "Custom",
      priceYearly: "Custom",
      icon: <Building2 className="w-5 h-5 text-blue-400" />,
      badge: "Self-Hosted & VPC",
      highlight: false,
      cta: "Contact Enterprise Sales",
      features: [
        "Unlimited Self-Hosted Flights (Docker & Kubernetes)",
        "Private VPC & Air-Gapped Deployment",
        "Custom LLM Gateways (Azure OpenAI, AWS Bedrock, Ollama)",
        "Enforced Zero-Trust Security Policies & Audit Logs",
        "Dedicated Solutions Architect & Custom MCPs",
        "Custom BAA & SOC2 Compliance Docs",
      ],
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 relative z-10 border-t border-zinc-800/80 bg-zinc-950">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent & Predictable Pricing
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Built for solo hackers. Scaled for enterprise teams.
          </h2>
          <p className="text-sm md:text-base text-zinc-400">
            Start completely free with zero configuration or connect your own API keys. Upgrade as your team scales.
          </p>

          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="p-1 rounded-xl bg-zinc-900 border border-zinc-800 inline-flex items-center gap-1 text-xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all ${
                  billingCycle === "monthly"
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === "yearly"
                    ? "bg-amber-500 text-black shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Yearly Billing
                <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-bold text-black uppercase">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative ${
                plan.highlight
                  ? "bg-gradient-to-b from-amber-500/10 via-zinc-900/60 to-zinc-950 border-amber-500/50 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/30"
                  : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black font-bold text-[10.5px] uppercase tracking-wider shadow-md">
                  {plan.badge}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/50">{plan.icon}</div>
                  <span className="text-[11px] font-mono text-zinc-400">{plan.badge}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{plan.tagline}</p>
                </div>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black tracking-tight text-white">
                      {typeof plan.priceMonthly === "number"
                        ? `$${billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}`
                        : plan.priceMonthly}
                    </span>
                    {typeof plan.priceMonthly === "number" && (
                      <span className="text-xs text-zinc-400 font-medium">/ month</span>
                    )}
                  </div>
                  {billingCycle === "yearly" && typeof plan.priceYearly === "number" && plan.priceYearly > 0 && (
                    <span className="text-[11px] text-emerald-400 font-mono">Billed annually (${plan.priceYearly * 12}/yr)</span>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Includes:</span>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-zinc-800/60">
                <Button
                  onClick={() => navigate("/login")}
                  className={`w-full rounded-xl text-xs font-bold h-10 ${
                    plan.highlight
                      ? "bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-500/20"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
