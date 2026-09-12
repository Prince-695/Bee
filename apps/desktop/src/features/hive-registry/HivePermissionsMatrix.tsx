import { useState } from "react";
import {
  Shield,
  Smartphone,
  RotateCcw,
  Save,
  Check,
  FileCode2,
  Terminal,
  GitBranch,
  Database,
  Globe,
} from "lucide-react";

export type PolicyLevel = "auto_approve" | "gate_prompt" | "strict_deny";

export interface PermissionRow {
  id: string;
  scopeName: string;
  category: "fs" | "vcs" | "shell" | "db" | "network";
  icon: React.ReactNode;
  description: string;
  affectedTools: string[];
  currentPolicy: PolicyLevel;
  defaultPolicy: PolicyLevel;
}

const INITIAL_POLICIES: PermissionRow[] = [
  {
    id: "fs_read",
    scopeName: "Workspace Filesystem Read",
    category: "fs",
    icon: <FileCode2 className="size-4 text-emerald-500" />,
    description: "Read text and binary files, analyze line slices, and list project directories.",
    affectedTools: ["read_file", "list_directory", "code_view_file"],
    currentPolicy: "auto_approve",
    defaultPolicy: "auto_approve",
  },
  {
    id: "fs_write",
    scopeName: "Workspace Filesystem Write & Patch",
    category: "fs",
    icon: <FileCode2 className="size-4 text-amber-500" />,
    description: "Create new files, apply diff patches, or rewrite source code in the workspace.",
    affectedTools: ["write_file", "patch_file"],
    currentPolicy: "gate_prompt",
    defaultPolicy: "gate_prompt",
  },
  {
    id: "vcs_read",
    scopeName: "Git VCS Blame & Diff Inspection",
    category: "vcs",
    icon: <GitBranch className="size-4 text-emerald-500" />,
    description: "Query git status, porcelain working tree changes, commit logs, and branch heads.",
    affectedTools: ["git_status", "git_diff", "git_log"],
    currentPolicy: "auto_approve",
    defaultPolicy: "auto_approve",
  },
  {
    id: "vcs_write",
    scopeName: "Git Commit & Branch Staging",
    category: "vcs",
    icon: <GitBranch className="size-4 text-amber-500" />,
    description: "Stage changes, create local feature branches, and create signed git commits.",
    affectedTools: ["git_commit", "git_create_branch"],
    currentPolicy: "gate_prompt",
    defaultPolicy: "gate_prompt",
  },
  {
    id: "vcs_push",
    scopeName: "Remote Git Push & PR Merge",
    category: "vcs",
    icon: <GitBranch className="size-4 text-destructive" />,
    description: "Push commits to remote GitHub/GitLab origin branches and trigger PR merges.",
    affectedTools: ["git_push", "pr_merge"],
    currentPolicy: "gate_prompt",
    defaultPolicy: "gate_prompt",
  },
  {
    id: "shell_test",
    scopeName: "Test Suite Execution (pytest, vitest)",
    category: "shell",
    icon: <Terminal className="size-4 text-emerald-500" />,
    description: "Run automated test runners inside the isolated micro-container sandbox.",
    affectedTools: ["run_test_suite", "run_linter"],
    currentPolicy: "auto_approve",
    defaultPolicy: "auto_approve",
  },
  {
    id: "shell_arbitrary",
    scopeName: "Arbitrary Bash Command Execution",
    category: "shell",
    icon: <Terminal className="size-4 text-destructive" />,
    description: "Execute raw shell commands and scripts inside the containerized sandbox environment.",
    affectedTools: ["run_command"],
    currentPolicy: "gate_prompt",
    defaultPolicy: "gate_prompt",
  },
  {
    id: "db_read",
    scopeName: "Database Read & Schema Reflection",
    category: "db",
    icon: <Database className="size-4 text-emerald-500" />,
    description: "Inspect relational tables, pgvector embeddings, and run SELECT SQL statements.",
    affectedTools: ["describe_table", "list_tables"],
    currentPolicy: "auto_approve",
    defaultPolicy: "auto_approve",
  },
  {
    id: "db_write",
    scopeName: "Database Mutation (INSERT/UPDATE/DROP)",
    category: "db",
    icon: <Database className="size-4 text-destructive" />,
    description: "Execute data mutation statements or schema alteration DDL migrations.",
    affectedTools: ["query"],
    currentPolicy: "gate_prompt",
    defaultPolicy: "gate_prompt",
  },
  {
    id: "net_outbound",
    scopeName: "Outbound Web Crawl & API Calls",
    category: "network",
    icon: <Globe className="size-4 text-amber-500" />,
    description: "Fetch external SDK documentation and issue reports via DuckDuckGo / web HTTP.",
    affectedTools: ["duckduckgo_web_search"],
    currentPolicy: "auto_approve",
    defaultPolicy: "auto_approve",
  },
];

