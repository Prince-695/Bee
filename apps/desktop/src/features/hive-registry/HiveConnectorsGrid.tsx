import { useState, useMemo } from "react";
import {
  GitPullRequest,
  GitBranch,
  FolderGit2,
  MessageSquare,
  Smartphone,
  Hash,
  CheckCircle2,
  ListTodo,
  FileText,
  Database,
  Layers,
  Server,
  Cloud,
  Globe,
  AlertTriangle,
  Activity,
  BellRing,
  ShieldCheck,
  Search,
  Check,
  RefreshCw,
  Unplug,
} from "lucide-react";

export interface PlatformConnector {
  id: string;
  name: string;
  category: "vcs" | "chat" | "pm" | "database" | "cloud" | "monitoring";
  categoryLabel: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  description: string;
  scopes: string[];
  connected: boolean;
  connectedAccount?: string;
  mobileApproval?: boolean;
  mcpServerId?: string;
}

const ALL_PLATFORMS: PlatformConnector[] = [
  // 1. Code & Version Control
  {
    id: "github",
    name: "GitHub",
    category: "vcs",
    categoryLabel: "Code & VCS",
    icon: <GitPullRequest className="size-5" />,
    iconBg: "bg-[#24292e]/80 border-white/20",
    iconColor: "text-white",
    description: "Repos, Pull Requests, AST branch inspection, and auto-commit PR workflows.",
    scopes: ["repo", "read:user", "workflow"],
    connected: true,
    connectedAccount: "princerathod695",
    mcpServerId: "git_agent",
  },
  {
    id: "gitlab",
    name: "GitLab",
    category: "vcs",
    categoryLabel: "Code & VCS",
    icon: <GitBranch className="size-5" />,
    iconBg: "bg-[#FC6D26]/20 border-[#FC6D26]/40",
    iconColor: "text-[#FC6D26]",
    description: "GitLab Self-Hosted & SaaS merge requests, CI pipeline triggers, and issues.",
    scopes: ["api", "read_repository"],
    connected: false,
  },
  {
    id: "bitbucket",
    name: "Bitbucket",
    category: "vcs",
    categoryLabel: "Code & VCS",
    icon: <FolderGit2 className="size-5" />,
    iconBg: "bg-[#0052CC]/20 border-[#0052CC]/40",
    iconColor: "text-[#2684FF]",
    description: "Atlassian Bitbucket repositories, branch restrictions, and pipelines.",
    scopes: ["repository:write", "pullrequest"],
    connected: false,
  },

  // 2. Team Chat & Mobile Approvals
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "chat",
    categoryLabel: "Chat & Mobile",
    icon: <Smartphone className="size-5" />,
    iconBg: "bg-[#25D366]/20 border-[#25D366]/40",
    iconColor: "text-[#25D366]",
    description: "Direct mobile WhatsApp push notifications with 1-Tap Zero-Trust Approval Gates.",
    scopes: ["messages:write", "interactive_gates"],
    connected: true,
    connectedAccount: "+1 (555) 019-2831",
    mobileApproval: true,
  },
  {
    id: "slack",
    name: "Slack",
    category: "chat",
    categoryLabel: "Chat & Mobile",
    icon: <Hash className="size-5" />,
    iconBg: "bg-[#4A154B]/30 border-[#E01E5A]/30",
    iconColor: "text-[#ECB22E]",
    description: "Team channel alerts, interactive modal approval gates, and bot triage bots.",
    scopes: ["chat:write", "channels:read", "interactive"],
    connected: false,
    mobileApproval: true,
  },
  {
    id: "discord",
    name: "Discord",
    category: "chat",
    categoryLabel: "Chat & Mobile",
    icon: <MessageSquare className="size-5" />,
    iconBg: "bg-[#5865F2]/20 border-[#5865F2]/40",
    iconColor: "text-[#5865F2]",
    description: "Developer guild webhooks, community bug incident streams, and commands.",
    scopes: ["bot", "messages.read", "webhooks"],
    connected: false,
  },

  // 3. Project Tracking & Specs
  {
    id: "linear",
    name: "Linear",
    category: "pm",
    categoryLabel: "Tracking & Specs",
    icon: <ListTodo className="size-5" />,
    iconBg: "bg-[#5E6AD2]/20 border-[#5E6AD2]/40",
    iconColor: "text-[#5E6AD2]",
    description: "Sync engineering cycles, auto-close resolved issue tickets on merged PRs.",
    scopes: ["read", "write", "issues:create"],
    connected: false,
  },
  {
    id: "jira",
    name: "Jira Software",
    category: "pm",
    categoryLabel: "Tracking & Specs",
    icon: <CheckCircle2 className="size-5" />,
    iconBg: "bg-[#0052CC]/20 border-[#0052CC]/40",
    iconColor: "text-[#0052CC]",
    description: "Sprint backlog tracking, epic link verification, and enterprise ticket triage.",
    scopes: ["read:jira-work", "write:jira-work"],
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    category: "pm",
    categoryLabel: "Tracking & Specs",
    icon: <FileText className="size-5" />,
    iconBg: "bg-white/10 border-white/20",
    iconColor: "text-foreground",
    description: "Product PRDs, engineering runbooks, architecture ADRs, and team wikis.",
    scopes: ["pages:read", "blocks:write"],
    connected: false,
  },

  // 4. Databases & Vector Stores
  {
    id: "postgres",
    name: "PostgreSQL",
    category: "database",
    categoryLabel: "Databases & Storage",
    icon: <Database className="size-5" />,
    iconBg: "bg-[#336791]/20 border-[#336791]/40",
    iconColor: "text-[#336791]",
    description: "Neon Serverless & local PostgreSQL schema inspection, SQL queries, and pgvector.",
    scopes: ["schema:inspect", "sql:read_write", "pgvector"],
    connected: true,
    connectedAccount: "neon://ep-bee-prod",
    mcpServerId: "postgres",
  },
  {
    id: "mysql",
    name: "MySQL",
    category: "database",
    categoryLabel: "Databases & Storage",
    icon: <Layers className="size-5" />,
    iconBg: "bg-[#00758F]/20 border-[#00758F]/40",
    iconColor: "text-[#F29111]",
    description: "Relational table inspection, query execution plans, and migration audits.",
    scopes: ["schema:inspect", "sql:read"],
    connected: false,
  },
  {
    id: "mongodb",
    name: "MongoDB",
    category: "database",
    categoryLabel: "Databases & Storage",
    icon: <Server className="size-5" />,
    iconBg: "bg-[#47A248]/20 border-[#47A248]/40",
    iconColor: "text-[#47A248]",
    description: "NoSQL document collections, aggregation pipelines, and index optimization.",
    scopes: ["collections:read", "documents:write"],
    connected: false,
  },

  // 5. Cloud, Hosting & Infra
  {
    id: "docker",
    name: "Docker Engine",
    category: "cloud",
    categoryLabel: "Cloud & Infra",
    icon: <Server className="size-5" />,
    iconBg: "bg-[#2496ED]/20 border-[#2496ED]/40",
    iconColor: "text-[#2496ED]",
    description: "Local containerized sandbox runner for pytest, cargo, and npm build isolation.",
    scopes: ["containers:run", "images:build"],
    connected: true,
    connectedAccount: "unix:///var/run/docker.sock",
    mcpServerId: "sandbox",
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "cloud",
    categoryLabel: "Cloud & Infra",
    icon: <Globe className="size-5" />,
    iconBg: "bg-[#F38020]/20 border-[#F38020]/40",
    iconColor: "text-[#F38020]",
    description: "Edge workers deployment, DNS records, and serverless KV namespace management.",
    scopes: ["workers:deploy", "dns:read"],
    connected: false,
  },
  {
    id: "vercel",
    name: "Vercel",
    category: "cloud",
    categoryLabel: "Cloud & Infra",
    icon: <Cloud className="size-5" />,
    iconBg: "bg-white/10 border-white/20",
    iconColor: "text-foreground",
    description: "Preview branch deployments, environment variables sync, and edge logs.",
    scopes: ["deployments:create", "domains:read"],
    connected: false,
  },

  // 6. Incidents & Monitoring
  {
    id: "sentry",
    name: "Sentry",
    category: "monitoring",
    categoryLabel: "Monitoring & Signals",
    icon: <AlertTriangle className="size-5" />,
    iconBg: "bg-[#362D59]/30 border-[#E1567C]/40",
    iconColor: "text-[#E1567C]",
    description: "Real-time crash stack traces with autonomous Fixer agent auto-patching.",
    scopes: ["alerts:read", "issues:resolve"],
    connected: false,
  },
  {
    id: "datadog",
    name: "Datadog",
    category: "monitoring",
    categoryLabel: "Monitoring & Signals",
    icon: <Activity className="size-5" />,
    iconBg: "bg-[#632CA6]/20 border-[#632CA6]/40",
    iconColor: "text-[#7B3FE4]",
    description: "APM latency traces, service health synthetic checks, and log metrics.",
    scopes: ["metrics:query", "traces:read"],
    connected: false,
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    category: "monitoring",
    categoryLabel: "Monitoring & Signals",
    icon: <BellRing className="size-5" />,
    iconBg: "bg-[#008000]/20 border-[#008000]/40",
    iconColor: "text-[#008000]",
    description: "On-call incident escalation, page suppression, and post-mortem creation.",
    scopes: ["incidents:manage", "oncall:read"],
    connected: false,
  },
];

