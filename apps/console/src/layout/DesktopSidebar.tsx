import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  Bot,
  History,
  Webhook,
  Boxes,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DesktopSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DesktopSidebar({ collapsed, onToggleCollapse }: DesktopSidebarProps) {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: <Activity className="w-4.5 h-4.5" />, label: "Teammate Board" },
    { to: "/chat", icon: <Bot className="w-4.5 h-4.5" />, label: "Co-Engineer Workspace" },
    { to: "/hive", icon: <Boxes className="w-4.5 h-4.5" />, label: "Hive Connectors" },
    { to: "/logs", icon: <History className="w-4.5 h-4.5" />, label: "Flight Logs & Spend" },
    { to: "/hooks", icon: <Webhook className="w-4.5 h-4.5" />, label: "Triggers & Hooks" },
  ];

  return (
    <aside
      className={`${
        collapsed ? "w-18" : "w-64"
      } border-r border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl flex flex-col py-5 transition-all duration-300 shrink-0 relative z-30`}
    >
      {/* Brand Header */}
      <div className={`${collapsed ? "px-3" : "px-5"} mb-6 flex items-center justify-between`}>
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="Bee Logo"
            className="w-10 h-10 rounded-xl object-contain shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                BEE <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">Desktop</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">Autonomous Co-Engineer</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className={`flex-1 w-full flex flex-col gap-1.5 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/app/status") || location.pathname.startsWith("/route")
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center ${
                collapsed ? "justify-center" : ""
              } gap-3 px-3 py-2.5 rounded-xl border transition-all group ${
                isActive
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 font-semibold shadow-xs shadow-amber-500/5"
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

      {/* Collapse Toggle */}
      <div className={`${collapsed ? "px-2" : "px-3"} mt-auto pt-4 border-t border-zinc-900 flex flex-col gap-2`}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {!collapsed && (
          <div className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-zinc-300 font-mono font-medium">Hive Active</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
}
