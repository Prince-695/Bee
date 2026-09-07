import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Search,
  Radio,
  Eye,
} from "lucide-react";
import type { SignalRecord } from "./SignalInspectorDrawer";

interface SignalFeedTableProps {
  signals: SignalRecord[];
  onInspectSignal: (signal: SignalRecord) => void;
  onSimulateClick: () => void;
}

const SOURCES = [
  { id: "all", label: "All Sources" },
  { id: "github", label: "GitHub" },
  { id: "ci", label: "CI/CD" },
  { id: "sentry", label: "Sentry" },
  { id: "approvals", label: "Approvals" },
];

export function SignalFeedTable({
  signals,
  onInspectSignal,
  onSimulateClick,
}: SignalFeedTableProps) {
  const [selectedSource, setSelectedSource] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return signals.filter((s) => {
      const matchSource = selectedSource === "all" || s.source.toLowerCase() === selectedSource;
      const matchSearch =
        searchQuery === "" ||
        s.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.branch && s.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.matched_mission_id && s.matched_mission_id.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSource && matchSearch;
    });
  }, [signals, selectedSource, searchQuery]);

  return (
    <div className="space-y-4 font-sans select-none">
      {/* ── Sub-header: Source Filter Pills & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {SOURCES.map((src) => {
            const active = selectedSource === src.id;
            return (
              <button
                key={src.id}
                type="button"
                onClick={() => setSelectedSource(src.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#FFB22C] text-[#121316] font-bold shadow-sm shadow-[#FFB22C]/30"
                    : "skeuo-button-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {src.label}
              </button>
            );
          })}
        </div>

        {/* Live Search & Count */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search event type, repo, mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-card/60 border border-border/80 focus:border-[#FFB22C] focus:outline-none w-56 text-foreground placeholder:text-muted-foreground/60 transition-colors font-sans"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-card/40 border border-border/70 text-xs font-mono text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
            <span className="font-bold text-foreground">{signals.length}</span> Ingested
          </div>
        </div>
      </div>

      {/* ── Table Container ── */}
      {filtered.length === 0 ? (
        <div className="skeuo-glass-card p-12 rounded-2xl border border-dashed border-border/80 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-card/80 border border-border/70 flex items-center justify-center mx-auto text-muted-foreground">
            <Radio className="size-6 text-[#FFB22C] animate-pulse" />
          </div>
          <h3 className="font-bold text-sm text-foreground">No matching signals in feed</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            No incoming webhook events match this filter. Use the 1-click simulator to generate test events.
          </p>
          <button
            type="button"
            onClick={onSimulateClick}
            className="skeuo-button-primary px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <span>Launch Signal Simulator</span>
          </button>
        </div>
      ) : (
        <div className="skeuo-glass-card rounded-2xl border border-border/80 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/70 bg-card/80 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Source & Event</th>
                  <th className="py-3 px-4 font-semibold">Repository & Target</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Autonomous Flight Match</th>
                  <th className="py-3 px-4 font-semibold hidden sm:table-cell">Timestamp</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-xs font-mono">
                {filtered.map((sig) => {
                  return (
                    <tr
                      key={sig.signal_id}
                      className="hover:bg-card/50 transition-colors group"
                    >
                      {/* Source & Event Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              sig.source === "github"
                                ? "bg-blue-500 shadow-[0_0_6px_#3B82F6]"
                                : sig.source === "ci"
                                ? "bg-emerald-500 shadow-[0_0_6px_#10B981]"
                                : sig.source === "sentry"
                                ? "bg-destructive shadow-[0_0_6px_#EF4444]"
                                : "bg-amber-500 shadow-[0_0_6px_#F59E0B]"
                            }`}
                          />
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              sig.source === "github"
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/25"
                                : sig.source === "ci"
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                                : sig.source === "sentry"
                                ? "bg-destructive/10 text-destructive border-destructive/25"
                                : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                            }`}
                          >
                            {sig.source}
                          </span>
                          <span className="font-bold text-foreground truncate block">
                            {sig.event_type}
                          </span>
                        </div>
                      </td>

                      {/* Repository & Branch */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground truncate">{sig.repository}</span>
                          {sig.branch && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.2 rounded bg-muted/60 border border-border/50">
                              {sig.branch}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Flight Match */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        {sig.matched_mission_id ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="size-3" />
                            {sig.matched_mission_id}
                          </span>
                        ) : (
                          <span className="text-[10.5px] text-muted-foreground/70">
                            Evaluated (no flight)
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 hidden sm:table-cell text-muted-foreground text-[11px]">
                        {new Date(sig.created_at).toLocaleTimeString()}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onInspectSignal(sig)}
                          className="skeuo-button-secondary px-3 py-1 rounded-xl text-[11px] font-semibold text-foreground inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="size-3 text-muted-foreground" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
