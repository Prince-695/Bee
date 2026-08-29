import { ArrowRight, Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ConversationMessage } from "@/lib/conversation";

export const conversationSuggestions = [
  "I have a problem and need help figuring out what to do.",
  "I need a plan to automate a workflow across my tools.",
  "I want to send updates to Slack when something happens in GitHub.",
  "I need to fix a broken integration and I am not sure where to start.",
];

export function conversationStatusTone(state: string | undefined): string {
  switch (state) {
    case "planned":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "planning":
    case "gathering":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "failed":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    default:
      return "text-zinc-400 bg-zinc-800/80 border-zinc-700/60";
  }
}

export function conversationStatusLabel(state: string | undefined): string {
  switch (state) {
    case "planned":
      return "Route ready";
    case "planning":
      return "Building route";
    case "failed":
      return "Needs attention";
    case "gathering":
      return "Analyzing goal";
    default:
      return "Ready to chat";
  }
}

export function ConversationMessageRow({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  const isPending = Boolean((message.metadata as { isOptimistic?: boolean }).isOptimistic);
  const bubbleClassName = isUser
    ? `ml-auto bg-amber-500 text-black font-medium border-amber-400 shadow-md shadow-amber-500/10 ${isPending ? "opacity-80" : ""}`
    : "mr-auto bg-zinc-900 border-zinc-800 text-zinc-200";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm ${bubbleClassName}`}>
        <div className="mb-1.5 flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg border ${isUser ? "border-black/20 bg-black/10 text-black" : "border-zinc-700 bg-zinc-800 text-amber-400"}`}>
            {isUser ? <span className="text-[10px] font-black">You</span> : <Bot className="h-3.5 w-3.5" />}
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider ${isUser ? "text-black/80" : "text-zinc-400"}`}>
            {isUser ? "You" : "Bee Co-Engineer"}
          </span>
          {isUser && isPending && (
            <span className="rounded-full border border-black/20 bg-black/10 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-black">
              Sending
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap text-xs leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}

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
    <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-amber-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Context Requirements</h2>
            <p className="text-[11px] text-zinc-500">Autonomous planning requirements.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {missingInfo.length > 0 ? (
            missingInfo.map((item) => (
              <span key={item} className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {item}
              </span>
            ))
          ) : (
            <span className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400">
              ● Ready to Plan
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Mission Session State</h3>
        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">State</span>
            <span className="font-semibold text-zinc-200">{stateLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">Messages</span>
            <span className="font-semibold text-zinc-200">{messageCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-zinc-400">Route</span>
            <span className="font-mono text-amber-400 font-semibold">{routeId ? routeId : "Not planned"}</span>
          </div>
        </div>

        {routeId && (
          <Button className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20" onClick={onOpenPlan}>
            Inspect Mission Control
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Engineering Directives</h3>
        <p className="mt-2 text-xs leading-relaxed text-zinc-400">
          State your engineering objective (e.g. bug description, test failure, branch task). Bee autonomously queries code, runs tests, and repairs issues.
        </p>
      </div>
    </aside>
  );
}