import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Settings,
  CreditCard,
  Users,
  Key,
  Bell,
  Shield,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BillingTab } from "./BillingTab";
import { MembersTab } from "./MembersTab";
import { AiProvidersTab } from "./AiProvidersTab";
import { NotificationsTab } from "./NotificationsTab";
import { ProfileSecurityTab } from "./ProfileSecurityTab";

type SettingsTab = "billing" | "members" | "ai-providers" | "notifications" | "profile";

export default function SettingsPage() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const validTab = (t?: string): SettingsTab => {
    switch (t) {
      case "members":
      case "ai-providers":
      case "notifications":
      case "profile":
      case "billing":
        return t;
      default:
        return "billing";
    }
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(validTab(tab));

  useEffect(() => {
    if (tab) {
      setActiveTab(validTab(tab));
    }
  }, [tab]);

  const handleTabChange = (newTab: SettingsTab) => {
    setActiveTab(newTab);
    navigate(`/settings/${newTab}`, { replace: true });
  };

  const tabs = [
    { id: "billing", label: "Billing & Invoices", icon: <CreditCard className="w-4 h-4" /> },
    { id: "members", label: "Team & RBAC", icon: <Users className="w-4 h-4" /> },
    { id: "ai-providers", label: "AI Providers & BYOK", icon: <Key className="w-4 h-4" /> },
    { id: "notifications", label: "Notification Channels", icon: <Bell className="w-4 h-4" /> },
    { id: "profile", label: "Profile & Security", icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 font-sans bg-background text-foreground transition-colors duration-200">
      {/* ─── Cockpit Master Header ─── */}
      <div className="skeuo-glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-border/70 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,178,44,0.25)]">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Organization, Settings & Billing Suite
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-bold uppercase">
                Phase 8 Cockpit
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage multi-tenant workspaces, team RBAC roles, BYOK keys, and Stripe subscription billing.
            </p>
          </div>
        </div>

        {/* Tenant Switcher Pill */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/70 text-xs">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-foreground">Cyberdyne Systems</span>
            <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/10 border-primary/30">
              PRO
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs Bar ─── */}
      <div className="skeuo-glass-card rounded-2xl p-2 border border-border/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id as SettingsTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === t.id
                ? "skeuo-button-primary text-primary-foreground font-bold shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Active Tab Content Body ─── */}
      <div className="transition-all duration-200">
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "members" && <MembersTab />}
        {activeTab === "ai-providers" && <AiProvidersTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "profile" && <ProfileSecurityTab />}
      </div>
    </div>
  );
}
