import React, { useState } from "react";
import {
  Check,
  CreditCard,
  Download,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending";
  pdfName: string;
}

const INVOICES: Invoice[] = [
  {
    id: "INV-2026-003",
    date: "Mar 01, 2026",
    amount: "$49.00",
    status: "paid",
    pdfName: "bee-invoice-mar-2026.pdf",
  },
  {
    id: "INV-2026-002",
    date: "Feb 01, 2026",
    amount: "$49.00",
    status: "paid",
    pdfName: "bee-invoice-feb-2026.pdf",
  },
  {
    id: "INV-2026-001",
    date: "Jan 01, 2026",
    amount: "$49.00",
    status: "paid",
    pdfName: "bee-invoice-jan-2026.pdf",
  },
];

export const BillingTab: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [isStripeLoading, setIsStripeLoading] = useState<boolean>(false);
  const [isUpdatingCard, setIsUpdatingCard] = useState<boolean>(false);

  const handleDownloadInvoice = (invoice: Invoice) => {
    // Generate simulated downloadable PDF receipt
    const content = `%PDF-1.4
% Bee Autonomous Platform Invoice
% Invoice ID: ${invoice.id}
% Date: ${invoice.date}
% Amount: ${invoice.amount} USD
% Status: PAID
% Customer: Cyberdyne Systems Org (Prince Rathod)
% SOC2 Tax Invoice Verified.
`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = invoice.pdfName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStripePortal = () => {
    setIsStripeLoading(true);
    setTimeout(() => {
      setIsStripeLoading(false);
      alert("Redirecting to secure Stripe Customer Portal...");
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Hero Banner */}
      <div className="skeuo-glass-card rounded-2xl p-5 border border-primary/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.25)]">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Pro Co-Engineer Subscription
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-bold">
                  ACTIVE
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Next billing cycle on <span className="text-foreground font-semibold">April 1, 2026</span> for $49.00 USD.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleStripePortal}
              disabled={isStripeLoading}
              className="skeuo-button-secondary text-xs px-3.5 py-2 rounded-xl text-foreground font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{isStripeLoading ? "Opening Stripe..." : "Stripe Customer Portal"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
        </div>
      </div>

      {/* Tier Comparison Grid */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-bold text-foreground">Available Subscription Plans</h4>
          <p className="text-xs text-muted-foreground">
            Scale autonomous agent capacity, MCP connectors, and zero-leak security guardrails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan 1: Starter */}
          <div
            className={`skeuo-glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              selectedPlan === "starter"
                ? "border-primary/50 shadow-lg"
                : "border-border/60 hover:border-border"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-foreground">Starter</h5>
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  INDIVIDUAL
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground font-mono">$0</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ideal for solo developers exploring autonomous test fixing and local MCP scripts.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>1 Seat included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>50 Flights / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Standard model rate limits</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Community Discord support</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40">
              <button
                onClick={() => setSelectedPlan("starter")}
                className="w-full py-2 rounded-xl text-xs font-semibold border border-border/70 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Downgrade to Starter
              </button>
            </div>
          </div>

          {/* Plan 2: Pro Co-Engineer (FEATURED) */}
          <div className="skeuo-glass-card rounded-2xl p-5 border-2 border-primary shadow-[0_0_24px_rgba(255,178,44,0.18)] relative flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  Pro Co-Engineer <Sparkles className="w-3.5 h-3.5 text-primary" />
                </h5>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10">
                  GROWTH
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground font-mono">$49</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Production-grade autonomous engineering with fast models, multi-channel approvals, and full MCP access.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium">5 Team Seats included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium">1,000 Autonomous Flights / mo</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium">Priority Gemini 2.5 & GPT-4o</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium">Zero-Leak Credential Shield</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium">WhatsApp & Slack Approvals</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40">
              <button
                disabled
                className="w-full skeuo-button-primary py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-default"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Current Active Plan</span>
              </button>
            </div>
          </div>

          {/* Plan 3: Enterprise Team */}
          <div
            className={`skeuo-glass-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              selectedPlan === "enterprise"
                ? "border-primary/50 shadow-lg"
                : "border-border/60 hover:border-border"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-foreground">Enterprise Team</h5>
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  SCALE
                </Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-foreground font-mono">$249</span>
                <span className="text-xs text-muted-foreground">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Dedicated cloud clusters, custom BYOK models, custom sandboxes, and enterprise SOC2 compliance.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Unlimited Seats</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Unlimited Autonomous Flights</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Dedicated Isolated Sandboxes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>SOC2 Immutable Audit Exports</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Dedicated 99.9% SLA & Slack Support</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40">
              <button
                onClick={() => setSelectedPlan("enterprise")}
                className="w-full py-2 rounded-xl text-xs font-bold border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
              >
                Upgrade to Enterprise
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method & Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
        {/* Skeuomorphic Credit Card Display */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Payment Method</h4>
          <div className="relative rounded-2xl p-6 bg-gradient-to-tr from-[#1E2026] via-[#2A2C34] to-[#17181D] border border-border/80 shadow-2xl text-foreground space-y-5 overflow-hidden group">
            {/* Metallic Gold Contactless Chip */}
            <div className="flex items-center justify-between">
              <div className="w-11 h-8 rounded-lg bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#AA771C] border border-[#FFD700]/60 shadow-inner flex items-center justify-center relative overflow-hidden">
                <div className="w-full h-px bg-black/30" />
                <div className="absolute w-px h-full bg-black/30" />
              </div>
              <CreditCard className="w-6 h-6 text-muted-foreground/60" />
            </div>

            {/* Embossed Card Number */}
            <div className="font-mono text-base tracking-[0.22em] text-foreground font-bold drop-shadow-md">
              •••• •••• •••• 4242
            </div>

            {/* Cardholder & Expiry */}
            <div className="flex items-end justify-between font-mono text-xs text-muted-foreground pt-1">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  Cardholder
                </div>
                <div className="font-bold text-foreground tracking-wider uppercase">
                  PRINCE RATHOD
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
                  Expires
                </div>
                <div className="font-bold text-foreground tracking-wider">
                  08/29
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Stripe 256-bit SSL
            </span>
            <button
              onClick={() => {
                setIsUpdatingCard(true);
                setTimeout(() => {
                  setIsUpdatingCard(false);
                  alert("Stripe card update modal dispatched.");
                }, 600);
              }}
              className="text-primary hover:underline font-bold"
            >
              {isUpdatingCard ? "Updating..." : "Update Card"}
            </button>
          </div>
        </div>

        {/* Downloadable PDF Invoices Table */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Billing History & Receipts</h4>
          <div className="skeuo-glass-card rounded-2xl overflow-hidden border border-border/60">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-secondary/60 border-b border-border/60 text-muted-foreground text-[10px] uppercase">
                  <th className="p-3">Invoice</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {INVOICES.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 text-foreground font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      {inv.id}
                    </td>
                    <td className="p-3 text-muted-foreground">{inv.date}</td>
                    <td className="p-3 text-foreground font-bold">{inv.amount}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold text-[10px] uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                        title="Download PDF Invoice"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[11px] font-sans font-medium">PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
