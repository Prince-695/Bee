import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Send,
  Sparkles,
} from "lucide-react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [conversation, setConversation] = useState<ConversationSession | null>(null);
  const [pendingMessage, setPendingMessage] = useState<ConversationMessage | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [showSideRail, setShowSideRail] = useState(true);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

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
        // Find if any message already has a route_id
        for (const msg of session.messages) {
          const rId = (msg.metadata as { route_id?: string })?.route_id;
          if (rId) {
            setActiveRouteId(rId);
            break;
          }
        }
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

  const activeConversationState =
    conversation?.state ?? (pendingMessage ? "gathering" : undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages.length, activeConversationState, activeRouteId]);

  const handleReset = () => {
    window.localStorage.removeItem(CONVERSATION_KEY);
    setConversation(null);
    setPendingMessage(null);
    setActiveRouteId(null);
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

      let updatedConversation = result.conversation;

      // If a route was planned, attach route_id to the assistant's response so InlineFlightPlayer renders!
      if (result.route_id) {
        setActiveRouteId(result.route_id);
        const lastMsgIdx = updatedConversation.messages.length - 1;
        if (lastMsgIdx >= 0 && updatedConversation.messages[lastMsgIdx].role === "assistant") {
          updatedConversation = {
            ...updatedConversation,
            messages: updatedConversation.messages.map((m, idx) =>
              idx === lastMsgIdx
                ? {
                    ...m,
                    metadata: {
                      ...m.metadata,
                      route_id: result.route_id,
                    },
                  }
                : m
            ),
          };
        }
      }

      setConversation(updatedConversation);
      setPendingMessage(null);
      window.localStorage.setItem(CONVERSATION_KEY, result.conversation.id);
    } catch (error) {
      setPendingMessage(null);
      setDraft(text);
      const message =
        error instanceof Error ? error.message : "Failed to send message.";
      setLoadError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  if (hydrating) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <span className="font-mono text-xs text-muted-foreground">
          Restoring Co-Engineer Session...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-background">
      {/* ─── 1. Cockpit Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/30 backdrop-blur-md z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-black shadow-[0_2px_10px_rgba(255,178,44,0.3)]">
            🐝
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
              <span>Co-Engineer Flight Console</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/20 font-semibold">
                Autonomous
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Capsule */}
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all ${conversationStatusTone(
              activeConversationState
            )}`}
          >
            <span
              className={`size-2 rounded-full ${
                activeConversationState === "planning" ||
                activeConversationState === "gathering"
                  ? "bg-primary honey-led-active"
                  : activeConversationState === "planned"
                  ? "bg-emerald-500 shadow-[0_0_8px_#10B981]"
                  : "bg-muted-foreground/40"
              }`}
            />
            <span>{conversationStatusLabel(activeConversationState)}</span>
          </div>

          {/* New Thread Tactile Button */}
          <button
            type="button"
            onClick={handleReset}
            className="skeuo-button-secondary px-2.5 py-1 rounded-lg text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
            title="Start fresh conversation thread"
          >
            <RotateCcw className="size-3 text-muted-foreground" />
            <span className="hidden sm:inline">New Thread</span>
          </button>

          {/* Toggle Blueprint Side Rail */}
          <button
            type="button"
            onClick={() => setShowSideRail(!showSideRail)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showSideRail
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            title={showSideRail ? "Collapse Blueprint Rail" : "Expand Blueprint Rail"}
          >
            {showSideRail ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* ─── 2. Main Workspace Body ──────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Chat Stream Centerpiece */}
        <section className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
            {!visibleMessages.length ? (
              <div className="flex h-full min-h-[420px] flex-col justify-center items-center max-w-2xl mx-auto space-y-8 text-center">
                {/* Hero Greeting */}
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                    <Sparkles className="size-3.5" />
                    <span>Autonomous AI Co-Engineer</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    What are we building or testing today?
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Issue a high-level goal. Bee will inspect codebases, synthesize a
                    DAG route, and execute flights with compiler feedback.
                  </p>
                </div>

                {/* Quick Directive Chips */}
                <div className="w-full space-y-2.5 text-left">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase text-muted-foreground px-1">
                    <span>Recommended Autonomous Missions</span>
                    <span>1-Click Launch</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {conversationSuggestions.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setDraft(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="skeuo-glass-card p-3 rounded-xl text-left text-xs font-medium text-foreground hover:border-primary/50 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span className="line-clamp-2 leading-snug">{prompt}</span>
                        <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {visibleMessages.map((msg) => (
                  <ConversationMessageRow
                    key={msg.id}
                    message={msg}
                    onNavigateToRoute={(rId) => navigate(`/route/${rId}`)}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ─── 3. Inset Frosted Input Console ──────────────────────── */}
          <div className="p-4 border-t border-border/50 bg-card/20 backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              {loadError && (
                <div className="mb-2 p-2.5 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{loadError}</span>
                </div>
              )}

              {/* Inset hardware bay */}
              <div className="rounded-2xl p-2 skeuo-glass-deck flex flex-col gap-2">
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your engineering goal (e.g., 'Analyze test failures, repair broken imports, and run coverage')..."
                  rows={2}
                  className="min-h-[56px] max-h-36 resize-none border-0 bg-transparent text-sm text-foreground focus-visible:ring-0 placeholder:text-muted-foreground/60 shadow-none font-sans"
                />

                <div className="flex items-center justify-between pt-1 px-1 border-t border-border/30">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    <span className="hidden sm:inline">Press</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground text-[10px] font-semibold border border-border/40">
                      Enter ↵
                    </kbd>
                    <span className="hidden sm:inline">to engage • Shift + Enter for newline</span>
                  </div>

                  <button
                    type="button"
                    disabled={!draft.trim() || isSending}
                    onClick={() => void handleSubmit()}
                    className={`skeuo-button-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      !draft.trim() || isSending ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Planning...</span>
                      </>
                    ) : (
                      <>
                        <span>Engage Bee</span>
                        <Send className="size-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. Collapsible Blueprint Side Rail ──────────────────────── */}
        {showSideRail && (
          <div className="hidden lg:block border-l border-border/50 bg-card/20 backdrop-blur-md p-4 animate-in slide-in-from-right duration-200">
            <ConversationSideRail
              missingInfo={conversation?.missing_info || []}
              stateLabel={conversationStatusLabel(activeConversationState)}
              messageCount={visibleMessages.length}
              routeId={activeRouteId}
              onOpenPlan={() => {
                if (activeRouteId) navigate(`/route/${activeRouteId}`);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}