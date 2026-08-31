export type DocSection =
  | "quickstart"
  | "oauth-connectors"
  | "architecture"
  | "mcp-catalog"
  | "approval-gates"
  | "security-budget"
  | "api-reference";

export interface SectionMeta {
  id: DocSection;
  title: string;
  category: "Getting Started" | "Core Concepts" | "Ecosystem" | "Security & API";
  iconName: string;
}

export const SECTIONS: SectionMeta[] = [
  { id: "quickstart", title: "Quickstart & Desktop Install", category: "Getting Started", iconName: "Download" },
  { id: "oauth-connectors", title: "1-Click OAuth Connectors", category: "Getting Started", iconName: "Key" },
  { id: "architecture", title: "5-Worker DAG & Self-Healing", category: "Core Concepts", iconName: "Cpu" },
  { id: "mcp-catalog", title: "Hive MCP Tool Catalog", category: "Ecosystem", iconName: "Boxes" },
  { id: "approval-gates", title: "Zero-Trust & WhatsApp Approvals", category: "Security & API", iconName: "Shield" },
  { id: "security-budget", title: "Zero-Leak Redaction & Budgeting", category: "Security & API", iconName: "DollarSign" },
  { id: "api-reference", title: "REST & Streaming API Reference", category: "Security & API", iconName: "Layers" },
];

export const API_ENDPOINTS = [
  { method: "POST", path: "/api/agent/route", desc: "Compile objective into a deterministic DAG of tool steps" },
  { method: "POST", path: "/api/agent/flight", desc: "Execute flight steps with self-healing error recovery" },
  { method: "GET", path: "/api/agent/gates", desc: "List pending human approval gates" },
  { method: "POST", path: "/api/agent/gates/:id/approve", desc: "Authorize a pending approval gate" },
  { method: "POST", path: "/api/missions", desc: "Create a 5-worker autonomous engineering mission" },
  { method: "GET", path: "/api/security/spend", desc: "Get total token consumption and flight USD cost" },
  { method: "POST", path: "/webhooks/github", desc: "Ingest GitHub PR and push events" },
  { method: "POST", path: "/webhooks/whatsapp", desc: "Resolve interactive 1-click mobile approval buttons" },
];
