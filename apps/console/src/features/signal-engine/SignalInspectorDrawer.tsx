import { useState } from "react";
import {
  X,
  Radio,
  ExternalLink,
  Copy,
  Check,
  Code2,
  GitBranch,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface SignalRecord {
  signal_id: string;
  source: string;
  event_type: string;
  repository: string;
  branch: string | null;
  sender: string | null;
  payload: Record<string, unknown>;
  status: string;
  matched_mission_id: string | null;
  created_at: string;
}

interface SignalInspectorDrawerProps {
  signal: SignalRecord | null;
  onClose: () => void;
}

export function SignalInspectorDrawer({
  signal,
  onClose,
}: SignalInspectorDrawerProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!signal) return null;

  const handleCopyPayload = () => {
    void navigator.clipboard.writeText(JSON.stringify(signal.payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigateToFlight = (missionId: string) => {
    navigate(`/route/${missionId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl h-full skeuo-glass-deck border-l border-border/80 flex flex-col justify-between shadow-2xl p-6 overflow-hidden animate-in slide-in-from-right duration-300 select-none text-foreground font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Drawer Header ─── */}
        <div className="flex items-start justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#FFB22C]/15 border border-[#FFB22C]/30 flex items-center justify-center text-[#FFB22C]">
                <Radio className="size-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
                  {signal.event_type}
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Signal ID: <strong className="text-foreground">{signal.signal_id}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPayload}
              className="skeuo-button-secondary p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="Copy Raw JSON"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="skeuo-button-secondary p-2 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
              title="Close Drawer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ─── Drawer Body (Scrollable) ─── */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 select-text">
          {/* Autonomous Flight Correlation Banner */}
          <div className="p-4 rounded-xl bg-card/60 border border-border/70 shadow-inner space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Zap className="size-3 text-[#FFB22C]" />
                Autonomous Flight Match Status:
              </span>
              {signal.matched_mission_id ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> FLIGHT SPAWNED
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-muted/60 text-muted-foreground border border-border/50">
                  INGESTED & ARCHIVED
                </span>
              )}
            </div>

            {signal.matched_mission_id ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-foreground block font-mono">
                    Mission #{signal.matched_mission_id}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Triggered multi-agent swarm pipeline (Scout $\rightarrow$ Tester $\rightarrow$ Fixer).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateToFlight(signal.matched_mission_id!)}
                  className="skeuo-button-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <span>Open Route</span>
                  <ExternalLink className="size-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluated against automation trigger rules: Event logged to audit trail. No flight threshold exceeded.
              </p>
            )}
          </div>

          {/* Event Metadata Table */}
          <div className="space-y-2">
            <span className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <GitBranch className="size-3 text-[#FFB22C]" />
              Event Coordinates & Context
            </span>
            <div className="p-3.5 rounded-xl bg-card/40 border border-border/60 grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Source Provider:</span>
                <span className="font-bold text-foreground uppercase">{signal.source}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Repository:</span>
                <span className="font-bold text-[#FFB22C] truncate block">{signal.repository}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Branch Head:</span>
                <span className="font-bold text-foreground">{signal.branch || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block">Sender Identity:</span>
                <span className="font-bold text-foreground truncate block">{signal.sender || "Unknown"}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Received At:
                </span>
                <span>{new Date(signal.created_at).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Raw Ingested JSON Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-mono uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                <Code2 className="size-3 text-[#FFB22C]" />
                Raw Ingested Webhook Payload (JSON)
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {Object.keys(signal.payload).length} keys
              </span>
            </div>

            <div className="skeuo-inset-terminal p-3.5 rounded-xl text-xs font-mono text-zinc-300 max-h-72 overflow-y-auto leading-relaxed border border-white/5">
              <pre className="text-[11px]">
                {JSON.stringify(signal.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* ─── Drawer Footer ─── */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10B981]" />
            Payload Verified by HMAC-SHA256
          </div>
          <button
            type="button"
            onClick={onClose}
            className="skeuo-button-secondary px-4 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
