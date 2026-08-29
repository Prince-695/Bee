import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import StatusPage from "./pages/StatusPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import RoutePage from "./pages/RoutePage";
import ConversationPage from "./pages/ConversationPage";
import ChatHistoryPage from "./pages/ChatHistoryPage";
import HooksPage from "./pages/HooksPage";
import HivePage from "./pages/HivePage";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  History,
  Webhook,
  Boxes,
  Sparkles,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { ThemeToggle } from "./components/shared/ThemeToggle";
import { AuthGate } from "./components/AuthGate";
import { useState } from "react";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { to: "/app", icon: <Bot className="w-4.5 h-4.5" />, label: "Co-Engineer" },
    { to: "/app/status", icon: <Activity className="w-4.5 h-4.5" />, label: "Teammate Board" },
    { to: "/app/hive", icon: <Boxes className="w-4.5 h-4.5" />, label: "Hive Registry" },
    { to: "/app/history", icon: <History className="w-4.5 h-4.5" />, label: "Flight Logs" },
    { to: "/app/hooks", icon: <Webhook className="w-4.5 h-4.5" />, label: "Triggers & Hooks" },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-amber-500/20">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-18" : "w-64"
        } border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl flex flex-col py-5 transition-all duration-300 shrink-0 relative z-30`}
      >
        {/* Brand Header */}
        <div className={`${collapsed ? "px-3" : "px-5"} mb-6 flex items-center justify-between`}>
          <Link to="/app" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  BEE <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">v0.3</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">AI Co-Engineer</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className={`flex-1 w-full flex flex-col gap-1.5 ${collapsed ? "px-2" : "px-3"}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/app" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center ${
                  collapsed ? "justify-center" : ""
                } gap-3 px-3 py-2.5 rounded-xl border transition-all group ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold shadow-sm shadow-amber-500/5"
                    : "text-zinc-400 border-transparent hover:bg-zinc-900/90 hover:text-zinc-200 hover:border-zinc-800"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div className="shrink-0 group-hover:scale-110 transition-transform">{item.icon}</div>
                {!collapsed && <span className="text-[13.5px] tracking-wide">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom System Status & User Profile */}
        <div className={`${collapsed ? "px-2" : "px-3"} w-full flex flex-col gap-3 mt-auto pt-4 border-t border-zinc-900`}>
          {!collapsed && (
            <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-zinc-300 font-mono font-medium">Hive Active</span>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          )}

          <div className={`flex ${collapsed ? "justify-center" : "items-center justify-between px-1"}`}>
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-200">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-200">Engineer</span>
                  <span className="text-[10px] text-zinc-500">Local Workspace</span>
                </div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 shadow-md flex items-center justify-center hover:bg-zinc-800 text-zinc-300 transition-colors z-30"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-hidden relative flex flex-col bg-background">
        {children}
      </main>
    </div>
  );
}

export function App() {
  return (
    <Router>
      <TooltipProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Dashboard routes */}
          <Route path="/app" element={<AuthGate><DashboardLayout><ConversationPage /></DashboardLayout></AuthGate>} />
          <Route path="/app/status" element={<AuthGate><DashboardLayout><StatusPage /></DashboardLayout></AuthGate>} />
          <Route path="/app/history" element={<AuthGate><DashboardLayout><ChatHistoryPage /></DashboardLayout></AuthGate>} />
          <Route path="/app/hive" element={<AuthGate><DashboardLayout><HivePage /></DashboardLayout></AuthGate>} />
          <Route path="/app/hooks" element={<AuthGate><DashboardLayout><HooksPage /></DashboardLayout></AuthGate>} />
          <Route path="/app/route/:routeId" element={<AuthGate><DashboardLayout><RoutePage /></DashboardLayout></AuthGate>} />
        </Routes>
      </TooltipProvider>
    </Router>
  );
}

export default App;