export function HivePermissionsMatrix() {
  const [policies, setPolicies] = useState<PermissionRow[]>(INITIAL_POLICIES);
  const [saved, setSaved] = useState(false);

  const handleUpdatePolicy = (id: string, level: PolicyLevel) => {
    setPolicies((prev) =>
      prev.map((r) => (r.id === id ? { ...r, currentPolicy: level } : r))
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    setPolicies((prev) =>
      prev.map((r) => ({ ...r, currentPolicy: r.defaultPolicy }))
    );
  };

  const autoCount = policies.filter((p) => p.currentPolicy === "auto_approve").length;
  const gateCount = policies.filter((p) => p.currentPolicy === "gate_prompt").length;
  const denyCount = policies.filter((p) => p.currentPolicy === "strict_deny").length;

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ── Sub-header with Policy Counts & Save Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="size-4 text-[#FFB22C]" />
            Zero-Trust Execution Policy & Permissions Matrix
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define granular safety boundaries. Dangerous actions automatically trigger 1-Tap Mobile Approval Gates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="skeuo-button-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="skeuo-button-primary px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            {saved ? <Check className="size-3.5 stroke-[2.5]" /> : <Save className="size-3.5" />}
            {saved ? "Policy Enforced!" : "Enforce Policy"}
          </button>
        </div>
      </div>

      {/* ── Policy Dimension Metric Capsules ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-card/60 border border-emerald-500/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="size-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            <div>
              <span className="text-xs font-bold text-foreground block">Auto-Approved Scope</span>
              <span className="text-[10px] text-muted-foreground">Runs autonomously in sandbox</span>
            </div>
          </div>
          <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {autoCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-card/60 border border-amber-500/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="size-3 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
            <div>
              <span className="text-xs font-bold text-foreground block">Gate-Prompted Scope</span>
              <span className="text-[10px] text-muted-foreground">Pushes 1-Tap Mobile Approval</span>
            </div>
          </div>
          <span className="text-lg font-bold font-mono text-amber-500">
            {gateCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-card/60 border border-destructive/30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="size-3 rounded-full bg-destructive shadow-[0_0_8px_#EF4444]" />
            <div>
              <span className="text-xs font-bold text-foreground block">Strictly Denied Scope</span>
              <span className="text-[10px] text-muted-foreground">Hard-blocked kernel boundary</span>
            </div>
          </div>
          <span className="text-lg font-bold font-mono text-destructive">
            {denyCount}
          </span>
        </div>
      </div>

      {/* ── Granular Policy Table ── */}
      <div className="skeuo-glass-card rounded-2xl border border-border/80 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-card/80 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Scope & Capability</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Bound Tools</th>
                <th className="py-3 px-4 font-semibold text-right sm:text-center">Execution Policy Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {policies.map((row) => {
                return (
                  <tr key={row.id} className="hover:bg-card/40 transition-colors">
                    {/* Scope Name & Desc */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-3">
                        <div className="size-7 rounded-lg bg-card/80 border border-border/60 flex items-center justify-center shrink-0 mt-0.5">
                          {row.icon}
                        </div>
                        <div>
                          <span className="font-bold text-foreground block tracking-tight">
                            {row.scopeName}
                          </span>
                          <span className="text-muted-foreground text-[11px] leading-relaxed block line-clamp-1">
                            {row.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Affected Tools */}
                    <td className="py-3.5 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {row.affectedTools.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-muted/60 border border-border/60 font-mono text-[10.5px] text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Policy Segmented Switch */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end sm:justify-center gap-1 bg-card/80 p-1 rounded-xl border border-border/80 w-fit ml-auto sm:mx-auto shadow-inner">
                        {/* Auto-Approve */}
                        <button
                          type="button"
                          onClick={() => handleUpdatePolicy(row.id, "auto_approve")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            row.currentPolicy === "auto_approve"
                              ? "bg-emerald-500 text-white shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          Auto
                        </button>

                        {/* Gate Prompt */}
                        <button
                          type="button"
                          onClick={() => handleUpdatePolicy(row.id, "gate_prompt")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            row.currentPolicy === "gate_prompt"
                              ? "bg-amber-500 text-[#121316] shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-amber-600" />
                          Gate
                        </button>

                        {/* Strict Deny */}
                        <button
                          type="button"
                          onClick={() => handleUpdatePolicy(row.id, "strict_deny")}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                            row.currentPolicy === "strict_deny"
                              ? "bg-destructive text-white shadow-sm font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-white" />
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Approval Notification Channels Banner ── */}
      <div className="p-4 rounded-2xl border border-border/70 bg-card/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#FFB22C] shrink-0">
            <Smartphone className="size-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">
              Multi-Channel Gate Delivery (WhatsApp & Slack)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Gate-prompted approvals automatically route to configured engineer phones with encrypted HMAC-SHA256 signature tokens.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active on WhatsApp
          </span>
        </div>
      </div>
    </div>
  );
}
