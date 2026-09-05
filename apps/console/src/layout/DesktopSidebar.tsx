import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Bot,
  Boxes,
  History,
  Webhook,
  BookOpen,
  Rocket,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export function DesktopSidebar() {
  const location = useLocation();

  const mainNavItems = [
    { to: "/", icon: <Home className="w-5 h-5" />, label: "Dashboard & Missions" },
    { to: "/chat", icon: <Bot className="w-5 h-5" />, label: "Co-Engineer Chat" },
    { to: "/hive", icon: <Boxes className="w-5 h-5" />, label: "Hive MCP Registry" },
    { to: "/logs", icon: <History className="w-5 h-5" />, label: "Flight Logs & Spend" },
    { to: "/hooks", icon: <Webhook className="w-5 h-5" />, label: "Signals & Hooks" },
  ];

  const secondaryNavItems = [
    { to: "https://bee.dev/docs", icon: <BookOpen className="w-5 h-5" />, label: "Docs & Academy" },
    { to: "https://github.com/Prince-695/Bee", icon: <Rocket className="w-5 h-5" />, label: "Releases & GitHub" },
    { to: "https://bee.dev/#faq", icon: <HelpCircle className="w-5 h-5" />, label: "Help & Support" },
  ];

  return (
    <aside className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-5 shrink-0 z-30 select-none transition-colors duration-200">
      {/* Top Brand Logo Icon in Rounded Square Pill */}
      <Link
        to="/"
        className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-primary hover:border-primary/80 hover:shadow-lg hover:shadow-primary/20 transition-all group mb-6 relative"
        title="Bee Autonomous Co-Engineer"
      >
        <img
          src="/logo.png"
          alt="Bee Logo"
          className="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
        />
        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-sidebar flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-primary-foreground" />
        </div>
      </Link>

      {/* Primary Navigation Icon Stack */}
      <nav className="flex-1 w-full flex flex-col items-center gap-2.5 px-3">
        {mainNavItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/" || location.pathname.startsWith("/app/status")
              : location.pathname.startsWith(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative group ${
                isActive
                  ? "bg-primary/15 text-primary shadow-sm border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              }`}
              title={item.label}
            >
              {item.icon}
              <span className="absolute left-16 px-2.5 py-1 rounded-lg bg-popover text-popover-foreground text-[11px] font-medium whitespace-nowrap shadow-xl border border-border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="w-8 h-px bg-border my-2" />

        {/* Secondary Navigation Items */}
        {secondaryNavItems.map((item) => (
          <a
            key={item.label}
            href={item.to}
            target="_blank"
            rel="noreferrer"
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-all relative group"
            title={item.label}
          >
            {item.icon}
            <span className="absolute left-16 px-2.5 py-1 rounded-lg bg-popover text-popover-foreground text-[11px] font-medium whitespace-nowrap shadow-xl border border-border pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.label}
            </span>
          </a>
        ))}
      </nav>

      {/* Bottom Pinned User Profile Avatar with Online Status Dot */}
      <div className="pt-4 flex flex-col items-center gap-3">
        <Link
          to="/"
          className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors group"
          title="Lead Engineer (Online)"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="User Avatar"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
        </Link>
      </div>
    </aside>
  );
}
