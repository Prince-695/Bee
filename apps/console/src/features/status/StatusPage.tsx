import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Smartphone,
  Check,
  Radio,
  Settings,
  Plus,
  MoreVertical,
  ArrowUpRight,
  GraduationCap,
  HelpCircle,
  Boxes,
  FileText,
  Zap,
} from "lucide-react";
import {
  listApprovalGates,
  type ApprovalGateRecord,
} from "@/lib/api";

export default function StatusPage() {
  const navigate = useNavigate();
  const [pendingGatesList, setPendingGatesList] = useState<ApprovalGateRecord[]>([]);
  const [activeTab, setActiveTab] = useState("Overview");
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(155); // 02:35

  const filterTabs = [
    "Overview",
    "Workers (5)",
    "Active Missions",
    "Approvals",
    "Memory Recall",
    "Telemetry",
    "Hive MCPs",
    "Variables",
  ];

  // Fetch real backend status
  const refreshData = useCallback(async () => {
    try {
      const g = await listApprovalGates("pending").catch(() => []);
      setPendingGatesList(g || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 8000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Timer increment
  useEffect(() => {
    if (!isTimerRunning) return;
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isTimerRunning]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-full p-6 lg:p-8 bg-[#F5F6F8] dark:bg-[#0E0F12] text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ─── 1. TOP HEADER & HEADLINE WITH BADGES ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex flex-wrap items-center gap-2.5 text-zinc-900 dark:text-white">
              Managing
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs font-semibold shadow-sm">
                <img src="/logo.png" alt="Bee" className="w-4 h-4 rounded-full object-contain" /> Bee AI
              </span>
              Your Team
              <br className="hidden sm:block" />
              and
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" /> 5 Workers
              </span>
              Workflows
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/hive")}
              className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              title="Settings & Connectors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate("/chat")}
              className="px-5 py-2.5 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-black/10 hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create a New Scenario
            </button>
          </div>
        </div>

        {/* ─── 2. HORIZONTAL FILTER PILLS ─── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-md"
                    : "bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* ─── 3. TOP 3 METRICS CARDS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Operations */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Operations</span>
              </div>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-950 dark:text-white">780</span>
                <span className="text-xs text-zinc-400 font-medium">/ 1000</span>
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 flex items-center gap-1">
                  82% <Check className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Segmented battery pill capsules */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seg) => (
                <div
                  key={seg}
                  className={`h-7 flex-1 rounded-full ${
                    seg <= 6
                      ? "bg-zinc-950 dark:bg-white"
                      : "border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card 2: Token Consumption / Data Transfer (Bright Tint) */}
          <div className="p-6 rounded-3xl bg-[#E6F85E] text-zinc-950 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-black/10 flex items-center justify-center text-zinc-950">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900">Data Transfer</span>
              </div>
              <button className="text-zinc-700 hover:text-black">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-zinc-950">163</span>
                <span className="text-xs text-zinc-700 font-medium">/ 512.0 MB</span>
                <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-black/10 text-zinc-950 flex items-center gap-1">
                  68% <Radio className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Segmented capsules */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((seg) => (
                <div
                  key={seg}
                  className={`h-7 flex-1 rounded-full ${
                    seg <= 4
                      ? "bg-zinc-950"
                      : "border-2 border-dashed border-black/30 bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Card 3: Take Engineering to the Next Level (Dark Luxury Card) */}
          <div className="p-6 rounded-3xl bg-[#111215] text-white border border-zinc-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-start z-10">
              <div className="space-y-1">
                <h3 className="text-lg font-black tracking-tight leading-snug flex items-center gap-1">
                  Take Your Automation to the Next Level
                  <ArrowUpRight className="w-4 h-4 text-amber-400" />
                </h3>
              </div>

              {/* 3D AI Robot / Bee representation */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-zinc-800 flex items-center justify-center p-2 shrink-0 border border-amber-500/20">
                <img src="/logo.png" alt="Bee 3D" className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div className="pt-4 z-10">
              <button
                onClick={() => navigate("/chat")}
                className="w-full py-2.5 px-4 rounded-full bg-white text-zinc-950 text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Upgrade <Play className="w-3 h-3 fill-black" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4. MAIN 2-COLUMN SECTION: ANALYTICS + COMPANION HUB ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Left 2 Columns: Statistics & Flight Chart */}
          <div className="lg:col-span-2 space-y-5">
            {/* Statistics Card with Custom Slider Bars */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-zinc-500" />
                    <span className="font-bold text-sm">Statistics</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-white" /> Operations
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#E6F85E]" /> Data transfer
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-700 dark:text-zinc-300">
                    <option>2026</option>
                    <option>2025</option>
                  </select>
                </div>
              </div>

              {/* Custom High-Contrast Rounded Slider Columns */}
              <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-zinc-100 dark:border-zinc-800/80">
                {[
                  { day: "27 Jun", val1: 70, val2: 40, badge: null },
                  { day: "28 Jun", val1: 50, val2: 25, badge: null },
                  { day: "29 Jun", val1: 65, val2: 30, badge: null },
                  { day: "30 Jun", val1: 85, val2: 60, badge: "32%" },
                  { day: "1 Jul", val1: 90, val2: 45, badge: "87%" },
                  { day: "2 Jul", val1: 75, val2: 50, badge: null },
                  { day: "3 Jul", val1: 60, val2: 35, badge: null },
                  { day: "4 Jul", val1: 55, val2: 20, badge: null },
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative group">
                    {item.badge && (
                      <span className={`absolute -top-7 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                        item.badge === "87%" ? "bg-zinc-950 text-white dark:bg-white dark:text-black" : "bg-[#E6F85E] text-black"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Double-pill column */}
                    <div className="w-8 rounded-full bg-zinc-100 dark:bg-zinc-800/60 p-1 flex flex-col justify-end gap-1 h-44 relative">
                      <div
                        style={{ height: `${item.val1}%` }}
                        className="w-full bg-zinc-950 dark:bg-white rounded-full relative flex items-center justify-center"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                      </div>
                      <div
                        style={{ height: `${item.val2}%` }}
                        className="w-full bg-[#E6F85E] rounded-full relative flex items-center justify-center"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      </div>
                    </div>

                    <span className="text-[10px] text-zinc-400 font-medium">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Circular Time Tracker / Live Flight Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Flight Time Tracker</span>
                  <div className="text-3xl font-black mt-1 font-mono">{formatTimer(timerSeconds)}</div>
                  <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1 mt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Mission Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="w-10 h-10 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => setTimerSeconds(0)}
                    className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Zero-Trust Mobile Approval Gate Quick Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Approval Gates</span>
                  <div className="text-3xl font-black mt-1">{pendingGatesList.length} Pending</div>
                  <span className="text-[11px] text-amber-500 font-semibold flex items-center gap-1 mt-1">
                    <Smartphone className="w-3.5 h-3.5" /> WhatsApp Synced
                  </span>
                </div>

                <button
                  onClick={() => navigate("/chat")}
                  className="px-4 py-2 rounded-2xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer"
                >
                  Review Gates
                </button>
              </div>
            </div>
          </div>

          {/* Right 1 Column: Knowledge & Companion Hub */}
          <div className="space-y-5">
            {/* 2x2 Grid Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://discord.gg/bee"
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:border-amber-400/60 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Community</span>
              </a>

              <a
                href="https://bee.dev/docs"
                target="_blank"
                rel="noreferrer"
                className="p-5 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:border-amber-400/60 transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">Academy</span>
              </a>
            </div>

            {/* Quick Link Navigation Cards */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#141519] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-4">
              {[
                {
                  icon: <HelpCircle className="w-4 h-4" />,
                  title: "Help Center",
                  desc: "Explore our detailed documentation...",
                  to: "https://bee.dev/docs",
                },
                {
                  icon: <Boxes className="w-4 h-4" />,
                  title: "Partner Directory",
                  desc: "Find MCP servers for Git, Jira, Slack...",
                  to: "/hive",
                },
                {
                  icon: <FileText className="w-4 h-4" />,
                  title: "Flight Logs & Spend",
                  desc: "Audit token consumption & spend...",
                  to: "/logs",
                },
                {
                  icon: <Activity className="w-4 h-4" />,
                  title: "Use Cases",
                  desc: "Get inspired by all autonomous workflows...",
                  to: "https://bee.dev/#features",
                },
              ].map((link, i) => (
                <a
                  key={i}
                  href={link.to}
                  className="flex items-start justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-amber-400 group-hover:text-black transition-colors">
                      {link.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                        {link.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400 transition-colors" />
                </a>
              ))}
            </div>

            {/* Task Checklist Drawer (Worker Pipeline Tasks 2/8) */}
            <div className="p-6 rounded-3xl bg-[#141519] text-white border border-zinc-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Onboarding Tasks</span>
                <span className="text-xs font-mono font-bold text-amber-400">2 / 8</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Initialize FastMCP Sidecar</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Done</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Pair Local Codebase</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">Done</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-zinc-600 flex items-center justify-center text-[9px]">3</span>
                    <span>Execute First Healed Flight</span>
                  </div>
                  <span className="text-[10px] text-amber-400">Pending</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
