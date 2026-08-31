import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send, Sparkles, Terminal, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getConversation,
  sendConversationMessage,
  startConversation,
  type ConversationMessage,
  type ConversationSession,
} from "@/lib/conversation";
import {
  ConversationMessageRow,
  ConversationSideRail,
  conversationSuggestions,
  conversationStatusLabel,
  conversationStatusTone,
} from "@/components/conversation/ConversationChrome";

const CONVERSATION_KEY = "bee.activeConversationId";

export default function ConversationPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [pendingMessage, setPendingMessage] = useState<ConversationMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    const savedConversationId = window.localStorage.getItem(CONVERSATION_KEY);
    if (!savedConversationId) {
      setHydrating(false);
      return;
    }

    let isMounted = true;
    const loadConversation = async () => {
      try {
        const session = await getConversation(savedConversationId);
        if (!isMounted) return;
        setConversation(session);
      } catch {
        if (!isMounted) return;
        window.localStorage.removeItem(CONVERSATION_KEY);
      } finally {
        if (isMounted) setHydrating(false);
      }
    };

    void loadConversation();
    return () => {
      isMounted = false;
    };
  }, []);

  const visibleMessages = conversation
    ? [...conversation.messages, ...(pendingMessage ? [pendingMessage] : [])]
    : pendingMessage
      ? [pendingMessage]
      : [];

  const activeConversationState = conversation?.state ?? (pendingMessage ? "gathering" : undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages.length, activeConversationState]);

  const handleReset = () => {
    window.localStorage.removeItem(CONVERSATION_KEY);
    setConversation(null);
    setPendingMessage(null);
    setDraft("");
    setLoadError(null);
  };

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    const optimisticMessage: ConversationMessage = {
      id: `local-${Date.now()}`,
      conversation_id: conversation?.id ?? "pending",
      turn_index: (conversation?.messages.length ?? 0) + 1,
      role: "user",
      content: text,
      metadata: { isOptimistic: true },
      created_at: new Date().toISOString(),
    };

    setIsSending(true);
    setLoadError(null);
    setPendingMessage(optimisticMessage);
    setDraft("");

    try {
      const result = conversation?.id
        ? await sendConversationMessage(conversation.id, text)
        : await startConversation(text);

      setConversation(result.conversation);
      setPendingMessage(null);
      window.localStorage.setItem(CONVERSATION_KEY, result.conversation.id);

      if (result.route_id) {
        navigate(`/app/route/${result.route_id}`);
      }
    } catch (error) {
      setPendingMessage(null);
      setDraft(text);
      const message = error instanceof Error ? error.message : "Failed to send message.";
      setLoadError(message);
    } finally {
      setIsSending(false);
    }
  };

  if (hydrating) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden p-4 md:p-6">
      <div className="mx-auto grid h-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Conversation Window */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4 bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">AI Co-Engineer Workspace</h1>
                <p className="text-xs text-zinc-400">Collaborative planning, code review, and execution stream.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${conversationStatusTone(activeConversationState)}`}>
                {conversationStatusLabel(activeConversationState)}
              </span>
              <Button
                variant="outline"
                className="rounded-xl border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
                onClick={handleReset}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                New Thread
              </Button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {!visibleMessages.length ? (
              <div className="flex h-full min-h-[300px] flex-col justify-center gap-6 p-4 max-w-2xl mx-auto">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    <Terminal className="h-3 w-3" /> Autonomous Task Planner
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    What are we building or fixing today?
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Provide your engineering task or issue description. Bee will analyze the requirements, inspect the codebase, and build a self-healing Route.
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Suggested tasks</span>
                  <div className="grid gap-2">
                    {conversationSuggestions.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setDraft(prompt);
                        }}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:border-amber-500/40 hover:bg-zinc-900/80 text-left text-xs text-zinc-300 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span>{prompt}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleMessages.map((msg) => (
                  <ConversationMessageRow key={msg.id} message={msg} />
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2.5 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-xs text-zinc-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      <span>Bee is analyzing requirements & creating execution Route...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="border-t border-zinc-800 bg-zinc-900/60 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
              className="space-y-3"
            >
              <Textarea
                className="min-h-24 resize-none rounded-xl border border-zinc-800 bg-black/50 p-3.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-amber-500"
                placeholder="Describe your engineering goal (e.g., 'Run test suite and fix failing auth assertions')..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit();
                  }
                }}
              />

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {activeConversationState === "planned"
                    ? "Route generated. Ready for Flight execution."
                    : "Press Enter to submit, Shift+Enter for new line."}
                </div>

                <Button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-xs shadow-lg shadow-amber-500/20 px-4"
                  disabled={isSending || !draft.trim()}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Planning
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" />
                      Send Goal
                    </>
                  )}
                </Button>
              </div>
            </form>

            {loadError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {loadError}
              </div>
            )}
          </div>
        </section>

        {/* Side Rail */}
        <ConversationSideRail
          missingInfo={conversation?.missing_info ?? []}
          stateLabel={conversationStatusLabel(activeConversationState)}
          messageCount={visibleMessages.length}
          routeId={conversation?.route_id ?? null}
          onOpenPlan={() => {
            if (conversation?.route_id) {
              navigate(`/app/route/${conversation.route_id}`);
            }
          }}
        />
      </div>
    </div>
  );
}