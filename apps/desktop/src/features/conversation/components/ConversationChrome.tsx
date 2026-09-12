import {
  User,
  ChevronRight,
  ShieldCheck,
  Layers,
  Search,
  Terminal,
  Wrench,
  Shield,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineFlightPlayer } from "@/features/mission-control/InlineFlightPlayer";
import type { ConversationMessage } from "@/lib/conversation";

export const conversationSuggestions = [
  "Audit auth middleware and verify JWT token rotation",
  "Run pytest suite, analyze failures, and auto-heal broken tests",
  "Add rate-limiting to all public API endpoints and test locally",
  "Setup WhatsApp Meta webhook for mobile 1-tap approval gates",
];

export function conversationStatusTone(state: string | undefined): string {
  switch (state) {
    case "planned":
      return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
    case "planning":
    case "gathering":
      return "text-primary bg-primary/10 border-primary/30";
    case "failed":
      return "text-destructive bg-destructive/10 border-destructive/30";
    default:
      return "text-muted-foreground bg-muted/40 border-border/60";
  }
}

export function conversationStatusLabel(state: string | undefined): string {
  switch (state) {
    case "planned":
      return "Route Ready & Planned";
    case "planning":
      return "Synthesizing DAG Route...";
    case "failed":
      return "Action Required";
    case "gathering":
      return "Analyzing Goal...";
    default:
      return "Co-Engineer Standing By";
  }
}

interface MessageRowProps {
  message: ConversationMessage;
  onNavigateToRoute?: (routeId: string) => void;
}

export function ConversationMessageRow({
  message,
  onNavigateToRoute,
}: MessageRowProps) {
  const isUser = message.role === "user";
  const isPending = Boolean(
    (message.metadata as { isOptimistic?: boolean })?.isOptimistic
  );
  const routeId =
    (message.metadata as { route_id?: string })?.route_id ||
    (message as unknown as { route_id?: string }).route_id;

  return (
    <div
      className={`flex flex-col space-y-2.5 transition-all ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      {/* Speaker Header Badge */}
      <div
        className={`flex items-center gap-2 px-1 text-[11px] font-mono select-none ${
          isUser ? "flex-row-reverse text-muted-foreground" : "text-primary"
        }`}
      >
        <div
          className={`size-5 rounded-md flex items-center justify-center text-[10px] font-bold shadow-xs ${
            isUser
              ? "bg-secondary text-secondary-foreground border border-border"
              : "bg-gradient-to-br from-primary to-amber-500 text-primary-foreground"
          }`}
        >
          {isUser ? <User className="size-3" /> : "🐝"}
        </div>
        <span className="font-semibold text-foreground/80">
          {isUser ? "You" : "Bee Co-Engineer"}
        </span>
        {isPending && (
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/15 text-primary border border-primary/20 font-bold uppercase tracking-wider animate-pulse">
            Processing...
          </span>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 transition-all ${
          isUser
            ? "skeuo-button-primary text-primary-foreground font-medium shadow-lg"
            : "skeuo-glass-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed tracking-normal font-sans">
          {message.content}
        </p>

        {/* Embedded Interactive Flight Player Cockpit if Route is generated */}
        {routeId && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <InlineFlightPlayer
              routeId={routeId}
              autoStart={false}
              onCompleted={() => {
                if (onNavigateToRoute) {
                  // Optional callback
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const WORKER_STAGES = [
  { id: "scout", name: "Inspector", role: "Codebase Analysis", icon: Search },
  { id: "test", name: "Tester", role: "Edge-Case Synthesis", icon: Terminal },
  { id: "fixer", name: "Fixer", role: "Compiler Auto-Heal", icon: Wrench },
  { id: "guard", name: "Guard", role: "Zero-Trust Gates", icon: Shield },
  { id: "scribe", name: "Scribe", role: "Verification Log", icon: FileText },
];

export function ConversationSideRail({
  missingInfo,
  stateLabel,
  messageCount,
  routeId,
  onOpenPlan,
}: {
  missingInfo: string[];
  stateLabel: string;
  messageCount: number;
  routeId: string | null;
  onOpenPlan: () => void;
}) {
  return (
    <aside className="w-80 flex flex-col gap-4 overflow-y-auto pr-1">
      {/* ─── 1. Autonomous Flight Telemetry ─────────────────────────── */}
      <div className="rounded-2xl skeuo-glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary honey-led-active" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              Flight Telemetry
            </h2>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
          >
            ACTIVE
          </Badge>
        </div>

        <div className="space-y-2 font-mono text-xs pt-1">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-muted-foreground text-[11px]">Mission State</span>
            <span className="font-semibold text-foreground">{stateLabel}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-muted-foreground text-[11px]">Dialogue Turns</span>
            <span className="font-semibold text-foreground">{messageCount}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40">
            <span className="text-muted-foreground text-[11px]">Active Route</span>
            <span className="font-semibold text-primary">
              {routeId ? `#${routeId.slice(0, 8)}` : "None"}
            </span>
          </div>
        </div>

        {missingInfo && missingInfo.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[11px]">
              <AlertCircle className="size-3" />
              <span>Required Context</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {missingInfo.map((info) => (
                <span
                  key={info}
                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono"
                >
                  {info}
                </span>
              ))}
            </div>
          </div>
        )}

        {routeId && (
          <Button
            type="button"
            variant="glow"
            size="sm"
            onClick={onOpenPlan}
            className="w-full text-xs font-semibold gap-1.5 h-9"
          >
            <span>Inspect Full DAG Flight Deck</span>
            <ChevronRight className="size-3.5" />
          </Button>
        )}
      </div>

      {/* ─── 2. Agent Worker Pipeline Stages ─────────────────────────── */}
      <div className="rounded-2xl skeuo-glass-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-primary" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Worker Pipeline
          </h3>
        </div>

        <div className="space-y-2">
          {WORKER_STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-card/40 hover:bg-card/70 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-md bg-muted flex items-center justify-center text-foreground">
                    <Icon className="size-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-xs">
                      {stage.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {stage.role}
                    </div>
                  </div>
                </div>
                <span className="size-1.5 rounded-full bg-emerald-500" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 3. Required Context Directives ─────────────────────────── */}
      <div className="rounded-2xl skeuo-glass-card p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
            Zero-Trust Isolation
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Commands and compiler passes run in local ephemeral sandboxes.
          Destructive modifications require explicit human authorization gates.
        </p>
      </div>
    </aside>
  );
}