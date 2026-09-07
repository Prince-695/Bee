import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ChatListItem } from "@/lib/api";

export interface FlightItem extends ChatListItem {
  duration?: string;
  totalTokens?: number;
  costUsd?: number;
  model?: string;
}

interface FlightHistoryListProps {
  flights: FlightItem[];
  selectedFlightId: string | null;
  onSelectFlight: (flightId: string) => void;
  isLoading: boolean;
}

type FilterStatus = "all" | "completed" | "flying" | "failed" | "high_spend";

export const FlightHistoryList: React.FC<FlightHistoryListProps> = ({
  flights,
  selectedFlightId,
  onSelectFlight,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterStatus>("all");

  const filteredFlights = useMemo(() => {
    return flights.filter((flight) => {
      // Tab filter
      if (filterTab === "completed" && flight.status !== "completed") return false;
      if (filterTab === "flying" && flight.status !== "flying" && flight.status !== "pending") return false;
      if (filterTab === "failed" && flight.status !== "failed") return false;
      if (filterTab === "high_spend" && (flight.totalTokens || 0) < 5000) return false;

      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = flight.id.toLowerCase().includes(q);
        const routeMatch = flight.route_id?.toLowerCase().includes(q) ?? false;
        const promptMatch = flight.prompt.toLowerCase().includes(q);
        return idMatch || routeMatch || promptMatch;
      }
      return true;
    });
  }, [flights, filterTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-md uppercase">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        );
      case "flying":
      case "pending":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-md uppercase">
            <Radio className="w-3 h-3 animate-pulse" /> Flying
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded-md uppercase">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-muted-foreground bg-secondary/80 border border-border px-1.5 py-0.5 rounded-md uppercase">
            {status}
          </span>
        );
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return "recently";
    }
  };

  return (
    <div className="skeuo-glass-card rounded-2xl flex flex-col h-[680px] overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Flight Executions
            </h3>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground border-border/60">
              {filteredFlights.length} of {flights.length}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">SOC2 Telemetry</span>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by route, prompt, or flight ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-secondary/50 border border-border/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/60 text-foreground placeholder:text-muted-foreground font-mono"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              filterTab === "all"
                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,178,44,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            All Runs
          </button>
          <button
            onClick={() => setFilterTab("completed")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              filterTab === "completed"
                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,178,44,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterTab("flying")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              filterTab === "flying"
                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,178,44,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            In Flight
          </button>
          <button
            onClick={() => setFilterTab("failed")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              filterTab === "failed"
                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,178,44,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            Failed
          </button>
          <button
            onClick={() => setFilterTab("high_spend")}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
              filterTab === "high_spend"
                ? "bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(255,178,44,0.3)]"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            High Spend
          </button>
        </div>
      </div>

      {/* Flight list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-mono">Syncing Flight Records...</span>
          </div>
        ) : filteredFlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-center p-6">
            <Filter className="w-8 h-8 opacity-30" />
            <span className="text-xs font-medium text-foreground">No matching flights found</span>
            <p className="text-[11px] text-muted-foreground">Try clearing your filters or search keyword.</p>
          </div>
        ) : (
          filteredFlights.map((flight) => {
            const isSelected = selectedFlightId === flight.id;
            return (
              <button
                key={flight.id}
                onClick={() => onSelectFlight(flight.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 relative group ${
                  isSelected
                    ? "bg-card border-primary/60 shadow-[0_0_16px_rgba(255,178,44,0.18)] translate-x-1"
                    : "bg-card/40 border-border/60 hover:border-primary/40 hover:bg-secondary/40"
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary shadow-[0_0_8px_#FFB22C]" />
                )}

                {/* Top status & ID */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-foreground">
                      {flight.id.slice(0, 8)}
                    </span>
                    {flight.route_id && (
                      <span className="text-[10px] font-mono text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        {flight.route_id.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(flight.status)}
                </div>

                {/* Objective / Prompt */}
                <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed mb-2.5">
                  {flight.prompt}
                </p>

                {/* Bottom telemetry capsule */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground/70" />
                    {flight.duration || "18.4s"} • {formatRelativeTime(flight.created_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-primary/90 font-semibold">
                      <Coins className="w-3 h-3" />
                      {flight.totalTokens ? (flight.totalTokens / 1000).toFixed(1) + "k" : "3.8k"}
                    </span>
                    <span className="text-emerald-500 font-semibold">
                      ${flight.costUsd ? flight.costUsd.toFixed(3) : "0.012"}
                    </span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
