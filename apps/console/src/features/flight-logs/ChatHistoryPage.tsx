import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  History,
  Loader2,
  RefreshCw,
  Shield,
  Coins,
  DollarSign,
  Lock,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getChat, getChats, type ChatListItem, type ChatRecord } from "@/lib/api";

const HISTORY_LIMIT = 40;

interface BudgetSpend {
  total_flights: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusTone(status: string): string {
  switch (status) {
    case "completed":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "failed":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "flying":
    case "pending":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-zinc-400 bg-zinc-800 border-zinc-700";
  }
}

export default function ChatHistoryPage() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatRecord | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingChatDetail, setIsLoadingChatDetail] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [spend, setSpend] = useState<BudgetSpend | null>(null);
  const [testRedactInput, setTestRedactInput] = useState("");
  const [redactedOutput, setRedactedOutput] = useState<{ text: string; secrets: string[] } | null>(null);

  const loadSpend = useCallback(async () => {
    try {
      const res = await fetch("/api/security/spend");
      if (res.ok) {
        const json = (await res.json()) as { success: boolean; data: BudgetSpend };
        if (json.success) setSpend(json.data);
      }
    } catch {
      // Ignore
    }
  }, []);

  const loadChats = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setIsLoadingChats(true);
    }

    setLoadError(null);

    try {
      const items = await getChats(HISTORY_LIMIT);
      setChats(items);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load chat history.";
      setLoadError(message);
      setChats([]);
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
    void loadSpend();
  }, [loadChats, loadSpend]);

  const handleSelectChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    setIsLoadingChatDetail(true);
    setLoadError(null);

    try {
      const chat = await getChat(chatId);
      setSelectedChat(chat);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load chat details.";
      setSelectedChat(null);
      setLoadError(message);
    } finally {
      setIsLoadingChatDetail(false);
    }
  };

  const handleTestRedact = async () => {
    if (!testRedactInput.trim()) return;
    try {
      const res = await fetch("/api/security/redact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testRedactInput }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          success: boolean;
          data: { redacted_text: string; detected_secrets: string[] };
        };
        setRedactedOutput({
          text: json.data.redacted_text,
          secrets: json.data.detected_secrets,
        });
      }
    } catch {
      // Ignore
    }
  };

  const handleRefresh = async () => {
    await loadChats(true);
    await loadSpend();
    if (selectedChatId) {
      await handleSelectChat(selectedChatId);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6 bg-zinc-950 font-sans text-zinc-100">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <History className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Flight Logs & Enterprise Security</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Review past executions, token spend analytics, and zero-leak credential protection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            className="rounded-xl border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/app")}
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
          >
            Back to Co-Engineer
          </Button>
        </div>
      </div>

      {/* ─── Enterprise Token Budget & Redaction Status ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Total LLM Tokens</div>
            <div className="text-lg font-bold text-white font-mono">
              {spend ? (spend.total_tokens / 1000).toFixed(1) + "k" : "0k"}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Estimated Cost (USD)</div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              ${spend ? spend.total_cost_usd.toFixed(4) : "0.0000"}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Zero-Leak Redaction</div>
            <div className="text-xs font-bold text-blue-300 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Active & Masking Secrets
            </div>
          </div>
        </div>
      </div>

      {/* ─── Zero-Leak Secret Scanner Test Drawer ─── */}
      <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Zero-Leak Redaction Live Tester (Paste API keys, DB URIs, or tokens)
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. sk-proj-1234567890abcdef or postgresql://admin:secret@localhost:5432"
            value={testRedactInput}
            onChange={(e) => setTestRedactInput(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 focus:outline-hidden focus:border-amber-500/50"
          />
          <Button
            size="sm"
            onClick={() => void handleTestRedact()}
            className="rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-4"
          >
            Test Redaction
          </Button>
        </div>

        {redactedOutput && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1 font-mono">
            <div className="text-zinc-400">
              Detected Secrets:{" "}
              {redactedOutput.secrets.length > 0 ? (
                <span className="text-amber-400 font-bold">{redactedOutput.secrets.join(", ")}</span>
              ) : (
                <span className="text-zinc-500">None</span>
              )}
            </div>
            <div className="text-emerald-400 whitespace-pre-wrap">{redactedOutput.text}</div>
          </div>
        )}
      </div>

      {/* ─── Flight History List & Detail ─── */}
      {loadError && (
        <div className="flex items-start gap-2 border border-red-500/30 bg-red-500/10 p-3 rounded-xl text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
        {/* Left Column: Chat List */}
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 overflow-hidden flex flex-col h-[520px]">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Recent Executions</span>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
              {chats.length} runs
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {isLoadingChats ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">No flight records found.</div>
            ) : (
              chats.map((chat) => {
                const isSelected = selectedChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => void handleSelectChat(chat.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-zinc-900 border-amber-500/40 shadow-sm"
                        : "bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-zinc-500">{chat.id.slice(0, 8)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${statusTone(chat.status)}`}>
                        {chat.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1 line-clamp-2">{chat.prompt}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Detail */}
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/30 overflow-hidden flex flex-col h-[520px]">
          {isLoadingChatDetail ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : selectedChat ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Execution {selectedChat.id}</h3>
                  <span className="text-xs text-zinc-500">{formatDateTime(selectedChat.created_at)}</span>
                </div>
                {selectedChat.route_id && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/app/route/${selectedChat.route_id}`)}
                    className="rounded-xl bg-amber-500 text-black font-semibold text-xs gap-1"
                  >
                    Inspect Flight <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="text-[11px] font-bold uppercase text-zinc-500">Objective</div>
                <p className="text-xs text-zinc-200">{selectedChat.prompt}</p>
              </div>

              {selectedChat.result_json && (
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-emerald-400">Response / Outcome</div>
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedChat.result_json, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              Select an execution on the left to inspect logs and payloads.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}