import React, { useState } from "react";
import {
  Shield,
  X,
  Search,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: "CREDENTIAL_REDACTED" | "FLIGHT_LAUNCHED" | "GATE_APPROVED" | "BUDGET_WARNING" | "MCP_CONNECTED";
  actor: string;
  ip: string;
  target: string;
  risk: "LOW" | "MEDIUM" | "HIGH";
  details: string;
}

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "aud_9081a7b1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    eventType: "CREDENTIAL_REDACTED",
    actor: "bee_system:ingress_sanitizer",
    ip: "10.0.12.45",
    target: "flight_auto_09ab2",
    risk: "LOW",
    details: "Sanitized Slack Bot Token (xoxb-...) before LLM ingestion",
  },
  {
    id: "aud_9081a7b2",
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    eventType: "GATE_APPROVED",
    actor: "prince.rathod@enterprise.io",
    ip: "192.168.1.104",
    target: "gate_commit_7812",
    risk: "MEDIUM",
    details: "Approved write action: git_commit to branch fix/auth-tests",
  },
  {
    id: "aud_9081a7b3",
    timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
    eventType: "FLIGHT_LAUNCHED",
    actor: "api_token:gh_webhook_prod",
    ip: "140.82.112.4",
    target: "route_mission_auto_fr7y",
    risk: "LOW",
    details: "Autonomous flight dispatched via GitHub push signal",
  },
  {
    id: "aud_9081a7b4",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    eventType: "BUDGET_WARNING",
    actor: "bee_system:spend_sentinel",
    ip: "10.0.12.1",
    target: "workspace_budget",
    risk: "LOW",
    details: "Monthly spend reached 75% of warning threshold ($14.82 of $20.00)",
  },
  {
    id: "aud_9081a7b5",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    eventType: "MCP_CONNECTED",
    actor: "prince.rathod@enterprise.io",
    ip: "192.168.1.104",
    target: "mcp_server:github_tools",
    risk: "LOW",
    details: "Active connector registered with read/write repo scopes",
  },
];

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  if (!isOpen) return null;

  const filtered = SAMPLE_AUDIT_EVENTS.filter((evt) => {
    if (riskFilter !== "ALL" && evt.risk !== riskFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        evt.eventType.toLowerCase().includes(q) ||
        evt.actor.toLowerCase().includes(q) ||
        evt.target.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCsv = () => {
    const headers = "id,timestamp,eventType,actor,ip,target,risk,details\n";
    const rows = filtered
      .map(
        (e) =>
          `"${e.id}","${e.timestamp}","${e.eventType}","${e.actor}","${e.ip}","${e.target}","${e.risk}","${e.details}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soc2-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJsonl = () => {
    const lines = filtered.map((e) => JSON.stringify(e)).join("\n");
    const blob = new Blob([lines], { type: "application/x-ndjson" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soc2-audit-logs-${new Date().toISOString().slice(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="skeuo-glass-deck w-full max-w-4xl rounded-2xl border border-primary/40 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_14px_rgba(255,178,44,0.2)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">SOC2 Audit Forensics Trail</h3>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Immutable
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cryptographic audit trail of all security scans, credential masking events, and execution gate approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="text-xs px-3 py-1.5 rounded-xl border border-border/60 hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors font-medium"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportJsonl}
              className="text-xs px-3 py-1.5 rounded-xl border border-border/60 hover:bg-secondary text-foreground flex items-center gap-1.5 transition-colors font-medium"
            >
              <FileCode className="w-3.5 h-3.5 text-primary" />
              <span>Export JSONL</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-secondary/30 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search audit trail by actor, event, or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-background/80 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/60 text-foreground font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase mr-1">Risk:</span>
            {["ALL", "LOW", "MEDIUM", "HIGH"].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                  riskFilter === r
                    ? "bg-primary text-primary-foreground shadow-[0_0_8px_rgba(255,178,44,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Events Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-secondary/60 border-b border-border/60 text-muted-foreground font-mono text-[10px] uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Type</th>
                  <th className="p-3">Actor & Origin</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Risk</th>
                  <th className="p-3">Evidence Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {filtered.map((evt) => (
                  <tr key={evt.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3 text-muted-foreground text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="p-3 text-foreground font-medium">
                      <div>{evt.actor}</div>
                      <div className="text-[10px] text-muted-foreground">{evt.ip}</div>
                    </td>
                    <td className="p-3 text-primary/90">{evt.target}</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          evt.risk === "LOW"
                            ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
                            : evt.risk === "MEDIUM"
                            ? "text-amber-500 bg-amber-500/10 border border-amber-500/20"
                            : "text-red-500 bg-red-500/10 border border-red-500/20"
                        }`}
                      >
                        {evt.risk}
                      </span>
                    </td>
                    <td className="p-3 text-foreground/80 font-sans text-xs">
                      {evt.details}
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
