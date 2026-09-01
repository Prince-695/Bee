import { useState } from "react";
import { WebNavbar } from "@/layout/WebNavbar";
import { WebFooter } from "@/layout/WebFooter";
import { LiveAgentWidget } from "@/features/landing/LiveAgentWidget";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  const tiers = [
    {
      name: "Personal Developer",
      badge: "Local-First Free",
      price: "$0",
      period: "forever free",
      desc: "Zero-setup local development on desktop with local SQLite and direct terminal execution.",
      features: [
        "50 autonomous flights / month",
        "All 5 worker personas included",
        "Local SQLite database (bee.db)",
        "FastMCP Git & Sandbox tools",
        "Community Discord support",
      ],
      cta: "Download Desktop Free",
      href: "/signup",
      highlighted: false,
    },
    {
      name: "Pro Co-Engineer",
      badge: "Most Popular",
      price: isAnnual ? "$29" : "$39",
      period: "/ developer / month",
      desc: "For full-time software engineers and startup teams who need unlimited autonomous flights & memory.",
      features: [
        "Unlimited autonomous flights",
        "Neon Postgres & pgvector semantic memory",
        "WhatsApp & Slack 1-click approvals",
        "Zero-leak secret redaction filter",
        "Token spend analytics & budget caps",
        "Priority FastMCP execution queue",
      ],
      cta: "Start 14-Day Free Trial",
      href: "/signup",
      highlighted: true,
    },
    {
      name: "Enterprise Multi-Tenant",
      badge: "Custom SaaS",
      price: "Custom",
      period: "tailored billing",
      desc: "For scale-ups requiring private VPC deployments, SSO SAML, SOC2 compliance, and dedicated FastMCP runners.",
      features: [
        "Everything in Pro Tier",
        "Dedicated VPC / On-Premise sidecars",
        "SAML 2.0 & Okta SSO integration",
        "Role-Based Access Control (RBAC)",
        "99.9% Uptime SLA & 24/7 dedicated support",
      ],
      cta: "Talk to Founders",
      href: "/contact",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 selection:text-white font-sans">
      <WebNavbar />

      <main className="pt-28 pb-20">
        <div className="py-16 px-6 max-w-5xl mx-auto text-center space-y-4">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            Transparent Pricing
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Predictable Costs.
            <br />
            <span className="text-amber-400">Zero Autonomous Overages.</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that fits your engineering workflow. All plans include all 5 specialized AI workers.
          </p>

          <div className="pt-6 flex items-center justify-center gap-3">
            <span className={`text-xs font-semibold ${!isAnnual ? "text-white" : "text-zinc-500"}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-12 h-6 rounded-full bg-zinc-800 p-1 transition-colors relative cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded-full bg-amber-400 transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isAnnual ? "text-white" : "text-zinc-500"}`}>
              Annual <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Save 25%</span>
            </span>
          </div>
        </div>

        <section className="py-8 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-8 flex flex-col justify-between space-y-8 transition-all ${
                t.highlighted
                  ? "bg-zinc-900 border-2 border-amber-400 shadow-2xl shadow-amber-500/10 relative scale-102"
                  : "bg-zinc-950 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    {t.badge}
                  </span>
                  {t.highlighted && <Sparkles className="w-5 h-5 text-amber-400" />}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white">{t.name}</h3>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{t.desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">{t.price}</span>
                  <span className="text-xs text-zinc-400 font-medium">{t.period}</span>
                </div>

                <ul className="space-y-3 text-xs text-zinc-300 border-t border-zinc-800 pt-6">
                  {t.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                to={t.href}
                className={`w-full py-3.5 rounded-full text-xs font-bold text-center transition-all flex items-center justify-center gap-2 ${
                  t.highlighted
                    ? "bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-500/25"
                    : "bg-zinc-900 text-white hover:bg-zinc-800 border border-zinc-700"
                }`}
              >
                {t.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </section>
      </main>

      <LiveAgentWidget />
      <WebFooter />
    </div>
  );
}