const CATEGORIES = [
  { id: "all", label: "All Platforms" },
  { id: "vcs", label: "Code & VCS" },
  { id: "chat", label: "Chat & Mobile" },
  { id: "pm", label: "Tracking & Specs" },
  { id: "database", label: "Databases" },
  { id: "cloud", label: "Cloud & Infra" },
  { id: "monitoring", label: "Monitoring" },
];

export function HiveConnectorsGrid() {
  const [platforms, setPlatforms] = useState<PlatformConnector[]>(ALL_PLATFORMS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return platforms.filter((p) => {
      const matchCat = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [platforms, selectedCategory, searchQuery]);

  const connectedCount = useMemo(() => platforms.filter((p) => p.connected).length, [platforms]);

  const handleConnect = (id: string) => {
    setConnectingId(id);
    setTimeout(() => {
      setPlatforms((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                connected: true,
                connectedAccount: `${p.id}_user_auto`,
              }
            : p
        )
      );
      setConnectingId(null);
    }, 900);
  };

  const handleDisconnect = (id: string) => {
    setPlatforms((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              connected: false,
              connectedAccount: undefined,
            }
          : p
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Filter Bar & Metrics ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#FFB22C] text-[#121316] shadow-sm shadow-[#FFB22C]/30 font-bold"
                    : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search & Active Count */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search platforms, tools, scopes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-card/60 border border-border/80 focus:border-[#FFB22C] focus:outline-none w-56 text-foreground placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card/40 border border-border/70 text-xs font-mono text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            <span className="font-bold text-foreground">{connectedCount}</span> / {platforms.length} Active
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const isConnecting = connectingId === p.id;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between gap-4 border relative group overflow-hidden ${
                p.connected
                  ? "skeuo-glass-card border-emerald-500/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/50"
                  : "skeuo-glass-card border-border/70 hover:border-border hover:shadow-md"
              }`}
            >
              {/* Highlight Refraction */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="space-y-3.5">
                {/* Top Row: Icon + Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-11 rounded-xl border flex items-center justify-center shadow-inner ${p.iconBg} ${p.iconColor}`}
                    >
                      {p.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-foreground tracking-tight">{p.name}</h3>
                        {p.mobileApproval && (
                          <span
                            title="Supports 1-Tap Mobile Zero-Trust Approvals"
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-[#FFB22C] border border-amber-500/30 flex items-center gap-1"
                          >
                            <Smartphone className="size-2.5" /> Mobile Gate
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] font-mono text-muted-foreground uppercase tracking-wider">
                        {p.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  {p.connected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      CONNECTED
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/50">
                      READY
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {p.description}
                </p>

                {/* Granted / Target Scopes */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider">
                    Permissions & Scopes:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {p.scopes.map((s) => (
                      <span
                        key={s}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                          p.connected
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted/40 border-border/60 text-muted-foreground"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connected Account Meta */}
                {p.connected && p.connectedAccount && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-card/60 border border-border/60 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                    <span className="truncate">Identity: {p.connectedAccount}</span>
                    <ShieldCheck className="size-3.5 text-emerald-500 shrink-0 ml-2" />
                  </div>
                )}
              </div>

                {/* Action Buttons */}
              <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                {p.connected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDisconnect(p.id)}
                      className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border hover:border-destructive/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Unplug className="size-3" />
                      Disconnect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConnect(p.id)}
                      className="skeuo-button-secondary py-1.5 px-3 rounded-xl text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Refresh OAuth Token"
                    >
                      <RefreshCw className="size-3 text-muted-foreground" />
                      Sync
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnect(p.id)}
                    disabled={isConnecting}
                    className="w-full skeuo-button-primary py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Authorizing 1-Click OAuth...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5 stroke-[2.5]" />
                        <span>1-Click Connect {p.name}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
